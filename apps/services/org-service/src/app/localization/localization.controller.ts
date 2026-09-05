import { Controller, Get, Req, Res, HttpStatus, Param } from "@nestjs/common";
import type { Request, Response } from "express";
import { LocalizationService } from "./localization.service";
import {
  createErrorResponse,
  createResponse,
} from "../../../../service-lib/src/lib/response.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Controller("localization")
export class LocalizationController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  @Get()
  async getUserLocalization(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "LocalizationController",
          method: "getUserLocalization",
          messageData: "method invoked",
        }),
      });
      const localizationData =
        await this.localizationService.getUserLocalization(userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Localization retrieved successfully",
            localizationData,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "LocalizationController",
          method: "getUserLocalization",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error instanceof Error ? error.message : "Localization not found",
          ),
        );
    }
  }

  @Get("organisation/:organisation_id")
  async getOrganizationLocalization(
    @Req() req: Request,
    @Res() res: Response,
    @Param("organisation_id") organisation_id: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "LocalizationController",
          method: "getOrganizationLocalization",
          payload: { organisation_id },
          messageData: "method invoked",
        }),
      });
      const localizationData =
        await this.localizationService.getOrganizationLocalization(
          organisation_id,
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Organization localization retrieved successfully",
            localizationData,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LocalizationController",
          method: "getOrganizationLocalization",
          payload: { organisation_id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error instanceof Error
              ? error.message
              : "Organization localization not found",
          ),
        );
    }
  }
}
