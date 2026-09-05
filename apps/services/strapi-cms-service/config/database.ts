import fs from "fs";

let caString: string | undefined;

const caPath = process.env.STRAPI_DB_SSL_CA;

if (caPath) {
  try {
    // Read CA file as utf8
    const fileContent = fs.readFileSync(caPath, "utf8");

    // If CA is base64 encoded, decode it
    caString = Buffer.from(fileContent, "base64").toString("utf8");

    console.log("CA file content length:", fileContent.length);
  } catch (err) {
    console.error("Error reading or decoding STRAPI DB SSL CA file:", err);
    throw new Error("Unable to read or decode STRAPI DB SSL CA file");
  }
}

export default ({ env }) => {
  const isSsl = env.bool("STRAPI_DB_SSL", false);

  return {
    connection: {
      client: "postgres",
      connection: {
        host: env("STRAPI_DB_HOST", "localhost"),
        port: env.int("STRAPI_DB_PORT", 5432),
        database: env("STRAPI_DB_NAME", "strapi_cms"),
        user: env("STRAPI_DB_USER", "postgres"),
        password: env("STRAPI_DB_PASSWORD", "postgres"),

        ssl: isSsl
          ? {
              rejectUnauthorized: true,
              ca: caString,
            }
          : false,

        schema: env("STRAPI_DB_SCHEMA", "public"),
      },

      pool: {
        min: env.int("STRAPI_DATABASE_POOL_MIN", 2),
        max: env.int("STRAPI_DATABASE_POOL_MAX", 10),
      },

      acquireConnectionTimeout: env.int(
        "STRAPI_DATABASE_CONNECTION_TIMEOUT",
        60000,
      ),
    },
  };
};
