import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Redis from "ioredis";
import { In, Repository } from "typeorm";
import { User } from "../entities/user";
import { UserRole } from "../entities/user-role.entity";
import { createLogger } from "../logger";
import { TraceIdService } from "../trace-id.service";
import { buildLogMessage } from "../utils/logger.util";
import { createRedisClient } from "../utils/redis.util";

const AUTH_VERSION_CACHE_PREFIX = "auth:version:";
const AUTH_VERSION_CACHE_TTL = 3600; // 1 hour

@Injectable()
export class AuthVersionService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly redis: Redis | null;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService);
    this.redis = createRedisClient({
      logger: this.logger,
      traceId: this.traceIdService.traceId,
      location: "AuthVersionService",
      method: "constructor",
    });
  }

   private getAuthVersionCacheKey(userId: number): string {
    return `auth:{${userId}}:version`;
  }

  /**
   * Get auth version for a user from cache or database
   */
  async getAuthVersion(userId: number): Promise<number> {
    try {
      let source = "database";
      let version: number;

      // Try cache first
      if (this.redis && this.redis.status === "ready") {
        const cached = await this.redis.get(
          this.getAuthVersionCacheKey(userId),
        );
        if (cached) {
          version = parseInt(cached, 10);
          source = "redis_cache";
          
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "AuthVersionService",
              method: "getAuthVersion",
              payload: { userId, version, source, redisKey: this.getAuthVersionCacheKey(userId) },
              messageData: "Auth version retrieved from Redis cache",
            }),
          });
          
          return version;
        }
      }

      // Fallback to database
      const user = await this.userRepository.findOne({
        where: { userId },
        select: ["authVersion"],
      });

      version = user?.authVersion || 1;

      // Cache the result
      let cacheWriteSuccess = false;
      if (this.redis && this.redis.status === "ready") {
        try {
          await this.redis.setex(
            this.getAuthVersionCacheKey(userId),
            AUTH_VERSION_CACHE_TTL,
            version.toString(),
          );
          cacheWriteSuccess = true;
        } catch (cacheError) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "AuthVersionService",
              method: "getAuthVersion",
              payload: { userId, version, cacheError },
              messageData: "Failed to write auth version to Redis cache",
            }),
          });
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AuthVersionService",
          method: "getAuthVersion",
          payload: { 
            userId, 
            version, 
            source,
            redisConnected: this.redis?.status === "ready",
            cacheWriteSuccess,
            redisKey: this.getAuthVersionCacheKey(userId)
          },
          messageData: "Auth version retrieved from database and cached",
        }),
      });

      return version;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AuthVersionService",
          method: "getAuthVersion",
          payload: { userId },
          messageData: error,
        }),
      });
      return 1; // Default version on error
    }
  }

  /**
   * Increment auth version for a single user
   */
  async incrementAuthVersion(userId: number, reason: string): Promise<number> {
    try {
      const user = await this.userRepository.findOne({
        where: { userId },
        select: ["userId", "authVersion"],
      });

      if (!user) {
        throw new NotFoundException(`User not found with id: ${userId}`);
      }

      // Increment auth version 
      const updatedUser = Object.assign(user, {
        authVersion: Number(user.authVersion || 1) + 1,
      });

      await this.userRepository.save(updatedUser);
      const newVersion = updatedUser.authVersion;

      // Update cache
      let cacheUpdateSuccess = false;
      if (this.redis && this.redis.status === "ready") {
        try {
          await this.redis.setex(
            this.getAuthVersionCacheKey(userId),
            AUTH_VERSION_CACHE_TTL,
            newVersion.toString(),
          );
          cacheUpdateSuccess = true;
        } catch (cacheError) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "AuthVersionService",
              method: "incrementAuthVersion",
              payload: { userId, newVersion, cacheError },
              messageData: "Failed to update auth version in Redis cache",
            }),
          });
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AuthVersionService",
          method: "incrementAuthVersion",
          payload: { 
            userId, 
            newVersion, 
            reason,
            redisConnected: this.redis?.status === "ready",
            cacheUpdateSuccess,
            redisKey: this.getAuthVersionCacheKey(userId)
          },
          messageData: "Auth version incremented in database and cache",
        }),
      });

      return newVersion;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AuthVersionService",
          method: "incrementAuthVersion",
          payload: { userId, reason },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Increment auth version for multiple users (bulk operation)
   */
  async incrementAuthVersionBulk(
    userIds: number[],
    reason: string,
  ): Promise<void> {
    if (userIds.length === 0) return;

    try {
      // Fetch all users
      const users = await this.userRepository.find({
        where: { userId: In(userIds) },
        select: ["userId", "authVersion"],
      });

      // Increment auth versions
      const updatedUsers = users.map(user => 
        Object.assign(user, {
          authVersion: Number(user.authVersion || 1) + 1,
        })
      );

      // Save all updated users
      await this.userRepository.save(updatedUsers);

      // Clear cache for all affected users
      if (this.redis && this.redis.status === "ready") {
        try {
          await this.clearAuthVersionCacheBulk(userIds);
        } catch (cacheError) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "AuthVersionService",
              method: "incrementAuthVersionBulk",
              payload: { userIds, userCount: userIds.length, cacheError },
              messageData: "Failed to clear Redis cache for bulk auth version update",
            }),
          });
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AuthVersionService",
          method: "incrementAuthVersionBulk",
          payload: { 
            userIds, 
            userCount: userIds.length, 
            reason,
            redisConnected: this.redis?.status === "ready",
          },
          messageData: "Auth versions incremented for multiple users",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AuthVersionService",
          method: "incrementAuthVersionBulk",
          payload: { userIds, reason },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Get users by role ID for bulk version increment
   */
  async getUsersByRole(roleId: number): Promise<number[]> {
    try {
      const userRoles = await this.userRoleRepository.find({
        where: { roleId },
        select: ["userId"],
      });

      const userIds = userRoles.map((ur) => ur.userId);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AuthVersionService",
          method: "getUsersByRole",
          payload: { roleId, userCount: userIds.length },
          messageData: "Retrieved users by role",
        }),
      });

      return userIds;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AuthVersionService",
          method: "getUsersByRole",
          payload: { roleId },
          messageData: error,
        }),
      });
      return [];
    }
  }

  /**
   * Handle user role change - increment auth version
   */
  async handleUserRoleChange(
    userId: number,
    changeType: "added" | "removed",
    roleId: number,
  ): Promise<void> {
    const reason = `User role ${changeType}: roleId=${roleId}`;
    await this.incrementAuthVersion(userId, reason);
  }

  /**
   * Handle role permission change - increment auth version for all users with that role
   */
  async handleRolePermissionChange(
    roleId: number,
    changeType: "added" | "removed",
    permissionId?: number,
  ): Promise<void> {
    const reason = `Role permission ${changeType}: roleId=${roleId}, permissionId=${permissionId}`;
    const userIds = await this.getUsersByRole(roleId);

    if (userIds.length > 0) {
      await this.incrementAuthVersionBulk(userIds, reason);
    }
  }

  /**
   * Clear auth version cache for multiple users - efficient batch deletion
   */
  private async clearAuthVersionCacheBulk(userIds: number[]): Promise<void> {
    if (!this.redis || this.redis.status !== "ready" || userIds.length === 0) {
      return;
    }

    let totalDeleted = 0;

    try {
      const pipeline = this.redis.pipeline();

      for (const userId of userIds) {
        const key = this.getAuthVersionCacheKey(userId);
        pipeline.del(key);
      }

      const results = await pipeline.exec();

      if(results) {
        for (const res of results) {
          if (res[1]) totalDeleted += res[1] as number;
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AuthVersionService",
          method: "clearAuthVersionCacheBulk",
          payload: {
            totalUsers: userIds.length,
            totalDeleted,
          },
          messageData: `Cleared ${totalDeleted}/${userIds.length} auth cache keys`,
        }),
      });

    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AuthVersionService",
          method: "clearAuthVersionCacheBulk",
          payload: { userCount: userIds.length, error },
          messageData: "Failed to clear auth cache keys",
        }),
      });
      throw error;
    }
  }
}
