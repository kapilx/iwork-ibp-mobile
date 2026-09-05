import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserActivityLog } from "./entities";

export interface CreateActivityLogParams {
  userId?: number | null;
  activityKey: string;
  activityCategory?: string;
  referenceId?: number;
  referenceType?: string;
  metadata?: any;
}

@Injectable()
export class UserActivityLogService {
  constructor(
    @InjectRepository(UserActivityLog)
    private readonly userActivityLogRepository: Repository<UserActivityLog>,
  ) {}

  /**
   * Create Activity Log Entry
   */
  async createActivityLog(params: CreateActivityLogParams): Promise<UserActivityLog> {
    console.log("[UserActivityLogService] createActivityLog CALLED:", {
      userId: params.userId,
      activityKey: params.activityKey,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
      metadata: params.metadata,
    });
    try {
      const log = this.userActivityLogRepository.create({
        userId: (params.userId ?? undefined) as any,
        activityKey: params.activityKey,
        activityCategory: params.activityCategory,
        referenceId: params.referenceId != null ? String(params.referenceId) : undefined,
        referenceType: params.referenceType,
        metadata: params.metadata,
      });
      console.log("[UserActivityLogService] entity created, attempting DB save...");
      const saved = await this.userActivityLogRepository.save(log) as UserActivityLog;
      console.log("[UserActivityLogService] createActivityLog SUCCESS — row id:", saved.id);
      return saved;
    } catch (error) {
      console.error("[UserActivityLogService] createActivityLog FAILED:", error instanceof Error ? error.message : error);
      throw new Error("Failed to create activity log: " + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Get Logs By User (optional helper)
   */
  async getLogsByUser(userId: number): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Generic Find (for admin/audit usage)
   */
  async findAll(): Promise<UserActivityLog[]> {
    return this.userActivityLogRepository.find({
      order: { createdAt: "DESC" },
    });
  }
}