import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_EXERCISE_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Fetches exercises from Notion.
 */
export async function fetchExercisesFromNotion() {
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
      name: page.properties.Name.title[0].text.content,
      group: page.properties.group?.select?.name || "Unknown",
      video: page.properties.video?.files?.[0]?.file?.url || null,
    }))
    .filter(Boolean);
}
