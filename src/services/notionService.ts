import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_DATABASE_ID = process.env.NOTION_EXERCISE_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

export const fetchExercisesFromNotion = async () => {
  try {
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

    console.log("Raw Notion API Response:", JSON.stringify(response.data, null, 2));

    return response.data.results.map((page: any) => ({
      // id: page.id,
      // name: page.properties.Name.title[0]?.text.content || "Unnamed",
      // group: page.properties.group?.select?.name || "Unknown",
      // focus: page.properties.focus?.multi_select.map((f: any) => f.name) || [],
      video: page.properties.video?.files?.[0]?.external?.url || page.properties.video?.files?.[0]?.file?.url || null, // External or uploaded file
    }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching exercises from Notion:", error.message);
    } else if (axios.isAxiosError(error) && error.response) {
      console.error("Error fetching exercises from Notion:", error.response.data);
    } else {
      console.error("Error fetching exercises from Notion:", error);
    }
    return [];
  }
};

