import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { Employee } from '../../../../service-lib/src/lib/entities/employee.entity';
import { UserRole } from '../../../../service-lib/src/lib/entities/user-role.entity';
import { USER_TYPE_IIRM_EMPLOYEE } from '../../../../service-lib/src/lib/constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class UserManagementRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Employee) private readonly empRepo: Repository<Employee>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'UserManagementRepository',
        method: 'createUser',
        payload: data,
        messageData: 'method invoked',
      }),
    });
    try {
      const user = this.userRepo.create(data);
      const saved = await this.userRepo.save(user);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementRepository',
          method: 'createUser',
          payload: data,
          messageData: 'User created',
        }),
      });
      return saved;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: 'createUser',
          payload: data,
          status: 'failure',
          location: 'UserManagementRepository',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User | null> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'UserManagementRepository',
        method: 'updateUser',
        payload: { id, ...data },
        messageData: 'method invoked',
      }),
    });
    try {
      await this.userRepo.update({ userId: id }, data);
      const updated = await this.userRepo.findOne({ where: { userId: id } });
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementRepository',
          method: 'updateUser',
          payload: { id, ...data },
          messageData: 'User updated',
        }),
      });
      return updated;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: 'updateUser',
          payload: { id, ...data },
          status: 'failure',
          location: 'UserManagementRepository',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async softDeleteUser(id: number): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'UserManagementRepository',
        method: 'softDeleteUser',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      await this.userRepo.update({ userId: id }, { deletedAt: new Date() });
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementRepository',
          method: 'softDeleteUser',
          payload: { id },
          messageData: 'User deleted',
        }),
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: 'softDeleteUser',
          payload: { id },
          status: 'failure',
          location: 'UserManagementRepository',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getUsers(skip = 0, take = 10, userType?: string): Promise<User[]> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'UserManagementRepository',
        method: 'getUsers',
        payload: { skip, take, userType },
        messageData: 'method invoked',
      }),
    });
    try {
      const where = userType ? { userTypeKey: userType } : {};
      const result = await this.userRepo.find({ where, skip, take });
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'UserManagementRepository',
          method: 'getUsers',
          payload: { skip, take, userType },
          messageData: 'Users retrieved',
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: 'getUsers',
          payload: { skip, take, userType },
          status: 'failure',
          location: 'UserManagementRepository',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async syncEmployee(user: User): Promise<void> {
    if (user.userTypeKey === USER_TYPE_IIRM_EMPLOYEE) {
      const emp = this.empRepo.create({
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        mobile: user.mobile,
        branchId: user.branchId,
        departmentId: user.departmentId,
        designationId: user.designationId,
        verticalId: user.verticalId,
        reportingUserId: user.reportingUserId,
        organisationId: 0,
        statusLid: 0,
        iirmEmpId: '',
        reportingManagerEmployeeId: 0,
        createdBy: user.createdBy,
        updatedBy: user.updatedBy,
      });
      await this.empRepo.save(emp);
    }
  }
}
