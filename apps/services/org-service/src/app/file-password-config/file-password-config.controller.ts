import {
    Controller,
    Get,
    Put,
    Body,
    HttpStatus,
    Query,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilePasswordConfigService } from './file-password-config.service';
import { CreateOrUpdateFilePasswordConfigDto } from './dto/file-password-config.dto';
import {
    getFilePasswordConfigSwagger,
    upsertFilePasswordConfigSwagger,
} from './file-password-config.swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('File Password Configuration')
@Controller('file-password-config')
export class FilePasswordConfigController {
    constructor(
        private readonly configService: FilePasswordConfigService
    ) {}

    /**
     * GET /api/org/file-password-config
     * Get current file password configuration
     */
    @Get()
    @getFilePasswordConfigSwagger()
    async getConfiguration(
        @Query('countryId') selectedCountryId: string,
        @Req() req: Request
    ) {
        const countryId = selectedCountryId ? parseInt(selectedCountryId, 10) : undefined;
        const config = await this.configService.getConfiguration(countryId);

        console.log('[Country ID] Received countryId from query:', {countryId, selectedCountryId} );
        // If no configuration exists, return default
        if (!config) {
            return {
                statusCode: HttpStatus.OK,
                message: 'Using default configuration',
                data: {
                    passwordType: 'custom',
                    selectedCountryId: null,
                    organisationKey: null,
                    customPassword: 'secure@123',
                    userFields: null,
                },
            };
        }

        return {
            statusCode: HttpStatus.OK,
            message: 'Configuration retrieved successfully',
            data: config,
        };
    }

    /**
     * PUT /api/config/file-password-config
     * Create or update file password configuration (Admin only)
     */
    @Put()
    @upsertFilePasswordConfigSwagger()
    async upsertConfiguration(
        @Body() dto: CreateOrUpdateFilePasswordConfigDto,
        @Req() req: Request
    ) {
        // Get user ID from request headers
        const userId = parseInt(req.headers['userid'] as string);

        if (!userId) {
            throw new UnauthorizedException('User ID is required');
        }

        const config = await this.configService.upsertConfiguration(dto, userId);

        return {
            statusCode: HttpStatus.OK,
            message: 'Configuration saved successfully',
            data: config,
        };
    }
}
