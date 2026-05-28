import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../synth.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    pitch REAL,
    playbackRate REAL,
    eqLow REAL,
    eqMid REAL,
    eqHigh REAL,
    reverbWet REAL,
    delayWet REAL,
    delayTime REAL,
    delayFeedback REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audio_files (
    user_id INTEGER PRIMARY KEY,
    filename TEXT,
    filepath TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed user function
export const seedUser = async (username, password) => {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log(`User ${username} created.`);
  } else {
    console.log(`User ${username} already exists.`);
  }
};

export default db;
