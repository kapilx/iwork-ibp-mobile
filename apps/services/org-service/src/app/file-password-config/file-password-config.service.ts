import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilePasswordConfig } from './file-password-config.entity';
import { CreateOrUpdateFilePasswordConfigDto } from './dto/file-password-config.dto';
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class FilePasswordConfigService {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        @InjectRepository(FilePasswordConfig)
        private readonly configRepository: Repository<FilePasswordConfig>,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(this.traceIdService);
    }

    /**
     * Get the current file password configuration
     * Returns the most recent configuration
     */
    async getConfiguration(selectedCountryId?: number): Promise<FilePasswordConfig | null> {
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'FilePasswordConfigService',
                method: 'getConfiguration',
                messageData: 'Fetching file password configuration',
            }),
        });

        try {
            const config = await this.configRepository.findOne({
                where: selectedCountryId ? { selectedCountryId } : {},
                order: { updatedAt: 'DESC' },
            });

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'FilePasswordConfigService',
                    method: 'getConfiguration',
                    messageData: config ? 'Configuration found' : 'No configuration found',
                }),
            });

            return config;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'FilePasswordConfigService',
                    method: 'getConfiguration',
                    messageData: error,
                }),
            });
            throw error;
        }
    }

    /**
     * Create or update file password configuration
     * Admin users only
     */
    async upsertConfiguration(
        dto: CreateOrUpdateFilePasswordConfigDto,
        userId: number
    ): Promise<FilePasswordConfig> {
        this.logger.log({
            level: 'info',
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: 'success',
                location: 'FilePasswordConfigService',
                method: 'upsertConfiguration',
                payload: { dto, userId },
                messageData: 'Upserting file password configuration',
            }),
        });

        try {
            // Find existing configuration for this specific country/organisation
            const existingConfig = await this.configRepository.findOne({
                where: { selectedCountryId: dto.selectedCountryId },
                order: { updatedAt: 'DESC' },
            });

            let config: FilePasswordConfig;

            if (existingConfig) {
                // Update existing configuration
                existingConfig.passwordType = dto.passwordType;
                existingConfig.selectedCountryId = dto.selectedCountryId;
                existingConfig.organisationKey = dto.organisationKey;
                existingConfig.customPassword = dto.customPassword || null;
                existingConfig.userFields = dto.passwordType === 'user_details' ? (dto.userFields || undefined) : undefined;
                existingConfig.updatedBy = userId;

                config = await this.configRepository.save(existingConfig);
            } else {
                // Create new configuration
                const newConfig = this.configRepository.create({
                    passwordType: dto.passwordType,
                    selectedCountryId: dto.selectedCountryId,
                    organisationKey: dto.organisationKey,
                    customPassword: dto.customPassword || null,
                    userFields: dto.passwordType === 'user_details' ? dto.userFields : null,
                    createdBy: userId,
                    updatedBy: userId,
                });

                config = await this.configRepository.save(newConfig);
            }

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'success',
                    location: 'FilePasswordConfigService',
                    method: 'upsertConfiguration',
                    messageData: 'Configuration saved successfully',
                }),
            });

            return config;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: 'failure',
                    location: 'FilePasswordConfigService',
                    method: 'upsertConfiguration',
                    messageData: error,
                }),
            });
            throw error;
        }
    }

    /**
     * Generate password based on configuration and user details
     */
    generatePassword(
        config: FilePasswordConfig,
        userDetails: { firstName?: string; lastName?: string; email?: string; mobileNumber?: string }
    ): string {
        if (config.passwordType === 'custom') {
            return config.customPassword || 'secure@123';
        }

        if (config.passwordType === 'user_details' && config.userFields && config.userFields.length > 0) {
            const passwordParts = config.userFields
                .map((field) => {
                    switch (field) {
                        case 'firstName':
                            return userDetails.firstName?.trim() || '';
                        case 'lastName':
                            return userDetails.lastName?.trim() || '';
                        case 'email':
                            return userDetails.email?.trim() || '';
                        case 'mobileNumber':
                            return userDetails.mobileNumber?.trim() || '';
                        default:
                            return '';
                    }
                })
                .filter(part => part !== '');

            if (passwordParts.length > 0) {
                return passwordParts.join('-');
            }
        }

        // Fallback to default
        return 'secure@123';
    }
}


