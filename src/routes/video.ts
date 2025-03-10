import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default function videoRoutes(fastify: FastifyInstance) {
  fastify.get("/video/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = getDBConnection();

      // Fix: Properly type the query result
      const row = db.prepare("SELECT video, video_size FROM exercises WHERE id = ?").get(id) as { video?: Buffer, video_size?: number } | undefined;

      if (!row || !row.video) {
        fastify.log.warn(`❌ Video not found for ID: ${id}`);
        return reply.status(404).send({ error: "Video not found" });
      }

      reply.header("Content-Type", "video/mp4");
      reply.header("Content-Length", row.video_size?.toString() || "0");
      reply.send(row.video);
    } catch (error) {
      fastify.log.error(`❌ Error retrieving video: ${(error as Error).message}`);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
