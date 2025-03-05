import Fastify from "fastify";
import dotenv from "dotenv";
import pino from "pino";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();

// Configure Pino logging
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "HH:MM:ss Z",
    },
  },
});

const fastify = Fastify({ logger });

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

const PORT = process.env.PORT || 3000;

fastify.addHook("onRequest", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url }, "📩 Incoming Request");
  done();
});

fastify.addHook("onResponse", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url, status: reply.statusCode }, "✅ Request Completed");
  done();
});

fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    logger.error(err, "❌ Server failed to start");
    process.exit(1);
  }
  logger.info(`✅ Server running at ${address}`);
});
