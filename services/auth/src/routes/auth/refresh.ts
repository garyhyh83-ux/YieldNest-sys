import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, signAccessToken, signRefreshToken } from "../../services/token-service.js";
import { rotateRefreshToken } from "../../services/session-service.js";

export async function refreshRoutes(app: FastifyInstance) {
  app.post("/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    if (!refreshToken) {
      return reply.status(400).send({
        success: false, error: { code: "INVALID_INPUT", message: "Refresh token required" },
      });
    }

    try {
      const payload = await verifyToken(refreshToken);
      if ((payload as any).type !== "refresh") {
        return reply.status(401).send({
          success: false, error: { code: "INVALID_TOKEN", message: "Not a refresh token" },
        });
      }

      const tokenPayload = { sub: payload.sub, enterpriseId: payload.enterpriseId, role: payload.role };
      const newAccessToken = await signAccessToken(tokenPayload);
      const newRefreshToken = await signRefreshToken(tokenPayload);
      await rotateRefreshToken(refreshToken, newRefreshToken);

      return reply.status(200).send({
        success: true,
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 },
      });
    } catch {
      return reply.status(401).send({
        success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" },
      });
    }
  });
}
