import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Shared MySQL connection pool, configured in mysqldatabase.js.
import pool from './mysqldatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const COMMISSION_REQUESTS_FILE = path.join(DATA_DIR, 'commissions.json');

app.use(express.json());
app.use(express.static(__dirname));

if (fs.existsSync(path.join(__dirname, 'artifyph'))) {
    app.use(express.static(path.join(__dirname, 'artifyph')));
}

// Commission listings in MySQL, client requests are stored in JSON file.
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(COMMISSION_REQUESTS_FILE)) {
    fs.writeFileSync(COMMISSION_REQUESTS_FILE, JSON.stringify([], null, 4));
}

function readCommissionRequests() {
    try {
        return JSON.parse(fs.readFileSync(COMMISSION_REQUESTS_FILE, 'utf8') || '[]');
    } catch {
        return [];
    }
}

function writeCommissionRequests(requests) {
    fs.writeFileSync(COMMISSION_REQUESTS_FILE, JSON.stringify(requests, null, 4));
}

 // Create the tables the API needs if they are not already in the database.
async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) PRIMARY KEY,
            role ENUM('artist','client','admin') DEFAULT 'artist',
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            bio TEXT,
            accepts_commissions BOOLEAN NULL DEFAULT NULL,
            folder VARCHAR(100),
            profilepicture VARCHAR(255),
            backgroundpicture VARCHAR(255),
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [commissionAvailabilityColumn] = await pool.query(
        "SHOW COLUMNS FROM users LIKE 'accepts_commissions'"
    );
    if (!commissionAvailabilityColumn.length) {
        await pool.query(
            'ALTER TABLE users ADD COLUMN accepts_commissions BOOLEAN NULL DEFAULT NULL'
        );
    }

    // Each commission and artwork belongs to a user. deleting that user removes their records.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS commissions (
            id INT NOT NULL AUTO_INCREMENT,
            artist_id VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('open','closed') DEFAULT 'open',
            image VARCHAR(255) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY artist_id (artist_id, image),
            CONSTRAINT commissions_ibfk_1 FOREIGN KEY (artist_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS artworks (
            id INT NOT NULL AUTO_INCREMENT,
            artist_id VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            image VARCHAR(255) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY artist_id (artist_id, image),
            CONSTRAINT artworks_ibfk_1 FOREIGN KEY (artist_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

// API routes read and write website data in MySQL, then return JSON to the browser.
initDb().then(() => {
    console.log('MySQL tables ready.');
}).catch(err => {
    console.error('DB init failed:', err.message);
});

/* ---------- Commissions API ---------- */

app.get('/api/commissions', async (req, res) => {
    try {
        const { artist_id } = req.query;
        let sql = 'SELECT * FROM commissions';
        const params = [];

        if (artist_id) {
            sql += ' WHERE artist_id = ?';
            params.push(artist_id);
        }

        sql += ' ORDER BY id DESC';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/commissions', async (req, res) => {
    try {
        const { artist_id, title, description = '', status = 'open', image = '' } = req.body;

        if (!artist_id || !title || !image) {
            return res.status(400).json({ error: "artist_id, title, and image are required." });
        }

        const [result] = await pool.query(
            'INSERT INTO commissions (artist_id, title, description, status, image) VALUES (?, ?, ?, ?, ?)',
            [artist_id, title, description, status, image]
        );

        const [rows] = await pool.query('SELECT * FROM commissions WHERE id = ?', [result.insertId]);
        res.status(201).json({ message: "Commission saved on server", commission: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Commission already exists for this artist and image." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/commissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [existing] = await pool.query('SELECT * FROM commissions WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ error: "Record not found" });

        if (status !== undefined) {
            await pool.query('UPDATE commissions SET status = ? WHERE id = ?', [status, id]);
        }

        const [rows] = await pool.query('SELECT * FROM commissions WHERE id = ?', [id]);
        res.json({ message: "Updated successfully", commission: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------- Commission Requests JSON API ---------- */

app.get('/api/commission-requests', (req, res) => {
    const requests = readCommissionRequests();
    const { artistId, clientId } = req.query;

    if (artistId) return res.json(requests.filter(request => request.artistId === artistId).reverse());
    if (clientId) return res.json(requests.filter(request => request.clientId === clientId).reverse());
    res.json(requests);
});

app.post('/api/commission-requests', (req, res) => {
    const data = req.body;
    if (!data.clientName || !data.clientEmail || !data.type || !data.deadline) {
        return res.status(400).json({ error: 'Please fill out all required fields.' });
    }

    const budget = Number(data.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
        return res.status(400).json({ error: 'Budget must be a positive numeric value.' });
    }

    const record = {
        id: data.id || `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        ...data,
        budget,
        serverSavedAt: new Date().toISOString()
    };

    try {
        const requests = readCommissionRequests();
        requests.push(record);
        writeCommissionRequests(requests);
        res.status(201).json({ message: 'Commission request saved to JSON', commission: record });
    } catch (err) {
        res.status(500).json({ error: 'Could not save commission request.' });
    }
});

app.patch('/api/commission-requests/:id', (req, res) => {
    const requests = readCommissionRequests();
    const record = requests.find(request => request.id === req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const { status, paid, method, reference, paidAt } = req.body;
    if (status !== undefined) record.status = status;
    if (paid !== undefined) record.paid = paid;
    if (method !== undefined) record.method = method;
    if (reference !== undefined) record.reference = reference;
    if (paidAt !== undefined) record.paidAt = paidAt;

    try {
        writeCommissionRequests(requests);
        res.json({ message: 'Commission request updated', commission: record });
    } catch {
        res.status(500).json({ error: 'Could not update commission request.' });
    }
});

/* ---------- Artworks API ---------- */

app.get('/api/artworks', async (req, res) => {
    try {
        const { artist_id } = req.query;
        let sql = 'SELECT * FROM artworks';
        const params = [];

        if (artist_id) {
            sql += ' WHERE artist_id = ?';
            params.push(artist_id);
        }

        sql += ' ORDER BY id DESC';

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/artworks', async (req, res) => {
    try {
        const { artist_id, title, description = '', image = '' } = req.body;

        if (!artist_id || !title || !image) {
            return res.status(400).json({ error: "artist_id, title, and image are required." });
        }

        const [result] = await pool.query(
            'INSERT INTO artworks (artist_id, title, description, image) VALUES (?, ?, ?, ?)',
            [artist_id, title, description, image]
        );

        const [rows] = await pool.query('SELECT * FROM artworks WHERE id = ?', [result.insertId]);
        res.status(201).json({ message: "Artwork saved on server", artwork: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Artwork already exists for this artist and image." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/artworks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }

        if (!updates.length) {
            return res.status(400).json({ error: "No fields to update." });
        }

        params.push(id);
        const [result] = await pool.query(`UPDATE artworks SET ${updates.join(', ')} WHERE id = ?`, params);

        if (!result.affectedRows) return res.status(404).json({ error: "Artwork not found" });

        const [rows] = await pool.query('SELECT * FROM artworks WHERE id = ?', [id]);
        res.json({ message: "Artwork updated", artwork: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/artworks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query('SELECT * FROM artworks WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ error: "Artwork not found" });

        await pool.query('DELETE FROM artworks WHERE id = ?', [id]);
        res.json({ message: "Artwork deleted", id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ---------- Users API ---------- */

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users ORDER BY username'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users WHERE id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "User not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password, role = 'artist', bio = '', id } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }

        const newId = id || ('acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

        const { acceptsCommissions } = req.body;
        await pool.query(
            `INSERT INTO users (id, role, username, email, password, bio, accepts_commissions)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newId, role, username, email, password, bio,
                typeof acceptsCommissions === 'boolean' ? acceptsCommissions : null]
        );

        const [rows] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users WHERE id = ?',
            [newId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Username or email already taken." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username, email, password, bio, profilepicture, backgroundpicture,
            folder, acceptsCommissions
        } = req.body;

        const [existing] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users WHERE id = ?',
            [id]
        );
        if (!existing.length) return res.status(404).json({ error: "User not found" });

        const updates = [];
        const params = [];

        if (username !== undefined) { updates.push('username = ?'); params.push(username); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (password !== undefined) { updates.push('password = ?'); params.push(password); }
        if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
        if (profilepicture !== undefined) { updates.push('profilepicture = ?'); params.push(profilepicture); }
        if (backgroundpicture !== undefined) { updates.push('backgroundpicture = ?'); params.push(backgroundpicture); }
        if (folder !== undefined) { updates.push('folder = ?'); params.push(folder); }
        if (typeof acceptsCommissions === 'boolean') {
            updates.push('accepts_commissions = ?');
            params.push(acceptsCommissions);
        }

        if (updates.length) {
            params.push(id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const [rows] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users WHERE id = ?',
            [id]
        );
        res.json(rows[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Username or email already taken." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: "Identifier and password are required." });
        }

        const [rows] = await pool.query(
            'SELECT *, accepts_commissions AS acceptsCommissions FROM users WHERE username = ? OR email = ?',
            [identifier, identifier]
        );

        if (!rows.length) return res.status(401).json({ error: "Incorrect credentials" });

        const account = rows[0];
        if (account.password !== password) {
            return res.status(401).json({ error: "Incorrect credentials" });
        }

        res.json({ account });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/conflict', async (req, res) => {
    try {
        const { username, email } = req.query;

        if (username) {
            const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
            if (rows.length) return res.json({ conflict: 'Username is already taken.' });
        }
        if (email) {
            const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (rows.length) return res.json({ conflict: 'Email is already registered.' });
        }

        res.json({ conflict: '' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`ArtifyPH Server running at http://localhost:${PORT}`);
    console.log(`Users API: http://localhost:${PORT}/api/users`);
    console.log(`Commissions API: http://localhost:${PORT}/api/commissions`);
    console.log(`Artworks API: http://localhost:${PORT}/api/artworks`);
    console.log(`===============================================`);
});
