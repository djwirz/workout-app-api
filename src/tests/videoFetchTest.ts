import { fetchExercisesFromNotion } from "../services/notionService";

async function testFetchVideo() {
  console.log("Fetching exercises from Notion...");
  const exercises = await fetchExercisesFromNotion();

  if (exercises.length === 0) {
    console.error("❌ No exercises found. Check Notion API or database.");
    return;
  }

  const firstExercise = exercises.find((e: { video: any; }) => e.video);
  
  if (!firstExercise) {
    console.error("❌ No exercise with a video found.");
    return;
  }

  console.log("✅ First exercise with a video:");
  console.log(`ID: ${firstExercise.id}`);
  console.log(`Name: ${firstExercise.name}`);
  console.log(`Video URL: ${firstExercise.video}`);
  
  console.log("🔗 Open this URL in a browser to confirm it's valid.");
}

testFetchVideo();
