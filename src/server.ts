import Fastify from "fastify";
import dotenv from "dotenv";
import exercisesRoutes from "./routes/exercises";
import videoRoutes from "./routes/video";

dotenv.config();
const fastify = Fastify({ logger: true });

fastify.register(exercisesRoutes);
fastify.register(videoRoutes);

const PORT = process.env.PORT || 3000;
fastify.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
