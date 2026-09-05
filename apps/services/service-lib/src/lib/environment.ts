import * as dotenv from "dotenv";

// Dynamically load the appropriate .env file based on NODE_ENV
const envFile = `environments/.env.${process.env.NODE_ENV || "dev"}`;
dotenv.config({ path: envFile });

export const ENV = process.env;

// Global kill switch for background jobs — set IS_DEMO_ENVIRONMENT=true in a
// demo/sales deployment's env file so every cron returns immediately instead
// of sending real notifications or mutating seeded demo data.
export const IS_DEMO_ENVIRONMENT = ENV.IS_DEMO_ENVIRONMENT === "true";
