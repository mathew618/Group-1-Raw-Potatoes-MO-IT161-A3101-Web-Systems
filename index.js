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

function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
        result[camelKey] = value;
    }
    return result;
}

app.use(express.json());
app.use(express.static(__dirname));

if (fs.existsSync(path.join(__dirname, 'artifyph'))) {
    app.use(express.static(path.join(__dirname, 'artifyph')));
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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS commission_requests (
            id INT NOT NULL AUTO_INCREMENT,
            artist_id VARCHAR(100) NOT NULL,
            artist_name VARCHAR(100),
            artist_email VARCHAR(255),
            client_id VARCHAR(100) NOT NULL,
            client_name VARCHAR(100) NOT NULL,
            client_email VARCHAR(255) NOT NULL,
            package VARCHAR(100),
            type VARCHAR(100) NOT NULL,
            deadline DATE NOT NULL,
            budget DECIMAL(10,2) NOT NULL,
            platform VARCHAR(100),
            details TEXT,
            wip TINYINT(1) DEFAULT 0,
            status ENUM('pending','accepted','rejected','in-progress','received') DEFAULT 'pending',
            paid TINYINT(1) DEFAULT 0,
            method VARCHAR(100),
            reference VARCHAR(255),
            requested_at DATETIME,
            server_saved_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
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


/* ---------- Commission Requests API ---------- */

app.get('/api/commission-requests', async (req, res) => {
    try {
        const { artistId, clientId } = req.query;
        let sql = 'SELECT * FROM commission_requests';
        const params = [];
        const conditions = [];

        if (artistId) {
            conditions.push('artist_id = ?');
            params.push(artistId);
        }
        if (clientId) {
            conditions.push('client_id = ?');
            params.push(clientId);
        }

        if (conditions.length) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY id DESC';

        const [rows] = await pool.query(sql, params);
        res.json(rows.map(toCamelCase));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/commission-requests', async (req, res) => {
    try {
        const {
            artistId, artistName, artistEmail,
            clientId, clientName, clientEmail,
            package: pkg, type, deadline, budget,
            platform, details, wip, status = 'pending',
            paid = false, method, reference, requestedAt
        } = req.body;

        if (!clientName || !clientEmail || !type || !deadline) {
            return res.status(400).json({ error: 'Please fill out all required fields.' });
        }

        const budgetNum = Number(budget);
        if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
            return res.status(400).json({ error: 'Budget must be a positive numeric value.' });
        }

        // Convert ISO string (e.g. 2026-10-31T23:01:49.206Z) to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        const requestedAtDb = requestedAt
            ? new Date(requestedAt).toISOString().replace(/T/, ' ').replace(/\..+Z$/, '')
            : null;

        const [result] = await pool.query(
            `INSERT INTO commission_requests
             (artist_id, artist_name, artist_email, client_id, client_name, client_email,
              package, type, deadline, budget, platform, details, wip, status, paid, method, reference, requested_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [artistId, artistName, artistEmail, clientId, clientName, clientEmail,
             pkg, type, deadline, budgetNum, platform, details, wip ? 1 : 0, status, paid ? 1 : 0, method, reference, requestedAtDb]
        );

        const [rows] = await pool.query('SELECT * FROM commission_requests WHERE id = ?', [result.insertId]);
        res.status(201).json({ message: 'Commission request saved on server', commission: toCamelCase(rows[0]) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/commission-requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paid, method, reference, paidAt } = req.body;

        const [existing] = await pool.query('SELECT * FROM commission_requests WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ error: 'Record not found' });

        const updates = [];
        const params = [];
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (paid !== undefined) { updates.push('paid = ?'); params.push(paid ? 1 : 0); }
        if (method !== undefined) { updates.push('method = ?'); params.push(method); }
        if (reference !== undefined) { updates.push('reference = ?'); params.push(reference); }
        if (paidAt !== undefined) { updates.push('paid_at = ?'); params.push(paidAt); }

        if (updates.length) {
            params.push(id);
            await pool.query(`UPDATE commission_requests SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const [rows] = await pool.query('SELECT * FROM commission_requests WHERE id = ?', [id]);
        res.json({ message: 'Commission request updated', commission: toCamelCase(rows[0]) });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    console.log(`Commission Requests API: http://localhost:${PORT}/api/commission-requests`);
    console.log(`===============================================`);
});
