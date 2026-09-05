import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { CronConfigurationRepository } from "./cron-configuration.repository";
import { IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";

/**
 * Reusable service to handle dynamic cron job loading and management.
 * Any scheduler can use this by passing their handler mappings.
 */
@Injectable()
export class DynamicCronService implements OnModuleInit {
  private readonly logger = new Logger(DynamicCronService.name);
  private readonly handlerMappings: Map<string, () => Promise<void>> =
    new Map();
  private readonly dynamicJobKeys: Set<string> = new Set();

  constructor(
    private readonly cronConfigRepository: CronConfigurationRepository,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  async onModuleInit() {
    // This will be called after all handlers are registered
  }

  /**
   * Register handlers from any scheduler
   * @param schedulerKey - The scheduler key from database
   * @param handler - The method to execute
   */
  registerHandler(schedulerKey: string, handler: () => Promise<void>) {
    this.handlerMappings.set(schedulerKey, handler);
    this.logger.log(`Registered handler for: ${schedulerKey}`);
  }

  /**
   * Register multiple handlers at once
   */
  registerHandlers(handlers: Map<string, () => Promise<void>>) {
    handlers.forEach((handler, schedulerKey) => {
      this.registerHandler(schedulerKey, handler);
    });
  }

  /**
   * Load all cron configurations from DB and schedule them
   * Call this after all handlers are registered
   */
  async loadCronJobs() {
    this.logger.log("Loading dynamic cron jobs from database...");

    try {
      const cronConfigs = await this.cronConfigRepository.getAllConfigurations(
        1,
        1000,
        [{ field: "id", order: "ASC" }]
      );

      for (const config of cronConfigs.data) {
        const handler = this.handlerMappings.get(config.schedulerKey);

        if (!handler) {
          this.logger.warn(
            `No handler registered for scheduler_key: ${config.schedulerKey}`
          );
          continue;
        }

        this.addDynamicCron(
          config.schedulerKey,
          config.schedulerExpression,
          handler
        );

        if (!config.isEnabled) {
          this.stopCron(config.schedulerKey);
        }
      }

      this.logger.log(
        `Loaded ${cronConfigs.data.length} dynamic cron jobs from DB`
      );
    } catch (error) {
      this.logger.error("Failed to load dynamic cron jobs:", error);
    }
  }

  /**
   * Add a dynamic cron job
   */
  addDynamicCron(
    schedulerKey: string,
    schedulerExpression: string,
    callback: () => Promise<void>
  ) {
    try {
      // Remove existing cron if present
      this.removeCron(schedulerKey);

      const job = new CronJob(schedulerExpression, async () => {
        if (IS_DEMO_ENVIRONMENT) {
          this.logger.log(
            `Skipping dynamic scheduler ${schedulerKey} — IS_DEMO_ENVIRONMENT is true`
          );
          return;
        }

        this.logger.log(`Executing dynamic scheduler: ${schedulerKey}`);
        const startTime = Date.now();
        try {
          // Update status to 'running'
          await this.cronConfigRepository.updateExecutionStatus(
            schedulerKey,
            "running",
            null,
            null
          );

          // Execute the actual handler
          await callback();

          // Calculate execution duration
          const executionDurationMs = Date.now() - startTime;

          // Update status to 'success' with duration
          await this.cronConfigRepository.updateExecutionStatus(
            schedulerKey,
            "success",
            null,
            executionDurationMs
          );
          this.logger.log(
            `Scheduler '${schedulerKey}' completed successfully in ${executionDurationMs}ms`
          );
        } catch (error) {
          // Calculate execution duration even on failure
          const executionDurationMs = Date.now() - startTime;

          // Update status to 'failed' with error message and duration
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await this.cronConfigRepository.updateExecutionStatus(
            schedulerKey,
            "failed",
            errorMessage,
            executionDurationMs
          );
          this.logger.error(
            `Error in dynamic scheduler ${schedulerKey}: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined
          );
        }
      });

      this.schedulerRegistry.addCronJob(schedulerKey, job);
      this.dynamicJobKeys.add(schedulerKey);
      job.start();

      this.logger.log(
        `Added dynamic scheduler: ${schedulerKey} with expression: ${schedulerExpression}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to add dynamic scheduler ${schedulerKey}:`,
        error
      );
    }
  }

  /**
   * Update an existing cron job's expression
   */
  async updateCronExpression(schedulerKey: string, newExpression: string) {
    try {
      const handler = this.handlerMappings.get(schedulerKey);

      if (!handler) {
        throw new Error(
          `No handler registered for schedulerKey: ${schedulerKey}`
        );
      }

      this.addDynamicCron(schedulerKey, newExpression, handler);

      this.logger.log(
        `Updated scheduler expression for ${schedulerKey} to: ${newExpression}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update scheduler expression for ${schedulerKey}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Stop a cron job
   */
  stopCron(schedulerKey: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(schedulerKey);
      job.stop();
      this.logger.log(`Stopped scheduler: ${schedulerKey}`);
    } catch (error) {
      // Log but don't throw - scheduler might not exist
      this.logger.debug(
        `Scheduler ${schedulerKey} not found or already stopped`,
        error
      );
    }
  }

  /**
   * Start a cron job
   */
  startCron(schedulerKey: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(schedulerKey);
      job.start();
      this.logger.log(`Started scheduler: ${schedulerKey}`);
    } catch (error) {
      this.logger.error(`Failed to start scheduler ${schedulerKey}:`, error);
    }
  }

  /**
   * Remove a cron job completely
   */
  removeCron(schedulerKey: string) {
    try {
      this.schedulerRegistry.deleteCronJob(schedulerKey);
      this.dynamicJobKeys.delete(schedulerKey);
      this.logger.log(`Removed scheduler: ${schedulerKey}`);
    } catch (error) {
      // Log but don't throw - scheduler doesn't exist, which is fine
      this.logger.debug(`Scheduler ${schedulerKey} doesn't exist`, error);
    }
  }

  /**
   * Reload all dynamic cron jobs from DB.
   * Useful after runtime config updates to avoid stale schedules.
   */
  async reloadAllDynamicCrons() {
    this.logger.log("Reloading all dynamic cron jobs...");
    const keysToRemove = Array.from(this.dynamicJobKeys);
    for (const schedulerKey of keysToRemove) {
      this.removeCron(schedulerKey);
    }
    await this.loadCronJobs();
  }
}
