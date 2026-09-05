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
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { GetMeetingsDto } from "./dto/get-meetings.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { MeetingService } from "./meeting.service";
import {
  completeMeetingSwaggerMetadata,
  createMeetingSwaggerMetadata,
  deleteMeetingSwaggerMetadata,
  getMeetingByIdSwaggerMetadata,
  getMeetingsSwaggerMetadata,
  updateMeetingSwaggerMetadata,
  getMeetingsByOpportunityActivitySwaggerMetadata,
} from "./meeting.swagger";
import { CreateMeetingFeedbackDto } from "./dto/create-meeting-feedback.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Controller("meeting")
export class MeetingController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly meetingService: MeetingService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.OPPORTUNITY_SERVICE);
  }

  // Create a new meeting
  @Post()
  @createMeetingSwaggerMetadata()
  async createMeeting(
    @Body() meetingData: CreateMeetingDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'MeetingController',
        method: 'createMeeting',
        messageData: 'method invoked',
      }),
    });
    try {
      meetingData.createdBy = userId;
      meetingData.updatedBy = userId;
      const meeting = await this.meetingService.createMeeting(meetingData);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.meetingCreation,
            meeting
          )
        );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'MeetingController',
          method: 'createMeeting',
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.meetingCreationFailed
      );
    }
  }

  // Get all meetings with pagination, search, and sorting
  @Get()
  @getMeetingsSwaggerMetadata()
  async getMeetings(
    @Query() query: GetMeetingsDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { page, limit, search, sort, searchBy, companyId, opportunityId, filterByOpportunity, viewBy } = query;
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'MeetingController',
        method: 'getMeetings',
        payload: { page, limit, search, companyId, opportunityId },
        messageData: 'method invoked',
      }),
    });
    try {
      const meetings = await this.meetingService.getMeetings(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sort || "createdAt:DESC",
        userId,
        searchBy || "",
        companyId,
        opportunityId,
        filterByOpportunity,
        viewBy
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.meetingList, meetings)
        );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'MeetingController',
          method: 'getMeetings',
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        infoMessages.forBidden,
        errorMessages.meetingListRetrievalFailed
      );
    }
  }

  // Get a meeting by ID
  @Get(":id")
  @getMeetingByIdSwaggerMetadata()
  async getMeetingById(@Param("id") id: number, @Res() res: Response) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'MeetingController',
        method: 'getMeetingById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const meeting = await this.meetingService.getMeetingById(id);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.meetingDetails, meeting)
        );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'MeetingController',
          method: 'getMeetingById',
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.meetingDetailsRetrievalFailed
      );
    }
  }

  // Update a meeting by ID
  @Put(":id")
  @updateMeetingSwaggerMetadata()
  async updateMeetingById(
    @Param("id") id: number,
    @Body() updateMeeting: UpdateMeetingDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      updateMeeting.updatedBy = userId;
      const meeting = await this.meetingService.updateMeeting(
        id,
        updateMeeting
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.meetingUpdated, meeting)
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.meetingUpdateFailed
      );
    }
  }

  // Complete a meeting by ID
  @Put(":id/complete")
  @completeMeetingSwaggerMetadata()
  async completeMeeting(
    @Param("id") id: number,
    @Body() completeMeetingDto: CreateMeetingFeedbackDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const meeting = await this.meetingService.completeMeeting(id, {
        ...completeMeetingDto,
        updatedBy: userId,
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.meetingFeedbackSubmitted,
            meeting
          )
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.meetingFeedbackSubmissionFailed
      );
    }
  }

  // Delete a meeting by ID
  @Delete(":id")
  @deleteMeetingSwaggerMetadata()
  async deleteMeetingById(@Param("id") id: number, @Res() res: Response) {
    try {
      await this.meetingService.deleteMeetingById(id);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.meetingDeleted));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.meetingDeletionFailed
      );
    }
  }

  @Get("opportunity-activity/:opportunityActivityId")
  @getMeetingsByOpportunityActivitySwaggerMetadata()
  async getMeetingsByOpportunityAndActivity(
    @Param("opportunityActivityId") opportunityActivityId: number,
    @Res() res: Response
  ) {
    try {
      const meetings =
        await this.meetingService.getMeetingsByOpportunityAndActivity(
          opportunityActivityId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.meetingList, meetings)
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.meetingNotFound,
        infoMessages.forBidden,
        errorMessages.failedToFetchMeetings
      );
    }
  }
}
