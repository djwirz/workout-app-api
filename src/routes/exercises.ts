import { FastifyInstance } from "fastify";
import { getExercisesFromDB, fetchAndStoreExercises } from "../services/syncService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    try {
      let exercises = await getExercisesFromDB();

      // If database is empty, fetch from Notion and store in SQLite
      if (exercises.length === 0) {
        console.log("No exercises found in SQLite, fetching from Notion...");
        await fetchAndStoreExercises();
        exercises = await getExercisesFromDB();
      }

      return reply.send({
        exercises: exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          group: ex.group,
          focus: ex.focus,
          hasVideo: !!ex.hasVideo, // ✅ Flag for video availability
        })),
      });
    } catch (error) {
      console.error("Error retrieving exercises:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
