import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  Req,
  Res,
  HttpException,
  Param,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { BulkEditService } from "../services/bulk-edit.service";
import { BulkEditRequestDto } from "../dto/bulk-edit-request.dto";
import {
  executeBulkEditSwaggerMetadata,
  findUsersByRoleSwaggerMetadata,
  findUsersByRoleNameSwaggerMetadata,
} from "../bulk-edit.swagger";
import {
  errorMessages,
  successMessage,
  infoMessages,
} from "../../../../../../../libs/service-lib/src/lib/messages";
import { createLogger } from "../../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../../service-lib/src/lib/utils/logger.util";

@ApiTags("Bulk Edit")
@Controller("bulk-edit")
export class BulkEditController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly bulkEditService: BulkEditService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.DOCUMENT_SERVICE
    );
  }

  @Post()
  @executeBulkEditSwaggerMetadata()
  async executeBulkEdit(
    @Body() bulkEditRequest: BulkEditRequestDto,
    @Res() res?: Response,
    @Req() req?: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      bulkEditRequest.userId = userId;
      this.logger.log({
        message: infoMessages.bulkEditExecutionStarted(
          userId,
          bulkEditRequest.entityType,
          bulkEditRequest.recordIds.length
        ),
        method: "executeBulkEdit",
        context: {
          userId,
          entityType: bulkEditRequest.entityType,
          recordCount: bulkEditRequest.recordIds.length,
          fieldUpdateCount: bulkEditRequest.fieldUpdates.length,
        },
      });

      const executionResult = await this.bulkEditService.executeBulkEdit(
        bulkEditRequest
      );

      // Determine response status based on results
      const hasErrors =
        executionResult.errors && executionResult.errors.length > 0;
      const statusCode = hasErrors ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK;
      const message = hasErrors
        ? successMessage.bulkEditExecutionPartialSuccess(
            executionResult.failureCount,
            executionResult.totalRecords
          )
        : successMessage.bulkEditExecutionSuccess;

      this.logger.log({
        info: "Bulk Edit Completed",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "success",
          location: "BulkEditController",
          method: "executeBulkEdit",
          payload: {
            userId,
            entityType: bulkEditRequest.entityType,
            totalRecords: executionResult.totalRecords,
            successCount: executionResult.successCount,
            failureCount: executionResult.failureCount,
            hasErrors,
            leadCrmUserList: executionResult.leadCrmUserList
              ? executionResult.leadCrmUserList
              : [],
            accountManagerUserList: executionResult.accountManagerUserList
              ? executionResult.accountManagerUserList
              : [],
            bdOwnerUserList: executionResult.bdOwnerUserList
              ? executionResult.bdOwnerUserList
              : [],
            isgOwnerUserList: executionResult.isgOwnerUserList
              ? executionResult.isgOwnerUserList
              : [],
          },
        }),
      });

      // For unit/integration tests without res object, return the result directly
      if (!res) {
        return executionResult;
      }

      return res.status(statusCode).json({
        statusCode,
        message,
        data: executionResult,
      });
    } catch (error) {
      console.log("error", error);
      this.logger.error({
        info: "Bulk Edit Error",
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "BulkEditController",
        method: "executeBulkEdit",
        message: "Error during bulk edit execution in controller",
        payload: {
          context: {
            error: error,
            entityType: bulkEditRequest.entityType,
            recordCount: bulkEditRequest.recordIds.length,
          },
        },
      });

      // For unit/integration tests without res object, throw the error
      if (!res) {
        throw error;
      }

      // Handle validation errors specifically
      if (
        error instanceof Error &&
        error.message.includes("validation failed")
      ) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: errorMessages.bulkEditValidationRequestFailed,
          error: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errorMessages.bulkEditInternalServerError,
        error:
          error instanceof Error
            ? error.message
            : errorMessages.bulkEditUnknownError,
      });
    }
  }

  @Get("users-by-role/:userId")
  @findUsersByRoleSwaggerMetadata()
  async findUsersByRole(@Res() res: Response, @Req() req: Request) {
    const userId = Number(req.params.userId);
    try {
      this.logger.log({
        level: "info",
        message: {
          userId: userId,
          status: "success",
          location: "BulkAssignmentController",
          method: "findUsersByRole",
          messageData: "method invoked",
        },
      });
      const data = await this.bulkEditService.findUsersWithSameRole(userId);

      this.logger.log({
        level: "info",
        message: {
          userId: userId,
          status: "success",
          location: "BulkAssignmentController",
          method: "findUsersByRole",
          messageData: "peers retrieved successfully",
        },
      });

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: successMessage.bulkAssignmentPeersRetrieved,
        data,
      });
    } catch (error) {
      const fallbackMessage = errorMessages.bulkAssignmentRoleFetchFailed;

      this.logger.error({
        level: "error",
        message: {
          userId: userId,
          status: "failure",
          location: "BulkAssignmentController",
          method: "findUsersByRole",
          messageData: error instanceof Error ? error.message : error,
        },
      });

      if (error instanceof HttpException) {
        const httpStatus = error.getStatus();
        return res.status(httpStatus).json({
          status: HttpStatus.BAD_REQUEST,
          message: error instanceof Error ? error.message : fallbackMessage,
        });
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage;

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ status: HttpStatus.INTERNAL_SERVER_ERROR, message });
    }
  }

  @Get("role-users/:roleKey/:organisationId")
  @findUsersByRoleNameSwaggerMetadata()
  async findUsersByRoleName(
    @Param("roleKey") roleKey: string,
    @Param("organisationId") organisationId: string,
    @Res() res: Response
  ) {
    try {
      const orgId = parseInt(organisationId);

      if (isNaN(orgId)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          message: "Invalid organisation ID. Must be a valid number.",
        });
      }

      this.logger.log({
        level: "info",
        message: {
          roleKey,
          organisationId: orgId,
          status: "success",
          location: "BulkAssignmentController",
          method: "findUsersByRoleName",
          messageData: "method invoked",
        },
      });

      const data = await this.bulkEditService.findUsersByRoleName(
        roleKey,
        orgId
      );

      this.logger.log({
        level: "info",
        message: {
          roleKey,
          organisationId: orgId,
          status: "success",
          location: "BulkAssignmentController",
          method: "findUsersByRoleName",
          messageData: "users by role name retrieved successfully",
        },
      });

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: successMessage.usersByRoleRetrieved,
        data,
      });
    } catch (error) {
      const fallbackMessage = errorMessages.failedToFetchUsersByRole(roleKey);

      this.logger.error({
        level: "error",
        message: {
          roleKey,
          organisationId: parseInt(organisationId),
          status: "failure",
          location: "BulkAssignmentController",
          method: "findUsersByRoleName",
          messageData: error instanceof Error ? error.message : error,
        },
      });

      if (error instanceof HttpException) {
        const httpStatus = error.getStatus();
        return res.status(httpStatus).json({
          status: httpStatus,
          message: error instanceof Error ? error.message : fallbackMessage,
        });
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage;

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ status: HttpStatus.INTERNAL_SERVER_ERROR, message });
    }
  }
}
