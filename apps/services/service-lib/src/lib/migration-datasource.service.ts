import { Injectable } from "@nestjs/common";
import { DataSource, DataSourceOptions } from "typeorm";

/**
 * Shared read-side connection to the external migration source database
 * (policy + company migration views), used by both policy-service and
 * org-service. Configured once, shared by both services.
 *
 * Two ways to configure it — discrete fields take priority when present:
 *   1. MIGRATION_DB_HOST / MIGRATION_DB_PORT / MIGRATION_DB_USER /
 *      MIGRATION_DB_PASSWORD / MIGRATION_DB_NAME — plain fields, no URL
 *      encoding needed regardless of what characters the password contains
 *      (an `@`, `:`, `/`, etc. in a connection-string password has to be
 *      percent-encoded or the URL parser misreads where the password ends;
 *      discrete fields sidestep that entirely). Recommended.
 *   2. MIGRATION_DB_URL — a full postgres://user:password@host:port/db
 *      connection string, used only if none of the discrete fields above
 *      are set. If the password contains reserved URL characters, they
 *      MUST be percent-encoded (e.g. `@` -> `%40`, `:` -> `%3A`, `/` -> `%2F`).
 *
 * If neither is configured, callers fall back to their own DataSource.
 * Writes for both migration flows always go through the calling service's
 * own DataSource regardless — this class is only ever used for the read
 * side: calling into and querying the source views.
 *
 * SSL: set MIGRATION_DB_SSL=true if the source database rejects plaintext
 * connections (Postgres error `ESSLREQUIRED`) — common for managed/hosted
 * databases. Uses `rejectUnauthorized: false` so a self-signed or
 * provider-issued certificate doesn't also need a CA bundle configured;
 * this trades certificate-chain verification for "just get an encrypted
 * connection working," which matches how most external DB connections are
 * done in practice, but tightening it later (supplying a proper CA) is a
 * one-line change here if that ever matters.
 */
@Injectable()
export class MigrationDataSourceService {
  private cache: DataSource | null = null;

  async getDataSource(fallback: DataSource): Promise<DataSource> {
    const options = this.resolveOptions();
    if (!options) return fallback;
    if (this.cache?.isInitialized) return this.cache;
    this.cache = new DataSource(options);
    await this.cache.initialize();
    return this.cache;
  }

  private resolveOptions(): DataSourceOptions | null {
    const ssl = (process.env.MIGRATION_DB_SSL || "false").toLowerCase() === "true"
      ? { rejectUnauthorized: false }
      : undefined;

    const host = process.env.MIGRATION_DB_HOST;
    if (host) {
      return {
        type: "postgres",
        host,
        port: process.env.MIGRATION_DB_PORT ? parseInt(process.env.MIGRATION_DB_PORT, 10) : 5432,
        username: process.env.MIGRATION_DB_USER,
        password: process.env.MIGRATION_DB_PASSWORD,
        database: process.env.MIGRATION_DB_NAME,
        ssl,
      };
    }
    const url = process.env.MIGRATION_DB_URL;
    if (url) return { type: "postgres", url, ssl };
    return null;
  }
}
