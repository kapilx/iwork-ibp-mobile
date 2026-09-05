import { Injectable, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";

const COMPANY_MIGRATION_SCHEDULER_KEY = "COMPANY_MIGRATION_DAILY";

/**
 * Triggers org-service's POST /company/migrate-companies once a day. Same
 * shape as PolicyMigrationScheduler — org-service owns the migration
 * (source procedure/views, staging, error/success CSVs, etc.); this class
 * only calls its existing endpoint on a schedule, authenticating with a
 * short-lived, self-signed system token (same pattern as
 * GenericTpaSyncScheduler/TpaClaimsWorkerScheduler/PolicyMigrationScheduler).
 *
 * Schedule is controlled entirely via the `COMPANY_MIGRATION_DAILY` row in
 * application_scheduler_configuration (see
 * database-migrations/sql/company-migration-scheduler-config.sql) — not an
 * env var — matching how every other cron in this service is configured.
 */
@Injectable()
export class CompanyMigrationScheduler implements OnModuleInit {
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
      COMPANY_MIGRATION_SCHEDULER_KEY,
      this.runCompanyMigration.bind(this),
    );
    await this.dynamicCronService.loadCronJobs();
    this.logger.log(
      `Registered handler and loaded cron jobs for ${COMPANY_MIGRATION_SCHEDULER_KEY}`,
    );
  }

  private async runCompanyMigration(): Promise<void> {
    const url = `${ENV["URL_ORG_SERVICE"] ?? "http://localhost:3023"}/company/migrate-companies`;
    const systemToken = jwt.sign(
      { userDetails: { emailId: "system-cron@iirm.com" } },
      ENV["JWT_SECRET"] ?? "secret",
      { expiresIn: "5m" },
    );

    this.logger.log(`Company migration cron firing → POST ${url}`);
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
        `Company migration completed: ${JSON.stringify(res.data?.data ?? res.data)}`,
      );
    } catch (error) {
      // Re-throw (after logging) instead of swallowing — see the identical
      // note in policy-migration.scheduler.ts: DynamicCronService's wrapper
      // is what records last_run_status/last_failed_run_at, and it can only
      // do that correctly if this callback actually throws on failure.
      this.logger.error(
        `Company migration cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
