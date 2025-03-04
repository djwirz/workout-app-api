import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";

// Ensure the exercises table exists before any queries
async function ensureExercisesTable() {
  const db = await getDBConnection();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      focus TEXT
    );
  `);
}

// Fetch exercises from SQLite, ensuring table exists first
export async function getExercisesFromDB() {
  const db = await getDBConnection();
  await ensureExercisesTable(); // Ensure table exists before querying
  return await db.all(`SELECT id, name, "group", focus FROM exercises`);
}

// Fetch exercises from Notion & store in SQLite
export async function fetchAndStoreExercises() {
  const db = await getDBConnection();
  await ensureExercisesTable(); // Ensure table exists before inserting
  
  const exercises = await fetchExercisesFromNotion();
  for (const exercise of exercises) {
    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus)
      VALUES (?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, JSON.stringify(exercise.focus)]
    );
  }

  console.log("Exercises updated from Notion and stored in SQLite.");
  return exercises;
}
