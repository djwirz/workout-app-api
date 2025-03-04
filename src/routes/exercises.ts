import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";
import { syncNotionToLocalDB } from "../services/syncService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    try {
      console.log("Fetching exercises from SQLite...");
      const db = await getDBConnection();
      const rows = await db.all(`
        SELECT id, name, "group" as muscle_group, focus, video IS NOT NULL as hasVideo 
        FROM exercises;
      `);

      if (rows.length === 0) {
        console.log("No exercises found in SQLite, fetching from Notion...");
        await syncNotionToLocalDB();
        return reply.send({ exercises: await db.all(`
          SELECT id, name, "group" as muscle_group, focus, video IS NOT NULL as hasVideo 
          FROM exercises;
        `)});
      }

      console.log(`Returning ${rows.length} exercises from local storage.`);
      return reply.send({ exercises: rows });

    } catch (error) {
      console.error("Error retrieving exercises:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
