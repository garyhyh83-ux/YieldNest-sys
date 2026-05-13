import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authRequired } from "../../middleware/auth-required.js";
import { db } from "../../db/connection.js";
import { passkeyCredentials } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { users } from "../../db/schema.js";

export async function deletePasskeyRoutes(app: FastifyInstance) {
  app.delete("/:id", { preHandler: authRequired }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const { id } = request.params as { id: string };

    // Verify passkey belongs to user
    const pkRows = await db.select().from(passkeyCredentials).where(
      and(eq(passkeyCredentials.id, id), eq(passkeyCredentials.userId, userId))
    ).limit(1);

    if (pkRows.length === 0) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Passkey not found" } });
    }

    await db.delete(passkeyCredentials).where(eq(passkeyCredentials.id, id));

    // Check remaining passkeys and update auth factors
    const remaining = await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.userId, userId));
    if (remaining.length === 0) {
      await db.update(users).set({ authFactors: { passkey: false, emailOtp: true, hardwareKey: false } } as any)
        .where(eq(users.id, userId));
    }

    return reply.status(200).send({ success: true, data: { message: "Passkey deleted" } });
  });
}
