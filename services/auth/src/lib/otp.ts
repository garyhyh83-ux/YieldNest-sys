import { config } from "../config.js";

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function storeOTP(email: string, purpose: string, code: string): void {
  const key = `${email}:${purpose}`;
  otpStore.set(key, {
    code,
    expiresAt: Date.now() + config.otpExpirySeconds * 1000,
  });
}

export function verifyOTP(email: string, purpose: string, code: string): boolean {
  const key = `${email}:${purpose}`;
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(key); // one-time use
  return true;
}

export function clearOTP(email: string, purpose: string): void {
  otpStore.delete(`${email}:${purpose}`);
}
