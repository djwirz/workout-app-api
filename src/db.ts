import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

const dbPath = path.resolve(__dirname, "../workout.db");

/**
 * Initializes the SQLite database with the correct schema.
 */
async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log("📦 Initializing database...");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      video BLOB,
      video_size INTEGER,
      last_updated INTEGER
    );
  `);

  console.log("✅ Database ready.");
  return db;
}

export async function getDBConnection() {
  return initializeDatabase();
}
