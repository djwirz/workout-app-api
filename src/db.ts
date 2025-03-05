import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

const dbPath = path.resolve(__dirname, "../workout.db");
let dbInstance: Database | null = null;

/**
 * Initializes the SQLite database and ensures all tables exist before API starts.
 */
async function initializeDatabase() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log("🔧 Checking database schema...");

  // Ensure exercises table exists
  const tableCheck = await dbInstance.get(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='exercises';
  `);

  if (!tableCheck) {
    console.log("⚠️ No 'exercises' table found, creating schema...");
    await dbInstance.exec(`
      CREATE TABLE exercises (
        id TEXT PRIMARY KEY,
        name TEXT,
        "group" TEXT,
        video BLOB,
        video_size INTEGER,
        last_updated INTEGER
      );
      CREATE INDEX idx_exercise_id ON exercises(id);
    `);
  } else {
    console.log("✅ Database schema already exists.");
  }

  return dbInstance;
}

export async function getDBConnection() {
  return initializeDatabase();
}
