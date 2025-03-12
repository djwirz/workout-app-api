import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchExercisesFromNotion } from "../notion/notionExercises";
import { fetchWorkoutsFromNotion } from "../notion/notionWorkouts";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

async function getLastSynced(entity: string): Promise<number> {
  const db = await getDBConnection();
  const row = await db.get("SELECT last_synced FROM sync_state WHERE entity = ?", [entity]);
  return row?.last_synced || 0;
}

async function updateLastSynced(entity: string) {
  const db = await getDBConnection();
  await db.run(
    "INSERT INTO sync_state (entity, last_synced) VALUES (?, ?) ON CONFLICT(entity) DO UPDATE SET last_synced = ?",
    [entity, Date.now(), Date.now()]
  );
}

export async function syncExercises() {
  const db = await getDBConnection();
  const lastSynced = await getLastSynced("exercises");

  logger.info("🔄 Syncing exercises...");
  const exercises = await fetchExercisesFromNotion(lastSynced);

  for (const exercise of exercises) {
    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video_path, last_updated) VALUES (?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, exercise.video, Date.now()]
    );
  }

  await updateLastSynced("exercises");
  logger.info("✅ Exercises synced.");
}

export async function syncWorkouts() {
  const db = await getDBConnection();
  const lastSynced = await getLastSynced("workouts");

  logger.info("🔄 Syncing workouts...");
  const workouts = await fetchWorkoutsFromNotion(lastSynced);

  for (const workout of workouts) {
    await db.run(
      `INSERT OR REPLACE INTO workouts (id, name, date, last_updated) VALUES (?, ?, ?, ?)`,
      [workout.id, workout.name, workout.date, Date.now()]
    );
  }

  await updateLastSynced("workouts");
  logger.info("✅ Workouts synced.");
}
