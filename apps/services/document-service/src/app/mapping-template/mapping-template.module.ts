import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MappingTemplateController } from './mapping-template.controller';
import { MappingTemplateService } from './mapping-template.service';
import { MappingTemplateVersion } from '../../../../service-lib/src/lib/entities/mapping-template-version.entity';
import { MappingTemplateColumn } from '../../../../service-lib/src/lib/entities/mapping-template-column.entity';
import { ENV } from '../../../../service-lib/src/lib/environment';

@Module({
    imports: [
        TypeOrmModule.forFeature([MappingTemplateVersion, MappingTemplateColumn]),
        JwtModule.register({ secret: ENV.JWT_SECRET }),
    ],
    controllers: [MappingTemplateController],
    providers: [MappingTemplateService],
    exports: [MappingTemplateService],
})
export class MappingTemplateModule {}
