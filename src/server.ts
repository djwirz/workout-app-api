import Fastify from "fastify";
import dotenv from "dotenv";
import pino from "pino";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();

// Correctly configure Pino for Fastify
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "HH:MM:ss Z",
    },
  },
});

// Correct Fastify logger initialization
const fastify = Fastify({ logger: true });

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

const PORT = process.env.PORT || 3000;

// Logging hooks for incoming requests
fastify.addHook("onRequest", (request, reply, done) => {
  fastify.log.info({ method: request.method, url: request.url }, "📩 Incoming Request");
  done();
});

fastify.addHook("onResponse", (request, reply, done) => {
  fastify.log.info({ method: request.method, url: request.url, status: reply.statusCode }, "✅ Request Completed");
  done();
});

fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err, "❌ Server failed to start");
    process.exit(1);
  }
  fastify.log.info(`✅ Server running at ${address}`);
});
