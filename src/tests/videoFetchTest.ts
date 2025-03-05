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

  let processedCount = 0;

  for (const exercise of exercises) {
    if (!exercise.video) {
      console.warn(`⚠️ No video URL for exercise ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video exists
    const existingVideo = await db.get("SELECT video_size FROM exercises WHERE id = ?", [exercise.id]);

    if (existingVideo?.video_size) {
      console.log(`✅ Video for ${exercise.id} already exists (${existingVideo.video_size} bytes), skipping.`);
      continue;
    }

    console.log(`📥 Downloading video for ${exercise.name}...`);
    const videoBuffer = await downloadVideo(exercise.video);

    if (!videoBuffer) {
      console.error(`❌ Video download failed for ${exercise.id}!`);
      continue;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video, video_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        exercise.id,
        exercise.name,
        exercise.group,
        JSON.stringify(exercise.focus),
        videoBuffer,
        videoBuffer.length,
      ]
    );

    console.log(`✅ Video stored for ${exercise.id} (${videoBuffer.length} bytes)`);
    processedCount++;
  }

  console.log(`✅ Completed processing ${processedCount} videos.`);

  // Verify API retrieval
  for (const exercise of exercises) {
    if (!exercise.video) continue;

    try {
      const response = await axios.get(`http://127.0.0.1:3000/video/${exercise.id}`, {
        responseType: "arraybuffer",
      });

      if (response.status === 200 && response.data.length > 0) {
        console.log(`✅ API successfully served video for ${exercise.id} (${response.data.length} bytes)`);
      } else {
        console.warn(`⚠️ API response size mismatch for ${exercise.id}.`);
      }
    } catch (error) {
      console.error(`❌ API error while retrieving video for ${exercise.id}: ${error}`);
    }
  }
}

testVideoStorageAndRetrieval();
