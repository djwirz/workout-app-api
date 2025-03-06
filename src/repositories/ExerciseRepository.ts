import { getDBConnection } from "../db";

export class ExerciseRepository {
  async getVideoSize(id: string): Promise<number | null> {
    const db = await getDBConnection();
    const row = await db.get("SELECT video_size FROM exercises WHERE id = ?", [id]);
    return row?.video_size || null;
  }

  async saveExercise(exercise: { id: string; name: string; group: string; video: Buffer; video_size: number }) {
    const db = await getDBConnection();
    await db.run(
      `INSERT OR REPLACE INTO exercises (id, name, "group", video, video_size, last_updated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.group, exercise.video, exercise.video_size, Date.now()]
    );
  }

  async getAllExercises() {
    const db = await getDBConnection();
    return await db.all(
      `SELECT id, name, "group" AS muscle_group, video IS NOT NULL AS hasVideo FROM exercises;`
    );
  }
}
