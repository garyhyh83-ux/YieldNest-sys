import type { FastifyInstance } from "fastify";
import { registerRoutes } from "./register.js";
import { loginRoutes } from "./login.js";
import { logoutRoutes } from "./logout.js";
import { refreshRoutes } from "./refresh.js";
import { recoverRoutes } from "./recover.js";

export async function authRoutes(app: FastifyInstance) {
  await app.register(registerRoutes);
  await app.register(loginRoutes);
  await app.register(logoutRoutes);
  await app.register(refreshRoutes);
  await app.register(recoverRoutes);
}
