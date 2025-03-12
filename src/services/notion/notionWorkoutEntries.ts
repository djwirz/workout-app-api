import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_WORKOUT_ENTRY_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Fetches workout entries from Notion, ensuring missing properties are handled.
 */
/**
 * Fetches workout entries from Notion.
 */
export async function fetchWorkoutEntriesFromNotion() {
  try {
    const response = await axios.post(
      `${NOTION_API_URL}/${NOTION_DATABASE_ID}/query`,
      {}, // Empty object since we are not applying filters
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.results.map((page: any) => {
      return {
        id: page.id,
        workout_id: page.properties["Workout"]?.relation?.[0]?.id || null,
        exercise_id: page.properties["Exercises"]?.relation?.[0]?.id || null,
        sets: page.properties["set"]?.rich_text?.[0]?.text?.content
          ? parseInt(page.properties["set"].rich_text[0].text.content, 10)
          : 0,
        reps: page.properties["reps"]?.rich_text?.[0]?.text?.content
          ? parseInt(page.properties["reps"].rich_text[0].text.content, 10)
          : 0,
        weight: page.properties["weight"]?.rich_text?.[0]?.text?.content
          ? parseFloat(page.properties["weight"].rich_text[0].text.content)
          : 0,
      };
    });
  } catch (error: any) {
    console.error(`❌ Notion API Error: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}
