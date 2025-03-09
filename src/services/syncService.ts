import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
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
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        logger.error("❌ Empty video response");
        return null;
      }

      logger.info(`✅ Video downloaded (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`❌ Download failed: ${error}`);
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts));
    }
  }

  logger.error("❌ Failed to download video after retries.");
  return null;
}

/**
 * Fetches exercises from Notion, downloads missing videos, and updates SQLite.
 */
export async function syncNotionToLocalDB() {
  const db = await getDBConnection();

  logger.info("🔄 Syncing exercises from Notion...");
  const exercises = await fetchExercisesFromNotion();

  for (const exercise of exercises) {
    if (!exercise.video) {
      logger.warn(`⚠️ No video for exercise ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video already exists
    const existingVideo = await db.get("SELECT video_size FROM exercises WHERE id = ?", [exercise.id]);

    if (existingVideo?.video_size) {
      logger.info(`✅ Video for ${exercise.id} already stored, skipping.`);
      continue;
    }

    const videoBuffer = await downloadVideo(exercise.video);
    if (!videoBuffer) {
      logger.error(`❌ Failed to download video for ${exercise.id}`);
      continue;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, videoBuffer, videoBuffer.length, Date.now()]
    );

    logger.info(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
  }

  logger.info("✅ Sync completed.");
}
