import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";

export async function syncNotionToLocalDB() {
  const db = await getDBConnection();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT,
      focus TEXT
    );
  `);

  const exercises = await fetchExercisesFromNotion();
  for (const exercise of exercises) {
    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus)
      VALUES (?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, JSON.stringify(exercise.focus)]
    );
  }

  console.log("Synced Notion exercises to local SQLite.");
}
