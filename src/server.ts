import Fastify from "fastify";
import dotenv from "dotenv";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();

// Configure Fastify logger directly using an object
const fastify = Fastify({
  logger: {
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
        : undefined, // Default JSON logging in production
  },
});

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

// ✅ Log all incoming requests
fastify.addHook("onRequest", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url }, "📩 Incoming Request");
  done();
});

// ✅ Log all outgoing responses
fastify.addHook("onResponse", (request, reply, done) => {
  request.log.info({ method: request.method, url: request.url, status: reply.statusCode }, "✅ Request Completed");
  done();
});

// Start the server
const PORT = process.env.PORT || 3000;
fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err, "❌ Server failed to start");
    process.exit(1);
  }
  fastify.log.info(`✅ Server running at ${address}`);
});
