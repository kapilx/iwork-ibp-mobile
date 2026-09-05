import { Injectable, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";

const POLICY_MIGRATION_SCHEDULER_KEY = "POLICY_MIGRATION_DAILY";

/**
 * Triggers policy-service's POST /policy/migrate-policies once a day. Unlike
 * most schedulers here, this one has no local business logic of its own —
 * policy-service owns the migration (source procedure/view, staging/ref
 * tables, error CSV, etc.); this class only calls its existing endpoint on a
 * schedule, authenticating with a short-lived, self-signed system token
 * (same pattern as GenericTpaSyncScheduler/TpaClaimsWorkerScheduler).
 *
 * Schedule is controlled entirely via the `POLICY_MIGRATION_DAILY` row in
 * application_scheduler_configuration (see
 * database-migrations/sql/policy-migration-scheduler-config.sql) — not an
 * env var — matching how every other cron in this service is configured.
 */
@Injectable()
export class PolicyMigrationScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE,
    );
  }

  async onModuleInit(): Promise<void> {
    this.dynamicCronService.registerHandler(
      POLICY_MIGRATION_SCHEDULER_KEY,
      this.runPolicyMigration.bind(this),
    );
    await this.dynamicCronService.loadCronJobs();
    this.logger.log(
      `Registered handler and loaded cron jobs for ${POLICY_MIGRATION_SCHEDULER_KEY}`,
    );
  }

  private async runPolicyMigration(): Promise<void> {
    const url = `${ENV["URL_POLICY_SERVICE"] ?? "http://localhost:3017"}/policy/migrate-policies`;
    const systemToken = jwt.sign(
      { userDetails: { emailId: "system-cron@iirm.com" } },
      ENV["JWT_SECRET"] ?? "secret",
      { expiresIn: "5m" },
    );

    this.logger.log(`Policy migration cron firing → POST ${url}`);
    try {
      const res = await axios.post(
        url,
        {},
        {
          timeout: 300_000,
          headers: { Authorization: `Bearer ${systemToken}`, "x-bypass-timeout": "true" },
        },
      );
      this.logger.log(
        `Policy migration completed: ${JSON.stringify(res.data?.data ?? res.data)}`,
      );
    } catch (error) {
      // Re-throw (after logging) instead of swallowing — DynamicCronService's
      // own wrapper around this callback is what records last_run_status/
      // last_failed_run_at in application_scheduler_configuration. Swallowing
      // the error here made every failed HTTP call (policy-service down,
      // wrong URL, bad auth, etc.) show up as a false "success" in the DB
      // with zero actual migration work done.
      this.logger.error(
        `Policy migration cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
