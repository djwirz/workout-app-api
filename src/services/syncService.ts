import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";

// Ensure the exercises table includes a `video` column
async function ensureExercisesTable() {
  const db = await getDBConnection();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      focus TEXT,
      video BLOB
    );
  `);
}

// Download video from S3 and return as a buffer
async function downloadVideo(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Error downloading video from ${url}:`, error);
    return null;
  }
}

// Fetch exercises from Notion, store in SQLite with videos
export async function fetchAndStoreExercises() {
  const db = await getDBConnection();
  await ensureExercisesTable(); // Ensure schema is correct

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

// Retrieve exercises from SQLite (excluding the video data)
export async function getExercisesFromDB() {
  const db = await getDBConnection();
  return db.all("SELECT id, name, 'group', focus, video IS NOT NULL as hasVideo FROM exercises");
}
