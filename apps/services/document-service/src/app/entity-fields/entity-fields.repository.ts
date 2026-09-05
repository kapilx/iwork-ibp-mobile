import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MstrEntityFieldsUtilityRef } from '../../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity';

@Injectable()
export class EntityFieldsRepository {
    constructor(
        @InjectRepository(MstrEntityFieldsUtilityRef)
        private readonly entityFieldsRepository: Repository<MstrEntityFieldsUtilityRef>
    ) {}

    async findByEntityName(entityName: string): Promise<MstrEntityFieldsUtilityRef[]> {
        return await this.entityFieldsRepository.find({
            where: { entityName },
            order: {
                tableName: 'ASC',
                columnName: 'ASC'
            }
        });
    }
}
