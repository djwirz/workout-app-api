import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchWorkoutEntriesFromNotion } from "../notion/notionWorkoutEntries";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

export async function syncWorkoutEntriesToLocalDB() {
  const db = await getDBConnection();
  const notionEntries = await fetchWorkoutEntriesFromNotion();

  logger.info("🔄 Syncing workout entries from Notion...");

  for (const entry of notionEntries) {
    const existingEntry = await db.get("SELECT id FROM workout_entries WHERE id = ?", [entry.id]);

    if (existingEntry) {
      logger.info(`✅ Entry ${entry.id} already stored, skipping.`);
      continue;
    }

    const validWorkout = await db.get("SELECT id FROM workouts WHERE id = ?", [entry.workout_id]);
    const validExercise = await db.get("SELECT id FROM exercises WHERE id = ?", [entry.exercise_id]);

    if (!validWorkout || !validExercise) {
      logger.warn(`⚠️ Skipping entry ${entry.id} due to missing workout or exercise.`);
      continue;
    }

    await db.run(
      `INSERT INTO workout_entries (id, workout_id, exercise_id, sets, reps, weight, rest_time, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.workout_id, entry.exercise_id, entry.sets, entry.reps, entry.weight, entry.rest_time, Date.now()]
    );

    logger.info(`✅ Stored entry ${entry.id}`);
  }

  logger.info("✅ Workout entries sync completed.");
}
