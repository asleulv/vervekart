const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// MODE-basert valg av path frå environment
const MODE = process.env.MODE || 'development';
const SQLITE_PATH = MODE === 'production' ? process.env.PROD_SQLITE_PATH : process.env.DEV_SQLITE_PATH;

// Bruk environment-path, fallback til lokal fil
const dbPath = SQLITE_PATH || path.join(__dirname, 'vervekart.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 👥 BRUKAR-TABELL
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 📍 ADRESSE-TABELL (for rask oppslag av noverande status)
  db.run(`
    CREATE TABLE IF NOT EXISTS address_current_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lokalid TEXT UNIQUE NOT NULL,
      address_text TEXT,
      kommune TEXT,
      fylke TEXT,
      current_status TEXT,
      last_changed_by INTEGER,
      last_changed_at DATETIME,
      FOREIGN KEY(last_changed_by) REFERENCES users(id)
    )
  `);

  // 📜 HISTORIKK-TABELL (lagrar ALLE endringar)
  db.run(`
    CREATE TABLE IF NOT EXISTS address_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lokalid TEXT NOT NULL,
      address_text TEXT,
      kommune TEXT,
      fylke TEXT,
      old_status TEXT,
      new_status TEXT,
      changed_by INTEGER,
      changed_by_name TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      action_type TEXT DEFAULT 'status_change' CHECK(action_type IN ('status_change', 'reset', 'bulk_reset')),
      notes TEXT,
      FOREIGN KEY(changed_by) REFERENCES users(id)
    )
  `);

  // 🗑️ RESET-LOGG (når område blir nullstilt)
  db.run(`
    CREATE TABLE IF NOT EXISTS reset_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kommune TEXT,
      fylke TEXT,
      reset_by INTEGER,
      reset_by_name TEXT,
      addresses_affected INTEGER,
      reset_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      FOREIGN KEY(reset_by) REFERENCES users(id)
    )
  `);

  // Indeksar for rask oppslag
  db.run(`CREATE INDEX IF NOT EXISTS idx_lokalid ON address_current_status(lokalid)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_lokalid ON address_history(lokalid)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_history_date ON address_history(changed_at)`);

  console.log(`✅ SQLite database initialized at ${dbPath} (mode: ${MODE})`);
});

module.exports = db;
