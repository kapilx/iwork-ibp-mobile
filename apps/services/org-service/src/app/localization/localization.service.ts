import { Injectable } from '@nestjs/common';
import { LocalizationRepository } from './localization.repository';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class LocalizationService {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly localizationRepository: LocalizationRepository,
        private readonly traceIdService: TraceIdService,
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
    }

    async getUserLocalization(userId: number) {
        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId,
                    status: 'success',
                    location: 'LocalizationService',
                    method: 'getUserLocalization',
                    messageData: 'method invoked',
                }),
            });
            return await this.localizationRepository.getUserLocalization(userId);
        }
        catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId,
                    status: 'failure',
                    location: 'LocalizationService',
                    method: 'getUserLocalization',
                    messageData: error,
                }),
            });
            throw new Error(`Failed to retrieve localization: ${error.message}`);
        }
    }

    async getOrganizationLocalization(organisation_id: number) {
        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'LocalizationService',
                    method: 'getOrganizationLocalization',
                    payload: { organisation_id },
                    messageData: 'method invoked',
                }),
            });
            return await this.localizationRepository.getOrganizationLocalization(organisation_id);
        }
        catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'LocalizationService',
                    method: 'getOrganizationLocalization',
                    payload: { organisation_id },
                    messageData: error,
                }),
            });
            throw new Error(`Failed to retrieve organization localization: ${error.message}`);
        }
    }
}
