import { Controller, Get, HttpStatus, Logger, Query, Req, Res, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { EntityFieldsService } from './entity-fields.service';
import { errorMessages, successMessage } from '../../../../../../libs/service-lib/src/lib/messages';
import { ENV } from '../../../../service-lib/src/lib/environment';

@ApiTags('Entity Fields')
@Controller('entity-fields')
export class EntityFieldsController {
    private readonly logger = new Logger(EntityFieldsController.name);

    constructor(
        private readonly entityFieldsService: EntityFieldsService,
        private readonly jwtService: JwtService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all columns from mstr_entity_fields_utility_ref table by entity name' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved entity fields' })
    @ApiResponse({ status: 400, description: 'Entity name is required' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    @ApiQuery({ name: 'entityName', required: true, description: 'Entity name (e.g., INSURER, POLICY, CLAIM, UPLOAD_CLAIM)' })
    async getAllEntityFields(
        @Query('entityName') entityName: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            // Validate JWT token
            const token = req?.headers?.authorization?.split(" ")[1];
            if (!token) {
                throw new UnauthorizedException(errorMessages.authorizationTokenRequired);
            }

            const decodedUser = this.jwtService.verify(token, {
                secret: ENV.JWT_SECRET,
            });
            const emailId = decodedUser.userDetails?.emailId as string;
            if (!emailId) {
                throw new UnauthorizedException(errorMessages.userEmailNotFoundInToken);
            }

            if (!entityName) {
                throw new BadRequestException(errorMessages.entityNameRequired);
            }

            this.logger.log(`GET /document/entity-fields?entityName=${entityName} by user: ${emailId}`);
            
            const fields = await this.entityFieldsService.getEntityFieldsByEntityName(entityName);

            return res.status(HttpStatus.OK).json({
                status: HttpStatus.OK,
                message: successMessage.entityFieldsRetrieved,
                data: fields,
                count: fields.length
            });
        } catch (error) {
            this.logger.error('Error retrieving entity fields:', error);
            let status = HttpStatus.INTERNAL_SERVER_ERROR;
            if (error instanceof BadRequestException) {
                status = HttpStatus.BAD_REQUEST;
            } else if (error instanceof UnauthorizedException) {
                status = HttpStatus.UNAUTHORIZED;
            }
            return res.status(status).json({ 
                status,
                message: error instanceof Error ? error.message : errorMessages.internalServerError || 'Failed to retrieve entity fields',
                data: null
            });
        }
    }
}
