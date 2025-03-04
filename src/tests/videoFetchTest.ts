import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "../services/notionService";
import { downloadVideo } from "../services/syncService";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testVideoStorageAndRetrieval() {
  const db = await getDBConnection();

  console.log("🔍 Checking if exercises exist...");
  const exercises = await fetchExercisesFromNotion();

  if (exercises.length === 0) {
    console.warn("⚠️ No exercises found in Notion. Skipping test.");
    return;
  }

  const exerciseWithVideo = exercises.find((ex: { video: any; }) => ex.video);
  if (!exerciseWithVideo) {
    console.warn("⚠️ No exercises with videos found in Notion.");
    return;
  }

  const existingVideo = await db.get("SELECT LENGTH(video) as size FROM exercises WHERE id = ?", [
    exerciseWithVideo.id,
  ]);

  if (existingVideo?.size) {
    console.log(`✅ Video exists in SQLite (${existingVideo.size} bytes), skipping download.`);
  } else {
    console.log(`📥 Downloading video for ${exerciseWithVideo.name}...`);
    const videoBuffer = await downloadVideo(exerciseWithVideo.video);

    if (!videoBuffer) {
      console.error("❌ Video download failed!");
      return;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video) VALUES (?, ?, ?, ?, ?)`,
      [
        exerciseWithVideo.id,
        exerciseWithVideo.name,
        exerciseWithVideo.group,
        JSON.stringify(exerciseWithVideo.focus),
        videoBuffer,
      ]
    );

    console.log(`✅ Video stored in SQLite (${videoBuffer.length} bytes)`);
  }

  // Test API retrieval
  try {
    const response = await axios.get(`http://127.0.0.1:3000/video/${exerciseWithVideo.id}`, {
      responseType: "arraybuffer",
    });

    if (response.status === 200 && response.data.length === existingVideo.size) {
      console.log(`✅ API served correct video (${response.data.length} bytes)`);
    } else {
      console.warn(`⚠️ API response size mismatch: ${response.data.length} bytes (DB: ${existingVideo.size} bytes)`);
    }
  } catch (error) {
    console.error(`❌ API error: ${error}`);
  }
}

testVideoStorageAndRetrieval();
