import { FastifyInstance } from "fastify";
import { syncNotionToLocalDB } from "../services/syncService";

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post("/sync", async (request, reply) => {
    try {
      fastify.log.info("🔄 Manually triggering Notion sync...");
      await syncNotionToLocalDB();
      fastify.log.info("✅ Sync completed.");
      reply.send({ message: "Sync completed successfully." });
    } catch (error) {
      fastify.log.error("❌ Error during sync:", error);
      reply.status(500).send({ error: "Sync failed" });
    }
  });
}
