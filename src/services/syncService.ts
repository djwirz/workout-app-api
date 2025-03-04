import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";

export async function fetchAndStoreExercises() {
  const db = await getDBConnection();
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

export async function getExercisesFromDB() {
  const db = await getDBConnection();
  return await db.all(`SELECT id, name, "group", focus FROM exercises`);
}
