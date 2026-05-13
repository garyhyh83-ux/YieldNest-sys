// Drizzle ORM schema definitions — mirrors the PostgreSQL migrations
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const enterprises = pgTable("enterprises", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }),
  country: varchar("country", { length: 2 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  kybStatus: varchar("kyb_status", { length: 20 }).notNull().default("pending"),
  kybProviderRef: varchar("kyb_provider_ref", { length: 255 }),
  riskScore: integer("risk_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  enterpriseId: uuid("enterprise_id").references(() => enterprises.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 150 }),
  role: varchar("role", { length: 50 }).notNull(),
  authFactors: jsonb("auth_factors").notNull().default("{}"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  enterpriseIdx: index("idx_users_enterprise").on(table.enterpriseId),
  emailIdx: index("idx_users_email").on(table.email),
}));

export const passkeyCredentials = pgTable("passkey_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  signCount: integer("sign_count").notNull().default(0),
  transports: jsonb("transports"),
  deviceLabel: varchar("device_label", { length: 255 }),
  aaguid: varchar("aaguid", { length: 36 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => ({
  userIdx: index("idx_passkeys_user").on(table.userId),
}));

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull().default("email_verification"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailPurposeIdx: index("idx_otp_email_purpose").on(table.email, table.purpose),
}));
