import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";

/**
 * Downloads a video from a given URL.
 */
export async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) {
    console.warn("⚠️ Skipping download, no URL provided.");
    return null;
  }

  try {
    console.log(`📥 Downloading video from: ${url}`);
    const response = await axios.get(url, { responseType: "arraybuffer" });

    if (response.data.length === 0) {
      console.error(`❌ Empty video response from ${url}`);
      return null;
    }

    console.log(`✅ Successfully downloaded video (${response.data.length} bytes)`);
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`❌ Failed to download video from ${url}:`, error);
    return null;
  }
}

/**
 * Fetches exercises from Notion and stores them in SQLite.
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
      video BLOB
    );
  `);

  console.log("✅ Database schema verified.");

  const exercises = await fetchExercisesFromNotion();

  for (const exercise of exercises) {
    const videoBuffer = exercise.video ? await downloadVideo(exercise.video) : null;

    if (videoBuffer) {
      console.log(`📝 Storing video for exercise ${exercise.id} (${videoBuffer.length} bytes)`);
    } else {
      console.warn(`⚠️ No video stored for exercise ${exercise.id}`);
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video)
       VALUES (?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, JSON.stringify(exercise.focus), videoBuffer]
    );
  }

  console.log("✅ Exercises updated from Notion and stored in SQLite.");
}
