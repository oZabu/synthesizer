import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import db, { seedUser } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3240;
const SECRET_KEY = 'your-very-secret-key'; // In production, use env variable

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    const token = jwt.sign({ id: info.lastInsertRowid, username }, SECRET_KEY);
    res.json({ token, username });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (user && await bcrypt.compare(password, user.password_hash)) {
    const token = jwt.sign({ id: user.id, username }, SECRET_KEY);
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// --- Settings Routes ---

app.get('/api/settings', authenticateToken, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  res.json(settings || {});
});

app.post('/api/settings', authenticateToken, (req, res) => {
  const { pitch, playbackRate, eqLow, eqMid, eqHigh, reverbWet, delayWet, delayTime, delayFeedback } = req.body;
  
  db.prepare(`
    INSERT INTO settings (user_id, pitch, playbackRate, eqLow, eqMid, eqHigh, reverbWet, delayWet, delayTime, delayFeedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      pitch=excluded.pitch,
      playbackRate=excluded.playbackRate,
      eqLow=excluded.eqLow,
      eqMid=excluded.eqMid,
      eqHigh=excluded.eqHigh,
      reverbWet=excluded.reverbWet,
      delayWet=excluded.delayWet,
      delayTime=excluded.delayTime,
      delayFeedback=excluded.delayFeedback
  `).run(req.user.id, pitch, playbackRate, eqLow, eqMid, eqHigh, reverbWet, delayWet, delayTime, delayFeedback);
  
  res.json({ success: true });
});

// --- Audio Routes ---

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/api/audio', authenticateToken, upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  db.prepare(`
    INSERT INTO audio_files (user_id, filename, filepath)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      filename=excluded.filename,
      filepath=excluded.filepath
  `).run(req.user.id, req.file.originalname, `/uploads/${req.file.filename}`);

  res.json({ filename: req.file.originalname, url: `/uploads/${req.file.filename}` });
});

app.get('/api/audio', authenticateToken, (req, res) => {
  const audio = db.prepare('SELECT * FROM audio_files WHERE user_id = ?').get(req.user.id);
  res.json(audio || null);
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Initial seed and start server
seedUser('adomin', '1234').then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
});
