import type { FastifyInstance } from "fastify";
import { registerPasskeyRoutes } from "./register.js";
import { listPasskeyRoutes } from "./list.js";
import { deletePasskeyRoutes } from "./delete.js";

export async function passkeyRoutes(app: FastifyInstance) {
  await app.register(registerPasskeyRoutes);
  await app.register(listPasskeyRoutes);
  await app.register(deletePasskeyRoutes);
}
