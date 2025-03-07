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

  console.log(`✅ Found exercise with video: ${exerciseWithVideo.name}`);

  // Download the video
  const videoBuffer = await downloadVideo(exerciseWithVideo.video);

  if (!videoBuffer) {
    console.error("❌ Failed to download video!");
    return;
  }

  console.log(`📥 Video downloaded (${videoBuffer.length} bytes)`);

  // Store in SQLite
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

  console.log("✅ Video stored in SQLite");

  // Validate storage
  const storedVideo = await db.get(
    "SELECT video FROM exercises WHERE id = ?",
    [exerciseWithVideo.id]
  );

  if (!storedVideo || !storedVideo.video) {
    console.error("❌ Video not found in database after insertion!");
    return;
  }

  console.log(`✅ Video successfully stored. Size: ${storedVideo.video.length} bytes`);

  // Test retrieval via API
  try {
    console.log("🌐 Testing API retrieval...");
    const response = await axios.get(`http://127.0.0.1:3000/video/${exerciseWithVideo.id}`, {
      responseType: "arraybuffer",
    });

    if (response.status === 200) {
      console.log(`✅ API successfully served video (${response.data.length} bytes)`);
    } else {
      console.error(`❌ API returned unexpected status: ${response.status}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ API failed to retrieve video:", error.message);
    } else {
      console.error("❌ API failed to retrieve video:", String(error));
    }
  }
}

testVideoStorageAndRetrieval();
