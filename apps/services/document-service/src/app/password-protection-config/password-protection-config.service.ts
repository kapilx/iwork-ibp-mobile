import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordProtectionConfig } from '../../../../service-lib/src/lib/entities/password-protection-config.entity';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class PasswordProtectionConfigService {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        @InjectRepository(PasswordProtectionConfig)
        private readonly passwordProtectionConfigRepository: Repository<PasswordProtectionConfig>,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(
            this.traceIdService,
            serviceNames.DOCUMENT_SERVICE
        );
    }

    /**
     * Get all active password protection configurations
     * @returns Array of active password protection configs
     */
    async getAllActiveConfigs(): Promise<PasswordProtectionConfig[]> {
        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'info',
                    location: 'PasswordProtectionConfigService',
                    method: 'getAllActiveConfigs',
                    messageData: 'Fetching all active password protection configurations',
                }),
            });

            const configs = await this.passwordProtectionConfigRepository.find({
                where: { status: 'active' },
                select: ['id', 'categoryName', 'categoryKey', 'enablePassword', 'status'],
                order: { categoryName: 'ASC' },
            });

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'PasswordProtectionConfigService',
                    method: 'getAllActiveConfigs',
                    messageData: `Retrieved ${configs.length} active configurations`,
                }),
            });

            return configs;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'PasswordProtectionConfigService',
                    method: 'getAllActiveConfigs',
                    messageData: `Error fetching configurations: ${error.message}`,
                }),
            });
            throw error;
        }
    }

    /**
     * Get password protection config by category key
     * @param categoryKey - The category key to search for
     * @returns Password protection config or null
     */
    async getConfigByCategoryKey(
        categoryKey: string
    ): Promise<PasswordProtectionConfig | null> {
        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'info',
                    location: 'PasswordProtectionConfigService',
                    method: 'getConfigByCategoryKey',
                    messageData: `Fetching config for category: ${categoryKey}`,
                }),
            });

            const config = await this.passwordProtectionConfigRepository.findOne({
                where: { categoryKey, status: 'active' },
                select: ['id', 'categoryName', 'categoryKey', 'enablePassword', 'status'],
            });

            if (!config) {
                this.logger.warn({
                    level: 'warn',
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: 'warning',
                        location: 'PasswordProtectionConfigService',
                        method: 'getConfigByCategoryKey',
                        messageData: `No active config found for category: ${categoryKey}`,
                    }),
                });
                return null;
            }

            return config;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'PasswordProtectionConfigService',
                    method: 'getConfigByCategoryKey',
                    messageData: `Error fetching config for category ${categoryKey}: ${error.message}`,
                }),
            });
            throw error;
        }
    }

    /**
     * Check if password protection is enabled for a specific category
     * @param categoryKey - The category key to check
     * @returns Boolean indicating if password protection is enabled
     */
    async isPasswordProtectionEnabled(categoryKey: string): Promise<boolean> {
        try {
            const config = await this.getConfigByCategoryKey(categoryKey);
            return config ? config.enablePassword : false;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'PasswordProtectionConfigService',
                    method: 'isPasswordProtectionEnabled',
                    messageData: `Error checking password protection for ${categoryKey}: ${error.message}`,
                }),
            });
            // Default to false if error occurs
            return false;
        }
    }
}
