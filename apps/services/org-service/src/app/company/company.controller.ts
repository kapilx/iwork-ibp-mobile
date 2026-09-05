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
import type { Request, Response } from "express";
import { CompanyService } from "./comapny.service";
import {
  createCompanySwaggerMetadata,
  getCompaniesDataSwaggerMetadata,
  getCompaniesSwaggerMetadata,
  getCompanyDetailsSwaggerMetadata,
  getCompanyListSwaggerMetadata,
  getCompanySwaggerMetadata,
  getGroupCompaniesSwaggerMetadata,
  getHierarchyCompaniesSwaggerMetadata,
  updateCompanySwaggerMetadata,
  bulkUpdateCompaniesSwaggerMetadata,
  inceptionCreateCompanySwaggerMetadata,
  refreshCompanyAnalyticsSwaggerMetadata,
  createCompanyOpportunitySwaggerMetadata,
  getCompanyContactsSwaggerMetadata,
  getCompanyDocumentsSwaggerMetadata,
  getCompanyLocationsSwaggerMetadata,
  migrateCompaniesSwaggerMetadata,
} from "./comapny.swagger";
import { CompanyDetailsDto } from "./dto/company-detail.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import type { QuickCreatePayloadDto } from "./dto/create-assistance.dto";
import { GetCompaniesDto, GetCompanyListDto } from "./dto/get-company-list-dto";
import { CompanyHierarchyQueryDto } from "./dto/company-hierarchy-query.dto";
import { CompanyBulkUpdateDto } from "./dto/company-bulk-update.dto";
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
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { UpdateCompanyReminderConfigDto } from "./dto/update-company-reminder-config.dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Controller("company")
export class CompanyController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly companyService: CompanyService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  // Create a new company
  @Post()
  @createCompanySwaggerMetadata()
  async createCompany(
    @Body("company") companyDto: CreateCompanyDto,
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
          location: "CompanyController",
          method: "createCompany",
          messageData: "method invoked",
        }),
      });
      companyDto.countryId =
        companyDto.countryId ??
        (await this.companyService.getCountryId(userId));
      companyDto.currencyId = await this.companyService.getCurrencyId(
        companyDto.countryId
      );
      companyDto.displayName = companyDto.displayName ?? companyDto.companyName;
      companyDto.priorityLid =
        companyDto.priorityLid ??
        (await this.companyService.getDefaultPriorty()); // Default medium
      companyDto.groupCompanyLid =
        companyDto.groupCompanyLid ??
        (await this.companyService.getDefaultGroupCompany()); // Default No
      companyDto.createdBy = userId;
      companyDto.updatedBy = userId;
      const companyData = await this.companyService.createCompany(
        companyDto,
        userId
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.companyCreated,
            companyData
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "createCompany",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound,
        errorMessages.companyCreationForbidden,
        errorMessages.companyCreationFailed
      );
    }
  }

  @Post("inception-create-company")
  @inceptionCreateCompanySwaggerMetadata()
  async inceptionCreateCompany(
    @Body() companies: CreateCompanyDto[],
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
          location: "CompanyController",
          method: "inceptionCreateCompany",
          messageData: "method invoked",
        }),
      });
      const results = await this.companyService.inceptionCreateCompany(
        companies,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.companyCreated, results)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "inceptionCreateCompany",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound,
        errorMessages.companyCreationForbidden,
        errorMessages.companyCreationFailed
      );
    }
  }

  @Get("analytics/refresh")
  @refreshCompanyAnalyticsSwaggerMetadata()
  async refreshCompanyAnalytics(@Res() res: Response, @Req() req: Request) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "refreshCompanyAnalytics",
          messageData: "method invoked",
        }),
      });
      await this.companyService.refreshCompanyAnalytics(userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyAnalyticsRefreshed
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyController",
          method: "refreshCompanyAnalytics",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound,
        errorMessages.companyAnalyticsRefreshForbidden,
        errorMessages.companyAnalyticsRefreshFailed
      );
    }
  }

  @Post("company-opportunity-create")
  @createCompanyOpportunitySwaggerMetadata() 
  async createAssistance(
    @Body() payload: QuickCreatePayloadDto,
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
          location: "CompanyController",
          method: "createAssistance",
          messageData: "method invoked",
        }),
      });
      payload.company.countryId =
        payload.company.countryId ??
        (await this.companyService.getCountryId(userId));
      payload.company.currencyId = await this.companyService.getCurrencyId(
        payload.company.countryId
      );
      payload.company.createdBy = userId;
      payload.company.updatedBy = userId;
      const data = await this.companyService.createAssistance(
        payload,
        userId,
        req
      );
      const message =
        payload?.opportunity == null
          ? payload?.company?.companyId == null
            ? `${payload.company.companyName} ` +
              successMessage.companyAndContactCreated
            : successMessage.contactCreated
          : payload?.company?.companyId == null
          ? `${payload.company.companyName} ` +
            successMessage.companyOpportunityCreated
          : successMessage.opportunityCreated;
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, message, data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyController",
          method: "createAssistance",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound,
        errorMessages.companyCreationForbidden,
        errorMessages.companyCreationFailed
      );
    }
  }

  // Get a list of companies
  // with pagination, search, and sorting options.
  @Get("companyList")
  @getCompanyListSwaggerMetadata()
  async getCompanyList(
    @Query() query: GetCompanyListDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search, entityIds } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "getCompanyList",
          messageData: "method invoked",
        }),
      });
      const companyList = await this.companyService.getCompanyList(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        userId,
        entityIds
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyListRetrieved,
            companyList
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompanyList",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || errorMessages.companyListNotFound
          )
        );
    }
  }

  @Get("company-hierarchy")
  @getCompaniesDataSwaggerMetadata()
  async getCompaniesData(
    @Query() query: GetCompanyListDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "getCompaniesData",
          messageData: "method invoked",
        }),
      });
      const companyData = await this.companyService.getCompanies(
        page,
        limit,
        userId,
        search
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyListRetrieved,
            companyData
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompaniesData",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || errorMessages.companyListNotFound
          )
        );
    }
  }

  @Get("hierarchy/companies")
  @getHierarchyCompaniesSwaggerMetadata()
  async getHierarchyCompanies(
    @Query() query: CompanyHierarchyQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const {
      ownerId,
      viewBy,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
    } = query;
    const loggedInUserId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId: loggedInUserId,
        status: "success",
        location: "CompanyController",
        method: "getHierarchyCompanies",
        payload: { ownerId, viewBy, page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      const companies = await this.companyService.getCompaniesByHierarchy(
        loggedInUserId,
        ownerId,
        viewBy,
        page ?? DEFAULT_PAGE,
        limit ?? DEFAULT_LIMIT,
        search
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyListRetrieved,
            companies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: loggedInUserId,
          status: "failure",
          location: "CompanyController",
          method: "getHierarchyCompanies",
          payload: { ownerId, viewBy, page, limit, search },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            (error as Error).message || errorMessages.companyListFailed
          )
        );
    }
  }

  @Get("portal-configured/companies")
  async getCompaniesWithPortalConfiguration(
    @Query() query: CompanyHierarchyQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search } = query;
    const loggedInUserId = parseInt(req?.headers?.userid);
    
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId: loggedInUserId,
        status: "success",
        location: "CompanyController",
        method: "getCompaniesWithPortalConfiguration",
        payload: { page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      const companies = await this.companyService.getCompaniesWithPortalConfiguration(
        page ?? DEFAULT_PAGE,
        limit ?? DEFAULT_LIMIT,
        search
      );
      
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Companies with active policies retrieved successfully",
            companies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: loggedInUserId,
          status: "failure",
          location: "CompanyController",
          method: "getCompaniesWithPortalConfiguration",
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            (error as Error).message || "Failed to fetch companies with active policies"
          )
        );
    }
  }

  // Get a list of group companies with pagination and search.
  @Get("group-company")
  @getGroupCompaniesSwaggerMetadata()
  async getGroupCompanies(
    @Query() query: GetCompanyListDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const { page, limit, search } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "getGroupCompanies",
          messageData: "method invoked",
        }),
      });
      const companyList = await this.companyService.getGroupCompanies(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.groupCompanyListRetrieved,
            companyList
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getGroupCompanies",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || errorMessages.groupCompanyListRetrievalFailed
          )
        );
    }
  }

  // Get a company's automated email reminder-day settings (installment due,
  // policy expiry, opportunity close-to-expiry). Declared before ":id" so it
  // isn't swallowed by that catch-all route.
  @Get("reminder-config/:companyId")
  async getCompanyReminderConfig(
    @Param("companyId") companyId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "success",
          location: "CompanyController",
          method: "getCompanyReminderConfig",
          messageData: "method invoked",
        }),
      });
      const reminderConfig = await this.companyService.getCompanyReminderConfig(
        parseInt(companyId)
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Reminder config retrieved successfully", reminderConfig));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompanyReminderConfig",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || "Failed to fetch reminder config"
          )
        );
    }
  }

  // Update a company's automated email reminder-day settings. Declared before
  // ":companyId" so it isn't swallowed by that catch-all route.
  @Put("reminder-config/:companyId")
  async updateCompanyReminderConfig(
    @Param("companyId") companyId: string,
    @Body() payload: UpdateCompanyReminderConfigDto,
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
          location: "CompanyController",
          method: "updateCompanyReminderConfig",
          messageData: "method invoked",
        }),
      });
      const reminderConfig = await this.companyService.updateCompanyReminderConfig(
        parseInt(companyId),
        payload,
        Number.isFinite(userId) ? userId : undefined
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.companyUpdated, reminderConfig));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "updateCompanyReminderConfig",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error.message || "Failed to update reminder config"
          )
        );
    }
  }

  // Get a company by its ID
  @Get(":id")
  @getCompanySwaggerMetadata()
  async getCompanyById(
    @Param("id") id: string,
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
          location: "CompanyController",
          method: "getCompanyById",
          messageData: "method invoked",
        }),
      });
      // Distinct mode from the generic "view" (still used by
      // getCompanyBasicDetails for cross-entity form population, which
      // intentionally stays org-wide) so only the full Company Details page
      // is restricted to the Lead CRM/Associate CRM/Account Manager circle.
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "company",
        "view-company-details-page",
        parseInt(id)
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
      const companyData = await this.companyService.getCompanyById(id, userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyDetails,
            companyData
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompanyById",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error instanceof Error ? error.message : errorMessages.companyNotFound
          )
        );
    }
  }

  @Get(":id/contacts")
  @getCompanyContactsSwaggerMetadata()
  async getCompanyContacts(
    @Param("id") id: number,
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
          location: "CompanyController",
          method: "getCompanyContacts",
          messageData: "method invoked",
        }),
      });
      const contacts = await this.companyService.getCompanyContacts(
        id,
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
            successMessage.companyContactsRetrieved,
            contacts
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyController",
          method: "getCompanyContacts",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyContactsListNotFound,
        infoMessages.forBidden,
        errorMessages.companyContactsRetrievalFailed
      );
    }
  }

  @Get(":id/documents")
  @getCompanyDocumentsSwaggerMetadata()
  async getCompanyDocuments(
    @Param("id") id: number,
    @Query() query: GetCompaniesDto,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyController",
          method: "getCompanyDocuments",
          payload: { id, query },
          messageData: "method invoked",
        }),
      });
      const { page, limit, search, searchBy, from, to, field } = query;
      const documents = await this.companyService.getCompanyDocuments(
        id,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search,
        searchBy,
        from,
        to,
        field
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyDocumentsRetrieved,
            documents
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyController",
          method: "getCompanyDocuments",
          payload: { id, query },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get(":id/locations")
  @getCompanyLocationsSwaggerMetadata()
  async getCompanyLocations(
    @Param("id") id: number,
    @Query() query: GetCompaniesDto,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyController",
          method: "getCompanyLocations",
          payload: { id, query },
          messageData: "method invoked",
        }),
      });
      const { page, limit, search, searchBy, from, to, field } = query;
      const locations = await this.companyService.getCompanyLocations(
        id,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search,
        searchBy,
        from,
        to,
        field
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyLocationsRetrieved,
            locations
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyController",
          method: "getCompanyLocations",
          payload: { id, query },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  // List companies
  @Get()
  @getCompaniesSwaggerMetadata()
  async getCompanies(
    @Query() query: GetCompaniesDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        page,
        limit,
        search,
        sort,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        ownerId,
        viewBy,
      } = query;
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "getCompanies",
          messageData: "method invoked",
        }),
      });
      const companies = await this.companyService.listCompanies(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sort || "createdAt:DESC",
        userId,
        searchBy || "",
        field,
        from,
        to || null,
        period,
        month,
        financialYear,
        ownerId,
        viewBy
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyListRetrieved,
            companies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompanies",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyListNotFound,
        infoMessages.forBidden,
        errorMessages.companyListRetrievalFailed
      );
    }
  }

  // Update a company by its companyId
  @Put(":companyId")
  @updateCompanySwaggerMetadata()
  async updateCompany(
    @Param("companyId") companyId: string,
    @Body("company") companyDto: UpdateCompanyDto,
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
          location: "CompanyController",
          method: "updateCompany",
          messageData: "method invoked",
        }),
      });
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "company",
        "edit",
        parseInt(companyId)
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      companyDto.updatedBy = userId;
      const updatedCompany = await this.companyService.updateCompany(
        companyId,
        companyDto
      );

      if (!updatedCompany) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              errorMessages.companyNotFound
            )
          );
      }
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.companyUpdated,
            updatedCompany
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "updateCompany",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound,
        errorMessages.companyUpdateForbidden,
        errorMessages.companyUpdateFailed
      );
    }
  }

  // Bulk update companies endpoint
  @Post("bulk-update")
  @bulkUpdateCompaniesSwaggerMetadata()
  async bulkUpdateCompanies(
    @Body() bulkUpdateDto: CompanyBulkUpdateDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = bulkUpdateDto.userId || parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "bulkUpdateCompanies",
          payload: {
            recordCount: bulkUpdateDto.recordIds?.length || 0,
            updateCount: bulkUpdateDto.fieldUpdates || 0,
            userId: bulkUpdateDto.userId,
          },
          messageData: "method invoked",
        }),
      });

      // Validate required fields based on selectedAll flag
      if (!bulkUpdateDto.selectedAll && !bulkUpdateDto.recordIds?.length) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "recordIds is required when selectedAll is false"
            )
          );
      }

      if (
        bulkUpdateDto.fieldUpdates &&
        Object.keys(bulkUpdateDto.fieldUpdates).length === 0
      ) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "fieldUpdates is required and must contain at least one field update"
            )
          );
      }

      // Call the company service bulk update method
      const result = await this.companyService.bulkUpdateCompanies(
        bulkUpdateDto.recordIds || [],
        bulkUpdateDto.fieldUpdates,
        userId,
        bulkUpdateDto.selectedAll,
        bulkUpdateDto.excludedIds,
        bulkUpdateDto.selectedFilterValues
      );

      const statusCode =
        result.failureCount > 0 ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK;
      const message =
        result.failureCount > 0
          ? `Bulk update completed with ${result.failureCount} failures out of ${result.totalRecords} records`
          : successMessage.companyBulkUpdateCompleted ||
            `Successfully updated ${result.successCount} companies`;
      return res
        .status(statusCode)
        .json(createResponse(statusCode, message, result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "bulkUpdateCompanies",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.companyNotFound || "Company not found",
        errorMessages.companyUpdateForbidden || "Company update forbidden",
        errorMessages.companyBulkUpdateFailed || "Company bulk update failed"
      );
    }
  }

  @Get("details/:id")
  @getCompanyDetailsSwaggerMetadata()
  async getCompanyBasicDetails(
    @Param("id") id: string,
    @Req() req: Request,
    @Query("contactId") contactId?: number,
    @Query("status") status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyController",
          method: "getCompanyBasicDetails",
          messageData: "method invoked",
        }),
      });
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "company",
        "view",
        parseInt(id)
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to view this company."
        );
      }
      const companyData = await this.companyService.getCompanyBasicDetails(
        parseInt(id),
        userId,
        contactId,
        status
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.companyDetails,
        companyData
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "CompanyController",
          method: "getCompanyBasicDetails",
          messageData: error,
        }),
      });
      return createErrorResponse(
        HttpStatus.NOT_FOUND,
        error instanceof Error ? error.message : errorMessages.companyNotFound
      );
    }
  }

  @Post("migrate-companies")
  @migrateCompaniesSwaggerMetadata()
  async migrateCompanies(
    @Res() res: Response,
    @Query("batchSize") batchSize?: string,
  ): Promise<Response> {
    try {
      const result = await this.companyService.migrateCompanies(
        batchSize ? Number(batchSize) : undefined,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Migration completed", result));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }
}
