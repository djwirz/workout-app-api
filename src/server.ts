import Fastify from "fastify";
import cors from "@fastify/cors"; // ✅ Import CORS plugin
import dotenv from "dotenv";
import pino from "pino";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";
import syncRoutes from "./routes/sync";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "HH:MM:ss Z",
          },
        }
      : undefined,
});

const fastify = Fastify({ logger: true });

// ✅ Register CORS middleware
fastify.register(cors, {
  origin: "*", // Allow all origins (for development)
  methods: ["GET", "POST"], // Allow GET & POST requests
  allowedHeaders: ["Content-Type"], // Allow specific headers
});

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);
fastify.register(syncRoutes);

fastify.addHook("onRequest", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url }, "📩 Incoming Request");
  done();
});

fastify.addHook("onResponse", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url, status: reply.statusCode }, "✅ Request Completed");
  done();
});

const PORT = process.env.PORT || 3000;
fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err, "❌ Server failed to start");
    process.exit(1);
  }
  fastify.log.info(`✅ Server running at ${address}`);
});
