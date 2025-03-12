import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_WORKOUT_ENTRIES_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

export async function fetchWorkoutEntriesFromNotion() {
  const response = await axios.post(
    `${NOTION_API_URL}/${NOTION_DATABASE_ID}/query`,
    {},
    {
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.results
    .map((page: any) => ({
      id: page.id,
      workout_id: page.properties.Workout.relation[0]?.id,
      exercise_id: page.properties.Exercise.relation[0]?.id,
      sets: page.properties.Sets.number,
      reps: page.properties.Reps.number,
      weight: page.properties.Weight.number || 0,
      rest_time: page.properties.Rest.number || 0,
    }))
    .filter(Boolean);
}
