import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "../services/notionService";
import { downloadVideo } from "../services/syncService";
import axios from "axios";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

async function testVideoStorageAndRetrieval() {
  const db = getDBConnection();

  logger.info("🔍 Fetching exercises from Notion...");
  const exercises = await fetchExercisesFromNotion(); // FIX: Await the fetch

  if (exercises.length === 0) {
    logger.warn("⚠️ No exercises found in Notion. Skipping test.");
    return;
  }

  let processedCount = 0;

  for (const exercise of exercises) {
    if (!exercise.video) {
      logger.warn(`⚠️ No video for ${exercise.id}, skipping.`);
      continue;
    }

    // Fix: Properly type the result
    const existingVideo = db.prepare("SELECT video_size FROM exercises WHERE id = ?").get(exercise.id) as { video_size?: number } | undefined;

    if (existingVideo?.video_size) {
      logger.info(`✅ Video for ${exercise.id} already stored, skipping.`);
      continue;
    }

    const videoBuffer = await downloadVideo(exercise.video); // FIX: Await the video download
    if (!videoBuffer) {
      logger.error(`❌ Failed to download video for ${exercise.id}`);
      continue;
    }

    db.prepare(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size)
       VALUES (?, ?, ?, ?, ?)`
    ).run(exercise.id, exercise.name, exercise.group, videoBuffer, videoBuffer.length);

    logger.info(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
    processedCount++;
  }

  logger.info(`✅ Processed ${processedCount} videos.`);
}

testVideoStorageAndRetrieval();
