import { buildApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    logger.info(`Auth Service listening on port ${config.port}`);
  } catch (err) {
    logger.error(err, "Failed to start server");
    process.exit(1);
  }
}

main();
