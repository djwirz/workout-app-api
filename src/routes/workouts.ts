import { FastifyInstance } from "fastify";
import { getDBConnection } from "../db";

export default async function workoutsRoutes(fastify: FastifyInstance) {
  
  // Get all planned workouts
  fastify.get("/workouts", async (request, reply) => {
    try {
      const db = await getDBConnection();
      const workouts = await db.all(`SELECT id, name, date FROM workouts;`);

      fastify.log.info(`✅ Returning ${workouts.length} workouts.`);
      return reply.send({ workouts });
    } catch (error) {
      fastify.log.error("❌ Error retrieving workouts:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // Get a single workout and its entries
  fastify.get("/workout/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = await getDBConnection();

      // Fetch the workout
      const workout = await db.get(`SELECT * FROM workouts WHERE id = ?;`, [id]);
      if (!workout) {
        return reply.status(404).send({ error: "Workout not found" });
      }

      // Fetch the entries for this workout
      const entries = await db.all(`
        SELECT we.id, we.exercise_id, e.name AS exercise_name, we.sets, we.reps, we.weight, we.rest_time
        FROM workout_entries we
        JOIN exercises e ON we.exercise_id = e.id
        WHERE we.workout_id = ?;
      `, [id]);

      fastify.log.info(`✅ Returning workout ${id} with ${entries.length} entries.`);
      return reply.send({ ...workout, entries });
    } catch (error) {
      const params = request.params as { id: string };
      fastify.log.error(`❌ Error retrieving workout ${params.id}:`, error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // Get all entries for a specific workout
  fastify.get("/workout/:id/entries", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = await getDBConnection();

      const entries = await db.all(`
        SELECT we.id, we.exercise_id, e.name AS exercise_name, we.sets, we.reps, we.weight, we.rest_time
        FROM workout_entries we
        JOIN exercises e ON we.exercise_id = e.id
        WHERE we.workout_id = ?;
      `, [id]);

      fastify.log.info(`✅ Returning ${entries.length} entries for workout ${id}.`);
      return reply.send({ entries });
    } catch (error) {
      const params = request.params as { id: string };
      fastify.log.error(`❌ Error retrieving workout entries for ${params.id}:`, error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });

}
