import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_WORKOUT_TEMPLATE_ENTRY_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Fetches new or updated workout template entries from Notion since the last sync.
 */
export async function fetchWorkoutTemplateEntriesFromNotion(lastSynced: number = 0) {
  const filter = lastSynced
    ? { property: "last_edited_time", date: { after: new Date(lastSynced).toISOString() } }
    : {};

  try {
    const response = await axios.post(
      `${NOTION_API_URL}/${NOTION_DATABASE_ID}/query`,
      { filter },
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.results.map((page: any) => ({
      id: page.id,
      template_id: page.properties["Workout Template"]?.relation?.[0]?.id || null,
      exercise_id: page.properties["Exercise"]?.relation?.[0]?.id || null,
      sets: page.properties["Sets"]?.number || 0,
      reps: page.properties["Reps"]?.number || 0,
      weight: page.properties["Weight"]?.number || 0,
    }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Notion API Error (Workout Template Entries): ${(error as any).response?.data?.message || error.message}`);
    } else {
      console.error('❌ Notion API Error (Workout Template Entries): An unknown error occurred');
    }
    throw error;
  }
}
