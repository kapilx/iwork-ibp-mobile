import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordProtectionConfig } from '../../../../service-lib/src/lib/entities/password-protection-config.entity';
import { PasswordProtectionConfigService } from './password-protection-config.service';
import { PasswordProtectionConfigController } from './password-protection-config.controller';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';

@Module({
    imports: [TypeOrmModule.forFeature([PasswordProtectionConfig])],
    controllers: [PasswordProtectionConfigController],
    providers: [PasswordProtectionConfigService, TraceIdService,],
    exports: [PasswordProtectionConfigService],
})
export class PasswordProtectionConfigModule {}
