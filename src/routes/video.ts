import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default async function videoRoutes(fastify: FastifyInstance) {
  fastify.get("/video/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = await getDBConnection();

      // Retrieve video BLOB from SQLite
      const row = await db.get("SELECT video FROM exercises WHERE id = ?", [id]);

      if (!row || !row.video) {
        return reply.status(404).send({ error: "Video not found" });
      }

      reply.header("Content-Type", "video/mp4"); // ✅ Ensure correct MIME type
      reply.send(row.video); // ✅ Stream the video BLOB
    } catch (error) {
      console.error("Error retrieving video:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
