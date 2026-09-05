import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Req,
  Put,
  Query,
  NotFoundException,
  ForbiddenException,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import {
  createContactSwaggerMetadata,
  getContactSwaggerMetadata,
  deleteContactSwaggerMetadata,
  updateContactSwaggerMetadata,
  getContactsSwaggerMetadata,
  getContactListSwaggerMetadata
} from "./contact.swagger";
import {
  createResponse,
  createErrorResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  GetAllContactsDto,
  GetContactListDto,
} from "./dto/get-all-contact.dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { ApplyMasking, ResponseMaskingInterceptor } from "../../../../service-lib/src/lib/field-masking";
/**
 * Controller for handling contact-related requests.
 */
@Controller("contact")
export class ContactController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly contactService: ContactService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Create a new contact. */
  @Post()
  @createContactSwaggerMetadata()
  async addContact(
    @Body() contact: CreateContactDto,
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
          location: "ContactController",
          method: "addContact",
          messageData: "method invoked",
        }),
      });
      const contactData = await this.contactService.addContact(contact, userId);
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.contactCreated,
            contactData
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(statusCode.notFound)
          .json(
            createErrorResponse(
              statusCode.notFound,
              error.message || errorMessages.contactNotFound
            )
          );
      } else if (error instanceof ForbiddenException) {
        return res
          .status(statusCode.forbidden)
          .json(
            createErrorResponse(
              statusCode.forbidden,
              error.message || errorMessages.contactCreationForbidden
            )
          );
      } else {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: parseInt(req?.headers?.userid as string),
            status: "failure",
            location: "ContactController",
            method: "addContact",
            messageData: error,
          }),
        });
        return res
          .status(statusCode.badRequest)
          .json(
            createErrorResponse(
              statusCode.badRequest,
              error instanceof Error
                ? error.message
                : errorMessages.unknownError
            )
          );
      }
    }
  }

  @Post("inception-create-contact")
  async inceptionCreateContact(
    @Body() contacts: CreateContactDto[],
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
          location: "ContactController",
          method: "inceptionCreateContact",
          messageData: "method invoked",
        }),
      });
      const results = await this.contactService.inceptionCreateContact(
        contacts,
        userId
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.contactCreated, results)
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message ?? errorMessages.contactNotFound,
        error.message ?? errorMessages.contactCreationForbidden,
        errorMessages.contactCreationFailed
      );
    }
  }

  // Get a list of contacts with pagination and search.
  // NOTE: @Res() is intentionally NOT used here. NestJS interceptors (including
  // ResponseMaskingInterceptor) are bypassed when @Res() + res.json() is used
  // because the response is sent directly to Express before the interceptor's
  // map() operator runs. Returning the value lets the interceptor process it.
  @Get("contactList")
  @getContactListSwaggerMetadata()
  @ApplyMasking('contact')
  @UseInterceptors(ResponseMaskingInterceptor)
  async fetchContactList(
    @Query() query: GetContactListDto,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      const { page, limit, search, contactRecordTypeLid, entityIds } = query;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "ContactController",
          method: "fetchContactList",
          messageData: "method invoked",
        }),
      });
      const contactList = await this.contactService.fetchContactList(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        contactRecordTypeLid,
        entityIds,
        userId
      );
      return createResponse(
        statusCode.ok,
        successMessage.contactListRetrieved,
        contactList
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ContactController",
          method: "fetchContactList",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /** Retrieve paginated contacts.
   * NOTE: @Res() is intentionally NOT used here — see fetchContactList for details.
   */
  @Get()
  @getContactsSwaggerMetadata()
  @ApplyMasking('contact')
  @UseInterceptors(ResponseMaskingInterceptor)
  async getContactList(
    @Query() getAllContacts: GetAllContactsDto,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "ContactController",
          method: "getContactList",
          messageData: "method invoked",
        }),
      });
      const {
        page,
        limit,
        contactRecordTypeLid,
        sort,
        search,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        ownerId,
        viewBy,
      } = getAllContacts;
      const contactListData = await this.contactService.getContactList(
        Number(page),
        Number(limit),
        userId,
        Number(contactRecordTypeLid),
        search,
        sort,
        searchBy,
        field,
        from,
        to || null,
        period,
        month,
        financialYear,
        ownerId,
        viewBy
      );
      return createResponse(
        statusCode.ok,
        successMessage.contactListRetrieved,
        contactListData
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ContactController",
          method: "getContactList",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /** Retrieve a single contact by ID.*/
  @Get(":id")
  @getContactSwaggerMetadata()
  async getContactById(
    @Res() res: Response,
    @Param("id") contactId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "ContactController",
          method: "getContactById",
          payload: { contactId },
          messageData: "method invoked",
        }),
      });
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "Contact",
        "view",
        contactId
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
        "Contact",
        "edit",
        contactId
      );
      const contactData = await this.contactService.getContactById(contactId);
      const response = { ...contactData, editable: editValidation };
      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.contactDetails, response)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "ContactController",
          method: "getContactById",
          payload: { contactId },
          messageData: error,
        }),
      });
      return res
        .status(statusCode.notFound)
        .json(
          createErrorResponse(
            statusCode.notFound,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Update a contact by ID. */
  @Put(":id")
  @updateContactSwaggerMetadata()
  async updateContactById(
    @Res() res: Response,
    @Req() req: Request,
    @Param("id") contactId: number,
    @Body() updateContact: UpdateContactDto
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "ContactController",
          method: "updateContactById",
          payload: { contactId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "contact",
        "edit",
        contactId
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
      const contactData = await this.contactService.updateContactById(
        contactId,
        updateContact,
        userId
      );
      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.contactUpdated,
            contactData
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(statusCode.notFound)
          .json(
            createErrorResponse(
              statusCode.notFound,
              error.message || errorMessages.contactNotFound
            )
          );
      } else if (error instanceof ForbiddenException) {
        return res
          .status(statusCode.forbidden)
          .json(
            createErrorResponse(
              statusCode.forbidden,
              error.message || errorMessages.contactUpdateForbidden
            )
          );
      } else {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: parseInt(req?.headers?.userid as string),
            status: "failure",
            location: "ContactController",
            method: "updateContactById",
            payload: { contactId },
            messageData: error,
          }),
        });
        return res
          .status(statusCode.badRequest)
          .json(
            createErrorResponse(
              statusCode.badRequest,
              error instanceof Error
                ? error.message
                : errorMessages.unknownError
            )
          );
      }
    }
  }

  /** Remove a contact by ID. */
  @Delete(":id")
  @deleteContactSwaggerMetadata()
  async deleteContactById(
    @Req() req: Request,
    @Res() res: Response,
    @Param("id") contactId: number
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "ContactController",
          method: "deleteContactById",
          payload: { contactId },
          messageData: "method invoked",
        }),
      });
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "contact",
        "edit",
        contactId
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
      const contactData = await this.contactService.deleteContactById(
        contactId
      );
      if (contactData) {
        return res
          .status(statusCode.ok)
          .json(createResponse(statusCode.ok, successMessage.contactDeleted));
      } else {
        return res
          .status(statusCode.notFound)
          .json(
            createErrorResponse(
              statusCode.notFound,
              errorMessages.contactDeletionFailed
            )
          );
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "ContactController",
          method: "deleteContactById",
          payload: { contactId },
          messageData: error,
        }),
      });
      return res
        .status(statusCode.badRequest)
        .json(
          createErrorResponse(
            statusCode.badRequest,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }
}
