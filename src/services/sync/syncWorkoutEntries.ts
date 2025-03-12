import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchWorkoutEntriesFromNotion } from "../notion/notionWorkoutEntries";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

export async function syncWorkoutEntriesToLocalDB() {
  const db = await getDBConnection();
  const notionEntries = await fetchWorkoutEntriesFromNotion();

  logger.info("🔄 Syncing workout entries from Notion...");

  // **Fetch all local workout entry IDs**
  const localEntries = await db.all("SELECT id FROM workout_entries");
  const localEntryIds = new Set(localEntries.map((entry) => entry.id));

  const notionEntryIds = new Set();

  for (const entry of notionEntries) {
    if (!entry.workout_id || !entry.exercise_id) {
      logger.warn(`⚠️ Skipping invalid entry: ${JSON.stringify(entry)}`);
      continue;
    }

    notionEntryIds.add(entry.id);

    // Check if the entry already exists
    const existingEntry = await db.get("SELECT id FROM workout_entries WHERE id = ?", [entry.id]);

    if (existingEntry) {
      logger.info(`✅ Entry ${entry.id} already stored, updating.`);
      await db.run(
        `UPDATE workout_entries SET sets = ?, reps = ?, weight = ?, last_updated = ? WHERE id = ?`,
        [entry.sets, entry.reps, entry.weight, Date.now(), entry.id]
      );
    } else {
      logger.info(`➕ Adding new workout entry ${entry.id}.`);
      await db.run(
        `INSERT INTO workout_entries (id, workout_id, exercise_id, sets, reps, weight, last_updated) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.workout_id, entry.exercise_id, entry.sets, entry.reps, entry.weight, Date.now()]
      );
    }
  }

  // **Find and remove stale workout entries**
  for (const localId of localEntryIds) {
    if (!notionEntryIds.has(localId)) {
      logger.info(`🗑️ Removing deleted workout entry: ${localId}`);
      await db.run("DELETE FROM workout_entries WHERE id = ?", [localId]);
    }
  }

  logger.info("✅ Workout entries sync completed.");
}
