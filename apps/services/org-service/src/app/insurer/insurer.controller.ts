import {
  BadRequestException,
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
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { GetAllInsurersDto } from "./dto/get-all-insurers.dto";
import { CompanyInsurerQueryDto } from "./dto/company-insurer-query.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurerService } from "./insurer.service";
import {
  addInsurerSwaggerMetadata,
  deleteInsurerSwaggerMetadata,
  getAllInsurersSwaggerMetadata,
  getInsurerByIdSwaggerMetadata,
  getInsurerBranchesSwaggerMetadata,
  getInsurerContactsSwaggerMetadata,
  getInsurerDetailsSwaggerMetadata,
  getInsurerListSwaggerMetadata,
  getCompanyInsurersSwaggerMetadata,
  modifyInsurerSwaggerMetadata,
} from "./insurer.swagger";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { CompanyService } from "../company/comapny.service";

@Controller("insurers")
export class InsurerController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly insurerService: InsurerService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly companyService: CompanyService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Add a new insurer. */
  @Post()
  @addInsurerSwaggerMetadata()
  async addInsurer(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createInsurerDto: CreateInsurerDto
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "InsurerController",
          method: "addInsurer",
          messageData: "method invoked",
        }),
      });
      createInsurerDto.countryId =
        createInsurerDto.countryId ??
        (await this.companyService.getCountryId(userId));
      const insurer = await this.insurerService.addInsurer(
        createInsurerDto,
        userId
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.insurerCreated, insurer)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "addInsurer",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.insurerNotFound,
        errorMessages.insurerCreationForbidden,
        errorMessages.unknownError
      );
    }
  }

  @Get("select-list")
  async getInsurerDropdown(
    @Res() res: Response,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("entityIds") entityIds?: string | string[],
  ) {
    try {
      const parsedEntityIds: number[] = Array.isArray(entityIds)
        ? entityIds.map(Number).filter(Boolean)
        : typeof entityIds === "string"
        ? [parseInt(entityIds)].filter(Boolean)
        : [];
      const result = await this.insurerService.getInsurerDropdown(
        search,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        parsedEntityIds,
      );
      return res.status(HttpStatus.OK).json(createResponse(statusCode.SUCCESS, successMessage.fetched, result));
    } catch (error) {
      return handleErrorResponse(res, error, errorMessages.unknownError);
    }
  }

  @Get("distinct/insurer-names")
  async getDistinctInsurerNames(@Query("search") search: string, @Res() res: Response) {
    try {
      const data = await this.insurerService.getDistinctInsurerNames(search);
      return res.status(HttpStatus.OK).json(createResponse(statusCode.SUCCESS, successMessage.fetched, { data }));
    } catch (error) {
      return handleErrorResponse(res, error, errorMessages.unknownError);
    }
  }

  @Get("distinct/branch-codes")
  async getDistinctBranchCodes(@Query("search") search: string, @Res() res: Response) {
    try {
      const data = await this.insurerService.getDistinctBranchCodes(search);
      return res.status(HttpStatus.OK).json(createResponse(statusCode.SUCCESS, successMessage.fetched, { data }));
    } catch (error) {
      return handleErrorResponse(res, error, errorMessages.unknownError);
    }
  }

  @Get("distinct/branch-names")
  async getDistinctBranchNames(@Query("search") search: string, @Res() res: Response) {
    try {
      const data = await this.insurerService.getDistinctBranchNames(search);
      return res.status(HttpStatus.OK).json(createResponse(statusCode.SUCCESS, successMessage.fetched, { data }));
    } catch (error) {
      return handleErrorResponse(res, error, errorMessages.unknownError);
    }
  }

  /** Get all insurers. */
  @Get()
  @getAllInsurersSwaggerMetadata()
  async getAllInsurers(
    @Query() getAllInsurersDto: GetAllInsurersDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, sort, search, searchBy } = getAllInsurersDto;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "InsurerController",
          method: "getAllInsurers",
          messageData: "method invoked",
        }),
      });
      const result = await this.insurerService.getAllInsurers(
        page ?? DEFAULT_PAGE,
        limit ?? DEFAULT_LIMIT,
        sort ?? DEFAULT_SORT_FIELD,
        search,
        searchBy,
        userId
      );

      const mappedResult = {
        data: result.insurers,
        count: result.total,
        totalActiveInsurers: result.totalActiveInsurers,
        kpisData: result.kpisData,
      };

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.insurerListRetrieved,
            mappedResult
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "getAllInsurers",
          messageData: error,
        }),
      });
      return res
        .status(statusCode.badRequest)
        .json(
          createErrorResponse(
            statusCode.badRequest,
            errorMessages.failedToFetchInsurers || error.message
          )
        );
    }
  }

  @Get("company/:companyId")
  @getCompanyInsurersSwaggerMetadata()
  async getCompanyInsurers(
    @Param("companyId") companyId: string,
    @Query() query: CompanyInsurerQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    const parsedCompanyId = Number(companyId);
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search } = query;

    if (Number.isNaN(parsedCompanyId)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            errorMessages.insurerNotFound
          )
        );
    }

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "InsurerController",
        method: "getCompanyInsurers",
        payload: { companyId: parsedCompanyId, page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      const insurers = await this.insurerService.getCompanyInsurers(
        parsedCompanyId,
        page ?? DEFAULT_PAGE,
        limit ?? DEFAULT_LIMIT,
        search
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.insurerListRetrieved,
            insurers
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "InsurerController",
          method: "getCompanyInsurers",
          payload: { companyId: parsedCompanyId, page, limit, search },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            (error as Error).message || errorMessages.failedToFetchInsurers
          )
        );
    }
  }

  /** Get a list of insurers. */
  @Get("insurerList")
  @getInsurerListSwaggerMetadata()
  async getInsurerList(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search, sortBy, sortOrder, entityIds } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "InsurerController",
          method: "getInsurerList",
          messageData: "method invoked",
        }),
      });
      const insurerList = await this.insurerService.getInsurerList(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sortBy || COMPANY_DISPLAY_NAME,
        sortOrder || DEFAULT_ASC_SORT_ORDER,
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
            successMessage.insurerListRetrieved,
            insurerList
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "getInsurerList",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || errorMessages.failedToFetchInsurers
          )
        );
    }
  }

  /** Get details of a single insurer by ID. */
  @Get("details/:id")
  @getInsurerDetailsSwaggerMetadata()
  async getInsurerDetails(
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
          location: "InsurerController",
          method: "getInsurerDetails",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const insurerDetails = await this.insurerService.getInsurerDetails(
        id,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.insurerDetailsRetrieved,
            insurerDetails
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "getInsurerDetails",
          payload: { id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error.message || errorMessages.insurerNotFound
          )
        );
    }
  }

  /** Get a single insurer by ID. */
  @Get(":insurerId")
  @getInsurerByIdSwaggerMetadata()
  async getInsurerById(
    @Param("insurerId") insurerId: number,
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
          location: "InsurerController",
          method: "getInsurerById",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "insurer",
        "view",
        insurerId
      );
      // if (!viewValidation) {
      //   return res
      //     .status(statusCode.forbidden)
      //     .json(
      //       createErrorResponse(
      //         HttpStatus.FORBIDDEN,
      //         "Access denied: You do not have permission to view this company."
      //       )
      //     );
      // }
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "insurer",
        "edit",
        insurerId
      );
      const insurer = await this.insurerService.getInsurerById(insurerId);
      const response = { ...insurer, editable: editValidation };
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.insurerDetails, response)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "getInsurerById",
          payload: { insurerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.insurerNotFound,
        infoMessages.forBidden,
        errorMessages.unknownError
      );
    }
  }

  /** Modify an existing insurer. */
  @Put(":insurerId")
  @modifyInsurerSwaggerMetadata()
  async modifyInsurer(
    @Req() req: Request,
    @Param("insurerId") insurerId: number,
    @Body() updateInsurerDto: UpdateInsurerDto,
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
          location: "InsurerController",
          method: "modifyInsurer",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "insurer",
        "edit",
        insurerId
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
      const insurer = await this.insurerService.modifyInsurer(
        insurerId,
        updateInsurerDto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.insurerUpdated, insurer)
        );
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, error.message));
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "modifyInsurer",
          payload: { insurerId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToModifyInsurer
          )
        );
    }
  }

  /** Delete an insurer by ID. */
  @Delete(":insurerId")
  @deleteInsurerSwaggerMetadata()
  async deleteInsurer(
    @Param("insurerId") insurerId: number,
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
          location: "InsurerController",
          method: "deleteInsurer",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "insurer",
        "edit",
        insurerId
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
      const result = await this.insurerService.deleteInsurer(insurerId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.insurerDeleted, result)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "InsurerController",
          method: "deleteInsurer",
          payload: { insurerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.insurerNotFound,
        infoMessages.forBidden,
        errorMessages.failedToDeleteInsurer
      );
    }
  }

  /** Get contacts of an insurer by ID. */
  @Get(":insurerId/contacts")
  @getInsurerContactsSwaggerMetadata()
  async getInsurerContacts(
    @Param("insurerId") insurerId: number,
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
          location: "InsurerController",
          method: "getInsurerContacts",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      const contacts = await this.insurerService.getInsurerContacts(
        insurerId,
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
            successMessage.insurerContactsRetrieved,
            contacts
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerController",
          method: "getInsurerContacts",
          payload: { insurerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || errorMessages.insurerContactsNotFound
            )
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToFetchInsurerContacts
          )
        );
    }
  }

  /** Get branches of an insurer by ID. */
  @Get(":insurerId/branches")
  @getInsurerBranchesSwaggerMetadata()
  async getInsurerBranches(
    @Param("insurerId") insurerId: number,
    @Res() res: Response,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "InsurerController",
          method: "getInsurerBranches",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });

      const branches = await this.insurerService.getInsurerBranches(
        insurerId,
        search,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.insurerBranchesRetrieved, branches));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerController",
          method: "getInsurerBranches",
          payload: { insurerId },
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToFetchInsurerBranches
          )
        );
    }
  }

  /** Get locations of a single insurer by ID. */
  @Get(":insurerId/locations")
  @getInsurerDetailsSwaggerMetadata()
  async getInsurerLocations(
    @Param("insurerId") insurerId: number,
    @Res() res: Response,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "InsurerController",
          method: "getInsurerLocations",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      const insurerLocations = await this.insurerService.getInsurerLocations(
        insurerId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || ""
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.insurerLocationsRetrieved,
            insurerLocations
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerController",
          method: "getInsurerLocations",
          payload: { insurerId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error.message || errorMessages.insurerNotFound
          )
        );
    }
  }
}
