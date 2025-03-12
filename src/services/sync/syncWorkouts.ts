import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchWorkoutsFromNotion } from "../notion/notionWokrouts";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

export async function syncWorkoutsToLocalDB() {
  try {
    const db = await getDBConnection();
    const notionWorkouts = await fetchWorkoutsFromNotion();

    logger.info("🔄 Syncing workouts from Notion...");

    for (const workout of notionWorkouts) {
      const existingWorkout = await db.get("SELECT id FROM workouts WHERE id = ?", [workout.id]);

      if (existingWorkout) {
        logger.info(`✅ Workout ${workout.id} already stored, skipping.`);
        continue;
      }

      await db.run(
        `INSERT INTO workouts (id, name, date, last_updated) VALUES (?, ?, ?, ?)`,
        [workout.id, workout.name, workout.date, Date.now()]
      );

      logger.info(`✅ Stored workout ${workout.id}`);
    }

    logger.info("✅ Workout sync completed.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`❌ Sync failed: ${error.message}`, error);
    } else {
      logger.error("❌ Sync failed with unknown error", error);
    }
    throw error;
  }
}
