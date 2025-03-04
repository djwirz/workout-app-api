import { FastifyInstance } from "fastify";
import { getExercisesFromDB, fetchAndStoreExercises } from "../services/syncService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    let exercises = await getExercisesFromDB();

    if (exercises.length === 0) {
      console.log("No exercises found in SQLite, fetching from Notion...");
      await fetchAndStoreExercises();
      exercises = await getExercisesFromDB();
    }

    // Return metadata (excluding video BLOB)
    return reply.send({
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        group: ex.group,
        focus: ex.focus,
        hasVideo: !!ex.hasVideo, // ✅ Flag for video availability
      })),
    });
  });
}
