import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default async function videoRoutes(fastify: FastifyInstance) {
  fastify.get("/video/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = await getDBConnection();

      const row = await db.get("SELECT video FROM exercises WHERE id = ?", [id]);

      if (!row || !row.video) {
        fastify.log.warn(`❌ Video not found for ID: ${id}`);
        return reply.status(404).send({ error: "Video not found" });
      }

      // Debug-level log only for troubleshooting
      fastify.log.debug(`📂 Serving video for ${id} (${row.video.length} bytes)`);

      reply.header("Content-Type", "video/mp4");
      reply.send(row.video);
    } catch (error) {
      fastify.log.error(`❌ Error retrieving video: ${error}`);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
