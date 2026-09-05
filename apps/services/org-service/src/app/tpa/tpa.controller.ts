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
  TPA_DEFAULT_PAGE,
  TPA_DEFAULT_PAGE_LIMIT,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { GetTpasDto } from "./dto/get-tpas-query.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";
import { TpaService } from "./tpa.service";
import {
  addTpaSwaggerMetadata,
  deleteTpaByIdSwaggerMetadata,
  getCompanyDetailsSwaggerMetadata,
  getCompanyListSwaggerMetadata,
  getTpaByIdSwaggerMetadata,
  getTpaContactsSwaggerMetadata,
  getTpasSwaggerMetadata,
  updateTpaByIdSwaggerMetadata,
} from "./tpa.swagger";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { CompanyService } from "../company/comapny.service";

@Controller("tpa")
export class TpaController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly tpaService: TpaService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly companyService: CompanyService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Creates a new TPA record by delegating the service
   */
  @Post()
  @addTpaSwaggerMetadata()
  async addTpa(
    @Body() createTpaObject: CreateTpaDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "TpaController",
        method: "addTpa",
        messageData: "method invoked",
      }),
    });
    try {
      createTpaObject.countryId =
        createTpaObject.countryId ??
        (await this.companyService.getCountryId(userId));
      const tpa = await this.tpaService.addTpa(createTpaObject, userId);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(HttpStatus.CREATED, successMessage.tpaCreated, tpa)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "TpaController",
          method: "addTpa",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        infoMessages.tpaNotFound,
        infoMessages.forBidden,
        infoMessages.unknownError
      );
    }
  }

  /**
   * Retrieves all the records of the TPA by delegating the service
   */
  @Get()
  @getTpasSwaggerMetadata()
  async getTpas(
    @Query() queries: GetTpasDto,
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
          location: "TpaController",
          method: "getTpas",
          messageData: "method invoked",
        }),
      });
      const tpas = await this.tpaService.getTpas(
        userId,
        queries.sort || "createdAt:DESC",
        queries.page || TPA_DEFAULT_PAGE,
        queries.limit || TPA_DEFAULT_PAGE_LIMIT,
        queries.search,
        queries.searchBy
      );

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(HttpStatus.CREATED, successMessage.tpasRetrieved, tpas)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "TpaController",
          method: "getTpas",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        infoMessages.tpaNotFound,
        infoMessages.forBidden,
        infoMessages.unknownError
      );
    }
  }

  /**
   * Retrieves the list of companies by delegating the service
   */
  @Get("tpaList")
  @getCompanyListSwaggerMetadata()
  async getCompanyList(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search, sortBy, sort, entityIds } = query;
      const userId = parseInt(req?.headers?.userid);
      const insurerCompanyList = await this.tpaService.getCompanyList(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sortBy || COMPANY_DISPLAY_NAME,
        sort || DEFAULT_ASC_SORT_ORDER,
        userId,
        Array.isArray(entityIds)
          ? entityIds
          : typeof entityIds === "string"
          ? [parseInt(entityIds)]
          : typeof entityIds === "number"
          ? [entityIds]
          : []
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.tpaCompanyListRetrieved,
            insurerCompanyList
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || errorMessages.tpaCompanyListNotFound
          )
        );
    }
  }

  /**
   * Retrieves the basic details of a company by delegating the service
   */
  @Get("details/:id")
  @getCompanyDetailsSwaggerMetadata()
  async getCompanyBasicDetails(@Param("id") id: string, @Req() req: Request) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const companyData = await this.tpaService.getCompanyBasicDetails(
        parseInt(id),
        userId
      );

      return createResponse(
        HttpStatus.OK,
        successMessage.tpaDetailsRetrieved,
        companyData
      );
    } catch (error) {
      return createErrorResponse(
        HttpStatus.NOT_FOUND,
        error instanceof Error ? error.message : errorMessages.companyNotFound
      );
    }
  }

  /**
   * Retrieves a TPA record by tpaId by delegating the service
   */
  @Get(":tpaId")
  @getTpaByIdSwaggerMetadata()
  async getTpaById(
    @Param("tpaId") tpaId: number,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "Tpa",
        "view",
        tpaId
      );
      if (!viewValidation) {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to view this company."
            )
          );
      }
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "Tpa",
        "edit",
        tpaId
      );
      const tpa = await this.tpaService.getTpaById(+tpaId);
      const responseData = { ...tpa, editable: editValidation };
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.tpaRetrieved,
            responseData
          )
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        infoMessages.tpaNotFound,
        infoMessages.forBidden,
        errorMessages.unknownError
      );
    }
  }

  /**
   * Retrives the TPA record by tpaId and updates the TPA record
   */
  @Put(":tpaId")
  @updateTpaByIdSwaggerMetadata()
  async updateTpaById(
    @Param("tpaId") tpaId: number,
    @Body() updateTpaObject: UpdateTpaDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "Tpa",
        "edit",
        tpaId
      );
      if (!editValidation) {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to edit this company."
            )
          );
      }
      const tpa = await this.tpaService.updateTpaById(
        +tpaId,
        updateTpaObject,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.tpaUpdated, tpa));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        infoMessages.tpaNotFound,
        infoMessages.forBidden,
        errorMessages.unknownError
      );
    }
  }

  /**
   * Deletes the TPA record by tpaId by delegating the service
   */
  @Delete(":tpaId")
  @deleteTpaByIdSwaggerMetadata()
  async deleteTpaById(
    @Param("tpaId") tpaId: number,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "Tpa",
        "edit",
        tpaId
      );
      if (!editValidation) {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to edit this company."
            )
          );
      }
      await this.tpaService.deleteTpaById(+tpaId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.tpaDeleted));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        infoMessages.tpaNotFound,
        infoMessages.forBidden,
        errorMessages.unknownError
      );
    }
  }

  /** Get contacts of a TPA by ID. */
  @Get(":tpaId/contacts")
  @getTpaContactsSwaggerMetadata()
  async getTpaContacts(
    @Param("tpaId") tpaId: number,
    @Res() res: Response,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("status") status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const contacts = await this.tpaService.getTpaContacts(
        tpaId,
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
            successMessage.tpaContactsRetrieved,
            contacts
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || errorMessages.tpaContactsNotFound
            )
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToFetchTpaContacts
          )
        );
    }
  }
}
