import { FastifyInstance } from "fastify";
import { getExercisesFromDB, fetchAndStoreExercises } from "../services/syncService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    let exercises = await getExercisesFromDB();
    
    if (exercises.length === 0) {
      console.log("No exercises found in SQLite, fetching from Notion...");
      exercises = await fetchAndStoreExercises(); // Pull from Notion & store in SQLite
    }
    
    return reply.send({ exercises });
  });
}
