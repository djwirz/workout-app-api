import { FastifyInstance } from "fastify";
import { syncNotionToLocalDB } from "../services/syncService";
import { getDBConnection } from "../db";

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post("/sync", async (request, reply) => {
    try {
      fastify.log.info("🔄 Syncing new exercises...");
      await syncNotionToLocalDB();

      // Fetch only NEW exercises (ones that didn't exist before)
      const db = await getDBConnection();
      const exercises = await db.all(
        `SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo
         FROM exercises;`
      );

      return reply.send({ exercises });
    } catch (error) {
      fastify.log.error("❌ Error during sync:", error);
      reply.status(500).send({ error: "Sync failed" });
    }
  });
}
