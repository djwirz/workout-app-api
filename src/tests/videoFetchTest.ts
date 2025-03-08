import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "../services/notionService";
import { downloadVideo } from "../services/syncService";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testVideoStorageAndRetrieval() {
  const db = await getDBConnection();

  console.log("🔍 Fetching exercises from Notion...");
  const exercises = await fetchExercisesFromNotion();

  if (exercises.length === 0) {
    console.error("❌ No exercises found in Notion!");
    return;
  }

  // Find an exercise that has a video
  const exerciseWithVideo = exercises.find((ex: { video: any; }) => ex.video);

  if (!exerciseWithVideo) {
    console.error("❌ No exercises with videos found in Notion!");
    return;
  }

  console.log(`✅ Found exercise with video: ${exerciseWithVideo.name} (${exerciseWithVideo.id})`);

  // Check if the video already exists in SQLite
  const existingVideo = await db.get("SELECT LENGTH(video) as size FROM exercises WHERE id = ?", [
    exerciseWithVideo.id,
  ]);

  if (existingVideo?.size) {
    console.log(`📂 Video already exists in SQLite (${existingVideo.size} bytes), skipping download.`);
  } else {
    console.log("📥 Downloading new video...");
    const videoBuffer = await downloadVideo(exerciseWithVideo.video);

    if (!videoBuffer) {
      console.error("❌ Failed to download video!");
      return;
    }

    console.log(`✅ Video downloaded (${videoBuffer.length} bytes), storing in SQLite...`);

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video)
       VALUES (?, ?, ?, ?, ?)`,
      [
        exerciseWithVideo.id,
        exerciseWithVideo.name,
        exerciseWithVideo.group,
        JSON.stringify(exerciseWithVideo.focus),
        videoBuffer,
      ]
    );

    console.log(`✅ Video successfully stored in SQLite.`);
  }

  // Validate stored video
  const storedVideo = await db.get(
    "SELECT LENGTH(video) as size FROM exercises WHERE id = ?",
    [exerciseWithVideo.id]
  );

  if (!storedVideo?.size) {
    console.error("❌ Video not found in database after insertion!");
    return;
  }

  console.log(`✅ Video is in SQLite (${storedVideo.size} bytes), testing API retrieval...`);

  // Test API retrieval
  try {
    const response = await axios.get(`http://127.0.0.1:3000/video/${exerciseWithVideo.id}`, {
      responseType: "arraybuffer",
    });

    if (response.status === 200) {
      console.log(
        `✅ API successfully served video (${response.data.length} bytes) [DB: ${storedVideo.size} bytes]`
      );

      // Ensure API response matches stored size
      if (response.data.length !== storedVideo.size) {
        console.error(
          `⚠️ Mismatch between API response (${response.data.length} bytes) and DB (${storedVideo.size} bytes)`
        );
      }
    } else {
      console.error(`❌ API returned unexpected status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("❌ API failed to retrieve video:", error instanceof Error ? error.message : String(error));
  }
}

testVideoStorageAndRetrieval();
