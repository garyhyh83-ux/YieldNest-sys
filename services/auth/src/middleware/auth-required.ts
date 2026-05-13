import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../services/token-service.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    enterpriseId?: string;
    userRole?: string;
  }
}

export async function authRequired(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing authorization header" },
    });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid authorization format" },
    });
    return;
  }

  try {
    const payload = await verifyToken(token);
    request.userId = payload.sub;
    request.enterpriseId = payload.enterpriseId;
    request.userRole = payload.role;
  } catch {
    reply.status(401).send({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
    });
  }
}
