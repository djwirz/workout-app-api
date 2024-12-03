import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_WORKOUT_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Fetches workouts from Notion, filtering only "Planned" workouts and using "Auto Name".
 */
export async function fetchWorkoutsFromNotion(lastSynced: number = 0) {
  const filter = {
    and: [
      { property: "status", status: { equals: "Planned" } },
      lastSynced ? { property: "last_edited_time", date: { after: new Date(lastSynced).toISOString() } } : {},
    ].filter(Boolean),
  };

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
      name: page.properties["Auto Name"]?.formula?.string || "Unnamed Workout",
      date: page.properties["Workout Date"]?.date?.start || null,
    }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Notion API Error (Workouts): ${(error as any).response?.data?.message || error.message}`);
    } else {
      console.error('❌ Notion API Error (Workouts): An unknown error occurred');
    }
    throw error;
  }
}
