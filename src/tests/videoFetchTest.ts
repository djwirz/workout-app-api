import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_EXERCISE_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function testNotionApiResponse() {
  try {
    console.log("Fetching raw data from Notion API...");

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

    console.log("✅ Full Notion API Response:");
    console.dir(response.data, { depth: null });

  } catch (error) {
    console.error("❌ Error fetching from Notion API:", error);
  }
}

testNotionApiResponse();
