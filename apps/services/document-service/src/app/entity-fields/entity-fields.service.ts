import { Injectable, Logger } from '@nestjs/common';
import { EntityFieldsRepository } from './entity-fields.repository';
import { MstrEntityFieldsUtilityRef } from '../../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity';

@Injectable()
export class EntityFieldsService {
    private readonly logger = new Logger(EntityFieldsService.name);

    constructor(
        private readonly entityFieldsRepository: EntityFieldsRepository
    ) {}

    async getEntityFieldsByEntityName(entityName: string): Promise<MstrEntityFieldsUtilityRef[]> {
        try {
            this.logger.log(`Fetching entity fields for entity: ${entityName}`);
            const fields = await this.entityFieldsRepository.findByEntityName(entityName);
            this.logger.log(`Retrieved ${fields.length} fields for entity: ${entityName}`);
            return fields;
        } catch (error) {
            this.logger.error(`Error fetching fields for entity ${entityName}:`, error);
            throw error;
        }
    }
}
