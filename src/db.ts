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

  // Ensure workouts table exists
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TEXT,  -- YYYY-MM-DD format
      last_updated INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_workout_id ON workouts(id);
  `);

  // Ensure workout_entries table exists
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS workout_entries (
      id TEXT PRIMARY KEY,
      workout_id TEXT REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id),
      sets INTEGER,
      reps INTEGER,
      weight INTEGER,
      rest_time INTEGER,
      last_updated INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_workout_entry_id ON workout_entries(id);
  `);

  console.log("✅ Database schema ready.");
  return dbInstance;
}

export async function getDBConnection() {
  return initializeDatabase();
}
