import { ExerciseRepository } from "../../repositories/ExerciseRepository";
import { fetchExercisesFromNotion } from "../notion/notionExercises";
import pino from "pino";
import { downloadVideo } from "./syncVideos";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

/**
 * Syncs exercises from Notion, downloads missing videos, and updates SQLite.
 */
export async function syncExercisesToLocalDB() {
  const exercises = await fetchExercisesFromNotion();
  const repo = new ExerciseRepository();

  logger.info("🔄 Syncing exercises from Notion...");

  for (const exercise of exercises) {
    if (!exercise.video) {
      logger.warn(`⚠️ No video for exercise ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video already exists
    const existingVideo = await repo.getVideoSize(exercise.id);
    if (existingVideo) {
      logger.info(`✅ Video for ${exercise.id} already stored, skipping.`);
      continue;
    }

    const videoBuffer = await downloadVideo(exercise.video);
    if (!videoBuffer) {
      logger.error(`❌ Failed to download video for ${exercise.id}`);
      continue;
    }

    await repo.saveExercise({ ...exercise, video: videoBuffer, video_size: videoBuffer.length });

    logger.info(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
  }

  logger.info("✅ Exercise sync completed.");
}
