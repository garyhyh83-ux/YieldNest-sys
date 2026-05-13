import "dotenv/config";

export const config = {
  port: parseInt(process.env["PORT"] || "3100"),
  databaseUrl: process.env["DATABASE_URL"] || "postgres://yieldnest:yieldnest_dev@localhost:5432/yieldnest?sslmode=disable",
  redisUrl: process.env["REDIS_URL"] || "redis://localhost:6379",
  jwtPrivateKeyPath: process.env["JWT_PRIVATE_KEY_PATH"] || "../../keys/jwt-private.pem",
  jwtPublicKeyPath: process.env["JWT_PUBLIC_KEY_PATH"] || "../../keys/jwt-public.pem",
  rpId: process.env["RP_ID"] || "localhost",
  rpName: process.env["RP_NAME"] || "YieldNest",
  rpOrigin: process.env["RP_ORIGIN"] || "http://localhost:3000",
  appUrl: process.env["APP_URL"] || "http://localhost:3000",
  logLevel: process.env["LOG_LEVEL"] || "debug",
  otpExpirySeconds: parseInt(process.env["OTP_EXPIRY_SECONDS"] || "300"),
};
