import Database from "better-sqlite3";
import { config } from "./config";

export const db = new Database(config.databasePath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grant_id TEXT UNIQUE NOT NULL,
  email TEXT,
  destination_email TEXT,
  cadence TEXT DEFAULT 'hourly',
  last_summary_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  grant_id TEXT NOT NULL,
  sender TEXT,
  subject TEXT,
  snippet TEXT,
  received_at TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summary_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grant_id TEXT NOT NULL,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  UNIQUE(grant_id, window_start, window_end)
);
`);

