import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";
import fs from "fs";

const MAX_RETRIES = 3;

/**
 * Downloads a video from a given URL with retry logic.
 */
export async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) {
    console.warn("⚠️ Skipping download, no URL provided.");
    return null;
  }

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`📥 Attempting to download video from: ${url} (Attempt ${attempts + 1})`);
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        console.error(`❌ Empty video response from ${url}`);
        return null;
      }

      console.log(`✅ Successfully downloaded video (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`❌ Failed to download video from ${url}:`, error);
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts)); // Exponential backoff
    }
  }

  console.error(`❌ Failed to download video after ${MAX_RETRIES} attempts.`);
  return null;
}

/**
 * Fetches exercises from Notion, downloads missing videos, and updates the local SQLite database.
 */
export async function syncNotionToLocalDB() {
  const db = await getDBConnection();

  console.log("🔄 Ensuring database schema is correct...");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT,
      "group" TEXT, -- Must be escaped
      focus TEXT,
      video BLOB,
      video_size INTEGER,
      last_updated INTEGER
    );
  `);
  console.log("✅ Database schema verified.");

  const exercises = await fetchExercisesFromNotion();

  for (const exercise of exercises) {
    if (!exercise.video) {
      console.warn(`⚠️ No video URL found for ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video already exists
    const existingVideo = await db.get("SELECT video_size, last_updated FROM exercises WHERE id = ?", [exercise.id]);

    if (existingVideo?.video_size) {
      console.log(`✅ Video for ${exercise.id} already exists (${existingVideo.video_size} bytes), skipping download.`);
      continue;
    }

    // Download and store video
    const videoBuffer = await downloadVideo(exercise.video);
    if (!videoBuffer) {
      console.error(`❌ Failed to download video for exercise ${exercise.id}, skipping storage.`);
      continue;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video, video_size, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exercise.id,
        exercise.name,
        exercise.group,
        JSON.stringify(exercise.focus),
        videoBuffer,
        videoBuffer.length,
        Date.now(),
      ]
    );

    console.log(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
  }

  console.log("✅ Exercises and videos successfully synced with SQLite.");
}
