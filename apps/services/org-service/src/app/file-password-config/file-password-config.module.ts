import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilePasswordConfig } from './file-password-config.entity';
import { FilePasswordConfigController } from './file-password-config.controller';
import { FilePasswordConfigService } from './file-password-config.service';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([FilePasswordConfig]),
    ],
    controllers: [FilePasswordConfigController],
    providers: [FilePasswordConfigService, TraceIdService],
    exports: [FilePasswordConfigService, TypeOrmModule],
})
export class FilePasswordConfigModule {}
