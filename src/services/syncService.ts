import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

const MAX_RETRIES = 3;

/**
 * Downloads a video from a given URL with retry logic.
 */
export async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) return null;

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      logger.info(`📥 Downloading video (Attempt ${attempts + 1})`);
      
      // Ensure we properly await the axios call
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        logger.error("❌ Empty video response");
        return null;
      }

      logger.info(`✅ Video downloaded (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`❌ Download failed: ${(error as Error).message}`);
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts)); // Exponential backoff
    }
  }

  logger.error("❌ Failed to download video after retries.");
  return null;
}

/**
 * Fetches exercises from Notion, downloads missing videos, and updates SQLite.
 */
export async function syncNotionToLocalDB(): Promise<void> {
  const db = getDBConnection();

  logger.info("🔄 Syncing exercises from Notion...");
  const exercises = await fetchExercisesFromNotion(); // FIX: Ensure we await the Promise

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertTransaction = db.transaction((exercises: any[]) => {
    for (const exercise of exercises) {
      if (!exercise.video) {
        logger.warn(`⚠️ No video for exercise ${exercise.id}, skipping.`);
        continue;
      }

      const existingVideo = db.prepare("SELECT video_size FROM exercises WHERE id = ?").get(exercise.id) as { video_size?: number } | undefined;

      if (existingVideo?.video_size) {
        logger.info(`✅ Video for ${exercise.id} already stored, skipping.`);
        continue;
      }

      // FIX: Properly await the video download before using .length
      downloadVideo(exercise.video).then((videoBuffer) => {
        if (!videoBuffer) {
          logger.error(`❌ Failed to download video for ${exercise.id}`);
          return;
        }

        insertStmt.run(
          exercise.id,
          exercise.name,
          exercise.group,
          videoBuffer,
          videoBuffer.length,
          Date.now()
        );

        logger.info(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
      }).catch((err) => {
        logger.error(`❌ Error during video download: ${(err as Error).message}`);
      });
    }
  });

  insertTransaction(exercises);
  logger.info("✅ Sync completed.");
}
