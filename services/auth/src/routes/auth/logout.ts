import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authRequired } from "../../middleware/auth-required.js";
import { revokeSession } from "../../services/session-service.js";

export async function logoutRoutes(app: FastifyInstance) {
  app.post("/logout", { preHandler: authRequired }, async (request: FastifyRequest, reply: FastifyReply) => {
    // In a full implementation, we'd look up the session by token hash
    // For Phase 0, client-side token removal is sufficient
    return reply.status(200).send({
      success: true,
      data: { message: "Logged out successfully" },
    });
  });
}
