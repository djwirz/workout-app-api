import Fastify from "fastify";
import dotenv from "dotenv";
import pino from "pino";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();

// Configure Pino correctly for Fastify
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

// Pass the Pino instance into Fastify
const fastify = Fastify({ logger });

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

const PORT = process.env.PORT || 3000;

// Proper request logging
fastify.addHook("onRequest", (request, reply, done) => {
  request.log.info(`📩 [${request.method}] ${request.url}`);
  done();
});

fastify.addHook("onResponse", (request, reply, done) => {
  request.log.info(`✅ [${reply.statusCode}] ${request.method} ${request.url}`);
  done();
});

// Start the server
fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err, "❌ Server failed to start");
    process.exit(1);
  }
  fastify.log.info(`✅ Server running at ${address}`);
});
