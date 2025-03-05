import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";

/**
 * Ensures all required tables exist and updates schema if needed.
 */
async function ensureDatabaseSchema() {
  const db = await getDBConnection();

  // Create exercises table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      focus TEXT,
      video BLOB
    );
  `);

  // Ensure exercises table has 'video' column (for schema updates)
  const columns = await db.all(`PRAGMA table_info(exercises)`);
  const hasVideoColumn = columns.some((col) => col.name === "video");

  if (!hasVideoColumn) {
    console.log("Updating database schema: Adding 'video' column...");
    await db.exec(`ALTER TABLE exercises ADD COLUMN video BLOB`);
  }

  // (Future tables can be added here)
}

/**
 * Downloads a video from the provided URL and returns it as a Buffer.
 */
async function downloadVideo(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Error downloading video from ${url}:`, error);
    return null;
  }
}

/**
 * Fetches exercise data from Notion and stores it in SQLite.
 */
export async function fetchAndStoreExercises() {
  const db = await getDBConnection();
  await ensureDatabaseSchema(); // Ensure database schema is initialized

  const exercises = await fetchExercisesFromNotion();
  for (const exercise of exercises) {
    const videoBuffer = exercise.video ? await downloadVideo(exercise.video) : null;

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video)
      VALUES (?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, JSON.stringify(exercise.focus), videoBuffer]
    );
  }

  console.log("Exercises updated from Notion and stored in SQLite.");
}

/**
 * Retrieves all exercises from SQLite (excluding video BLOBs).
 */
export async function getExercisesFromDB() {
  const db = await getDBConnection();
  return db.all("SELECT id, name, 'group', focus, video IS NOT NULL as hasVideo FROM exercises");
}
