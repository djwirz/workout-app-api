import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_EXERCISE_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function notionRequestWithRetry(url: string, body: object = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers["retry-after"] || 1;
        console.warn(`Rate limited by Notion, retrying in ${retryAfter} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      } else {
        console.error("Notion API request failed:", error);
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded for Notion API");
}

export const fetchExercisesFromNotion = async () => {
  try {
    const response = await notionRequestWithRetry(`${NOTION_API_URL}/${NOTION_DATABASE_ID}/query`);
    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Name.title[0]?.text.content || "Unnamed",
      group: page.properties.group?.select?.name || "Unknown",
      focus: page.properties.focus?.multi_select.map((f: any) => f.name) || [],
    }));
  } catch (error) {
    console.error("Error fetching exercises from Notion:", error);
    return [];
  }
};
