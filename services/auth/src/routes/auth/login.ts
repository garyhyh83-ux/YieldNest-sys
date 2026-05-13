import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db/connection.js";
import { users, passkeyCredentials } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generatePasskeyAuthOptions, verifyPasskeyAuth } from "../../services/web-authn.js";
import { signAccessToken, signRefreshToken } from "../../services/token-service.js";
import { createSession } from "../../services/session-service.js";
import { generateOTP, storeOTP, verifyOTP } from "../../lib/otp.js";
import { sendOTPEmail } from "../../lib/email.js";

// Store challenges temporarily (Phase 0: in-memory; Phase 1: Redis)
const challengeStore = new Map<string, { challenge: string; timestamp: number }>();

export async function loginRoutes(app: FastifyInstance) {
  // POST /v1/auth/login/begin
  app.post("/login/begin", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };
    if (!email) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email required" } });
    }

    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userRows.length === 0) {
      // Don't reveal if user exists — send OTP anyway
      const otp = generateOTP();
      storeOTP(email, "login", otp);
      await sendOTPEmail(email, otp, "login");
      return reply.status(200).send({ success: true, data: { method: "otp", message: "Check your email" } });
    }

    const user = userRows[0]!;
    const authFactors = user.authFactors as Record<string, boolean> | null;

    if (authFactors?.passkey) {
      // Get user's passkeys
      const passkeys = await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.userId, user.id));
      if (passkeys.length > 0) {
        const options = await generatePasskeyAuthOptions();
        challengeStore.set(email, { challenge: options.challenge as string, timestamp: Date.now() });
        return reply.status(200).send({
          success: true,
          data: { method: "passkey", options, email },
        });
      }
    }

    // Fall back to OTP
    const otp = generateOTP();
    storeOTP(email, "login", otp);
    await sendOTPEmail(email, otp, "login");
    return reply.status(200).send({ success: true, data: { method: "otp", message: "Check your email" } });
  });

  // POST /v1/auth/login/complete
  app.post("/login/complete", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, credential, otp } = request.body as any;

    if (!email) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email required" } });
    }

    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userRows.length === 0) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
    }

    const user = userRows[0]!;

    // Passkey login
    if (credential) {
      const stored = challengeStore.get(email);
      if (!stored) {
        return reply.status(400).send({ success: false, error: { code: "SESSION_EXPIRED", message: "Challenge expired" } });
      }
      challengeStore.delete(email);

      const passkeys = await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.userId, user.id));
      let verified = false;
      let newSignCount = 0;

      for (const pk of passkeys) {
        if (pk.credentialId === credential.id) {
          const result = await verifyPasskeyAuth(stored.challenge, credential, {
            credentialId: pk.credentialId,
            publicKey: new Uint8Array(Buffer.from(pk.publicKey, "base64")),
            signCount: pk.signCount,
            transports: (pk.transports as string[]) || undefined,
          });
          verified = result.verified;
          newSignCount = result.newSignCount;
          break;
        }
      }

      if (!verified) {
        return reply.status(401).send({ success: false, error: { code: "PASSKEY_VERIFICATION_FAILED", message: "Passkey verification failed" } });
      }

      // Update sign count
      await db.update(passkeyCredentials).set({ signCount: newSignCount, lastUsedAt: new Date() } as any)
        .where(eq(passkeyCredentials.credentialId, credential.id));

      const payload = { sub: user.id, enterpriseId: user.enterpriseId || "", role: user.role };
      const accessToken = await signAccessToken(payload);
      const refreshToken = await signRefreshToken(payload);
      await createSession(user.id, accessToken, refreshToken, {}, request.ip);

      // Update last login
      await db.update(users).set({ lastLoginAt: new Date() } as any).where(eq(users.id, user.id));

      return reply.status(200).send({
        success: true,
        data: { accessToken, refreshToken, expiresIn: 900 },
      });
    }

    // OTP login
    if (otp) {
      if (!verifyOTP(email, "login", otp)) {
        return reply.status(400).send({ success: false, error: { code: "INVALID_OTP", message: "Invalid or expired OTP" } });
      }

      const payload = { sub: user.id, enterpriseId: user.enterpriseId || "", role: user.role };
      const accessToken = await signAccessToken(payload);
      const refreshToken = await signRefreshToken(payload);
      await createSession(user.id, accessToken, refreshToken, {}, request.ip);

      await db.update(users).set({ lastLoginAt: new Date() } as any).where(eq(users.id, user.id));

      return reply.status(200).send({
        success: true,
        data: { accessToken, refreshToken, expiresIn: 900 },
      });
    }

    return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Missing credential or OTP" } });
  });
}
