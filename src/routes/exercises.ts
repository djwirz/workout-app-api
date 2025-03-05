import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";
import { syncNotionToLocalDB } from "../services/syncService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    try {
      const db = await getDBConnection();
      const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };

      const rows = await db.all(`
        SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo 
        FROM exercises
        LIMIT ? OFFSET ?;
      `, [limit, offset]);

      if (rows.length === 0) {
        fastify.log.info("No exercises found in SQLite, syncing from Notion...");
        await syncNotionToLocalDB();
        return reply.send({ exercises: await db.all(`
          SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo 
          FROM exercises;
        `)});
      }

      fastify.log.info(`✅ Returning ${rows.length} exercises.`);
      return reply.send({ exercises: rows });

    } catch (error) {
      fastify.log.error("❌ Error retrieving exercises:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
