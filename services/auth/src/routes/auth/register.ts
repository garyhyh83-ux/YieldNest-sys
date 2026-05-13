import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db/connection.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generateOTP, storeOTP, verifyOTP } from "../../lib/otp.js";
import { sendOTPEmail } from "../../lib/email.js";
import { config } from "../../config.js";
import { randomUUID } from "node:crypto";

interface RegisterRequest {
  email: string;
  displayName?: string;
  enterpriseId?: string;
}

interface VerifyRequest {
  email: string;
  otp: string;
}

export async function registerRoutes(app: FastifyInstance) {
  // POST /v1/auth/register — initiate registration
  app.post("/register", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, displayName, enterpriseId } = request.body as RegisterRequest;

    if (!email) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email required" } });
    }

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ success: false, error: { code: "EMAIL_ALREADY_EXISTS", message: "Email already registered" } });
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(email, "email_verification", otp);
    await sendOTPEmail(email, otp, "email_verification");

    return reply.status(200).send({
      success: true,
      data: {
        message: "OTP sent to email",
        expiresIn: config.otpExpirySeconds,
      },
    });
  });

  // POST /v1/auth/register/verify — verify OTP and create user
  app.post("/register/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, otp } = request.body as VerifyRequest;

    if (!email || !otp) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_INPUT", message: "Email and OTP required" } });
    }

    if (!verifyOTP(email, "email_verification", otp)) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_OTP", message: "Invalid or expired OTP" } });
    }

    // Create user (status = active, no passkey yet)
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      displayName: (request.body as RegisterRequest).displayName || null,
      role: "admin",
      status: "active",
      authFactors: { passkey: false, emailOtp: true, hardwareKey: false },
    } as any);

    return reply.status(201).send({
      success: true,
      data: { userId, email, message: "Registration complete. Set up your passkey to continue." },
    });
  });
}
