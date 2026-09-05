import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { AccessControlListService } from "./access-control-list.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import type { Request, Response } from "express";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { getUserPermissionsSwaggerMetadata, getAclMetadataSwaggerMetadata, updateRoleAclSwaggerMetadata } from "./access-control-list.swagger";
import { UpdateRoleAclDto } from "./dto/update-role-acl.dto";

@Controller("access-control-list")
export class AccessControlListController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly accessControlListService: AccessControlListService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  @Get()
  @getAclMetadataSwaggerMetadata()
  async getAclMetadata(
    @Query('role') roleId: string,
    @Res() res: Response,
  ) {
    try {
      if (roleId) {
        const data = await this.accessControlListService.getRoleAcl(+roleId);
        return res
          .status(HttpStatus.OK)
          .json(createResponse(HttpStatus.OK, 'Role ACL retrieved successfully', data));
      }
      const data = await this.accessControlListService.getAclMetadata();
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, 'ACL metadata retrieved successfully', data));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : 'Failed to retrieve ACL data',
          ),
        );
    }
  }

  @Put('role/:roleId')
  @updateRoleAclSwaggerMetadata()
  async updateRoleAcl(
    @Param('roleId') roleId: string,
    @Body() body: UpdateRoleAclDto,
    @Res() res: Response,
  ) {
    try {
      await this.accessControlListService.updateRoleAcl(+roleId, body.aclIds);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, 'Role ACL updated successfully'));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : 'Failed to update role ACL',
          ),
        );
    }
  }

  /**
   * Retrieves the permissions for a specific user based on their roles and access control mappings.
   */
  @Get("permissions")
  @getUserPermissionsSwaggerMetadata()
  async getUserPermissionsx(
    @Query("categoryKey") categoryKey: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'AccessControlListController',
        method: 'getUserPermissionsx',
        payload: { categoryKey },
        messageData: 'method invoked',
      }),
    });
    try {
      const permissions = await this.accessControlListService.getUserPermissions(
        userId,
        categoryKey,
      );

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'success',
          location: 'AccessControlListController',
          method: 'getUserPermissionsx',
          payload: { categoryKey },
          messageData: 'Permissions retrieved',
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            'Permissions retrieved successfully',
            permissions,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'AccessControlListController',
          method: 'getUserPermissionsx',
          payload: { categoryKey },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while retrieving permissions',
          ),
        );
    }
  }
}
