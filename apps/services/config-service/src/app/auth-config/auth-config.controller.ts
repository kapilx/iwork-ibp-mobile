import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpStatus,
    Res,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthConfigService } from './auth-config.service';
import {
    addAuthMethodToCompanySwagger,
    getCompanyAuthMethodsSwagger,
    getCompanyAuthConfigBySubdomainSwagger,
    removeAuthMethodFromCompanySwagger,
    seedDefaultAuthMethodsSwagger,
    updateCompanyAuthMethodSwagger,
    downloadAuthConfigFileSwagger,
} from './auth-config.swagger';
import { CompanyConfigService } from '../company-config/company-config.service';
import { DefaultAuthConfigProvider } from './default-auth-config.provider';

@ApiTags('Authentication Configuration')
@Controller('auth-config')
export class AuthConfigController {
    constructor(
        private readonly authConfigService: AuthConfigService,
        private readonly companyConfigService: CompanyConfigService,
        private readonly defaultAuthConfigProvider: DefaultAuthConfigProvider,
    ) {}

    private isDefaultSubdomain(subdomain?: string): boolean {
      const normalized = String(subdomain || "").trim().toLowerCase();
      return (
        !normalized ||
        normalized === "localhost" ||
        normalized === "127.0.0.1" || normalized ===  process.env.IBP_APP_PREFIX || normalized === "iwh"
      );
    }

    /**
     * Get authentication methods for a specific company
     */
    @Get('company/:companyId(\\d+)')
    @getCompanyAuthMethodsSwagger()
    async getCompanyAuthMethods(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Res() res: Response
    ) {
        try {
            const methods = await this.authConfigService.getCompanyAuthMethods(companyId);

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Company authentication methods retrieved successfully',
                data: methods,
            });
        } catch (error: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error?.message || 'Failed to fetch auth methods',
            });
        }
    }

    /**
     * Get company configuration and auth methods by subdomain
     */
    @Get('company')
    @getCompanyAuthConfigBySubdomainSwagger()
    async getCompanyAuthConfigBySubdomain(
        @Query('subdomain') subdomain: string,
        @Res() res: Response
    ) {
        try {
            if (this.isDefaultSubdomain(subdomain)) {
              const fallbackData =
                this.defaultAuthConfigProvider.buildDefaultCompanyAuthConfig(
                  subdomain,
                );
              return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message:
                  "Default authentication configuration retrieved successfully",
                data: fallbackData,
              });
            }

            const companyConfig = await this.companyConfigService.getConfigBySubDomain(subdomain);
            const companyId = companyConfig.companyId;
            if (typeof companyId !== 'number' || Number.isNaN(companyId)) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Company ID not available for subdomain',
                });
            }

      const authMethods = await this.authConfigService.getCompanyAuthMethods(
        companyId,
        companyConfig.portalConfigId,
      );
      const company = await this.authConfigService.getCompanyById(companyId);
      const trimmedConfig = {
        companyId,
        subDomain: companyConfig.subDomain,
        logoFileId: company?.companyLogoFileId ?? null,
        companyLogoId: companyConfig.logoFileId,
        databaseConfig: companyConfig.databaseConfig,
        portalBrandingConfig: companyConfig.portalBrandingConfig ?? null,
        portalDashboardConfig: companyConfig.portalDashboardConfig ?? null,
        portalWellnessConfig: companyConfig.portalWellnessConfig ?? null,
        dependentRelationConfig: companyConfig.dependentRelationConfig ?? null,
        offersAndBenefits: companyConfig.offersAndBenefits ?? [],
        offersAndBenefitsEnabled: companyConfig.offersAndBenefitsEnabled ?? true,
        passwordRules: companyConfig.passwordRules,
        country: company?.country?.name ?? "india",
      };
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Company authentication configuration retrieved successfully",
        data: {
          companyId,
          companyConfig: trimmedConfig,
          authMethods,
        },
      });
    } catch (error: any) {
      const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error?.message ||
          "Failed to retrieve company authentication configuration",
      });
    }
    }

    /**
     * Download file/image uploaded to config service (auth-config)
     */
    @Get('file-upload/:documentId/download')
    @downloadAuthConfigFileSwagger()
    async downloadFile(
        @Param('documentId', ParseIntPipe) documentId: bigint,
        @Res() res: Response
    ) {
        try {
            const result = await this.authConfigService.downloadFile(documentId);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${result.fileName}"`
            );
            res.setHeader(
                'Content-Type',
                result.mimeType || 'application/octet-stream'
            );
            if (result.contentLength) {
                res.setHeader('Content-Length', result.contentLength);
            }
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            result.stream.pipe(res);
        } catch (error: any) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                message:
                    error?.message || 'Failed to download document',
            });
        }
    }

    /**
     * Add authentication method to a company
     */
    @Post('company/:companyId(\\d+)/methods')
    @addAuthMethodToCompanySwagger()
    async addAuthMethodToCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Body() body: { authMethodId: number; displayOrder?: number },
        @Res() res: Response
    ) {
        try {
            const mapping = await this.authConfigService.addAuthMethodToCompany(
                companyId,
                body.authMethodId,
                body.displayOrder
            );
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                message: 'Authentication method added to company successfully',
                data: mapping,
            });
        } catch (error: any) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                message: error?.message || 'Failed to add authentication method',
            });
        }
    }

    /**
     * Update company authentication method configuration
     */
    @Put('company/:companyId(\\d+)/methods/:authMethodId(\\d+)')
    @updateCompanyAuthMethodSwagger()
    async updateCompanyAuthMethod(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Param('authMethodId', ParseIntPipe) authMethodId: number,
        @Body()
            body: {
                isEnabled?: boolean;
                displayOrder?: number;
                companyPortalAuthConfig?: Record<string, any>;
            },
        @Res() res: Response
    ) {
        try {
            const mapping = await this.authConfigService.updateCompanyAuthMethod(
                companyId,
                authMethodId,
                body
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Authentication method updated successfully',
                data: mapping,
            });
        } catch (error: any) {
            const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({
                statusCode: status,
                message: error?.message || 'Failed to update authentication method',
            });
        }
    }

    /**
     * Remove authentication method from a company
     */
    @Delete('company/:companyId(\\d+)/methods/:authMethodId(\\d+)')
    @removeAuthMethodFromCompanySwagger()
    async removeAuthMethodFromCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Param('authMethodId', ParseIntPipe) authMethodId: number,
        @Res() res: Response
    ) {
        try {
            await this.authConfigService.removeAuthMethodFromCompany(
                companyId,
                authMethodId
            );
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Authentication method removed from company successfully',
            });
        } catch (error: any) {
            const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({
                statusCode: status,
                message: error?.message || 'Failed to remove authentication method',
            });
        }
    }
}
