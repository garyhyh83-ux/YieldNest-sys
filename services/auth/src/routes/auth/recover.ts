import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db/connection.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generateOTP, storeOTP, verifyOTP } from "../../lib/otp.js";
import { sendOTPEmail } from "../../lib/email.js";
import { config } from "../../config.js";

export async function recoverRoutes(app: FastifyInstance) {
  // POST /v1/auth/recover/begin
  app.post("/recover/begin", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };
    if (!email) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email required" } });
    }

    // Always show success to prevent email enumeration
    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userRows.length > 0) {
      const otp = generateOTP();
      storeOTP(email, "recovery", otp);
      await sendOTPEmail(email, otp, "recovery");
    }

    return reply.status(200).send({
      success: true,
      data: { message: "If the email is registered, a recovery code has been sent", expiresIn: config.otpExpirySeconds },
    });
  });

  // POST /v1/auth/recover/complete
  app.post("/recover/complete", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, otp } = request.body as { email: string; otp: string };
    if (!email || !otp) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email and OTP required" } });
    }

    if (!verifyOTP(email, "recovery", otp)) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_OTP", message: "Invalid or expired OTP" } });
    }

    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userRows.length === 0) {
      return reply.status(404).send({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }

    // Recovery successful — user should set up new passkey
    return reply.status(200).send({
      success: true,
      data: { message: "Recovery successful. Please register a new passkey.", userId: userRows[0]!.id },
    });
  });
}
