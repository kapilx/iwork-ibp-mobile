import Redis from "ioredis";
import { ENV } from "../environment";
import { buildLogMessage } from "./logger.util";
import type { Logger } from "winston";

interface RedisClientConfig {
  logger: Logger;
  traceId: string;
  location: string;
  method: string;
}

export const createRedisClient = ({
  logger,
  traceId,
  location,
  method,
}: RedisClientConfig): Redis | null => {
  if (ENV.STORAGE_TYPE !== "valkey") {
    return null;
  }

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId,
      status: "success",
      location,
      method,
      messageData: "Initializing Redis client",
    }),
  });

  // TLS is only enabled when explicitly configured and not for localhost.
  const host = ENV.VALKEY_HOST || "localhost";
  const port = ENV.VALKEY_PORT ? parseInt(ENV.VALKEY_PORT, 10) : 6379;
  const useTls = (ENV.VALKEY_TLS || "").toLowerCase() === "true";
  const isLocalHost = host === "localhost" || host === "127.0.0.1";

  const redisOptions: Redis.RedisOptions = {
    host,
    port,
    tls: {}, // Comment out this line when testing locally
  };

  if (useTls && !isLocalHost) {
    redisOptions.tls = {};
  }

  const redis = new Redis(redisOptions);

  redis.on("error", (err) => {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId,
        status: "failure",
        location,
        method,
        messageData: `Redis connection error: ${err}`,
      }),
    });
  });

  redis.on("connect", () => {
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        location,
        method,
        messageData: "Connected to Redis",
      }),
    });
  });

  return redis;
};
