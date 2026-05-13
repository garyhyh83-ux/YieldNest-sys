import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authRequired } from "../../middleware/auth-required.js";
import { db } from "../../db/connection.js";
import { users, passkeyCredentials } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generatePasskeyRegistrationOptions, verifyPasskeyRegistration } from "../../services/web-authn.js";
import { randomUUID } from "node:crypto";

const challengeStore = new Map<string, { challenge: string; timestamp: number }>();

export async function registerPasskeyRoutes(app: FastifyInstance) {
  // GET /v1/auth/passkey/register/begin
  app.get("/register/begin", { preHandler: authRequired }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRows.length === 0) {
      return reply.status(404).send({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }

    const user = userRows[0]!;
    const options = await generatePasskeyRegistrationOptions(user.email, user.displayName || undefined);
    challengeStore.set(userId, { challenge: options.challenge as string, timestamp: Date.now() });

    return reply.status(200).send({ success: true, data: { options } });
  });

  // POST /v1/auth/passkey/register/complete
  app.post("/register/complete", { preHandler: authRequired }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const { credential, deviceLabel } = request.body as any;

    if (!credential) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Credential required" } });
    }

    const stored = challengeStore.get(userId);
    if (!stored) {
      return reply.status(400).send({ success: false, error: { code: "SESSION_EXPIRED", message: "Registration challenge expired" } });
    }
    challengeStore.delete(userId);

    try {
      const result = await verifyPasskeyRegistration(userId, stored.challenge, credential);

      // Store the passkey credential
      await db.insert(passkeyCredentials).values({
        id: randomUUID(),
        userId,
        credentialId: result.credentialId,
        publicKey: result.publicKey,
        signCount: result.signCount,
        transports: result.transports ? JSON.stringify(result.transports) : null,
        deviceLabel: deviceLabel || null,
        aaguid: result.aaguid || null,
      } as any);

      // Update user auth factors
      await db.update(users).set({ authFactors: { passkey: true, emailOtp: true, hardwareKey: false } } as any)
        .where(eq(users.id, userId));

      return reply.status(201).send({
        success: true,
        data: { message: "Passkey registered successfully", credentialId: result.credentialId },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: "PASSKEY_VERIFICATION_FAILED", message: err.message || "Passkey verification failed" },
      });
    }
  });
}
