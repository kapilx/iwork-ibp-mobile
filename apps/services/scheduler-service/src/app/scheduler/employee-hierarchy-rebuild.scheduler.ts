import { Injectable, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { DEFAULT_ADMIN_ID } from "../../../../../../libs/service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";

const EMPLOYEE_HIERARCHY_REBUILD_SCHEDULER_KEY = "EMPLOYEE_HIERARCHY_REBUILD_DAILY";

/**
 * Triggers org-service's POST /employee/rebuild-hierarchy once a day. Same
 * shape as CompanyMigrationScheduler/PolicyMigrationScheduler — org-service
 * owns the actual rebuild (truncate + bulk recursive-CTE repopulate of
 * employee_hierarchy); this class only calls its existing endpoint on a
 * schedule, authenticating with a short-lived, self-signed system token.
 *
 * This is a self-healing safety net, not the primary freshness mechanism —
 * employee_hierarchy is also kept up to date incrementally on employee
 * create/reassign/deactivate/reactivate (see employee.repository.ts). This
 * cron exists to correct any drift those incremental paths miss (e.g.
 * concurrent bulk-import races) within 24h.
 *
 * Schedule is controlled entirely via the `EMPLOYEE_HIERARCHY_REBUILD_DAILY`
 * row in application_scheduler_configuration (see
 * database-migrations/sql/employee-hierarchy-rebuild-scheduler-config.sql) —
 * not an env var — matching how every other cron in this service is
 * configured.
 */
@Injectable()
export class EmployeeHierarchyRebuildScheduler implements OnModuleInit {
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
      EMPLOYEE_HIERARCHY_REBUILD_SCHEDULER_KEY,
      this.runEmployeeHierarchyRebuild.bind(this),
    );
    await this.dynamicCronService.loadCronJobs();
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EmployeeHierarchyRebuildScheduler",
        method: "onModuleInit",
        messageData: `Registered handler and loaded cron jobs for ${EMPLOYEE_HIERARCHY_REBUILD_SCHEDULER_KEY}`,
      }),
    });
  }

  private async runEmployeeHierarchyRebuild(): Promise<void> {
    const url = `${ENV["URL_ORG_SERVICE"] ?? "http://localhost:3023"}/employee/rebuild-hierarchy`;
    // AuthGuard (service-lib/src/lib/auth.guard.ts) resolves the acting user
    // from decoded.userDetails.userId (falling back to decoded.userId /
    // decoded.sub) -- a token carrying only emailId, as every other
    // system-cron token in this service currently does (company-migration,
    // policy-migration, generic-tpa-sync, tpa-claims-worker), fails that
    // check. Including userId here is what actually makes this a valid
    // "system" identity, matching how a real login token is shaped
    // (userDetails: { userId, emailId, ... }, see
    // simple-auth.service.ts's getTokens).
    const systemToken = jwt.sign(
      { userDetails: { userId: DEFAULT_ADMIN_ID, emailId: "system-cron@iirm.com" } },
      ENV["JWT_SECRET"] ?? "secret",
      { expiresIn: "5m" },
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EmployeeHierarchyRebuildScheduler",
        method: "runEmployeeHierarchyRebuild",
        messageData: `Employee hierarchy rebuild cron firing → POST ${url}`,
      }),
    });
    try {
      const res = await axios.post(
        url,
        {},
        {
          timeout: 120_000,
          headers: { Authorization: `Bearer ${systemToken}`, "x-bypass-timeout": "true" },
        },
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeHierarchyRebuildScheduler",
          method: "runEmployeeHierarchyRebuild",
          messageData: `Employee hierarchy rebuild completed: ${JSON.stringify(res.data?.data ?? res.data)}`,
        }),
      });
    } catch (error) {
      // Re-throw (after logging) instead of swallowing — DynamicCronService's
      // wrapper is what records last_run_status/last_failed_run_at, and it
      // can only do that correctly if this callback actually throws on
      // failure. Same note as company-migration.scheduler.ts.
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeHierarchyRebuildScheduler",
          method: "runEmployeeHierarchyRebuild",
          messageData: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        }),
      });
      throw error;
    }
  }
}
