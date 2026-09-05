import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MstrEntityFieldsUtilityRef } from '../../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity';
import { EntityFieldsController } from './entity-fields.controller';
import { EntityFieldsService } from './entity-fields.service';
import { EntityFieldsRepository } from './entity-fields.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([MstrEntityFieldsUtilityRef]),
        JwtModule.register({})
    ],
    controllers: [EntityFieldsController],
    providers: [EntityFieldsService, EntityFieldsRepository],
    exports: [EntityFieldsService]
})
export class EntityFieldsModule {}
