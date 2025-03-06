import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_EXERCISE_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Handles Notion API requests with automatic retry logic.
 */
async function notionRequestWithRetry(url: string, data: any = {}) {
  let attempts = 3;
  while (attempts > 0) {
    try {
      const response = await axios.post(
        url,
        data,
        {
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (attempts === 1 || error.response?.status !== 429) {
        console.error(`Notion API request failed: ${error.message}`);
        throw error;
      }
      console.warn(`Notion API rate limited, retrying...`);
      await new Promise((res) => setTimeout(res, 1000)); // Wait 1s before retrying
    }
    attempts--;
  }
}

/**
 * Fetches exercises from Notion, extracting relevant properties.
 */
export const fetchExercisesFromNotion = async () => {
  try {
    const response = await notionRequestWithRetry(`${NOTION_API_URL}/${NOTION_DATABASE_ID}/query`);

    return response.results.map((page: any) => {
      const videoUrl = page.properties.video?.files?.[0]?.external?.url || null;
      console.log(`Fetched video for ${page.properties.Name.title[0]?.text.content}: ${videoUrl}`);

      return {
        id: page.id,
        name: page.properties.Name.title[0]?.text.content || "Unnamed",
        group: page.properties.group?.select?.name || "Unknown",
        focus: page.properties.focus?.multi_select.map((f: any) => f.name) || [],
        video: videoUrl,
      };
    });
  } catch (error) {
    console.error("Error fetching exercises from Notion:", error);
    return [];
  }
};
