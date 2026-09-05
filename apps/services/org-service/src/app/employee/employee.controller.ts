import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
  Query,
  NotFoundException,
  ForbiddenException,
  Res,
  Req,
  BadRequestException,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { GetEmployeesDto } from "./dto/get-empolyees-query.dto";
import {
  DEFAULT_EMPLOYEE_CREATED_BY,
  DEFAULT_EMPLOYEE_PAGE,
  DEFAULT_EMPLOYEE_PAGE_LIMIT,
  DEFAULT_ADMIN_ID,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createResponse,
  createErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import {
  addEmployeeSwaggerMetadata,
  deleteEmployeeSwaggerMetadata,
  getEmployeeByIdSwaggerMetadata,
  getEmployeesSwaggerMetadata,
  getEmployeeHierarchySwaggerMetadata,
  getListOfEmployeesValuesSwaggerMetadata,
  updateEmployeeSwaggerMetadata,
  rebuildHierarchySwaggerMetadata,
  reportingChainSwaggerMetadata,
  inceptionCreateEmployeeSwaggerMetadata,
  validateResetTokenSwaggerMetadata,
  resetPasswordSwaggerMetadata,
  ibpResetPasswordSwaggerMetadata,
  sendPasswordResetMailSwaggerMetadata,
  sendIBPPasswordResetMailSwaggerMetadata,
  sendCompanyEmployeePasswordResetMailSwaggerMetadata,
} from "./employee.swagger";
import { ManualDeactivateDto } from "./dto/deactivate-employee.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { GetReportingChainDto } from "./dto/get-reporting-chain.dto";
import type { Request, Response } from "express";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import { UserTrace } from "../../../../service-lib/src/lib/audit-history/decorators/user-trace.decorator";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { CaptchaGuard } from "@divami-labs/nestjs-captcha";
import { ApplyMasking, ResponseMaskingInterceptor } from "../../../../service-lib/src/lib/field-masking";
import { maskValue, MaskingPattern } from "../../../../service-lib/src/lib/field-masking";

@Controller("employee")
export class EmployeeController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Retrieve a list of Employee records for the dropdown by delegating the employee service.
   */
  @Get("list-of-values")
  @getListOfEmployeesValuesSwaggerMetadata()
  async getEmployeesListOfValues(
    @Res() res: Response,
    @Query() queries?: GetEmployeesDto
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getEmployeesListOfValues",
          messageData: "method invoked",
        }),
      });
      const employees = await this.employeeService.getListOfEmployeesValues(
        queries?.sort,
        queries?.search,
        queries?.searchBy,
        queries?.page ?? DEFAULT_EMPLOYEE_PAGE,
        queries?.limit ?? DEFAULT_EMPLOYEE_PAGE_LIMIT,
        queries?.entityIds
      );
      return res.status(statusCode.ok).json(
        createResponse(HttpStatus.OK, successMessage.employeeListRetrieval, {
          data: employees.data,
          count: employees.count,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getEmployeesListOfValues",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Create a new Employee record by delegating the employee service.
   */
  @Post()
  @addEmployeeSwaggerMetadata()
  async addEmployee(
    @Body() createEmployeeObject: CreateEmployeeDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId =
        parseInt(req?.headers?.userid) ?? DEFAULT_EMPLOYEE_CREATED_BY;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeController",
          method: "addEmployee",
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeService.addEmployee(
        createEmployeeObject,
        userId
      );
      // if(employee){
      //   await this.employeeService.sendPasswordResetMail(employee.emailId, employee.userId, employee.firstName);
      // }
      return res
        .status(statusCode.created)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.employeeCreation,
            employee
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          userId: parseInt(req?.headers?.userid) ?? DEFAULT_EMPLOYEE_CREATED_BY,
          location: "EmployeeController",
          method: "addEmployee",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  // Create Inception Employee
  @Post("inception-create-employee")
  @inceptionCreateEmployeeSwaggerMetadata()
  async inceptionCreateEmployee(
    @Body() employees: CreateEmployeeDto[],
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId =
        parseInt(req?.headers?.userid) ?? DEFAULT_EMPLOYEE_CREATED_BY;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeController",
          method: "inceptionCreateEmployee",
          messageData: "method invoked",
        }),
      });
      const results = await this.employeeService.inceptionCreateEmployee(
        employees,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeCreation,
            results
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          userId: parseInt(req?.headers?.userid) ?? DEFAULT_EMPLOYEE_CREATED_BY,
          location: "EmployeeController",
          method: "inceptionCreateEmployee",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Validate password reset token
   */
  @Get("password-reset/validate")
  @validateResetTokenSwaggerMetadata()
  async validateResetToken(
    @Query("token") token: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "validateResetToken",
          messageData: "method invoked",
        }),
      });
      await this.employeeService.validateResetToken(token);
      return res
        .status(statusCode.ok)
        .json(createResponse(HttpStatus.OK, successMessage.employeeRetrieval));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "validateResetToken",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Reset password using token
   */
  @Post("password-reset")
  @UserTrace("PASSWORD-RESET")
  @UseGuards(CaptchaGuard)
  @resetPasswordSwaggerMetadata()
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "resetPassword",
          messageData: "method invoked",
        }),
      });
      const ipAddress = this.extractIpAddress(req);
      await this.employeeService.resetPassword(
        body.token,
        body.password,
        ipAddress
      );
      return res
        .status(statusCode.ok)
        .json(createResponse(HttpStatus.OK, successMessage.passwordUpdated));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "resetPassword",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Reset password using token
   */
  @Post("ibp-password-reset")
  @UserTrace("PASSWORD-RESET")
  @UseGuards(CaptchaGuard)
  @ibpResetPasswordSwaggerMetadata()
  async ibpResetPassword(@Body() body: ResetPasswordDto, @Res() res: Response) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "ibpResetPassword",
          messageData: "method invoked",
        }),
      });
      await this.employeeService.ibpResetPassword(body.token, body.password, body.companyId);
      return res
        .status(statusCode.ok)
        .json(createResponse(HttpStatus.OK, successMessage.passwordUpdated));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "resetPassword",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Send password reset mail for an employee.
   */
  @Post("password-reset-mail/:emailId")
  @sendPasswordResetMailSwaggerMetadata()
  async sendPasswordResetMail(
    @Param("emailId") emailId: string,
    @Query("source") source: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const ipAddress = this.extractIpAddress(req);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "sendPasswordResetMail",
          payload: { emailId, ipAddress },
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeService.getEmployeeByEmailId(emailId);
      await this.employeeService.sendPasswordResetMail(
        employee.emailId,
        employee.userId,
        [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
          employee.firstName,
        source
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, successMessage.passwordResetMailSent)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "sendPasswordResetMail",
          payload: { emailId },
          messageData: error,
        }),
      });
    }
    // Always return generic message regardless of success or failure
    return res
      .status(statusCode.ok)
      .json(
        createResponse(
          HttpStatus.OK,
          "If this account exists, a password reset link has been sent to your registered email."
        )
      );
  }

  /**
   * Send password reset mail for an employee.
   */
  @Post("ibp-password-reset-mail/:emailId")
  @sendIBPPasswordResetMailSwaggerMetadata()
  async sendIBPPasswordResetMail(
    @Param("emailId") emailId: string,
    @Query("source") source: string,
    @Query("domain") domain: string,
    @Query("method") methodCode: string,
    @Res() res: Response
  ) {
    try {
      console.log("Source:", source); // For demonstration purposes
      console.log("Domain:", domain); // For demonstration purposes
      console.log("Method:", methodCode); // For demonstration purposes
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "sendIBPPasswordResetMail",
          payload: { emailId, domain },
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeService.getUserForIbpPasswordReset(
        emailId,
        methodCode,
        domain,
      );
      await this.employeeService.sendPasswordResetMail(
        employee.emailId,
        employee.userId,
        employee.firstName,
        source,
        domain,
        methodCode,
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, successMessage.passwordResetMailSent, {
            maskedEmail: maskValue(employee.emailId, {
              pattern: MaskingPattern.EMAIL_STANDARD,
            }),
          })
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "sendPasswordResetMail",
          payload: { emailId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  @Post("company-employee-password-reset-mail/:emailId")
  @sendCompanyEmployeePasswordResetMailSwaggerMetadata()
  async sendPasswordResetMailForCompanyEmployee(
    @Param("emailId") emailId: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "sendPasswordResetMailForCompanyEmployee",
          payload: { emailId },
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeService.getCompanyEmployeeByEmailId(
        emailId
      );
      if (!employee || !employee.email || !employee.id) {
        throw new NotFoundException(
          `Failed to fetch company employee with email ID ${emailId}`
        );
      }
      await this.employeeService.sendPasswordResetMail(
        employee.email,
        employee.id,
        employee.employeeName
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, successMessage.passwordResetMailSent)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "sendPasswordResetMailForCompanyEmployee",
          payload: { emailId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Retrieve all Employee records by delegating the employee service.
   *
   * NOTE: @Res() is intentionally NOT used here. NestJS interceptors (including
   * ResponseMaskingInterceptor) are bypassed when @Res() + res.json() is used
   * because the response is sent directly to Express before the interceptor's
   * map() operator runs. Returning the value lets the interceptor process it.
   */
  @UseInterceptors(ResponseMaskingInterceptor)
  @ApplyMasking('employee')
  @Get()
  @getEmployeesSwaggerMetadata()
  async getEmployees(@Query() queries?: GetEmployeesDto) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getEmployees",
          messageData: "method invoked",
        }),
      });
      const employees = await this.employeeService.getEmployees(
        queries?.sort,
        queries?.search,
        queries?.searchBy,
        queries?.page ?? DEFAULT_EMPLOYEE_PAGE,
        queries?.limit ?? DEFAULT_EMPLOYEE_PAGE_LIMIT
      );

      return createResponse(HttpStatus.OK, successMessage.employeeListRetrieval, {
        data: employees.data,
        count: employees.count,
        inactiveCount: employees.inactiveCount,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getEmployees",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieve employee hierarchy for a given root userId.
   */
  @Get("/hierarchy")
  @getEmployeeHierarchySwaggerMetadata()
  async getEmployeeHierarchy(
    @Res() res: Response,
    @Req() req: Request,
    @Param("userId") userId: number
  ) {
    try {
      const userIdHeader = parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userIdHeader,
          status: "success",
          location: "EmployeeController",
          method: "getEmployeeHierarchy",
          messageData: "method invoked",
        }),
      });
      let parsedUserId = userIdHeader;
      if (userId) {
        parsedUserId = userId;
      }

      const hierarchy = await this.employeeService.getEmployeeHierarchyByUserId(
        parsedUserId
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeHierarchyRetrieval,
            hierarchy
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "EmployeeController",
          method: "getEmployeeHierarchy",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Retrieve employee hierarchy for a given root userId.
   */
  @Get(":userId/parentPrivilege")
  @getEmployeeHierarchySwaggerMetadata()
  async getEmployeeParentWithPrivilege(
    @Res() res: Response,
    @Param("userId") userId: number,
    @Query("aclCategoryKey") aclCategoryKey: string,
    @Query("aclActionKey") aclActionKey: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getEmployeeParentWithPrivilege",
          payload: { userId, aclCategoryKey, aclActionKey },
          messageData: "method invoked",
        }),
      });
      if (!aclCategoryKey || !aclActionKey) {
        throw new BadRequestException(infoMessages.missingPrivilegeKeys);
      }
      const parent = await this.employeeService.getParentUserWithPrivilege(
        +userId,
        aclCategoryKey,
        aclActionKey
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.parentWithPrivilege,
            parent
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getEmployeeParentWithPrivilege",
          payload: { userId, aclCategoryKey, aclActionKey },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Retrieve users with a given privilege.
   */
  @Get("privilege")
  @getEmployeeHierarchySwaggerMetadata()
  async getUsersWithPrivilege(
    @Res() res: Response,
    @Query("aclCategoryKey") aclCategoryKey: string,
    @Query("aclActionKey") aclActionKey: string,
    @Query("limit") limit: number,
    @Query("page") page: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getUsersWithPrivilege",
          payload: { aclCategoryKey, aclActionKey, limit, page },
          messageData: "method invoked",
        }),
      });
      if (!aclCategoryKey || !aclActionKey) {
        throw new BadRequestException(infoMessages.missingPrivilegeKeys);
      }
      if (page === undefined || isNaN(page) || page < 1) {
        page = DEFAULT_EMPLOYEE_PAGE;
      }
      if (limit === undefined || isNaN(limit) || limit < 1) {
        limit = DEFAULT_EMPLOYEE_PAGE_LIMIT;
      }

      const users = await this.employeeService.getAllUsersWithPrivilege(
        aclCategoryKey,
        aclActionKey,
        page,
        limit
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeesWithPrivilege,
            users
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getUsersWithPrivilege",
          payload: { aclCategoryKey, aclActionKey, limit, page },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Retrieve all employee hierarchy for a given root userId.
   */
  @Get("/all-users-hierarchy")
  @getEmployeeHierarchySwaggerMetadata()
  async getAllEmployeeHierarchy(@Res() res: Response, @Req() req: Request) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const orgId = await this.employeeService.getSuperUserId(userId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: orgId,
          status: "success",
          location: "EmployeeController",
          method: "getAllEmployeeHierarchy",
          messageData: "method invoked",
        }),
      });
      const hierarchy = await this.employeeService.getEmployeeHierarchyByOrgId(
        orgId
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeHierarchyRetrieval,
            hierarchy
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "EmployeeController",
          method: "getAllEmployeeHierarchy",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Retrieve a single Employee record by ID by delegating the employee service.
   */
  @Get("my-profile")
  async getMyProfile(@Res() res: Response, @Req() req: Request) {
    const userId = parseInt(req?.headers?.userid);
    try {
      if (!userId) {
        return res
          .status(statusCode.badRequest)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, errorMessages.unauthorizedUser));
      }
      const employee = await this.employeeService.getMyProfile(userId);
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, successMessage.employeeRetrieval, employee)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getMyProfile",
          payload: { userId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  @Get(":employeeId")
  @getEmployeeByIdSwaggerMetadata()
  async getEmployeeById(
    @Res() res: Response,
    @Param("employeeId") employeeId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getEmployeeById",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeService.getEmployeeById(+employeeId);
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeRetrieval,
            employee
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getEmployeeById",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Update an existing Employee record by ID by delegating the employee service.
   */
  @Put(":employeeId")
  @updateEmployeeSwaggerMetadata()
  async updateEmployeeById(
    @Res() res: Response,
    @Req() req: Request,
    @Param("employeeId") employeeId: number,
    @Body() updateEmployeeObject: UpdateEmployeeDto
  ) {
    const userId =
      parseInt(req?.headers?.userid) ?? DEFAULT_EMPLOYEE_CREATED_BY;

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeController",
          method: "updateEmployeeById",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      if (!updateEmployeeObject) {
        return res
          .status(statusCode.badRequest)
          .json(
            createErrorResponse(
              statusCode.badRequest,
              infoMessages.employeeUpdateFailed
            )
          );
      }
      const employee = await this.employeeService.updateEmployeeById(
        +employeeId,
        updateEmployeeObject,
        userId
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, successMessage.employeeUpdate, employee)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeController",
          method: "updateEmployeeById",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Delete an Employee record by ID by delegating the employee service.
   */
  @Delete(":employeeId")
  @deleteEmployeeSwaggerMetadata()
  async deleteEmployeeById(
    @Res() res: Response,
    @Param("employeeId") employeeId: number,
    @Query("delegateId") delegateId: number,
    @Query("newManagerId") newManagerId?: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "deleteEmployeeById",
          payload: { employeeId, delegateId, newManagerId },
          messageData: "method invoked",
        }),
      });
      await this.employeeService.deleteEmployeeById(
        +employeeId,
        delegateId,
        newManagerId
      );
      return res
        .status(statusCode.ok)
        .json(createResponse(HttpStatus.OK, successMessage.employeeDeletion));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "deleteEmployeeById",
          payload: { employeeId, delegateId, newManagerId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Returns counts of dependent records for the deactivation confirmation popup.
   */
  @Get(":employeeId/deactivate-preview")
  async getDeactivatePreview(
    @Res() res: Response,
    @Param("employeeId") employeeId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getDeactivatePreview",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const preview = await this.employeeService.getDeactivatePreview(+employeeId);
      return res
        .status(200)
        .json(createResponse(HttpStatus.OK, "Deactivation preview fetched", preview));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getDeactivatePreview",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Returns all dependent records (companies, opportunities, etc.) for the
   * manual-assignment page.
   */
  @Get(":employeeId/deactivation-records")
  async getDeactivationRecords(
    @Res() res: Response,
    @Param("employeeId") employeeId: number,
    @Query("type") type?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getDeactivationRecords",
          payload: { employeeId, type },
          messageData: "method invoked",
        }),
      });
      const records = await this.employeeService.getDeactivationRecords(+employeeId, type);
      return res
        .status(200)
        .json(createResponse(HttpStatus.OK, "Deactivation records fetched", records));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getDeactivationRecords",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Auto-assigns all dependent records to the reporting manager and deactivates
   * the employee in one transaction.
   */
  @Post(":employeeId/auto-deactivate")
  async autoDeactivate(
    @Res() res: Response,
    @Param("employeeId") employeeId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "autoDeactivate",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      await this.employeeService.autoDeactivate(+employeeId);
      return res
        .status(200)
        .json(createResponse(HttpStatus.OK, "Employee deactivated successfully"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "autoDeactivate",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Applies admin-specified manual reassignments and deactivates the employee.
   */
  @Post(":employeeId/manual-deactivate")
  async manualDeactivate(
    @Res() res: Response,
    @Param("employeeId") employeeId: number,
    @Body() dto: ManualDeactivateDto
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "manualDeactivate",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      await this.employeeService.manualDeactivate(+employeeId, dto);
      return res
        .status(200)
        .json(createResponse(HttpStatus.OK, "Employee deactivated successfully"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "manualDeactivate",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Returns each given employee's ordered reporting chain (root -> ... -> the
   * employee), for grid display. Reads only the precomputed
   * employee_hierarchy table, batched for the whole set of userIds in one
   * request.
   */
  @Post("reporting-chain")
  @reportingChainSwaggerMetadata()
  async getReportingChain(
    @Res() res: Response,
    @Body() dto: GetReportingChainDto
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "getReportingChain",
          messageData: `method invoked for ${dto.userIds.length} employee(s)`,
        }),
      });
      const chains = await this.employeeService.getReportingChains(dto.userIds);
      return res
        .status(statusCode.ok)
        .json(
          createResponse(HttpStatus.OK, "Reporting chains fetched successfully.", chains)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "getReportingChain",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Triggers the rebuilding of the entire employee hierarchy.
   * This is a potentially long-running operation.
   */
  @Post("rebuild-hierarchy")
  @rebuildHierarchySwaggerMetadata()
  async rebuildHierarchy(@Res() res: Response, @Req() req: Request) {
    try {
      const creatorId =
        parseInt(req?.headers?.userid as string) || DEFAULT_ADMIN_ID;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: creatorId,
          status: "success",
          location: "EmployeeController",
          method: "rebuildHierarchy",
          messageData: "method invoked",
        }),
      });
      await this.employeeService.rebuildFlatHierarchy(creatorId);
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            HttpStatus.OK,
            "Employee hierarchy rebuild process initiated successfully."
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: creatorId,
          status: "failure",
          location: "EmployeeController",
          method: "rebuildHierarchy",
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  handleErrorResponse(
    error: any,
    res: Response,
    notFoundMessage: string = infoMessages.employeeNotFound,
    forbiddenMessage: string = infoMessages.forBidden,
    badRequestMessage: string = infoMessages.unknownError
  ) {
    if (error instanceof NotFoundException) {
      return res
        .status(statusCode.notFound)
        .json(
          createErrorResponse(
            statusCode.notFound,
            error.message || notFoundMessage
          )
        );
    } else if (error instanceof ForbiddenException) {
      return res
        .status(statusCode.forbidden)
        .json(
          createErrorResponse(
            statusCode.forbidden,
            error.message || forbiddenMessage
          )
        );
    } else {
      return res
        .status(statusCode.badRequest)
        .json(
          createErrorResponse(
            statusCode.badRequest,
            error instanceof Error ? error.message : badRequestMessage
          )
        );
    }
  }

  /**
   * Reactivates a previously deactivated employee.
   */
  @Post(":employeeId/activate")
  async activateEmployee(
    @Res() res: Response,
    @Param("employeeId") employeeId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeController",
          method: "activateEmployee",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      await this.employeeService.activateEmployee(+employeeId);
      return res
        .status(200)
        .json(createResponse(HttpStatus.OK, "Employee activated successfully"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeController",
          method: "activateEmployee",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return this.handleErrorResponse(error, res);
    }
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(req: any): string {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'EmployeeController',
        method: 'extractIpAddress',
        messageData: 'method invoked',
      }),
    });
    return (
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown"
    );
  }
}
