import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authRequired } from "../../middleware/auth-required.js";
import { db } from "../../db/connection.js";
import { passkeyCredentials } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export async function listPasskeyRoutes(app: FastifyInstance) {
  app.get("/list", { preHandler: authRequired }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const passkeys = await db.select({
      id: passkeyCredentials.id,
      credentialId: passkeyCredentials.credentialId,
      signCount: passkeyCredentials.signCount,
      deviceLabel: passkeyCredentials.deviceLabel,
      aaguid: passkeyCredentials.aaguid,
      createdAt: passkeyCredentials.createdAt,
      lastUsedAt: passkeyCredentials.lastUsedAt,
    }).from(passkeyCredentials).where(eq(passkeyCredentials.userId, userId));

    return reply.status(200).send({ success: true, data: passkeys });
  });
}
