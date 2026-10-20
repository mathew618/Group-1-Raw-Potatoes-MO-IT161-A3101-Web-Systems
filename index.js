import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

if (fs.existsSync(path.join(__dirname, 'artifyph'))) {
    app.use(express.static(path.join(__dirname, 'artifyph')));
}

const DATA_DIR = path.join(__dirname, 'data');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(COMMISSIONS_FILE)) {
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify([], null, 4));
}

function readCommissions() {
    try {
        const content = fs.readFileSync(COMMISSIONS_FILE, 'utf-8');
        return JSON.parse(content || '[]');
    } catch {
        return [];
    }
}

function writeCommissions(data) {
    try {
        fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(data, null, 4));
        return true;
    } catch {
        return false;
    }
}

app.get('/api/commissions', (req, res) => {
    const list = readCommissions();
    const { artistId, clientId } = req.query;

    if (artistId) return res.json(list.filter(c => c.artistId === artistId).reverse());
    if (clientId) return res.json(list.filter(c => c.clientId === clientId).reverse());
    res.json(list);
});

app.post('/api/commissions', (req, res) => {
    const data = req.body;

    if (!data.clientName || !data.clientEmail || !data.type || !data.deadline) {
        return res.status(400).json({ error: "Please fill out all required fields." });
    }

    const numBudget = Number(data.budget);
    if (isNaN(numBudget) || numBudget <= 0) {
        return res.status(400).json({ error: "Budget must be a positive numeric value." });
    }

    const commissions = readCommissions();
    const record = {
        id: data.id || ('req_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
        ...data,
        budget: numBudget,
        serverSavedAt: new Date().toISOString()
    };

    commissions.push(record);
    writeCommissions(commissions);

    res.status(201).json({ message: "Commission saved on server", commission: record });
});

app.patch('/api/commissions/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, paid, method, reference } = req.body;

    const commissions = readCommissions();
    const item = commissions.find(c => c.id === id);

    if (!item) return res.status(404).json({ error: "Record not found" });

    if (status !== undefined) item.status = status;
    if (paid !== undefined) item.paid = paid;
    if (method !== undefined) item.method = method;
    if (reference !== undefined) item.reference = reference;

    writeCommissions(commissions);
    res.json({ message: "Updated successfully", commission: item });
});

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`ArtifyPH Server running at http://localhost:${PORT}`);
    console.log(`Commissions API: http://localhost:${PORT}/api/commissions`);
    console.log(`===============================================`);
});