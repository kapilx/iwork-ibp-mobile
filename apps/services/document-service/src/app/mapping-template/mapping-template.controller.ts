import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Query,
    Param,
    HttpStatus,
    Req,
    Res,
    Logger,
    UnauthorizedException,
    BadRequestException,
    ValidationPipe,
    UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { MappingTemplateService } from './mapping-template.service';
import { SaveMappingTemplateDto } from './dto/save-mapping-template.dto';
import { SaveMappingTemplateResponseDto } from './dto/save-mapping-template-response.dto';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { errorMessages, successMessage } from '../../../../../../libs/service-lib/src/lib/messages';

@ApiTags('Mapping Templates')
@Controller('mapping-templates')
export class MappingTemplateController {
    private readonly logger = new Logger(MappingTemplateController.name);

    constructor(
        private readonly mappingTemplateService: MappingTemplateService,
        private readonly jwtService: JwtService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get active mapping template by company and entity' })
    @ApiQuery({ name: 'company_id', required: true })
    @ApiQuery({ name: 'entity_id', required: false })
    @ApiQuery({ name: 'entity_name', required: true })
    @ApiQuery({ name: 'file_direction', required: false })
    @ApiQuery({ name: 'status', required: false, description: "Set to 'ALL' to fetch version history" })
    @ApiResponse({ status: 200, description: 'Successfully retrieved mapping template' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async getMappingTemplate(
        @Query('company_id') companyId: number,
        @Query('entity_id') entityId: number,
        @Query('entity_name') entityName: string,
        @Query('file_direction') fileDirection: string,
        @Query('status') status: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const token = req?.headers?.authorization?.split(" ")[1];
            if (!token) {
                throw new UnauthorizedException(errorMessages.authorizationTokenRequired);
            }
            this.jwtService.verify(token, { secret: ENV.JWT_SECRET });

            const templates = await this.mappingTemplateService.getMappingTemplate(
                Number(companyId),
                entityName,
                fileDirection || 'INBOUND',
                status,
                entityId ? Number(entityId) : undefined
            );

            return res.status(HttpStatus.OK).json({
                status: 'SUCCESS',
                message: successMessage.mappingTemplateRetrieved || 'Mapping template retrieved successfully',
                data: templates
            });
        } catch (error) {
            this.logger.error('Error retrieving mapping template:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                status: 'ERROR',
                message: error instanceof Error ? error.message : errorMessages.failedToRetrieveMappingTemplate
            });
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a mapping template' })
    @ApiResponse({ status: 200, description: 'Template deleted successfully' })
    async deleteTemplate(
        @Param('id') id: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const token = req?.headers?.authorization?.split(" ")[1];
            if (!token) {
                throw new UnauthorizedException(errorMessages.authorizationTokenRequired);
            }
            const decodedUser = this.jwtService.verify(token, { secret: ENV.JWT_SECRET });
            const userId = decodedUser.userDetails?.userId;

            await this.mappingTemplateService.deleteMappingTemplate(Number(id), Number(userId));

            return res.status(HttpStatus.OK).json({
                status: 'SUCCESS',
                message: successMessage.mappingTemplateDeleted
            });
        } catch (error) {
            this.logger.error('Error deleting mapping template:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                status: 'ERROR',
                message: errorMessages.failedToDeleteMappingTemplate
            });
        }
    }

    @Post('restore/:id')
    @ApiOperation({ summary: 'Restore a mapping template version' })
    @ApiResponse({ status: 200, description: 'Template restored successfully' })
    async restoreTemplate(
        @Param('id') id: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const token = req?.headers?.authorization?.split(" ")[1];
            if (!token) {
                throw new UnauthorizedException(errorMessages.authorizationTokenRequired);
            }
            const decodedUser = this.jwtService.verify(token, { secret: ENV.JWT_SECRET });
            const userId = decodedUser.userDetails?.userId;

            await this.mappingTemplateService.restoreMappingTemplate(Number(id), Number(userId));

            return res.status(HttpStatus.OK).json({
                status: 'SUCCESS',
                message: 'Template version restored successfully'
            });
        } catch (error) {
            this.logger.error('Error restoring mapping template:', error);
            const status = error instanceof BadRequestException ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({
                status: 'ERROR',
                message: error instanceof Error ? error.message : 'Failed to restore mapping template'
            });
        }
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({ summary: 'Save a new mapping template version' })
    @ApiResponse({
        status: 201,
        description: 'Mapping template saved successfully',
        type: SaveMappingTemplateResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async saveMappingTemplate(
        @Body() dto: SaveMappingTemplateDto,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            // Extract and validate JWT token
            const token = req?.headers?.authorization?.split(" ")[1];
            if (!token) {
                throw new UnauthorizedException(errorMessages.authorizationTokenRequired);
            }

            const decodedUser = this.jwtService.verify(token, {
                secret: ENV.JWT_SECRET,
            });


            const userId = decodedUser.userDetails?.userId as number;
            if (!userId) {
                throw new UnauthorizedException(errorMessages.invalidUserCredentials);
            }

            // Save mapping template
            const result = await this.mappingTemplateService.saveMappingTemplate(
                dto,
                userId
            );

            return res.status(HttpStatus.CREATED).json(result);
        } catch (error) {
            this.logger.error('Failed to save mapping template', error);

            const status = (error instanceof UnauthorizedException || error instanceof BadRequestException) 
                ? error.getStatus() 
                : HttpStatus.INTERNAL_SERVER_ERROR;

            return res.status(status).json({
                status: 'ERROR',
                message: error instanceof Error ? error.message : errorMessages.failedToSaveMappingTemplate,
            });
        }
    }
}
