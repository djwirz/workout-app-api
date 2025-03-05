import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../workout.db");
const db = new Database(dbPath, { verbose: console.log });

/**
 * Initializes the SQLite database and ensures all tables exist before API starts.
 */
export function initializeDatabase() {
  console.log("🔧 Initializing database schema...");

  db.exec(`
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
}

export function getDBConnection() {
  return db;
}

// Initialize the DB schema when the module is loaded
initializeDatabase();
