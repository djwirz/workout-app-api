import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";

const MAX_RETRIES = 3;

/**
 * Downloads a video from the given URL with retry logic.
 */
export async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) {
    console.warn("⚠️ No URL provided, skipping download.");
    return null;
  }

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`📥 Downloading video: Attempt ${attempts + 1}`);
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        console.error(`❌ Empty video response from ${url}`);
        return null;
      }

      console.log(`✅ Downloaded video (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Video download failed: ${error.message}`);
      } else {
        console.error('❌ Video download failed: Unknown error');
      }
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts)); // Exponential backoff
    }
  }

  console.error(`❌ Failed to download video after ${MAX_RETRIES} attempts.`);
  return null;
}

/**
 * Syncs exercises from Notion, downloads videos, and updates the database.
 */
export async function syncNotionToLocalDB() {
  const db = await getDBConnection();

  console.log("🔄 Syncing exercises from Notion...");

  const exercises = await fetchExercisesFromNotion();

  for (const exercise of exercises) {
    if (!exercise.video) {
      console.warn(`⚠️ No video URL for exercise ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video exists
    const existingVideo = await db.get("SELECT video_size, last_updated FROM exercises WHERE id = ?", [exercise.id]);

    if (existingVideo?.video_size) {
      console.log(`✅ Video for ${exercise.id} already exists (${existingVideo.video_size} bytes), skipping.`);
      continue;
    }

    console.log(`📥 Downloading video for ${exercise.name}...`);
    const videoBuffer = await downloadVideo(exercise.video);

    if (!videoBuffer) {
      console.error(`❌ Video download failed for ${exercise.id}, skipping storage.`);
      continue;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        exercise.id,
        exercise.name,
        exercise.group,
        videoBuffer,
        videoBuffer.length,
        Date.now(),
      ]
    );

    console.log(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
  }

  console.log("✅ Sync complete.");
}
