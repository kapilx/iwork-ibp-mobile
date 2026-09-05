import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
  Param,
  Put,
  Delete,
  Query,
  Req,
} from "@nestjs/common";

import type { Response } from "express";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { LookUpService } from "./look-up.service";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import {
  ApiResponse,
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { LookUpDto } from "./dto/look-up.dto";
import { GetLookUpsQueryDto } from "./dto/look-up-query-param.dto";
import {
  createLookUpSwaggerMetadata,
  deleteLookUpByIdSwaggerMetadata,
  getAllLookUpsSwaggerMetadata,
  getDistinctLookUpNamesSwaggerMetadata,
  getLookUpByIdSwaggerMetadata,
  getLookUpByValueSwaggerMetadata,
  getLookUpsByKeySwaggerMetadata,
  getLookUpsByNamesSwaggerMetadata,
  updateLookUpByIdSwaggerMetadata,
} from "./look-up.swagger";
import { JwtService } from "@nestjs/jwt";
@Controller("look-up")
export class LookUpController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly lookUpService: LookUpService,
    private readonly traceIdService: TraceIdService,
    private readonly jwtService: JwtService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Retrieves all LookUps by delegating the service.
   */
  @Get()
  @getAllLookUpsSwaggerMetadata()
  async getAllLookUps(
    @Res() res: Response,
    @Query() queries?: GetLookUpsQueryDto
  ): Promise<Response<ApiResponse<LookUpDto[]>>> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "LookUpController",
          method: "getAllLookUps",
          messageData: "method invoked",
        }),
      });

      const lookUps = await this.lookUpService.getAllLookUps(
        queries?.search,
        queries?.sortBy as keyof LookUpDto,
        queries?.sortOrder,
        queries?.page,
        queries?.limit
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "LookUps retrieved successfully",
            lookUps
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpController",
          method: "getAllLookUps",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An error occurred while retrieving LookUps"
          )
        );
    }
  }

  /**
   * Creates a new LookUp by delegating the service.
   */
  @Post()
  @createLookUpSwaggerMetadata()
  async createLookUp(
    @Body() createLookUpDto: CreateLookUpDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<LookUpDto>>> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "LookUpController",
          method: "createLookUp",
          messageData: "method invoked",
        }),
      });
      const lookUp = await this.lookUpService.createLookUp(createLookUpDto);

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "LookUp created successfully",
            lookUp
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpController",
          method: "createLookUp",
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
              : "An error occurred while creating LookUp"
          )
        );
    }
  }

  /**
   * Get lookup values by lookup name by delegating the service.
   */
  @Get("value")
  @getLookUpByValueSwaggerMetadata()
  async getLookUpsByName(
    @Query("name") lookUpName: string,
    @Query("organisationId") organisationIdParam: string | undefined,
    @Query("sortOrder") sortOrderParam: string | undefined,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getLookUpsByName *");
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: "Authorization header missing" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = this.jwtService.decode(token) as any;
      // Allow an explicit organisation override (e.g. master cover mapping picks
      // the org); fall back to the logged-in user's organisation otherwise.
      const organisationId = organisationIdParam
        ? Number(organisationIdParam)
        : decoded?.userDetails?.organisationId;
      if (!lookUpName) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "lookUpName is required"
            )
          );
      }
      const sortOrder: "ASC" | "DESC" =
        sortOrderParam?.toUpperCase() === "DESC" ? "DESC" : "ASC";
      const serviceStartTime = Date.now(); // Record the service execution start time
      const data = await this.lookUpService.getLookUpsByName(
        lookUpName.toUpperCase(),
        organisationId,
        sortOrder
      );
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getLookUpsByName * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getLookUpsByName * ${
          responseTime - requestStartTime
        }ms`
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "LookUps retrieved successfully", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while retrieving LookUps"
          )
        );
    }
  }

  /**
   * Get lookup values by lookup key by delegating the service.
   */

  @Get("key")
  @getLookUpsByKeySwaggerMetadata()
  async getLookUpsByKey(@Query("key") lookUpKey: string, @Res() res: Response) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getLookUpsByKey *");
      const serviceStartTime = Date.now(); // Record the service execution start time
      if (!lookUpKey) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(HttpStatus.BAD_REQUEST, "lookUpKey is required")
          );
      }
      const data = await this.lookUpService.getLookUpsByKey(
        lookUpKey.toUpperCase()
      );
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getLookUpsByKey * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getLookUpsByKey * ${
          responseTime - requestStartTime
        }ms`
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "LookUps retrieved successfully", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while retrieving LookUps"
          )
        );
    }
  }

  /**
   * Retrieves distinct lookup names.
   */
  @Get("distinct-names")
  @getDistinctLookUpNamesSwaggerMetadata()
  async getDistinctLookUpNames(@Res() res: Response): Promise<Response> {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getDistinctLookUpNames *");
      const serviceStartTime = Date.now(); // Record the service execution start time
      const distinctNames = await this.lookUpService.getDistinctLookUpNames();
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getDistinctLookUpNames * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getDistinctLookUpNames * ${
          responseTime - requestStartTime
        }ms`
      );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Distinct lookup names retrieved successfully",
        data: distinctNames,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "An error occurred while retrieving distinct lookup names",
      });
    }
  }

  /**
   * Retrieves a single LookUp by ID by dleegating the service.
   */
  @Get(":id")
  @getLookUpByIdSwaggerMetadata()
  async getLookUpById(
    @Res() res: Response,
    @Param("id") id: string
  ): Promise<Response<ApiResponse<{ data: LookUpDto }>>> {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getLookUpById * ");
      const serviceStartTime = Date.now(); // Record the service execution start time
      const lookUp = await this.lookUpService.getLookUpById(+id);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getLookUpById * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getLookUpById * ${responseTime - requestStartTime}ms`
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "LookUp retrieved successfully", lookUp)
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while retrieving LookUp"
          )
        );
    }
  }

  /**
   * Updates a LookUp by ID, by delegating the service.
   */
  @Put(":id")
  @updateLookUpByIdSwaggerMetadata()
  async updateLookUpById(
    @Res() res: Response,
    @Param("id") id: string,
    @Body() updateLookUpDto: UpdateLookUpDto
  ): Promise<
    Response<ApiResponse<{ data: LookUpDto }>> | Response<ApiResponse<{}>>
  > {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * updateLookUpDto * ");
      const serviceStartTime = Date.now(); // Record the service execution start time
      const lookUp = await this.lookUpService.updateLookUpById(
        +id,
        updateLookUpDto
      );
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * updateLookUpDto * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * updateLookUpDto * ${
          responseTime - requestStartTime
        }ms`
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "LookUp updated successfully", lookUp)
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while updating LookUp"
          )
        );
    }
  }

  /**
   * Deletes a LookUp by ID, by delegating the service.
   */
  @Delete(":id")
  @deleteLookUpByIdSwaggerMetadata()
  async deleteLookUpById(
    @Res() res: Response,
    @Param("id") id: string
  ): Promise<Response<ApiResponse<{}>> | Response<ApiResponse<{}>>> {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * deleteLookUpById *");
      const serviceStartTime = Date.now(); // Record the service execution start time
      await this.lookUpService.deleteLookUpById(+id);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * deleteLookUpById * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * deleteLookUpById * ${
          responseTime - requestStartTime
        }ms`
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "LookUp deleted successfully"));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while deleting LookUp"
          )
        );
    }
  }

  /**
   * Retrieves LookUp records based on a list of lookup names.
   */
  @Post("lookup-values-by-name")
  @getLookUpsByNamesSwaggerMetadata()
  async getLookUpsByNames(
    @Body() body: { lookupNames: string[] },
    @Res() res: Response
  ): Promise<Response> {
    try {
      const { lookupNames } = body;
      // Validate the input
      if (!Array.isArray(lookupNames) || lookupNames.length === 0) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "lookupNames must be a non-empty array"
            )
          );
      }

      const lookUpRecords = await this.lookUpService.getLookUpsByNames(
        lookupNames
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "LookUp records retrieved successfully",
            lookUpRecords
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "An error occurred while retrieving LookUp records"
          )
        );
    }
  }
}
