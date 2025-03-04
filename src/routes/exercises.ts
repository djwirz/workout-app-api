import { FastifyInstance } from "fastify";
import { fetchExercisesFromNotion } from "../services/notionService";

export default async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    const exercises = await fetchExercisesFromNotion();
    return reply.send({ exercises });
  });
}
