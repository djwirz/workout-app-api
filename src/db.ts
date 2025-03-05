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

  console.log("🔧 Initializing database schema...");

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      video BLOB,
      video_size INTEGER,
      last_updated INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_id ON exercises(id);
  `);

  console.log("✅ Database schema verified.");
  return dbInstance;
}

export async function getDBConnection() {
  return initializeDatabase();
}
