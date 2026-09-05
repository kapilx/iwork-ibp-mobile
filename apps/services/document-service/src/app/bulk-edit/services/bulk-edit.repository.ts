import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  User as Users,
  Role,
} from "../../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../../service-lib/src/lib/utils/logger.util";
import { TraceIdService } from "../../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../../service-lib/src/lib/constants";

@Injectable()
export class BulkEditRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.DOCUMENT_SERVICE
    );
  }

  async findUserWithRoles(userId: number): Promise<Users | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findUserWithRoles",
          payload: { userId },
          messageData: "method invoked",
        }),
      });

      const user = await this.userRepository.findOne({
        where: { userId },
        relations: {
          userRoles: {
            role: true,
          },
        },
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findUserWithRoles",
          payload: { userId },
          messageData: user ? "user retrieved" : "user not found",
        }),
      });

      return user;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          status: "failure",
          location: "BulkAssignmentRepository",
          method: "findUserWithRoles",
          payload: { userId },
          messageData: error instanceof Error ? error.message : error,
        }),
      });
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch user with roles."
      );
    }
  }

  async findPeersByRoleAndOrganisation(
    roleIds: number[],
    organisationId: number
  ): Promise<Users[]> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findPeersByRoleAndOrganisation",
          payload: { roleIds, organisationId },
          messageData: "method invoked",
        }),
      });

      const peers = await this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.userRoles", "userRole")
        .leftJoinAndSelect("userRole.role", "role")
        .where("userRole.roleId IN (:...roleIds)", { roleIds })
        .andWhere("user.organisationId = :organisationId", { organisationId })
        .andWhere("user.deletedAt IS NULL")
        .getMany();

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findPeersByRoleAndOrganisation",
          payload: { roleIds, organisationId },
          messageData: `retrieved ${peers.length} peers`,
        }),
      });

      return peers;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          status: "failure",
          location: "BulkAssignmentRepository",
          method: "findPeersByRoleAndOrganisation",
          payload: { roleIds, organisationId },
          messageData: error instanceof Error ? error.message : error,
        }),
      });
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch peers by role."
      );
    }
  }

  async findRoleByName(roleName: string): Promise<Role | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findRoleByName",
          payload: { roleName },
          messageData: "method invoked",
        }),
      });

      const role = await this.roleRepository.findOne({
        where: { roleKey: roleName },
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkAssignmentRepository",
          method: "findRoleByName",
          payload: { roleName },
          messageData: role ? "role found" : "role not found",
        }),
      });

      return role;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          status: "failure",
          location: "BulkAssignmentRepository",
          method: "findRoleByName",
          payload: { roleName },
          messageData: error instanceof Error ? error.message : error,
        }),
      });
      throw new Error(
        error instanceof Error ? error.message : "Failed to find role by name."
      );
    }
  }

  async getUserAndManagerDetails(
    userId: number
  ): Promise<{ user: Users | null; manager: Users | null }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkEditRepository",
          method: "getUserAndManagerDetails",
          payload: { userId },
          messageData: "method invoked",
        }),
      });

      const user = await this.userRepository.findOne({
        where: { userId },
        select: [
          "userId",
          "firstName",
          "lastName",
          "emailId",
          "reportingUserId",
          "userStatusKey",
        ],
      });

      if (!user) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            status: "success",
            location: "BulkEditRepository",
            method: "getUserAndManagerDetails",
            payload: { userId },
            messageData: "user not found",
          }),
        });
        return { user: null, manager: null };
      }

      let manager: Users | null = null;
      if (user.reportingUserId) {
        manager = await this.userRepository.findOne({
          where: { userId: user.reportingUserId },
          select: [
            "userId",
            "firstName",
            "lastName",
            "emailId",
            "userStatusKey",
          ],
        });
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "BulkEditRepository",
          method: "getUserAndManagerDetails",
          payload: { userId },
          messageData: "user and manager details retrieved",
        }),
      });

      return { user, manager };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          status: "failure",
          location: "BulkEditRepository",
          method: "getUserAndManagerDetails",
          payload: { userId },
          messageData: error instanceof Error ? error.message : error,
        }),
      });
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch user and manager details."
      );
    }
  }
}
