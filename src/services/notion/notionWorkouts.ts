import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_WORKOUT_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

export async function fetchWorkoutsFromNotion() {
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
      date: page.properties.Date.date.start,
    }))
    .filter(Boolean);
}
