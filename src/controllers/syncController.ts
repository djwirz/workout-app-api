import { FastifyInstance } from "fastify";
import { syncExercisesToLocalDB } from "../services/sync/syncExercises";
import { ExerciseRepository } from "../repositories/ExerciseRepository";

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post("/sync", async (request, reply) => {
    try {
      fastify.log.info("🔄 Syncing exercises...");
      await syncExercisesToLocalDB();

      const repo = new ExerciseRepository();
      const exercises = await repo.getAllExercises();

      return reply.send({ exercises });
    } catch (error) {
      fastify.log.error("❌ Error during sync:", error);
      reply.status(500).send({ error: "Sync failed" });
    }
  });
}
