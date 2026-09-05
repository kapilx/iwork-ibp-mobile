import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  COMPANY_DISPLAY_NAME,
  DEFAULT_ASC_SORT_ORDER,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT_FIELD,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { BrokerService } from "./broker.service";
import {
  addBrokerSwaggerMetadata,
  deleteBrokerSwaggerMetadata,
  getAllBrokersSwaggerMetadata,
  getBrokerByIdSwaggerMetadata,
  getBrokerContactsSwaggerMetadata,
  getBrokerDetailsSwaggerMetadata,
  getBrokerListSwaggerMetadata,
  updateBrokerSwaggerMetadata,
} from "./broker.swagger";
import { CreateBrokerDto } from "./dto/create-broker.dto";
import { GetAllBrokersDto } from "./dto/get-all-broker.dto";
import { UpdateBrokerDto } from "./dto/update-broker.dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { CompanyService } from "../company/comapny.service";

@Controller("brokers")
export class BrokerController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly brokerService: BrokerService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly companyService: CompanyService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Add a new broker */
  @Post()
  @addBrokerSwaggerMetadata()
  async createBroker(
    @Req() req: Request,
    @Body() createBrokerDto: CreateBrokerDto,
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
          location: "BrokerController",
          method: "createBroker",
          messageData: "method invoked",
        }),
      });
      createBrokerDto.countryId =
        createBrokerDto.countryId ??
        (await this.companyService.getCountryId(userId));
      const broker = await this.brokerService.createBroker(
        createBrokerDto,
        userId
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.brokerCreated,
            broker
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "createBroker",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.brokerNotFound,
        errorMessages.brokerCreationFailed,
        errorMessages.unknownError
      );
    }
  }

  /** Get all brokers */
  @Get()
  @getAllBrokersSwaggerMetadata()
  async getAllBrokers(
    @Query() getAllBrokersDto: GetAllBrokersDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, sort, search, searchBy } = getAllBrokersDto;
      const userId = parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerController",
          method: "getAllBrokers",
          messageData: "method invoked",
        }),
      });
      const result = await this.brokerService.getAllBrokers(
        page ?? DEFAULT_PAGE,
        limit ?? DEFAULT_LIMIT,
        sort ?? DEFAULT_SORT_FIELD,
        search,
        searchBy,
        userId
      );

      const mappedResult = {
        data: result.brokers,
        count: result.total,
        totalBrokers: result.totalBrokers,
      };
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.brokerListRetrieved,
            mappedResult
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "BrokerController",
          method: "getAllBrokers",
          messageData: error,
        }),
      });
      return res
        .status(statusCode.badRequest)
        .json(
          createErrorResponse(
            statusCode.badRequest,
            errorMessages.failedToFetchBrokers || error.message
          )
        );
    }
  }

  /** Get all brokers with broker name and display name */
  @Get("brokerList")
  @getBrokerListSwaggerMetadata()
  async getBrokerList(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search, sortBy, sortOrder } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerController",
          method: "getBrokerList",
          messageData: "method invoked",
        }),
      });
      const brokerList = await this.brokerService.getBrokerList(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sortBy || COMPANY_DISPLAY_NAME,
        sortOrder || DEFAULT_ASC_SORT_ORDER,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.brokerListRetrieved,
            brokerList
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "getBrokerList",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            errorMessages.failedToFetchBrokers || error.message
          )
        );
    }
  }

  /** Get a single Broker by ID. */
  @Get("details/:id")
  @getBrokerDetailsSwaggerMetadata()
  async getbrokerDetails(
    @Param("id") id: number,
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
          location: "BrokerController",
          method: "getbrokerDetails",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const brokerDetails = await this.brokerService.getBrokerDetails(
        id,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.brokerDetailsRetrieved,
            brokerDetails
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "getbrokerDetails",
          payload: { id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound || error.message
          )
        );
    }
  }

  /** Get a single Broker by ID. */
  @Get(":brokerId")
  @getBrokerByIdSwaggerMetadata()
  async getBrokerById(
    @Param("brokerId") brokerId: number,
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
          location: "BrokerController",
          method: "getBrokerById",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "broker",
        "view",
        brokerId
      );
      if (!viewValidation) {
        return res
          .status(statusCode.forbidden)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to view this company."
            )
          );
      }
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "broker",
        "edit",
        brokerId
      );
      const broker = await this.brokerService.getBrokerById(brokerId);
      const response = { ...broker, editable: editValidation };
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.brokerDetails, response)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "getBrokerById",
          payload: { brokerId },
          messageData: error,
        }),
      });
      return res
        .status(statusCode.badRequest)
        .json(
          createErrorResponse(
            statusCode.badRequest,
            errorMessages.brokerNotFound || error.message
          )
        );
    }
  }

  /** Modify a broker */
  @Put(":brokerId")
  @updateBrokerSwaggerMetadata()
  async modifyBroker(
    @Req() req: Request,
    @Param("brokerId") brokerId: number,
    @Body() updateBrokerDto: UpdateBrokerDto,
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
          location: "BrokerController",
          method: "modifyBroker",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "broker",
        "edit",
        brokerId
      );
      if (!editValidation) {
        return res
          .status(statusCode.forbidden)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to edit this company."
            )
          );
      }

      const broker = await this.brokerService.modifyBroker(
        brokerId,
        updateBrokerDto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.brokerUpdated, broker)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "modifyBroker",
          payload: { brokerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.brokerNotFound,
        errorMessages.failedToUpdateBroker
      );
    }
  }

  /** Delete an Broker by ID. */
  @Delete(":brokerId")
  @deleteBrokerSwaggerMetadata()
  async deleteBroker(
    @Param("brokerId") brokerId: number,
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
          location: "BrokerController",
          method: "deleteBroker",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "broker",
        "edit",
        brokerId
      );
      if (!editValidation) {
        return res
          .status(statusCode.forbidden)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to edit this company."
            )
          );
      }
      const result = await this.brokerService.deleteBroker(brokerId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.brokerDeleted, result)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "BrokerController",
          method: "deleteBroker",
          payload: { brokerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.brokerNotFound,
        errorMessages.failedToDeleteBroker
      );
    }
  }

  /** Get contacts of a broker by ID. */
  @Get(":brokerId/contacts")
  @getBrokerContactsSwaggerMetadata()
  async getBrokerContacts(
    @Param("brokerId") brokerId: number,
    @Res() res: Response,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("status") status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "BrokerController",
          method: "getBrokerContacts",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const contacts = await this.brokerService.getBrokerContacts(
        brokerId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        status
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.brokerContactsRetrieved,
            contacts
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerController",
          method: "getBrokerContacts",
          payload: { brokerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || errorMessages.brokerContactsNotFound
            )
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToFetchBrokerContacts
          )
        );
    }
  }
}
