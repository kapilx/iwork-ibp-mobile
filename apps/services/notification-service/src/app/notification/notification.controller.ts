import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  successMessage
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  DEFAULT_VALUES,
  LOG_STATUS,
  LogStatus, serviceNames
} from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { createResponse } from "../../../../service-lib/src/lib/response.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage, serializeError } from "../../../../service-lib/src/lib/utils/logger.util";
import { GetNotificationDto, GetNotificationInfoDto } from "./dto/get-notification.dto";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { NotificationService } from "./notification.service";
import {
  checkLatestNotificationSwaggerMetadata,
  getNotificationInfoByIdSwaggerMetadata,
  getNotificationInfoSwaggerMetadata,
  getNotificationsSwaggerMetadata,
  sendNotificationSwaggerMetadata,
  updateNotificationStatusSwaggerMetadata,
} from "./notification.swagger";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationController {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private readonly notificationService: NotificationService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE,
    );
  }

  private logInfo(
    method: string,
    messageData = "method invoked",
    payload = {},
    status: LogStatus = LOG_STATUS.SUCCESS,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status,
        location: "NotificationController",
        method,
        payload,
        messageData,
      }),
    });
  }

  private logError(method: string, error: any, payload = {}) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: LOG_STATUS.FAILURE,
        location: "NotificationController",
        method,
        payload,
        messageData: serializeError(error),
      }),
    });
  }

  @Post()
  @sendNotificationSwaggerMetadata()
  async send(@Body() dto: SendNotificationDto, @Res() res: Response) {
    this.logInfo("send", undefined, dto);
    try {
      if (dto && !dto.emailId && !dto.userId) {
        return createResponse(
          400,
          errorMessages.notificationUserRequired,
          null,
        );
      }
      const result = await this.notificationService.sendNotification(dto);
      this.logInfo(
        "send",
        `notification sent successfully - ${JSON.stringify(result)}`,
        dto,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.notificationRetrieved,
            result,
          ),
        );
    } catch (error: any) {
      this.logError("send", error, dto);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.notificationSendFailed,
            error?.message || "Failed to send notification",
          ),
        );
    }
  }

  @Get()
  @getNotificationsSwaggerMetadata()
  async getNotifications(
    @Query() query: GetNotificationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    this.logInfo("getNotifications", undefined, { userId, query });
    try {
      const { page, limit, status } = query;
      const result = await this.notificationService.getNotifications(
        userId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        status,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.notificationRetrieved,
            result,
          ),
        );
    } catch (error) {
      this.logError("getNotifications", error, { userId, query });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.notificationRetrievalFailed,
            error,
          ),
        );
    }
  }

  @Get("check-latest-notification")
  @checkLatestNotificationSwaggerMetadata()
  async checkLatestNotification(
    @Query("notificationId") notificationId: string,
    @Query("status") status: string,
    @Res() res: Response,
  ) {
    this.logInfo("checkLatestNotification", undefined, {
      notificationId,
      status,
    });
    try {
      const result = await this.notificationService.checkLatestNotification(
        notificationId,
        status,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.notificationRetrieved,
            result,
          ),
        );
    } catch (error) {
      this.logError("checkLatestNotification", error, {
        notificationId,
        status,
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.notificationRetrievalFailed,
            error,
          ),
        );
    }
  }

  @Put("update-status")
  @updateNotificationStatusSwaggerMetadata()
  async updateReadStatus(
    @Body() updateStatus: UpdateStatusDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    this.logInfo("updateReadStatus", undefined, { userId, updateStatus });
    try {
      const result = await this.notificationService.updateReadStatus(
        updateStatus.id,
        updateStatus.status,
        userId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.notificationUpdated,
            result,
          ),
        );
    } catch (error) {
      this.logError("updateReadStatus", error, { userId });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.notificationUpdateFailed,
            error,
          ),
        );
    }
  }

  @Get("info")
  @getNotificationInfoSwaggerMetadata()
  async getNotificationInfo(
    @Query() query: GetNotificationInfoDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    this.logInfo("getNotificationInfo", undefined, { userId, query });

    try {
      const {
        page,
        limit,
        sort,
        search,
        searchBy,
        field,
        from,
        to,
        month,
        quarter,
        financialYear,
        ownerId,
      } = query;
      const userId = parseInt(req?.headers?.userid as string);
      const result = await this.notificationService.getNotificationInfoByUserId(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        ownerId || userId,
        sort || "createdAt:DESC",
        searchBy,
        search,
        field,
        from,
        to,
        month ? month : quarter,
        financialYear,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Notification info retrieved successfully",
            result,
          ),
        );
    } catch (error: unknown) {
      this.logError("getNotificationInfo", error, { userId, query });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to retrieve notification info",
            error && typeof error === "object" && "message" in error
              ? (error as { message: string }).message
              : "Internal server error",
          ),
        );
    }
  }

  @Get("info/:id")
  @getNotificationInfoByIdSwaggerMetadata()
  async getNotificationInfoById(@Param("id") id: string, @Res() res: Response) {
    const notificationInfoId = parseInt(id);
    this.logInfo("getNotificationInfoById", undefined, { notificationInfoId });

    try {
      if (isNaN(notificationInfoId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid notification info ID format",
              null,
            ),
          );
      }

      const result = await this.notificationService.getNotificationInfoById(
        notificationInfoId,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Notification info retrieved successfully",
            result,
          ),
        );
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Unknown error";
      this.logError("getNotificationInfoById", error, { notificationInfoId });

      if (errorMessage.includes("not found")) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createResponse(
              HttpStatus.NOT_FOUND,
              "Notification info not found",
              null,
            ),
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to retrieve notification info",
            errorMessage,
          ),
        );
    }
  }
}
