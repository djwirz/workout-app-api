import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchWorkoutEntriesFromNotion } from "../notion/notionWorkoutEntries";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

export async function syncWorkoutEntriesToLocalDB() {
  try {
    const db = await getDBConnection();
    const notionEntries = await fetchWorkoutEntriesFromNotion();

    logger.info("🔄 Syncing workout entries from Notion...");

    for (const entry of notionEntries) {
      if (!entry.workout_id || !entry.exercise_id) {
        logger.warn(`⚠️ Skipping invalid entry: ${JSON.stringify(entry)}`);
        continue;
      }

      const existingEntry = await db.get("SELECT id FROM workout_entries WHERE id = ?", [entry.id]);

      if (existingEntry) {
        logger.info(`✅ Entry ${entry.id} already stored, skipping.`);
        continue;
      }

      await db.run(
        `INSERT INTO workout_entries (id, workout_id, exercise_id, sets, reps, weight, last_updated) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.workout_id, entry.exercise_id, entry.sets, entry.reps, entry.weight, Date.now()]
      );

      logger.info(`✅ Stored workout entry ${entry.id}`);
    }

    logger.info("✅ Workout entries sync completed.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`❌ Sync failed: ${error.message}`, error);
    } else {
      logger.error("❌ Sync failed with unknown error", error);
    }
    throw error;
  }
}


