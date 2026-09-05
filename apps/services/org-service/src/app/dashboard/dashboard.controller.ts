import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { DashboardService } from "./dashboard.service";
import {
  CreateAnnouncementDto,
  GetAnnouncementsDto,
  GetCelebrationsDto,
} from "./dto/dashboard.dto";
import {
  getAnnouncementsSwaggerMetadata,
  getTeamCelebrationsSwaggerMetadata,
} from "./dashboard.swagger";

@Controller("dashboard")
export class DashboardController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  // Create an announcement
  @Post("announcement")
  async createAnnouncement(
    @Body() announcement: CreateAnnouncementDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "DashboardController",
          method: "createAnnouncement",
          messageData: "method invoked",
        }),
      });
      announcement.createdBy = userId;
      announcement.updatedBy = userId;
      const createdAnnouncement =
        await this.dashboardService.createAnnouncement(announcement);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.announcementCreation,
            createdAnnouncement
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "DashboardController",
          method: "createAnnouncement",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.announcementNotFound,
        infoMessages.forBidden,
        errorMessages.announcementCreationFailed
      );
    }
  }

  // Update an announcement
  @Put("announcement/:id")
  async updateAnnouncement(
    @Param("id") id: number,
    @Body() announcement: CreateAnnouncementDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "DashboardController",
          method: "updateAnnouncement",
          messageData: "method invoked",
        }),
      });
      announcement.updatedBy = userId;
      const updatedAnnouncement =
        await this.dashboardService.updateAnnouncement(id, announcement);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.announcementUpdated,
            updatedAnnouncement
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "DashboardController",
          method: "updateAnnouncement",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.announcementNotFound,
        infoMessages.forBidden,
        errorMessages.announcementUpdateFailed
      );
    }
  }

  // Get all announcements
  @Get("announcements")
  @getAnnouncementsSwaggerMetadata()
  async getAnnouncements(
    @Query() query: GetAnnouncementsDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "DashboardController",
          method: "getAnnouncements",
          messageData: "method invoked",
        }),
      });
      const { page, limit, search, sort, searchBy } = query;
      const announcements = await this.dashboardService.getAnnouncements(
        userId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sort || "expiryDate:ASC",
        searchBy || ""
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.announcementList,
            announcements
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "DashboardController",
          method: "getAnnouncements",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        infoMessages.forBidden,
        errorMessages.announcementListRetrievalFailed
      );
    }
  }

  // Get team celebrations
  @Get("team-celebrations")
  @getTeamCelebrationsSwaggerMetadata()
  async getTeamCelebrations(
    @Query() query: GetCelebrationsDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "DashboardController",
          method: "getTeamCelebrations",
          messageData: "method invoked",
        }),
      });
      const { page, limit } = query;
      const celebrations = await this.dashboardService.getTeamCelebrations(
        userId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.celebrationsList,
            celebrations
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "DashboardController",
          method: "getTeamCelebrations",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        infoMessages.forBidden,
        errorMessages.celebrationsListRetrievalFailed
      );
    }
  }

  // Get an announcement by ID
  @Get("announcement/:id")
  async getAnnouncementById(@Param("id") id: number, @Res() res: Response) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "DashboardController",
        method: "getAnnouncementById",
        payload: { id },
        messageData: "method invoked",
      }),
    });
    try {
      const announcement = await this.dashboardService.getAnnouncementById(id);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.announcementDetails,
            announcement
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardController",
          method: "getAnnouncementById",
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.announcementNotFound,
        infoMessages.forBidden,
        errorMessages.announcementDetailsRetrievalFailed
      );
    }
  }

  // Delete an announcement
  @Delete("announcement/:id")
  async deleteAnnouncement(@Param("id") id: number, @Res() res: Response) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardController",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      await this.dashboardService.deleteAnnouncement(id);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.announcementDeleted)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardController",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.announcementNotFound,
        infoMessages.forBidden,
        errorMessages.announcementDeletionFailed
      );
    }
  }
}
