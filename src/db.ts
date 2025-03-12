import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

const dbPath = path.resolve(__dirname, "../workout.db");
let dbInstance: Database | null = null;

async function initializeDatabase() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log("🔧 Checking database schema...");

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      video_path TEXT,
      video_size INTEGER,
      last_updated INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_last_updated ON exercises(last_updated);
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TEXT,
      last_updated INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_workout_last_updated ON workouts(last_updated);
  `);

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
    CREATE INDEX IF NOT EXISTS idx_workout_entry_last_updated ON workout_entries(last_updated);
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      entity TEXT PRIMARY KEY,
      last_synced INTEGER
    );
  `);

  console.log("✅ Database schema ready.");
  return dbInstance;
}

export async function getDBConnection() {
  return initializeDatabase();
}
