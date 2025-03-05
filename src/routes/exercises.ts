import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";
import { syncNotionToLocalDB } from "../services/syncService";

export default function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", (request, reply) => {
    try {
      const db = getDBConnection();
      const { limit = 10, offset = 0 } = request.query as { limit?: number; offset?: number };

      const rows = db
        .prepare(`SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo FROM exercises LIMIT ? OFFSET ?`)
        .all(limit, offset);

      if (rows.length === 0) {
        fastify.log.info("No exercises found in SQLite, syncing from Notion...");
        syncNotionToLocalDB();
        return reply.send({
          exercises: db
            .prepare(`SELECT id, name, "group" as muscle_group, video IS NOT NULL as hasVideo FROM exercises`)
            .all(),
        });
      }

      fastify.log.info(`✅ Returning ${rows.length} exercises.`);
      return reply.send({ exercises: rows });
    } catch (error) {
      fastify.log.error("❌ Error retrieving exercises:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
