import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth/index.js";
import { passkeyRoutes } from "./routes/passkey/index.js";
import { healthRoute } from "./routes/health.js";
import { logger } from "./lib/logger.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // Plugins
  await app.register(cors, {
    origin: [config.rpOrigin, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Error handler
  app.setErrorHandler((err: Error & { statusCode?: number; code?: string }, _request, reply) => {
    app.log.error(err);
    reply.status(err.statusCode || 500).send({
      success: false,
      error: {
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Internal server error",
      },
    });
  });

  // Routes
  await app.register(healthRoute);
  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(passkeyRoutes, { prefix: "/v1/auth/passkey" });

  return app;
}
