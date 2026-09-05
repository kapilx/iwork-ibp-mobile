import { Injectable } from "@nestjs/common";
import { AccessControlListRepository } from "./access-control-list.repository";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class AccessControlListService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly accessControlListRepository: AccessControlListRepository,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }
  /**
   * Delegates the userId to the repository to get the user permissions
   */
  async getUserPermissions(userId: number,categoryKey:string) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'AccessControlListService',
        method: 'getUserPermissions',
        payload: { categoryKey },
        messageData: 'method invoked',
      }),
    });
    try {
      const data = await this.accessControlListRepository.getUserPermissions(userId, categoryKey);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'success',
          location: 'AccessControlListService',
          method: 'getUserPermissions',
          payload: { categoryKey },
          messageData: 'Permissions retrieved',
        }),
      });
      return data;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'AccessControlListService',
          method: 'getUserPermissions',
          payload: { categoryKey },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getAclMetadata() {
    return this.accessControlListRepository.getAclMetadata();
  }

  async getRoleAcl(roleId: number) {
    return this.accessControlListRepository.getRoleAcl(roleId);
  }

  async updateRoleAcl(roleId: number, aclIds: number[]) {
    return this.accessControlListRepository.updateRoleAcl(roleId, aclIds);
  }
}
