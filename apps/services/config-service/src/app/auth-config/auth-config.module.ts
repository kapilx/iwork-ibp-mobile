import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigController } from './auth-config.controller';
import { AuthConfigService } from './auth-config.service';
import { DefaultAuthConfigProvider } from './default-auth-config.provider';
import {
    AuthenticationMethod,
    CompanyAuthenticationMapping,
    CompanyAuthenticationConfig,
    FileUpload,
    Company,
} from '../../../../service-lib/src/lib/entities';
import { CompanyConfigModule } from '../company-config/company-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthenticationMethod,
      CompanyAuthenticationMapping,
      CompanyAuthenticationConfig,
      FileUpload,
      Company,
    ]),
    CompanyConfigModule,
  ],
  controllers: [AuthConfigController],
  providers: [AuthConfigService, DefaultAuthConfigProvider],
  exports: [AuthConfigService],
})
export class AuthConfigModule {}
