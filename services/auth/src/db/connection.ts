import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";
import { logger } from "../lib/logger.js";

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

export const db = drizzle(pool, { schema });

pool.on("error", (err) => {
  logger.error(err, "PostgreSQL pool error");
});

export async function healthCheck(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}

export { pool };
