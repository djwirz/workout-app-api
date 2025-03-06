import { getDBConnection } from "../db";
import { fetchExercisesFromNotion } from "./notionService";
import axios from "axios";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const NOTION_WORKOUT_DB_ID = process.env.NOTION_WORKOUT_DB_ID;
const NOTION_WORKOUT_ENTRY_DB_ID = process.env.NOTION_WORKOUT_ENTRY_DB_ID;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

/**
 * Handles Notion API requests with automatic retry logic.
 */
async function notionRequestWithRetry(url: string, data: any = {}) {
  let attempts = 3;
  while (attempts > 0) {
    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      if (attempts === 1 || error.response?.status !== 429) {
        logger.error(`Notion API request failed: ${error.message}`);
        throw error;
      }
      logger.warn(`Notion API rate limited, retrying...`);
      await new Promise((res) => setTimeout(res, 1000)); // Wait 1s before retrying
    }
    attempts--;
  }
}

/**
 * Fetches planned workouts from Notion.
 */
async function fetchPlannedWorkoutsFromNotion() {
  logger.info("📡 Fetching planned workouts from Notion...");

  const response = await notionRequestWithRetry(
    `${NOTION_API_URL}/${NOTION_WORKOUT_DB_ID}/query`
  );

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties.Name.title?.[0]?.text?.content || "Unnamed Workout",
    date: page.properties.WorkoutDate.date?.start || "Unknown Date",
  }));
}

/**
 * Fetches workout entries for a given workout ID.
 */
async function fetchWorkoutEntriesFromNotion(workoutId: string) {
  logger.info(`📡 Fetching entries for workout: ${workoutId}`);

  const response = await notionRequestWithRetry(
    `${NOTION_API_URL}/${NOTION_WORKOUT_ENTRY_DB_ID}/query`,
    {
      filter: {
        property: "Workout",
        relation: {
          contains: workoutId,
        },
      },
    }
  );

  return response.results.map((entry: any) => ({
    id: entry.id,
    workout_id: workoutId,
    exercise_id: entry.properties.Exercise.relation?.[0]?.id || null,
    sets: entry.properties.Sets.number || 0,
    reps: entry.properties.Reps.number || 0,
    weight: entry.properties.Weight.number || 0,
    rest_time: entry.properties.RestTime.number || 0,
  }));
}

/**
 * Syncs planned workouts and their entries from Notion.
 */
async function syncWorkoutsToLocalDB() {
  const db = await getDBConnection();

  logger.info("🔄 Syncing planned workouts from Notion...");

  const notionWorkouts = await fetchPlannedWorkoutsFromNotion();
  for (const workout of notionWorkouts) {
    await db.run(
      `INSERT OR REPLACE INTO workouts (id, name, date, last_updated)
       VALUES (?, ?, ?, ?)`,
      [workout.id, workout.name, workout.date, Date.now()]
    );

    const workoutEntries = await fetchWorkoutEntriesFromNotion(workout.id);
    for (const entry of workoutEntries) {
      await db.run(
        `INSERT OR REPLACE INTO workout_entries (id, workout_id, exercise_id, sets, reps, weight, rest_time, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          workout.id,
          entry.exercise_id,
          entry.sets,
          entry.reps,
          entry.weight,
          entry.rest_time,
          Date.now(),
        ]
      );
    }
  }

  logger.info(`✅ Synced ${notionWorkouts.length} workouts.`);
}

/**
 * Downloads a video from a given URL with retry logic.
 */
async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) return null;

  let attempts = 0;
  while (attempts < 3) {
    try {
      logger.info(`📥 Downloading video (Attempt ${attempts + 1})`);
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        logger.error("❌ Empty video response");
        return null;
      }

      logger.info(`✅ Video downloaded (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`❌ Download failed: ${error}`);
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts));
    }
  }

  logger.error("❌ Failed to download video after retries.");
  return null;
}

/**
 * Syncs exercises from Notion, downloads missing videos, and updates SQLite.
 */
async function syncExercisesToLocalDB() {
  const db = await getDBConnection();

  logger.info("🔄 Syncing exercises from Notion...");
  const exercises = await fetchExercisesFromNotion();

  for (const exercise of exercises) {
    if (!exercise.video) {
      logger.warn(`⚠️ No video for exercise ${exercise.id}, skipping.`);
      continue;
    }

    // Check if video already exists
    const existingVideo = await db.get("SELECT video_size FROM exercises WHERE id = ?", [exercise.id]);

    if (existingVideo?.video_size) {
      logger.info(`✅ Video for ${exercise.id} already stored, skipping.`);
      continue;
    }

    const videoBuffer = await downloadVideo(exercise.video);
    if (!videoBuffer) {
      logger.error(`❌ Failed to download video for ${exercise.id}`);
      continue;
    }

    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, videoBuffer, videoBuffer.length, Date.now()]
    );

    logger.info(`✅ Stored video for ${exercise.id} (${videoBuffer.length} bytes)`);
  }

  logger.info("✅ Exercise sync completed.");
}

/**
 * Syncs all data: Exercises + Workouts.
 */
export async function syncNotionToLocalDB() {
  logger.info("🔄 Full sync started...");
  
  await syncExercisesToLocalDB();
  await syncWorkoutsToLocalDB();

  logger.info("✅ Full sync completed.");
}
