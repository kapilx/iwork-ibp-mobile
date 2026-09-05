import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  GetNonGroupClaimQueryDto,
  ValidateNonGroupClaimDto,
} from "./dto/claim-activity-meta.dto";
import { NonGroupClaimService } from "./non-group-claim.service";
import {
  createClaimActivityMetaSwaggerMetadata,
  createNonGroupClaimSwaggerMetadata,
  getAllNonGroupClaimsSwaggerMetadata,
  getClaimActivityMetaSwaggerMetadata,
  getClaimActivityStepperSwaggerMetadata,
  getNonGroupClaimSwaggerMetadata,
  updateClaimActivityMetaSwaggerMetadata,
} from "./non-group-claim.swagger";

@Controller("non-group-claim")
export class NonGroupClaimController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly nonGroupClaimService: NonGroupClaimService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  // Create Non-Group Claim
  @Post()
  @createNonGroupClaimSwaggerMetadata()
  async createNonGroupClaim(
    @Body() claimData: ValidateNonGroupClaimDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "NonGroupClaimController",
          method: "createNonGroupClaim",
          messageData: "method invoked",
        }),
      });
      const result = await this.nonGroupClaimService.createNonGroupClaim(
        claimData,
        userId
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "Non-group claim created successfully",
            result.claim
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "NonGroupClaimController",
          method: "createNonGroupClaim",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res, error.message);
    }
  }

  // Get Claim Activity Stepper
  @Get("activity-stepper")
  @getClaimActivityStepperSwaggerMetadata()
  async getClaimActivityStepper(
    @Res() res: Response,
    @Query("claimId") claimId?: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "NonGroupClaimController",
          method: "getClaimActivityStepper",
          messageData: "method invoked",
        }),
      });

      const result = await this.nonGroupClaimService.getClaimActivityStepper(
        claimId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Claim activity stepper retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "NonGroupClaimController",
          method: "getClaimActivityStepper",
          messageData: error,
        }),
      });

      return handleErrorResponse(error as Error, res);
    }
  }

  // Get Non-Group Claim by ID
  @Get(":claimId")
  @getNonGroupClaimSwaggerMetadata()
  async getNonGroupClaim(
    @Param("claimId", ParseIntPipe) claimId: number,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "NonGroupClaimController",
          method: "getNonGroupClaim",
          messageData: "method invoked",
        }),
      });
      const result = await this.nonGroupClaimService.getNonGroupClaim(claimId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "successMessage", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "NonGroupClaimController",
          method: "getNonGroupClaim",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res, error.message);
    }
  }

  // Get All Non-Group Claims with Filters
  @Get()
  @getAllNonGroupClaimsSwaggerMetadata()
  async getAllNonGroupClaims(
    @Query() queries: GetNonGroupClaimQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "NonGroupClaimController",
          method: "getAllNonGroupClaims",
          messageData: "method invoked",
        }),
      });
      const result = await this.nonGroupClaimService.getAllNonGroupClaims(
        queries,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Non-group claims retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "NonGroupClaimController",
          method: "getAllNonGroupClaims",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res, error.message);
    }
  }

  // Create Claim Activity Meta
  @Post("activity-meta")
  @createClaimActivityMetaSwaggerMetadata()
  async createClaimActivityMeta(
    @Body() activityMeta: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "NonGroupClaimController",
          method: "createClaimActivityMeta",
          messageData: "method invoked",
        }),
      });
      const result = await this.nonGroupClaimService.createClaimActivityMeta(
        activityMeta,
        userId
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, result.message, result.data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "NonGroupClaimController",
          method: "createClaimActivityMeta",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  // Update Claim Activity Meta
  @Put("activity-meta/:claimActivityId")
  @updateClaimActivityMetaSwaggerMetadata()
  async updateClaimActivityMeta(
    @Param("claimActivityId", ParseIntPipe) claimActivityId: number,
    @Body() activityMeta: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "NonGroupClaimController",
          method: "updateClaimActivityMeta",
          messageData: "method invoked",
        }),
      });
      const result = await this.nonGroupClaimService.updateClaimActivityMeta(
        claimActivityId,
        activityMeta,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, result.message, result.data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "NonGroupClaimController",
          method: "updateClaimActivityMeta",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res, error.message);
    }
  }

  // Get Claim Activity Meta
  @Get("activity-meta/:claimActivityId")
  @getClaimActivityMetaSwaggerMetadata()
  async getClaimActivityMeta(
    @Param("claimActivityId") claimActivityIdParam: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "NonGroupClaimController",
          method: "getClaimActivityMeta",
          messageData: "method invoked",
        }),
      });

      // Parse the parameter - could be single ID or comma-separated IDs
      let claimActivityId: number | number[];

      if (claimActivityIdParam.includes(",")) {
        // Handle comma-separated IDs
        claimActivityId = claimActivityIdParam
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));

        if (claimActivityId.length === 0) {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(
              createResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid activity IDs provided",
                null
              )
            );
        }
      } else {
        // Handle single ID
        const parsedId = parseInt(claimActivityIdParam);
        if (isNaN(parsedId)) {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(
              createResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid activity ID provided",
                null
              )
            );
        }
        claimActivityId = parsedId;
      }

      const result = await this.nonGroupClaimService.getClaimActivityMeta(
        claimActivityId
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "success", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "NonGroupClaimController",
          method: "getClaimActivityMeta",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res, error.message);
    }
  }
}
