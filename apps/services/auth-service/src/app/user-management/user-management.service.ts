import { Injectable } from '@nestjs/common';
import { UserManagementRepository } from './user-management.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class UserManagementService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly repo: UserManagementRepository,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  createUser(data: CreateUserDto) {
    try {
      const result = this.repo.createUser(data);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementService',
          messageData: 'Operation successful',
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'UserManagementService',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  updateUser(id: number, data: UpdateUserDto) {
    try {
      const result = this.repo.updateUser(id, data);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementService',
          messageData: 'Operation successful',
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'UserManagementService',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async deleteUser(id: number) {
    try {
      await this.repo.softDeleteUser(id);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementService',
          messageData: 'User deleted',
        }),
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'UserManagementService',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  getUsers(page = 1, limit = 10, type?: string) {
    try {
      const result = this.repo.getUsers((page - 1) * limit, limit, type);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementService',
          messageData: 'Operation successful',
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'UserManagementService',
          messageData: error,
        }),
      });
      throw error;
    }
  }
}
