import { Injectable, NotFoundException } from "@nestjs/common";
import { CronConfigurationRepository } from "./cron-configuration.repository";
import { DynamicCronService } from "./dynamic-cron.service";
import { ApplicationSchedulerConfiguration } from "../../../../service-lib/src/lib/entities/application-scheduler-configuration.entity";
import { SchedulerAuditLog } from "../../../../service-lib/src/lib/entities/scheduler-audit-log.entity";
import { UpdateCronConfigDto } from "../dto/update-cron-config.dto";
import { mapSortParams } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { ENTITY_NAME } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class CronConfigurationService {
  private readonly istOffsetMinutes = 330;

  constructor(
    private readonly cronConfigRepository: CronConfigurationRepository,
    private readonly dynamicCronService: DynamicCronService
  ) {}

  async getAllConfigurations(
    page: number,
    limit: number,
    sort: string,
    searchBy?: string,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[]
  ): Promise<{ data: ApplicationSchedulerConfiguration[]; count: number }> {
    try {
      const sortParams = mapSortParams(
        sort,
        ENTITY_NAME.APPLICATION_SCHEDULER_CONFIGURATION.toUpperCase()
      );

      const result = await this.cronConfigRepository.getAllConfigurations(
        page,
        limit,
        sortParams,
        searchBy,
        searchArray
      );

      // Sort data to prioritize running crons at the top
      const sortedData = result.data
        .map((config) => ({
          ...config,
          schedulerExpression: this.convertCronUtcToIst(
            config.schedulerExpression
          ),
        }))
        .sort((a, b) => {
          // Running status gets priority (comes first)
          if (a.lastRunStatus === "running" && b.lastRunStatus !== "running") {
            return -1;
          }
          if (a.lastRunStatus !== "running" && b.lastRunStatus === "running") {
            return 1;
          }
          return 0;
        });

      return {
        ...result,
        data: sortedData,
      };
    } catch (error) {
      throw new Error(
        `Failed to get all scheduler configurations: ${error.message}`
      );
    }
  }

  async getConfigurationById(
    id: number
  ): Promise<ApplicationSchedulerConfiguration> {
    try {
      const config = await this.cronConfigRepository.getConfigurationById(id);
      if (!config) {
        throw new NotFoundException(
          `Scheduler configuration with ID ${id} not found`
        );
      }
      return {
        ...config,
        schedulerExpression: this.convertCronUtcToIst(
          config.schedulerExpression
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to get scheduler configuration by ID: ${error.message}`
      );
    }
  }

  async updateConfiguration(
    id: number,
    dto: UpdateCronConfigDto,
    userId: number
  ): Promise<ApplicationSchedulerConfiguration> {
    try {
      const utcCronExpression = dto.cronExpression
        ? this.convertCronIstToUtc(dto.cronExpression)
        : undefined;
      const updatedConfig = await this.cronConfigRepository.updateConfiguration(
        id,
        {
          schedulerExpression: utcCronExpression,
          isEnabled: dto.isEnabled,
        },
        userId
      );

      // Update scheduler if expression changed
      if (utcCronExpression) {
        await this.dynamicCronService.updateCronExpression(
          updatedConfig.schedulerKey,
          utcCronExpression
        );
      }

      // Handle enable/disable
      if (dto.isEnabled !== undefined) {
        if (dto.isEnabled) {
          this.dynamicCronService.startCron(updatedConfig.schedulerKey);
        } else {
          this.dynamicCronService.stopCron(updatedConfig.schedulerKey);
        }
      }

      // Force a full refresh so runtime schedulers always reflect latest DB state
      // and avoid stale cron expressions lingering in memory.
      await this.dynamicCronService.reloadAllDynamicCrons();

      return {
        ...updatedConfig,
        schedulerExpression: this.convertCronUtcToIst(
          updatedConfig.schedulerExpression
        ),
      };
    } catch (error) {
      throw new Error(
        `Failed to update scheduler configuration: ${error.message}`
      );
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
      return await this.cronConfigRepository.getAuditLogs(
        schedulerConfigId,
        startDate,
        endDate,
        page,
        limit
      );
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  private convertCronIstToUtc(cronExpression: string) {
    return this.shiftCronExpression(cronExpression, -this.istOffsetMinutes);
  }

  private convertCronUtcToIst(cronExpression: string) {
    return this.shiftCronExpression(cronExpression, this.istOffsetMinutes);
  }

  private shiftCronExpression(cronExpression: string, offsetMinutes: number) {
    if (!cronExpression) return cronExpression;
    const parts = cronExpression.trim().split(" ");
    if (parts.length < 5) return cronExpression;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const minuteNum = Number(minute);
    const hourNum = Number(hour);

    if (
      Number.isNaN(minuteNum) ||
      Number.isNaN(hourNum) ||
      minute.includes("*") ||
      hour.includes("*")
    ) {
      return cronExpression;
    }

    let totalMinutes = hourNum * 60 + minuteNum + offsetMinutes;
    let dayShift = 0;
    if (totalMinutes < 0) {
      totalMinutes += 1440;
      dayShift = -1;
    } else if (totalMinutes >= 1440) {
      totalMinutes -= 1440;
      dayShift = 1;
    }

    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;

    const shiftedDayOfWeek =
      dayShift !== 0 ? this.shiftList(dayOfWeek, dayShift, 0, 6) : dayOfWeek;
    const shiftedDayOfMonth =
      dayShift !== 0 ? this.shiftList(dayOfMonth, dayShift, 1, 31) : dayOfMonth;

    return `${newMinute.toString().padStart(2, "0")} ${newHour
      .toString()
      .padStart(2, "0")} ${shiftedDayOfMonth} ${month} ${shiftedDayOfWeek}`;
  }

  private shiftList(value: string, shift: number, min: number, max: number) {
    if (value === "*" || !value) return value;
    return value
      .split(",")
      .map((item) => {
        const num = Number(item.trim());
        if (Number.isNaN(num)) return item.trim();
        let next = num + shift;
        if (next < min) next = max;
        if (next > max) next = min;
        return next.toString();
      })
      .join(",");
  }
}
