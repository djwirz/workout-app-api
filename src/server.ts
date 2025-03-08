import Fastify from "fastify";
import dotenv from "dotenv";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();

// Configure Fastify logging: Only log errors by default
const fastify = Fastify({
  logger: {
    level: "warn", // Reduce unnecessary logging
    transport: {
      target: 'pino-pretty',
      options: {
        enabled: process.env.NODE_ENV !== "production" // Pretty logs in dev
      }
    }
  },
});

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

const PORT = process.env.PORT || 3000;
fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`✅ Server running at ${address}`); // Keep one concise startup log
});
