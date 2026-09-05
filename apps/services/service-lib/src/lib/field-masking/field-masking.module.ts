import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AclCategoryActionApiMap } from '../entities/acl-category-action-api-map.entity';
import { AclCategoryActionMap } from '../entities/acl-category-action-map.entity';
import { RoleAclCategoryActionMap } from '../entities/role-acl-category-action-map.entity';
import { UserRole } from '../entities/user-role.entity';
import { AclService } from '../acl.service';
import { ResponseMaskingInterceptor } from './interceptors/response-masking.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AclCategoryActionApiMap,
      AclCategoryActionMap,
      RoleAclCategoryActionMap,
      UserRole,
    ]),
  ],
  providers: [AclService, ResponseMaskingInterceptor],
  exports: [TypeOrmModule, AclService, ResponseMaskingInterceptor],
})
export class FieldMaskingModule {}
