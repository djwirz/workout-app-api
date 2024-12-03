import { getDBConnection } from "../../db";
import pino from "pino";
import { fetchWorkoutTemplateEntriesFromNotion } from "../notion/notionWorkoutTemplateEntries";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

export async function syncWorkoutTemplateEntriesToLocalDB() {
  const db = await getDBConnection();
  const notionEntries = await fetchWorkoutTemplateEntriesFromNotion();

  logger.info("🔄 Syncing workout template entries from Notion...");

  // Fetch all local template entry IDs
  const localEntries = await db.all("SELECT id FROM workout_template_entries");
  const localEntryIds = new Set(localEntries.map((entry) => entry.id));

  const notionEntryIds = new Set();

  for (const entry of notionEntries) {
    if (!entry.template_id || !entry.exercise_id) {
      logger.warn(`⚠️ Skipping invalid template entry: ${JSON.stringify(entry)}`);
      continue;
    }

    notionEntryIds.add(entry.id);

    // Check if the template entry exists
    const existingEntry = await db.get("SELECT id FROM workout_template_entries WHERE id = ?", [entry.id]);

    if (existingEntry) {
      logger.info(`✅ Template entry ${entry.id} already exists, updating.`);
      await db.run(
        `UPDATE workout_template_entries SET sets = ?, reps = ?, weight = ?, last_updated = ? WHERE id = ?`,
        [entry.sets, entry.reps, entry.weight, Date.now(), entry.id]
      );
    } else {
      logger.info(`➕ Adding new workout template entry ${entry.id}.`);
      await db.run(
        `INSERT INTO workout_template_entries (id, template_id, exercise_id, sets, reps, weight, last_updated) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.template_id, entry.exercise_id, entry.sets, entry.reps, entry.weight, Date.now()]
      );
    }
  }

  // **Find and remove stale template entries**
  for (const localId of localEntryIds) {
    if (!notionEntryIds.has(localId)) {
      logger.info(`🗑️ Removing deleted workout template entry: ${localId}`);
      await db.run("DELETE FROM workout_template_entries WHERE id = ?", [localId]);
    }
  }

  logger.info("✅ Workout template entries sync completed.");
}
