import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "../services/notionService";
import { downloadVideo } from "../services/syncService";

async function testVideoStorage() {
  console.log("🔍 Fetching exercises from Notion...");
  const exercises = await fetchExercisesFromNotion();

  const exerciseWithVideo = exercises.find((e: { video: any; }) => e.video);
  if (!exerciseWithVideo) {
    console.error("❌ No exercises with video found.");
    return;
  }

  console.log(`✅ Found exercise with video: ${exerciseWithVideo.name}`);
  console.log(`📥 Downloading video from: ${exerciseWithVideo.video}`);

  const videoBuffer = await downloadVideo(exerciseWithVideo.video);
  if (!videoBuffer) {
    console.error("❌ Failed to download video.");
    return;
  }

  console.log(`✅ Video downloaded (${videoBuffer.length} bytes)`);

  // Store in SQLite
  const db = await getDBConnection();
  await db.run(
    `INSERT OR REPLACE INTO exercises (id, name, "group", focus, video) VALUES (?, ?, ?, ?, ?)`,
    [
      exerciseWithVideo.id,
      exerciseWithVideo.name,
      exerciseWithVideo.group,
      JSON.stringify(exerciseWithVideo.focus),
      videoBuffer
    ]
  );

  console.log(`✅ Video stored in SQLite for exercise ${exerciseWithVideo.id}`);

  // Validate retrieval
  const result = await db.get(
    `SELECT id, name, length(video) as video_size FROM exercises WHERE id = ?`,
    [exerciseWithVideo.id]
  );

  if (!result || result.video_size === 0) {
    console.error("❌ Video storage validation failed. Data not found.");
  } else {
    console.log(`✅ Video successfully stored. Size: ${result.video_size} bytes`);
  }
}

testVideoStorage();
