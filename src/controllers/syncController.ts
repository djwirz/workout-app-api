import { FastifyInstance } from "fastify";
import { syncWorkoutEntriesToLocalDB } from "../services/sync/syncWorkoutEntries";
import { syncWorkoutTemplateEntriesToLocalDB } from "../services/sync/syncWorkoutTemplateEntries";
import { getDBConnection } from "../db";
import { syncExercises, syncWorkouts } from "../services/sync/syncService";

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post("/sync", async (request, reply) => {
    const { type } = request.query as { type?: string };

    if (!type || type.includes("exercises")) await syncExercises();
    if (!type || type.includes("workouts")) await syncWorkouts();
    if (!type || type.includes("workout-entries")) await syncWorkoutEntriesToLocalDB();
    if (!type || type.includes("workout-template-entries")) await syncWorkoutTemplateEntriesToLocalDB();
    if (!type || type.includes("workout-templates")) await syncWorkoutTemplateEntriesToLocalDB();

    return reply.send({ message: "Sync completed" });
  });

  fastify.get("/sync/status", async (request, reply) => {
    const db = await getDBConnection();
    const syncTimes = await db.all("SELECT * FROM sync_state");
    return reply.send(syncTimes);
  });
}
