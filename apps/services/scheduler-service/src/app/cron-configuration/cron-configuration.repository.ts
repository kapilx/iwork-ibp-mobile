import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApplicationSchedulerConfiguration } from "../../../../service-lib/src/lib/entities/application-scheduler-configuration.entity";
import { SchedulerAuditLog } from "../../../../service-lib/src/lib/entities/scheduler-audit-log.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";

@Injectable()
export class CronConfigurationRepository {
  constructor(
    @InjectRepository(ApplicationSchedulerConfiguration)
    private readonly schedulerConfigRepository: Repository<ApplicationSchedulerConfiguration>,
    @InjectRepository(SchedulerAuditLog)
    private readonly auditLogRepository: Repository<SchedulerAuditLog>,
    private readonly entityService: EntityService
  ) {}

  async getAllConfigurations(
    page: number,
    limit: number,
    sortArray: { field: string; order: "ASC" | "DESC" }[],
    searchBy?: string,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[]
  ): Promise<{ data: ApplicationSchedulerConfiguration[]; count: number }> {
    try {
      const { data, count } = await this.entityService.fetchEntityList(
        ApplicationSchedulerConfiguration,
        page,
        limit,
        sortArray,
        undefined,
        undefined,
        undefined,
        searchArray,
        undefined,
        searchBy,
        ["schedulerName", "schedulerKey"] // searchOn
      );
      return { data, count };
    } catch (error) {
      throw new Error(
        `Failed to fetch all scheduler configurations: ${error.message}`
      );
    }
  }

  async getConfigurationBySchedulerKey(
    schedulerKey: string
  ): Promise<ApplicationSchedulerConfiguration | null> {
    try {
      return await this.schedulerConfigRepository.findOne({
        where: { schedulerKey },
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch scheduler configuration by key: ${error.message}`
      );
    }
  }

  async getConfigurationById(
    id: number
  ): Promise<ApplicationSchedulerConfiguration | null> {
    try {
      return await this.schedulerConfigRepository.findOne({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch scheduler configuration by ID: ${error.message}`
      );
    }
  }

  async updateConfiguration(
    id: number,
    data: Partial<ApplicationSchedulerConfiguration>,
    userId: number
  ): Promise<ApplicationSchedulerConfiguration> {
    try {
      await this.schedulerConfigRepository.update(id, {
        ...data,
        updatedBy: userId,
      });

      const schedulerUpdated = await this.getConfigurationById(id);
      if (!schedulerUpdated) {
        throw new Error(`Scheduler configuration with ID ${id} not found`);
      }
      return schedulerUpdated;
    } catch (error) {
      throw new Error(
        `Failed to update scheduler configuration: ${error.message}`
      );
    }
  }

  async updateExecutionStatus(
    schedulerKey: string,
    status: "running" | "success" | "failed" | "idle",
    errorMessage?: string,
    executionDurationMs?: number
  ): Promise<void> {
    try {
      const config = await this.getConfigurationBySchedulerKey(schedulerKey);
      if (!config) {
        throw new Error(
          `Scheduler configuration not found for key: ${schedulerKey}`
        );
      }

      const updateData: any = {
        lastRunStatus: status,
      };

      if (status === "success") {
        updateData.lastSuccessfulRunAt = new Date();
        updateData.lastErrorMessage = null;
      } else if (status === "failed") {
        updateData.lastFailedRunAt = new Date();
        updateData.lastErrorMessage = errorMessage || "Unknown error";
      }

      await this.schedulerConfigRepository.update({ schedulerKey }, updateData);

      // Create audit log entry for every execution
      await this.createAuditLog({
        schedulerConfigId: config.id,
        schedulerKey: config.schedulerKey,
        schedulerName: config.schedulerName,
        status,
        errorMessage: errorMessage || null,
        executionDurationMs,
        executedAt: new Date(),
        createdBy: 1, // System user
      });
    } catch (error) {
      throw new Error(
        `Failed to update execution status for scheduler ${schedulerKey}: ${error.message}`
      );
    }
  }

  async createAuditLog(
    auditData: Partial<SchedulerAuditLog>
  ): Promise<SchedulerAuditLog> {
    try {
      const auditLog = this.auditLogRepository.create(auditData);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      throw new Error(`Failed to create audit log: ${error.message}`);
    }
  }

  async getAuditLogs(
    schedulerConfigId?: number,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: SchedulerAuditLog[]; count: number }> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder("audit");

      if (schedulerConfigId) {
        queryBuilder.andWhere(
          "audit.scheduler_config_id = :schedulerConfigId",
          {
            schedulerConfigId,
          }
        );
      }

      if (startDate) {
        queryBuilder.andWhere("audit.executed_at >= :startDate", { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere("audit.executed_at <= :endDate", { endDate });
      }

      queryBuilder
        .orderBy("audit.executed_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

      const [data, count] = await queryBuilder.getManyAndCount();
      return { data, count };
    } catch (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }
}
