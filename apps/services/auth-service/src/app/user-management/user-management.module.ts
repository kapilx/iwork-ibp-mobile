import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { Employee } from '../../../../service-lib/src/lib/entities/employee.entity';
import { UserManagementService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { UserManagementRepository } from './user-management.repository';
import { UserRole } from '../../../../service-lib/src/lib/entities/user-role.entity';
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, Employee, UserRole]), InsuranceWellnessHubServiceLibModule],
  providers: [UserManagementService, UserManagementRepository],
  controllers: [UserManagementController],
})
export class UserManagementModule {}
