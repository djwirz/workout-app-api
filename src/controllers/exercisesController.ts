import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    try {
      const db = await getDBConnection();
      const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };

      const rows = await db.all(
        `SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo FROM exercises LIMIT ? OFFSET ?;`,
        [limit, offset]
      );

      fastify.log.info(`✅ Returning ${rows.length} exercises from database.`);
      return reply.send({ exercises: rows });
    } catch (error) {
      fastify.log.error("❌ Error retrieving exercises:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
