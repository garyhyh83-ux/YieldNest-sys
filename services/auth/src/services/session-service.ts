import { createHash, randomUUID } from "node:crypto";

// Phase 0: In-memory session store
// Phase 1+: Redis or database-backed sessions
interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  refreshTokenHash: string;
  deviceInfo: Record<string, unknown>;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
}

const sessions = new Map<string, Session>();
const tokenToSession = new Map<string, string>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  accessToken: string,
  refreshToken: string,
  deviceInfo: Record<string, unknown> = {},
  ipAddress: string | null = null,
): Promise<Session> {
  const id = randomUUID();
  const session: Session = {
    id,
    userId,
    tokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    deviceInfo,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
  };

  sessions.set(id, session);
  tokenToSession.set(session.tokenHash, id);
  return session;
}

export async function validateSession(accessToken: string): Promise<Session | null> {
  const hash = hashToken(accessToken);
  const sessionId = tokenToSession.get(hash);
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    tokenToSession.delete(hash);
    return null;
  }

  return session;
}

export async function revokeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    tokenToSession.delete(session.tokenHash);
    tokenToSession.delete(session.refreshTokenHash);
    sessions.delete(sessionId);
  }
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  for (const [id, session] of sessions) {
    if (session.userId === userId) {
      tokenToSession.delete(session.tokenHash);
      tokenToSession.delete(session.refreshTokenHash);
      sessions.delete(id);
    }
  }
}

export async function rotateRefreshToken(
  oldRefreshToken: string,
  newRefreshToken: string,
): Promise<Session | null> {
  const hash = hashToken(oldRefreshToken);
  for (const [id, session] of sessions) {
    if (session.refreshTokenHash === hash) {
      session.refreshTokenHash = hashToken(newRefreshToken);
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return session;
    }
  }
  return null;
}
