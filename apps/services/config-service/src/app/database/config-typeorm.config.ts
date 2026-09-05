import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { entities as serviceLibEntities } from "../../../../service-lib/src/lib/entities";
import { LogLevel } from "typeorm";
import * as fs from "fs";

let caString: string | undefined;
if (ENV.DB_SSL_CA) {
  try {
    const fileContent = fs.readFileSync(ENV.DB_SSL_CA, "utf8");
    caString = Buffer.from(fileContent, "base64").toString("utf8");
  } catch (err) {
    throw new Error("Unable to read or decode DB SSL CA file");
  }
}

const isSsl = ENV.DB_SSL ? ENV.DB_SSL.toLowerCase() === "true" : false;

export const configTypeOrmConfig: TypeOrmModuleOptions = {
  type: (ENV.DB_TYPE as "postgres") || "postgres",
  host: ENV.DB_HOST || "localhost",
  port: ENV.DB_PORT ? parseInt(ENV.DB_PORT, 10) : 5432,
  username: ENV.DB_USER || "postgres",
  password: ENV.DB_PASSWORD ? String(ENV.DB_PASSWORD) : "postgres",
  database: ENV.DB_NAME || "iirm-centralize",
  entities: serviceLibEntities,
  synchronize: false,
  logging: ENV.DB_LOGGING ? (ENV.DB_LOGGING.split(",") as LogLevel[]) : false,
  ssl: isSsl
    ? {
        rejectUnauthorized: true,
        ca: caString,
      }
    : false,
};
