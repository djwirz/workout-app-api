import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default async function videoRoutes(fastify: FastifyInstance) {
  fastify.get("/video/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = await getDBConnection();

      console.log(`Fetching video for ID: ${id}`);
      const row = await db.get("SELECT video FROM exercises WHERE id = ?", [id]);

      if (!row || !row.video) {
        console.warn(`Video not found for ID: ${id}`);
        return reply.status(404).send({ error: "Video not found" });
      }

      console.log(`Serving video for ${id} (size: ${row.video.length} bytes)`);
      reply.header("Content-Type", "video/mp4");
      reply.send(row.video);
    } catch (error) {
      console.error("Error retrieving video:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
