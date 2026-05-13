import * as jose from "jose";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

let privateKey: jose.KeyLike | null = null;
let publicKey: jose.KeyLike | null = null;
let useHMAC = false;
let hmacKey: Uint8Array | null = null;

async function loadKeys() {
  try {
    const privPem = await readFile(config.jwtPrivateKeyPath, "utf8");
    privateKey = await jose.importPKCS8(privPem, "RS256");
    const pubPem = await readFile(config.jwtPublicKeyPath, "utf8");
    publicKey = await jose.importSPKI(pubPem, "RS256");
    logger.info("Loaded RS256 keys for JWT");
  } catch {
    logger.warn("RS256 keys not found, using HMAC fallback for development");
    useHMAC = true;
    hmacKey = new TextEncoder().encode(
      process.env["JWT_SECRET"] || "yieldnest-dev-jwt-secret-change-in-production",
    );
  }
}

loadKeys();

export interface TokenPayload {
  sub: string;
  enterpriseId: string;
  role: string;
  jti: string;
}

export async function signAccessToken(payload: Omit<TokenPayload, "jti">): Promise<string> {
  const jti = randomUUID();
  const fullPayload = { ...payload, jti };

  if (useHMAC && hmacKey) {
    return new jose.SignJWT(fullPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .setIssuer("yieldnest-auth")
      .sign(hmacKey);
  }

  if (!privateKey) throw new Error("JWT private key not loaded");
  return new jose.SignJWT(fullPayload)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("yieldnest-auth")
    .sign(privateKey);
}

export async function signRefreshToken(payload: Omit<TokenPayload, "jti">): Promise<string> {
  const jti = randomUUID();
  const fullPayload = { ...payload, jti, type: "refresh" };

  if (useHMAC && hmacKey) {
    return new jose.SignJWT(fullPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .setIssuer("yieldnest-auth")
      .sign(hmacKey);
  }

  if (!privateKey) throw new Error("JWT private key not loaded");
  return new jose.SignJWT(fullPayload)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("yieldnest-auth")
    .sign(privateKey);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  if (useHMAC && hmacKey) {
    const { payload } = await jose.jwtVerify(token, hmacKey, {
      issuer: "yieldnest-auth",
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  }

  if (!publicKey) throw new Error("JWT public key not loaded");
  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: "yieldnest-auth",
    algorithms: ["RS256"],
  });
  return payload as unknown as TokenPayload;
}
