// Phase 0: Simple password hashing placeholder
// Phase 1+: Argon2id via @noble/hashes or native crypto

export async function hashPassword(password: string): Promise<string> {
  // Placeholder — in production use argon2id
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}
