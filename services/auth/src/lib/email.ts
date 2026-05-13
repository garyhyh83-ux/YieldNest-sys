import { logger } from "./logger.js";

// Phase 0: Mock email sender — logs to console
// Phase 1+: Integrate SendGrid / Resend / AWS SES
export async function sendOTPEmail(email: string, otp: string, purpose: string): Promise<void> {
  logger.info({ email, otp, purpose }, `[MOCK EMAIL] OTP sent to ${email}`);
}

export async function sendMagicLink(email: string, link: string): Promise<void> {
  logger.info({ email, link }, `[MOCK EMAIL] Magic link sent to ${email}`);
}

export async function sendNotification(email: string, subject: string, body: string): Promise<void> {
  logger.info({ email, subject }, `[MOCK EMAIL] Notification sent to ${email}`);
}
