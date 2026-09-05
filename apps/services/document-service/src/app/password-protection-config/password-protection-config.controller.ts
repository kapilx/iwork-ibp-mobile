import { Controller, Get, HttpStatus, Param, Req } from '@nestjs/common';
import { PasswordProtectionConfigService } from './password-protection-config.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import type { Request } from 'express';

@Controller('password-protection-config')
export class PasswordProtectionConfigController {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly passwordProtectionConfigService: PasswordProtectionConfigService,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(
            this.traceIdService,
            serviceNames.DOCUMENT_SERVICE
        );
    }

    /**
     * Get all active password protection configurations
     * @route GET /password-protection-config
     * @returns Array of active configurations
     */
    @Get()
    async getAllConfigs(@Req() req: Request) {
        const userId = req.headers['userid'];

        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'info',
                    location: 'PasswordProtectionConfigController',
                    method: 'getAllConfigs',
                    messageData: 'Fetching all active password protection configurations',
                }),
            });

            const configs =
                await this.passwordProtectionConfigService.getAllActiveConfigs();

            // Transform to frontend-friendly format
            const configMap = configs.reduce((acc, config) => {
                acc[config.categoryKey] = config.enablePassword;
                return acc;
            }, {} as Record<string, boolean>);

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'success',
                    location: 'PasswordProtectionConfigController',
                    method: 'getAllConfigs',
                    messageData: `Retrieved ${configs.length} configurations`,
                }),
            });

            return {
                configs: configMap,
                rawConfigs: configs,
            };
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'failure',
                    location: 'PasswordProtectionConfigController',
                    method: 'getAllConfigs',
                    messageData: `Error: ${error.message}`,
                }),
            });

            throw error;
        }
    }

    /**
     * Get password protection config by category key
     * @route GET /password-protection-config/:categoryKey
     * @param categoryKey - The category key to fetch
     * @returns Configuration for the specified category
     */
    @Get(':categoryKey')
    async getConfigByCategoryKey(
        @Param('categoryKey') categoryKey: string,
        @Req() req: Request
    ) {
        const userId = req.headers['userid'];

        try {
            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'info',
                    location: 'PasswordProtectionConfigController',
                    method: 'getConfigByCategoryKey',
                    messageData: `Fetching config for category: ${categoryKey}`,
                }),
            });

            const config =
                await this.passwordProtectionConfigService.getConfigByCategoryKey(
                    categoryKey
                );

            if (!config) {
                this.logger.warn({
                    level: 'warn',
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId: Number(userId),
                        status: 'warning',
                        location: 'PasswordProtectionConfigController',
                        method: 'getConfigByCategoryKey',
                        messageData: `No config found for category: ${categoryKey}`,
                    }),
                });

                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `Configuration not found for category: ${categoryKey}`,
                };
            }

            this.logger.log({
                level: 'info',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'success',
                    location: 'PasswordProtectionConfigController',
                    method: 'getConfigByCategoryKey',
                    messageData: `Retrieved config for category: ${categoryKey}`,
                }),
            });

            return config;
        } catch (error) {
            this.logger.error({
                level: 'error',
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId: Number(userId),
                    status: 'failure',
                    location: 'PasswordProtectionConfigController',
                    method: 'getConfigByCategoryKey',
                    messageData: `Error: ${error.message}`,
                }),
            });

            throw error;
        }
    }
}
