import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db: any = null;

export async function openDb() {
  if (!db) {
    db = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });

    // Original translation history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS TranslationHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inputText TEXT NOT NULL,
        outputText TEXT NOT NULL,
        tableSchema TEXT,
        isHumanToSql BOOLEAN NOT NULL,
        tags TEXT DEFAULT '',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Task 1: chat sessions and messages
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user','assistant')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
      )
    `);

    // Task 5: Add tags column to existing table if it doesn't exist
    try {
      await db.exec(`ALTER TABLE TranslationHistory ADD COLUMN tags TEXT DEFAULT ''`);
    } catch {
      // Column already exists — safe to ignore
    }
  }
  return db;
}
