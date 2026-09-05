import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import * as AWS from "aws-sdk";
import type { Request } from "express";
import { Brackets, DataSource, EntityManager } from "typeorm";
import {
  COMPANY_STATUS_KEY,
  PRIORITY_LOOK_UP,
  GROUP_COMPANY,
  sortRealtionsMapping,
  COMPANY_MAP_TABLE_DELETE_FIELDS,
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
  NOTIFICATION_IN_APP,
  NOTIFICATION_EMAIL,
  COMPANY_SUM_INSURED_NOTIFICATION_THRESHOLD,
  NOTIFICATION_EVENT_TYPES,
  DEFAULT_VALUES,
  ATTRIBUTE_FIELD_MAP,
} from "../../../../../../apps/services/service-lib/src/lib/constants";
import {
  companyNonEditableFields,
  EMPLOYEE_USER_ID,
  LOOK_UP_DATA,
  MAPPED_DATA_DELETION,
  MASTER_DATA,
  ORGANISATION_ID,
  TABLE_NAMES,
  USER_EMAIL,
  DEFAULT_EMAIL_KEY,
  DEFAULT_PHONE_KEY,
  ACTIVITY_KEY,
  DEFAULT_OPPORTUNITY_ACTIVITY_MAP_ENTITY_NAME,
  MEETING_NAME,
  ENTITY_NAME,
  OWNER_TYPES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  SENSITIVE_FIELD_NAMES,
  ADDRESS_TYPE_POLICY_LOCATION,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { LookUpRepository } from "../look-up/look-up.repository";
import { CompanyRepository } from "./company.repository";
import { CompanyDetailsDto } from "./dto/company-detail.dto";
import {
  CreateCompanyAddressDto,
  CreateCompanyDto,
} from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { UpdateCompanyReminderConfigDto } from "./dto/update-company-reminder-config.dto";
import { QuickCreatePayloadDto } from "./dto/create-assistance.dto";
import type { CompanyFieldUpdateDto } from "./dto/company-bulk-update.dto";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { AddressService } from "../address/address.service";
import { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity";
import { CompanyPolicyConfigurationLocation } from "../../../../service-lib/src/lib/entities/company-policy-configuration-location.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { MigrationDataSourceService } from "../../../../service-lib/src/lib/migration-datasource.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { normalizePolicyLocationCode } from "../../../../service-lib/src/lib/utils/policy-location.util";
import { ContactService } from "../contact/contact.service";
import { EmployeeService } from "../employee/employee.service";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { FieldEncryptionService } from "../../../../service-lib/src/lib/field-encryption/services/field-encryption.service";
import { decryptSelectedFields } from "../../../../service-lib/src/lib/field-encryption/utils/decrypt.util";
import { User } from "../../../../service-lib/src/lib/entities/user";

// ---------------------------------------------------------------------------
// Company Migration source config. MIGRATION_DB_URL (see
// MigrationDataSourceService in service-lib) points this at the client's
// database; the 4 view names below identify what to read once connected.
// Mirrors the equivalent config in policy-service's PolicyService.
// ---------------------------------------------------------------------------
const COMPANY_MIGRATION_VIEW_COMPANY =
  process.env.COMPANY_MIGRATION_VIEW_COMPANY || "vw_company_migration_company_source";
const COMPANY_MIGRATION_VIEW_CONTACT =
  process.env.COMPANY_MIGRATION_VIEW_CONTACT || "vw_company_migration_contact_source";
const COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS =
  process.env.COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS || "vw_company_migration_company_address_source";
const COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS =
  process.env.COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS || "vw_company_migration_contact_address_source";
const COMPANY_MIGRATION_ORDER_COLUMN = process.env.COMPANY_MIGRATION_ORDER_COLUMN || "row_seq";
const COMPANY_MIGRATION_BATCH_SIZE = Number(process.env.COMPANY_MIGRATION_BATCH_SIZE) || 100;
const COMPANY_MIGRATION_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
// migration_log.system — identifies the SOURCE system this migrated data
// comes from (not our own service name): both policy and company migration
// data originate from the client's finops system.
const MIGRATION_LOG_SYSTEM = "finops";
// Postgres advisory lock key guarding migrateCompanies() against overlapping
// runs — same reasoning as POLICY_MIGRATION_ADVISORY_LOCK_KEY in
// policy-service's policy.service.ts. Different constant so the two
// services' locks never collide with each other.
const COMPANY_MIGRATION_ADVISORY_LOCK_KEY = 861234502;

interface CompanyMigrationBatchResult {
  batchNumber: number;
  groupsRead: number;
  validGroups: number;
  errorGroups: number;
  status: "completed" | "failed";
  error?: string;
  durationMs?: number;
}

interface CompanyMigrationResult {
  migrationRunId: string;
  totalGroups: number;
  totalBatches: number;
  validGroups: number;
  errorGroups: number;
  insertedIntoCompany: number;
  insertedIntoContact: number;
  insertedIntoAddress: number;
  insertedIntoCompanyAddress: number;
  insertedIntoContactAddress: number;
  insertedIntoCompanyContactMap: number;
  errorLogTable: string;
  batches: CompanyMigrationBatchResult[];
  rawDataCsvKeys: {
    company: string | null;
    contact: string | null;
    companyAddress: string | null;
    contactAddress: string | null;
  };
  errorCsvKey: string | null;
  successCsvKey: string | null;
}

@Injectable()
export class CompanyService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly migrationS3: AWS.S3;
  private readonly migrationRepoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  constructor(
    private readonly dataSource: DataSource,
    private readonly companyRepository: CompanyRepository,
    private readonly lookUpRepository: LookUpRepository,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly addressService: AddressService,
    private readonly notificationUtils: NotificationUtils,
    private readonly traceIdService: TraceIdService,
    private readonly contactService: ContactService,
    private readonly employeeService: EmployeeService,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly fieldEncryptionService: FieldEncryptionService,
    private readonly migrationDataSourceService: MigrationDataSourceService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
    if (this.migrationRepoMode === "AWS") {
      AWS.config.update({ region: process.env.S3_AWS_REGION });
      this.migrationS3 = new AWS.S3();
    }
  }

  // Looks up the associate CRM's reporting manager so it can be stamped onto
  // the company record alongside associateCrmId.
  private async resolveAssociateCrmMgrId(
    entityManager: EntityManager,
    associateCrmId?: number
  ): Promise<number | null | undefined> {
    if (!associateCrmId) {
      return undefined;
    }
    const associateCrmUser = await entityManager.findOne(User, {
      where: { userId: associateCrmId },
    });
    return associateCrmUser?.reportingUserId ?? null;
  }

  async refreshCompanyAnalytics(userId: number): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyService",
        method: "refreshCompanyAnalytics",
        messageData: "method invoked",
      }),
    });
    try {
      await this.companyRepository.refreshCompanyAnalytics();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "refreshCompanyAnalytics",
          messageData: "company analytics refreshed",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyService",
          method: "refreshCompanyAnalytics",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getCompanyReminderConfig(companyId: number) {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.getCompanyReminderConfig(
      companyId
    );

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    return {
      companyId: company.id,
      installmentReminderDays: company.installmentReminderDays ?? [],
      policyExpiryReminderDays: company.policyExpiryReminderDays ?? [],
      opportunityCloseToExpiryReminderDays:
        company.opportunityCloseToExpiryReminderDays ?? [],
    };
  }

  async updateCompanyReminderConfig(
    companyId: number,
    payload: UpdateCompanyReminderConfigDto,
    userId?: number
  ) {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const savedCompany = await this.companyRepository.updateCompanyReminderConfig(
      companyId,
      payload,
      userId
    );

    if (!savedCompany) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    return {
      companyId: savedCompany.id,
      installmentReminderDays: savedCompany.installmentReminderDays ?? [],
      policyExpiryReminderDays: savedCompany.policyExpiryReminderDays ?? [],
      opportunityCloseToExpiryReminderDays:
        savedCompany.opportunityCloseToExpiryReminderDays ?? [],
    };
  }

  async createCompany(companyDto: CreateCompanyDto, userId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyService",
        method: "createCompany",
        payload: { companyDto, userId },
        messageData: "method invoked",
      }),
    });
    try {
      const response = await this.dataSource.transaction(
        async (entityManager) => {
          // Check for duplicate company name (case-insensitive)
          const existingCompany =
            await this.companyRepository.findCompanyByName(
              companyDto.companyName,
              Number(companyDto.countryId)
            );
          if (existingCompany) {
            throw new Error(
              `A company with the name ${companyDto.companyName} already exists.`
            );
          }
          await this.lookUpValidation.validateDynamicLookupValues(
            companyDto,
            LOOK_UP_DATA
          );
          await this.masterValidation.validateMasterIds(
            companyDto,
            MASTER_DATA
          );

          // Create the company
          const companyData = companyDto;
          const companyStatus = await this.lookUpRepository.findByLookUpKey(
            COMPANY_STATUS_KEY.ACTIVE
          );
          if (!companyStatus || !companyStatus[0].id) {
            throw new NotFoundException(
              `Company status with key ${COMPANY_STATUS_KEY.ACTIVE} not found`
            );
          }
          const associateCrmMgrId = await this.resolveAssociateCrmMgrId(
            entityManager,
            companyData.associateCrmId
          );
          const company = await this.companyRepository.createCompany(
            entityManager,
            {
              ...companyData,
              statusLid: companyDto.statusLid ?? companyStatus[0].id,
              annualPremium: Number(companyData.annualPremium ?? 0),
              ...(associateCrmMgrId !== undefined ? { associateCrmMgrId } : {}),
            }
          );
          //check the priority company or not for sending the in app notifications
          const isPriorityCompany =
            await this.companyRepository.isPriorityCompany(
              entityManager,
              company.priorityLid
            );
          if (isPriorityCompany) {
            const url = `${ENV.CLIENT_SERVER_URL}companies/${company.id}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.PRIORITY_COMPANY_CREATION,
              url,
              companyDto?.createdBy || userId,
              true,
              false
            );
          }

          if (
            companyDto.annualPremium &&
            companyDto.annualPremium >
              COMPANY_SUM_INSURED_NOTIFICATION_THRESHOLD
          ) {
            const url = `${ENV.CLIENT_SERVER_URL}companies/${company.id}`;
            const userOrganisationIds =
              await this.companyRepository.getEntityTableMapIds(
                TABLE_NAMES.USER,
                ORGANISATION_ID,
                { userId: userId }
              );
            const employeeIds =
              await this.companyRepository.getEntityTableMapIds(
                TABLE_NAMES.EMPLOYEE,
                EMPLOYEE_USER_ID,
                { organisationId: userOrganisationIds[0] }
              );
            for (let employeeId of employeeIds) {
              await this.sendNotification(
                NOTIFICATION_EVENT_TYPES.HIGH_PREMIUM_COMPANY_CREATION,
                url,
                employeeId,
                true,
                true
              );
            }
          }

          // Create GST details
          if (companyDto.gstDetails && companyDto.gstDetails.length > 0) {
            for (const gst of companyDto.gstDetails) {
              await this.companyRepository.createGstDetail(entityManager, {
                ...gst,
                company,
                entityType: "COMPANY",
                statusLid: 1,
                createdBy: userId,
                updatedBy: userId,
              });
            }
          }

          // Create multiple addresses if provided
          if (companyData.addresses && companyData.addresses.length) {
            await this.addCompanyAddress(
              entityManager,
              companyData.addresses,
              company.id,
              company.createdBy,
              companyData.countryId
            );
            await this.syncCompanyPolicyConfigurationLocations(
              entityManager,
              company.id
            );
          } else {
            throw new Error(errorMessages.companyAddressRequired);
          }

          const companyDetailsDto = companyDto.companyDetails;
          // Create company details
          if (companyDetailsDto) {
            companyDetailsDto.createdBy = company.createdBy;
            companyDetailsDto.updatedBy = company.updatedBy;
            await this.companyRepository.createCompanyDetails(entityManager, {
              ...companyDetailsDto,
              company,
            });
          }
          const groupCompanyLookup = await this.lookUpRepository.getLookUpById(
            companyData.groupCompanyLid
          );
          const isGroupCompany =
            groupCompanyLookup?.data?.lookUpName === GROUP_COMPANY.Name &&
            groupCompanyLookup?.data?.lookUpValueKey !== GROUP_COMPANY.keyValue;
          if (companyDto.groupCompanyMap && isGroupCompany) {
            await this.companyRepository.createGroupCompanyMap(entityManager, {
              ...companyDto.groupCompanyMap,
              company,
            });
          } else if (!companyDto.groupCompanyMap && isGroupCompany) {
            throw new NotFoundException("Group company map not found");
          }

          // Create company document mappings
          if (
            companyDto.companyDocMaps &&
            companyDto.companyDocMaps?.length > 0
          ) {
            for (const companyDocMap of companyDto.companyDocMaps) {
              if (!companyDocMap.documentId) {
                throw new Error(errorMessages.companyDocumentError);
              }
              await this.companyRepository.createCompanyDocMap(entityManager, {
                ...companyDocMap,
                company,
              });
            }
          }
          delete company.createdAt;
          delete company.updatedAt;
          delete company.deletedAt;
          delete company.createdBy;
          delete company.updatedBy;

          return { id: company.id };
        }
      );
      if (response.id !== undefined && response.id !== null) {
        const createdCompany = await this.companyRepository.getCompanyById(
          response.id,
          userId,
        );
        // Decrypt sensitive fields before returning
        decryptSelectedFields(this.fieldEncryptionService, createdCompany, [
          SENSITIVE_FIELD_NAMES.PAN_CARD_NUMBER,
        ]);
        return createdCompany;
      }
    } catch (error) {
      if ((error as Error).message.includes("Duplicate entry")) {
        throw new Error((error as Error).message); // Propagate the duplicate entry error
      }
      throw error; // Re-throw other errors
    }
  }

  // Retrieves a company by its unique identifier.
  async getCompanyById(id: string, userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "getCompanyById",
          messageData: "method invoked",
        }),
      });
      const company = await this.companyRepository.getCompanyById(
        Number(id),
        userId
      );
      if (!company) {
        throw new NotFoundException(errorMessages.companyNotFound);
      }
      // Decrypt sensitive fields before returning
      decryptSelectedFields(this.fieldEncryptionService, company, [
        SENSITIVE_FIELD_NAMES.PAN_CARD_NUMBER,
      ]);
      const kpiDetails = await this.companyRepository.getCompanyProfile(
        Number(id)
      );
      return { ...company, kpiDetails };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyService",
          method: "getCompanyById",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  // Deletes a company by its unique identifier.
  async deleteCompanyById(id: string): Promise<boolean> {
    try {
      // Check if the company exists
      // const company = await this.companyRepository.getCompanyById(Number(id));
      const company = null;
      if (!company) {
        throw new Error(`Company with ID ${id} does not exist`);
      }

      // Proceed with the soft delete
      const deleteResult = await this.companyRepository.deleteByCompanyId(id);
      return (deleteResult.affected ?? 0) > 0;
    } catch (error) {
      throw new Error(
        (error as Error).message || "Failed to delete company by ID"
      );
    }
  }

  // Retrieves a paginated list of companies based on the provided parameters.
  async listCompanies(
    page: number,
    limit: number,
    search: string,
    sort: string,
    loggedInUserId: number,
    searchBy: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number,
    ownerId?: number,
    viewBy?: "manager" | "team"
  ) {
    try {
      const searchParams = mapSearchParams(search);
      ownerId = ownerId ? Number(ownerId) : Number(loggedInUserId);
      let ownerScopeCondition: Brackets | undefined;
      if (ownerId) {
        let userIdsList: number[] = [];
        if (!viewBy || viewBy === OWNER_TYPES.TEAM) {
          const users = await this.employeeService.getEmployeeHierarchyByUserId(
            ownerId
          );
          userIdsList = users?.map((user) => user.userId) || [];
        } else if (viewBy === OWNER_TYPES.MANAGER) {
          userIdsList = [ownerId];
        }
        // A company is visible if its leadCrm falls in the resolved owner
        // hierarchy, OR the caller is the exact assigned account manager /
        // associate CRM (no hierarchy rollup for those two fields).
        ownerScopeCondition = new Brackets((qb) => {
          qb.where("owner.userId IN (:...ownerScopeUserIds)", {
            ownerScopeUserIds: userIdsList.length ? userIdsList : [-1],
          })
            .orWhere("main.accountManager = :assignedUserId", {
              assignedUserId: ownerId,
            })
            .orWhere("main.associateCrmId = :assignedUserId", {
              assignedUserId: ownerId,
            });
        });
      }
      const organisationIdParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
      );
      const orgId = (
        organisationIdParam?.searchValue as number[] | undefined
      )?.[0];
      if (orgId === 0) {
        const organisationIdNew =
          await this.companyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
            { id: orgId }
          );

        const lookupCriteria =
          organisationIdNew.length === 0
            ? { parentOrganisationId: orgId }
            : { id: orgId };

        const organisationIds =
          await this.companyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
            lookupCriteria
          );
        const idx = searchParams.findIndex(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
        );
        if (idx !== -1) {
          searchParams[idx].searchValue = organisationIds;
        }
      }

      const sortParams = mapSortParams(sort, ENTITY_NAME.COMPANY.toUpperCase());
      const companies = await this.companyRepository.findAllCompanyList(
        page,
        limit,
        searchParams,
        sortParams,
        ownerId,
        searchBy,
        field,
        fromDate,
        toDate,
        period,
        timeFilter,
        financialYear,
        ownerScopeCondition
      );
      companies.data = companies.data.map((company) => {
        const contacts = company?.companyContactMaps
          ?.map((map) => map.contact)
          .filter(Boolean);
        return {
          ...company,
          contacts,
        };
      });
      return companies;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "listCompanies",
          messageData: error,
        }),
      });
      throw new Error(errorMessages.companyListFailed);
    }
  }

  // Updates a company's details by its ID.
  async updateCompany(companyId: string, companyDto: UpdateCompanyDto) {
    try {
      // Pre-flight: if the incoming payload would remove or retype any of the
      // company's Policy Location addresses, and any of the company's policies
      // currently has enablePolicyLocations = true, reject BEFORE any DB
      // mutation happens. Some downstream helpers (addressService,
      // deleteEntityTableMapIds) use repositories that don't honour the outer
      // dataSource.transaction wrapper, so a late-stage throw cannot roll
      // their writes back. The check below guarantees atomicity for the
      // toggle-guard rule regardless of those helpers.
      await this.assertPolicyLocationRemovalAllowed(
        Number(companyId),
        companyDto
      );

      const response = await this.dataSource.transaction(
        async (entityManager) => {
          const response: any = {};
          const userId = companyDto.updatedBy;
          const { companyDetails, ...companyData } = companyDto;
          if (companyData) {
            await this.lookUpValidation.validateDynamicLookupValues(
              companyData,
              LOOK_UP_DATA
            );
            await this.masterValidation.validateMasterIds(
              companyData,
              MASTER_DATA
            );
            const invalidFields = Object.keys(companyData).filter(
              (key) =>
                Array.isArray(companyNonEditableFields) &&
                companyNonEditableFields.includes(key)
            );

            if (invalidFields.length > 0) {
              throw new ForbiddenException(
                createErrorResponse(
                  HttpStatus.FORBIDDEN,
                  `The following fields are non-editable: ${invalidFields.join(
                    ", "
                  )}`
                )
              );
            }
            const associateCrmMgrId = await this.resolveAssociateCrmMgrId(
              entityManager,
              companyData.associateCrmId
            );
            const updatedCompany = await this.companyRepository.updateCompany(
              entityManager,
              companyId,
              {
                ...companyData,
                ...(associateCrmMgrId !== undefined
                  ? { associateCrmMgrId }
                  : {}),
              }
            );
            if (!updatedCompany) {
              throw new NotFoundException(errorMessages.companyNotFound);
            } else {
              const groupCompanyLookup =
                await this.lookUpRepository.getLookUpById(
                  updatedCompany.groupCompanyLid
                );
              if (
                groupCompanyLookup?.data?.lookUpName === GROUP_COMPANY.Name &&
                groupCompanyLookup?.data?.lookUpValueKey ===
                  GROUP_COMPANY.keyValue
              ) {
                await this.companyRepository.deleteGroupCompanyMap(
                  entityManager,
                  Number(companyId)
                );
                companyData.groupCompanyMap = undefined;
              }
              delete updatedCompany.createdAt;
              delete updatedCompany.updatedAt;
              delete updatedCompany.createdBy;
              delete updatedCompany.updatedBy;
              delete updatedCompany.deletedAt;
            }
            response.company = updatedCompany;
          }

          if (companyData.gstDetails) {
            const existingStateGstIds =
              await this.companyRepository.getEntityTableMapIds(
                COMPANY_MAP_TABLE_DELETE_FIELDS.STATE_GST_DETAILS,
                COMPANY_MAP_TABLE_DELETE_FIELDS.ID,
                { companyId: companyId }
              );
            if (companyData.gstDetails.length > 0) {
              const updatedGstDetails = [];
              for (const gst of companyData.gstDetails) {
                if (gst.id) {
                  const index = existingStateGstIds.indexOf(gst.id);
                  if (index !== -1) {
                    existingStateGstIds.splice(index, 1);
                  }
                  // Ensure the GST detail belongs to the correct company
                  gst.companyId = companyId; // Ensure the company ID is set
                  gst.entityType = "COMPANY";
                  gst.statusLid = 1;
                  gst.updatedBy = userId;
                  // Update existing GST detail
                  const updatedGst =
                    await this.companyRepository.updateGstDetail(
                      entityManager,
                      gst
                    );
                  delete updatedGst.createdAt;
                  delete updatedGst.updatedAt;
                  delete updatedGst.deletedAt;
                  updatedGstDetails.push(updatedGst);
                } else {
                  gst.companyId = companyId;
                  gst.entityType = "COMPANY";
                  gst.statusLid = 1;
                  gst.createdBy = userId;
                  gst.updatedBy = userId;
                  // Create new GST detail
                  const createdGst =
                    await this.companyRepository.createGstDetail(
                      entityManager,
                      gst
                    );
                  delete createdGst.createdAt;
                  delete createdGst.updatedAt;
                  delete createdGst.deletedAt;
                  updatedGstDetails.push(createdGst);
                }
              }
              response.gstDetails = updatedGstDetails;
            }
            await this.companyRepository.deleteEntityTableMapIds(
              COMPANY_MAP_TABLE_DELETE_FIELDS.STATE_GST_DETAILS,
              existingStateGstIds,
              COMPANY_MAP_TABLE_DELETE_FIELDS.ID,
              MAPPED_DATA_DELETION.SOFT_DELETE
            );
          }

          if (companyData.addresses) {
            const existingCompanyAddressIds =
              await this.companyRepository.getEntityTableMapIds(
                COMPANY_MAP_TABLE_DELETE_FIELDS.COMPANY_ADDRESS,
                COMPANY_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
                { company: { id: companyId } }
              );
            if (companyData.addresses.length > 0) {
              const updateAddresses = [];
              const createAddresses = [];
              const addressIdsToUpdate = [];
              for (const address of companyData.addresses) {
                const { id: addressId, ...addressData } = address;
                if (addressId) {
                  const index = existingCompanyAddressIds.indexOf(addressId);
                  if (index !== -1) {
                    existingCompanyAddressIds.splice(index, 1);
                  }

                  // Collect update address data
                  addressIdsToUpdate.push(addressId);
                  updateAddresses.push({ addressId, addressData });
                } else {
                  // Collect create address data
                  addressData.createdBy = userId;
                  addressData.updatedBy = userId;
                  createAddresses.push(addressData);
                }
              }
              // Retrieve all existing address IDs of the company
              const existingAddresses = await entityManager.find(
                CompanyAddress,
                {
                  where: { company: { id: Number(companyId) } },
                  relations: ["address"],
                }
              );
              const existingAddressIds = existingAddresses.map(
                (companyAddress) => companyAddress.address.id
              );
              // Validate received address IDs against existing address IDs
              const invalidIds = addressIdsToUpdate?.filter(
                (id) => !existingAddressIds.includes(id)
              );
              if (invalidIds.length > 0) {
                throw new NotFoundException(
                  `Address with ID(s) ${invalidIds.join(
                    ", "
                  )} not found for company ID ${companyId}`
                );
              }
              if (updateAddresses.length > 0) {
                await Promise.all(
                  updateAddresses.map(async ({ addressId, addressData }) => {
                    const addressDetails = await entityManager.findOne(City, {
                      where: { id: addressData.cityId },
                    });
                    if (!addressDetails) {
                      throw new NotFoundException(
                        `City with ID ${addressData.cityId} not found`
                      );
                    }
                    addressData.stateId = addressDetails.stateId;
                    await this.addressService.updateAddressById(
                      addressId,
                      addressData,
                      userId
                    );
                  })
                );
              }
              if (createAddresses.length > 0) {
                await this.addCompanyAddress(
                  entityManager,
                  createAddresses,
                  Number(companyId),
                  userId,
                  response.company.countryId
                );
              }
            }
            await this.companyRepository.deleteEntityTableMapIds(
              COMPANY_MAP_TABLE_DELETE_FIELDS.COMPANY_ADDRESS,
              existingCompanyAddressIds,
              COMPANY_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
              MAPPED_DATA_DELETION.MAP_REMOVED
            );
          }
          // Auto-sync company_policy_configuration_location with company
          // addresses whose addressType is "Policy Location".
          await this.syncCompanyPolicyConfigurationLocations(
            entityManager,
            Number(companyId)
          );

          if (companyDetails && Object.keys(companyDetails).length > 0) {
            const updatedCompanyDetails =
              await this.companyRepository.updateCompanyDetails(
                entityManager,
                companyId,
                Number(userId),
                companyDetails
              );
            if (updatedCompanyDetails) {
              delete updatedCompanyDetails.createdAt;
              delete updatedCompanyDetails.updatedAt;
              delete updatedCompanyDetails.createdBy;
              delete updatedCompanyDetails.updatedBy;
              delete updatedCompanyDetails.deletedAt;
              response.companyDetails = updatedCompanyDetails;
            }
          }

          if (companyData.groupCompanyMap) {
            companyData.groupCompanyMap.companyId = Number(companyId);
            const updatedGroupCompanyMap =
              await this.companyRepository.createOrUpdateGroupCompanyMap(
                entityManager,
                companyData.groupCompanyMap
              );
            response.groupCompanyMap = updatedGroupCompanyMap;
          }

          // Create company document mappings
          if (
            companyData.companyDocMaps &&
            companyData.companyDocMaps.length > 0
          ) {
            const updatedCompanyDocMaps = [];
            for (const companyDocMap of companyData.companyDocMaps) {
              companyDocMap.companyId = Number(companyId);
              const updatedCompanyDocMap =
                await this.companyRepository.createOrUpdateCompanyDocMap(
                  entityManager,
                  companyDocMap
                );
              updatedCompanyDocMaps.push(updatedCompanyDocMap);
            }
            response.companyDocMaps = updatedCompanyDocMaps;
          }
          return { id: Number(companyId) };
        }
      );
      if (response.id !== undefined && response.id !== null) {
        const updatedCompany = await this.companyRepository.getCompanyById(
          response.id,
          companyDto.updatedBy,
        );
        // Decrypt sensitive fields before returning
        decryptSelectedFields(this.fieldEncryptionService, updatedCompany, [
          SENSITIVE_FIELD_NAMES.PAN_CARD_NUMBER,
        ]);
        return updatedCompany;
      }
    } catch (error) {
      if ((error as Error).message.includes("Duplicate entry")) {
        throw new Error((error as Error).message); // Propagate the duplicate entry error
      }
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Bulk update Companies with optimized batching for large datasets.
   * Processes records in batches of 1000 to handle 10,000+ records efficiently.
   * Basic type checks & non-editable field enforcement only (simple validation option 1).
   * Upstream BulkEditValidator is expected to have performed request-level validation.
   */
  async bulkUpdateCompanies(
    recordIds: number[],
    fieldUpdates: any,
    userId: number,
    selectedAll: boolean = false,
    excludedIds: number[] = [],
    selectedFilterValues: Record<string, any> = {}
  ): Promise<{
    totalRecords: number;
    successCount: number;
    failureCount: number;
    errors: {
      recordId: number;
      fieldName: string;
      errorCode: string;
      errorMessage: string;
    }[];
    affectedRecords: number[];
    processingDuration: number;
    leadCrmUserList: any;
    accountManagerUserList: any;
  }> {
    try {
      const start = Date.now();
      let updatedCompanyRecord;
      const errors: {
        recordId: number;
        fieldName: string;
        errorCode: string;
        errorMessage: string;
      }[] = [];
      const affectedRecords: number[] = [];

      // Determine final record IDs based on selectedAll flag
      let finalRecordIds: number[] = [];

      if (selectedAll) {
        // Fetch all company IDs based on filter values
        try {
          if (
            selectedFilterValues.viewBy &&
            selectedFilterValues.viewBy.value == OWNER_TYPES.TEAM
          ) {
            const users =
              await this.employeeService.getEmployeeHierarchyByUserId(
                Number(selectedFilterValues.ownerId.value)
              );
            const userIdsList = users?.map((user: any) => user.userId) || [];
            selectedFilterValues["userIdsList"] = userIdsList;
          }

          finalRecordIds = await this.companyRepository.getFilteredCompanyIds(
            selectedFilterValues,
            selectedFilterValues?.ownerId?.value
              ? Number(selectedFilterValues.ownerId.value)
              : userId
          );

          // Exclude the IDs that user doesn't want to update
          if (excludedIds?.length) {
            finalRecordIds = finalRecordIds.filter(
              (id) => !excludedIds.includes(id)
            );
          }

          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "CompanyService",
              method: "bulkUpdateCompanies",
              messageData: `Selected all mode: Found ${finalRecordIds.length} companies after applying filters and exclusions`,
            }),
          });
        } catch (error) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyService",
              method: "bulkUpdateCompanies",
              messageData: `Failed to fetch filtered company IDs: ${
                (error as Error).message
              }`,
            }),
          });
          throw new BadRequestException(
            "Failed to fetch companies with selected filters"
          );
        }
      } else {
        // Use provided record IDs
        finalRecordIds = recordIds || [];
      }
      let leadCrmUserList, accountManagerUserList;
      leadCrmUserList = await this.companyRepository.getUsersByCompanyIds(
        finalRecordIds
      );
      accountManagerUserList =
        await this.companyRepository.getUsersByCompanyIdsFromAccountManager(
          finalRecordIds
        );
      if (!finalRecordIds?.length) {
        return {
          totalRecords: 0,
          successCount: 0,
          failureCount: 0,
          errors: [],
          affectedRecords: [],
          processingDuration: 0,
        };
      }

      const normalizeFieldName = (fieldName: string): string =>
        typeof fieldName !== "string"
          ? ""
          : fieldName
              .trim()
              .replace(/[\s_-]+(.)?/g, (_, chr: string) =>
                chr ? chr.toUpperCase() : ""
              )
              .replace(/^(.)/, (match) => match.toLowerCase());

      const normalizedUpdates = Object.entries(fieldUpdates || {}).map(
        ([fieldName, value]) => ({
          originalFieldName: fieldName,
          fieldName: normalizeFieldName(fieldName),
          value: value,
          operation: "set",
        })
      );

      if (!normalizedUpdates.length) {
        return {
          totalRecords: finalRecordIds.length,
          successCount: 0,
          failureCount: finalRecordIds.length,
          errors: finalRecordIds.map((recordId) => ({
            recordId,
            fieldName: "*",
            errorCode: "NO_UPDATES_PROVIDED",
            errorMessage: "No updates provided for bulk update",
          })),
          affectedRecords: [],
          processingDuration: 0,
        };
      }

      const BULK_EDITABLE_FIELDS = new Set([
        "leadCrm",
        "accountManager",
        "statusLid",
        "priorityLid",
      ]);
      const FIELD_PERSISTENCE_MAP: Record<string, string> = {
        leadCrm: "leadCrm",
        accountManager: "accountManager",
        status: "statusLid",
        priority: "priorityLid",
      };
      const LEGACY_FIELD_NAME_MAP: Record<string, string> = {
        leadCrm: "lead_crm",
        accountManager: "account_manager",
        statusLid: "statusLid",
        priorityLid: "priorityLid",
      };
      const NON_EDITABLE = new Set(
        Array.isArray(companyNonEditableFields) ? companyNonEditableFields : []
      );

      const BATCH_SIZE = 1000; // Process 1000 records per batch

      // Split records into batches for optimal processing
      const batches = [];
      for (let i = 0; i < finalRecordIds.length; i += BATCH_SIZE) {
        batches.push(finalRecordIds.slice(i, i + BATCH_SIZE));
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "bulkUpdateCompanies",
          messageData: `Start bulk update for ${finalRecordIds.length} companies (${normalizedUpdates.length} fields) in ${batches.length} batches of ${BATCH_SIZE}`,
        }),
      });

      // Process each batch in its own transaction for optimal performance
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStart = Date.now();

        try {
          await this.dataSource.transaction(async (entityManager) => {
            for (const companyId of batch) {
              try {
                // Minimal existence & field snapshot using common getEntityTableMapIds
                const existingId =
                  await this.companyRepository.getEntityTableMapIds(
                    "Company",
                    "id",
                    { id: companyId }
                  );
                if (!existingId || existingId.length === 0) {
                  errors.push({
                    recordId: companyId,
                    fieldName: "*",
                    errorCode: "NOT_FOUND",
                    errorMessage: "Company not found",
                  });
                  this.logger.warn({
                    level: "warn",
                    message: buildLogMessage({
                      traceId: this.traceIdService.traceId,
                      userId,
                      status: "failure",
                      location: "CompanyService",
                      method: "bulkUpdateCompanies",
                      messageData: `Company ${companyId} not found`,
                    }),
                  });
                  continue;
                }
                const mutation: Record<string, unknown> = {};
                for (const update of normalizedUpdates) {
                  const { fieldName, value, originalFieldName } = update;
                  if (!BULK_EDITABLE_FIELDS.has(fieldName)) {
                    errors.push({
                      recordId: companyId,
                      fieldName: originalFieldName,
                      errorCode: "FIELD_NOT_BULK_EDITABLE",
                      errorMessage: `Field '${originalFieldName}' is not bulk editable for company`,
                    });
                    this.logger.warn({
                      level: "warn",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "CompanyService",
                        method: "bulkUpdateCompanies",
                        messageData: `Field ${originalFieldName} not bulk editable for companyId ${companyId}`,
                      }),
                    });
                    continue;
                  }
                  const legacyFieldName = LEGACY_FIELD_NAME_MAP[fieldName];
                  const isNonEditable =
                    NON_EDITABLE.has(fieldName) ||
                    (legacyFieldName
                      ? NON_EDITABLE.has(legacyFieldName)
                      : false);
                  if (isNonEditable) {
                    errors.push({
                      recordId: companyId,
                      fieldName: originalFieldName,
                      errorCode: "FIELD_NON_EDITABLE",
                      errorMessage: `Field '${originalFieldName}' cannot be edited`,
                    });
                    this.logger.warn({
                      level: "warn",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "CompanyService",
                        method: "bulkUpdateCompanies",
                        messageData: `Field ${originalFieldName} non-editable for companyId ${companyId}`,
                      }),
                    });
                    continue;
                  }
                  const persistenceKey =
                    FIELD_PERSISTENCE_MAP[fieldName] || fieldName;
                  if (fieldName === "status" || fieldName === "priority") {
                    if (value === null || value === undefined) {
                      mutation[persistenceKey] = null;
                    } else if (typeof value !== "number") {
                      errors.push({
                        recordId: companyId,
                        fieldName: originalFieldName,
                        errorCode: "INVALID_TYPE",
                        errorMessage: `Field '${originalFieldName}' expects a number`,
                      });
                      this.logger.warn({
                        level: "warn",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "failure",
                          location: "CompanyService",
                          method: "bulkUpdateCompanies",
                          messageData: `Invalid type for ${originalFieldName} on companyId ${companyId}`,
                        }),
                      });
                      continue;
                    } else {
                      mutation[persistenceKey] = value;
                    }
                    continue;
                  }
                  mutation[persistenceKey] = value;
                }
                if (Object.keys(mutation).length === 0) {
                  this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                      traceId: this.traceIdService.traceId,
                      userId,
                      status: "success",
                      location: "CompanyService",
                      method: "bulkUpdateCompanies",
                      messageData: `No valid mutations for companyId ${companyId}`,
                    }),
                  });
                  continue;
                }
                mutation.updatedBy = String(userId);
                // Use common updateEntityTableMapIds for updating company data
                mutation.auditRefId = companyId; // maintain audit reference similar to single update path
                if (
                  mutation["leadCrm"] !== undefined &&
                  mutation["leadCrm"] !== null
                ) {
                  mutation["createdBy"] = Number(mutation["leadCrm"]);
                }
                try {
                  updatedCompanyRecord =
                    await this.companyRepository.updateEntityTableMapIds(
                      "Company",
                      mutation,
                      { id: companyId }
                    );
                } catch (updateErr) {
                  errors.push({
                    recordId: companyId,
                    fieldName: "*",
                    errorCode: "UPDATE_FAILED",
                    errorMessage:
                      updateErr instanceof Error
                        ? updateErr.message
                        : "Failed to update company",
                  });
                  this.logger.error({
                    level: "error",
                    message: buildLogMessage({
                      traceId: this.traceIdService.traceId,
                      userId,
                      status: "failure",
                      location: "CompanyService",
                      method: "bulkUpdateCompanies",
                      messageData: `Common update failed for companyId ${companyId}: ${
                        updateErr instanceof Error ? updateErr.message : "Error"
                      }`,
                    }),
                  });
                  continue;
                }
                if (updatedCompanyRecord.affected === 1) {
                  affectedRecords.push(companyId);
                }
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId,
                    status: "success",
                    location: "CompanyService",
                    method: "bulkUpdateCompanies",
                    messageData: `Updated companyId ${companyId}`,
                  }),
                });
              } catch (error: any) {
                errors.push({
                  recordId: companyId,
                  fieldName: "*",
                  errorCode: "EXCEPTION",
                  errorMessage:
                    error instanceof Error ? error.message : "Error",
                });
                this.logger.error({
                  level: "error",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId,
                    status: "failure",
                    location: "CompanyService",
                    method: "bulkUpdateCompanies",
                    messageData: `Exception for companyId ${companyId}: ${
                      error instanceof Error ? error.message : "Error"
                    }`,
                  }),
                });
              }
            }
          });

          const batchDuration = Date.now() - batchStart;
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "CompanyService",
              method: "bulkUpdateCompanies",
              messageData: `Batch ${batchIndex + 1}/${
                batches.length
              } completed in ${batchDuration}ms (${batch.length} records)`,
            }),
          });
        } catch (batchError) {
          // If entire batch fails, mark all records in batch as failed
          for (const companyId of batch) {
            errors.push({
              recordId: companyId,
              fieldName: "*",
              errorCode: "BATCH_TRANSACTION_FAILED",
              errorMessage: `Batch transaction failed: ${
                batchError instanceof Error ? batchError.message : "Batch error"
              }`,
            });
          }

          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyService",
              method: "bulkUpdateCompanies",
              messageData: `Batch ${batchIndex + 1}/${batches.length} failed: ${
                batchError instanceof Error ? batchError.message : "Batch error"
              }`,
            }),
          });
        }
      }
      const successCount = affectedRecords.length;
      const failureCount = finalRecordIds.length - successCount;
      const totalDuration = Date.now() - start;

      this.logger.log({
        level: failureCount > 0 ? "warn" : "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: failureCount > 0 ? "failure" : "success",
          location: "CompanyService",
          method: "bulkUpdateCompanies",
          messageData: `Bulk update completed: success=${successCount}, failure=${failureCount}, duration=${totalDuration}ms, batches=${batches.length}`,
        }),
      });
      finalRecordIds.map((recordId) => {
        leadCrmUserList.map((item) => {
          if (item.companyIds.includes(recordId) && fieldUpdates.leadCrm) {
            item.leadCrmCount = item.leadCrmCount + 1;
          }
          if (item.companyIds.includes(recordId) && fieldUpdates.priorityLid) {
            item.priorityCount = item.priorityCount + 1;
          }
        });
        accountManagerUserList.map((item) => {
          if (
            item.companyIds.includes(recordId) &&
            fieldUpdates.accountManager
          ) {
            item.accountManagerCount = item.accountManagerCount + 1;
          }
        });
      });
      leadCrmUserList.map((item) => item.companyIds && delete item.companyIds);
      accountManagerUserList.map(
        (item) => item.companyIds && delete item.companyIds
      );
      return {
        totalRecords: finalRecordIds.length,
        successCount,
        failureCount,
        errors,
        affectedRecords,
        processingDuration: totalDuration,
        leadCrmUserList,
        accountManagerUserList,
      };
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  /**
   * Queries managed Policy Location address ids for a company. A row counts
   * as "managed" only when its cpcl row, company_address mapping and
   * underlying address are all live AND the address's current type is
   * Policy Location. Used by both the pre-flight check and the sync helper.
   */
  private async getManagedPolicyLocationRows(
    queryMgr: DataSource | EntityManager,
    companyId: number,
    policyLocationLid: number
  ): Promise<{ id: number; address_id: number }[]> {
    return queryMgr
      .createQueryBuilder()
      .select("cpcl.id", "id")
      .addSelect("cpcl.address_id", "address_id")
      .from("company_policy_configuration_location", "cpcl")
      .innerJoin(
        "company_address",
        "ca",
        "ca.address_id = cpcl.address_id AND ca.company_id = cpcl.company_id AND ca.deleted_at IS NULL"
      )
      .innerJoin(
        "address",
        "a",
        "a.id = cpcl.address_id AND a.deleted_at IS NULL"
      )
      .where("cpcl.company_id = :companyId", { companyId })
      .andWhere("cpcl.deleted_at IS NULL")
      .andWhere("a.address_type_lid = :lid", { lid: policyLocationLid })
      .getRawMany();
  }

  /** Returns true if any of the company's policies has enablePolicyLocations = true. */
  private async hasEnabledPolicyLocationToggle(
    queryMgr: DataSource | EntityManager,
    companyId: number
  ): Promise<boolean> {
    const row = await queryMgr
      .createQueryBuilder()
      .select("p.id", "policy_id")
      .from("policy", "p")
      .innerJoin(
        "policy_configuration",
        "pc",
        "pc.policy_id = p.id AND pc.deleted_at IS NULL"
      )
      .where("p.company_id = :companyId", { companyId })
      .andWhere(
        "(pc.policy_configuration->>'enablePolicyLocations')::boolean = true"
      )
      .limit(1)
      .getRawOne();
    return !!row;
  }

  /**
   * Pre-flight: reject the company save before any DB mutation if it would
   * remove/retype a Policy Location address while any of the company's
   * policies has enablePolicyLocations = true. Atomicity is required here
   * because several downstream helpers use their own non-transactional
   * connections.
   */
  private async assertPolicyLocationRemovalAllowed(
    companyId: number,
    companyDto: UpdateCompanyDto
  ): Promise<void> {
    const incomingAddresses = companyDto?.addresses;
    if (!Array.isArray(incomingAddresses)) return;

    const policyLocationLookup =
      await this.lookUpRepository.findByLookUpKey(ADDRESS_TYPE_POLICY_LOCATION);
    const policyLocationLid = policyLocationLookup?.[0]?.id;
    if (!policyLocationLid) return;

    const currentManagedAddressIds = new Set(
      (
        await this.getManagedPolicyLocationRows(
          this.dataSource,
          companyId,
          policyLocationLid
        )
      ).map((r) => Number(r.address_id))
    );
    if (currentManagedAddressIds.size === 0) return;

    const incomingPolicyLocationIds = new Set<number>(
      incomingAddresses
        .filter(
          (addr) =>
            addr?.id != null &&
            Number(addr.addressTypeLid) === policyLocationLid
        )
        .map((addr) => Number(addr.id))
    );

    const wouldRemoveManaged = [...currentManagedAddressIds].some(
      (id) => !incomingPolicyLocationIds.has(id)
    );
    if (!wouldRemoveManaged) return;

    if (await this.hasEnabledPolicyLocationToggle(this.dataSource, companyId)) {
      throw new BadRequestException(
        errorMessages.policyLocationRemovalBlockedByEnabledToggle
      );
    }
  }

  private async syncCompanyPolicyConfigurationLocations(
    entityManager: EntityManager,
    companyId: number
  ): Promise<void> {
    const policyLocationLookup =
      await this.lookUpRepository.findByLookUpKey(ADDRESS_TYPE_POLICY_LOCATION);
    const policyLocationLid = policyLocationLookup?.[0]?.id;
    if (!policyLocationLid) {
      throw new NotFoundException(
        errorMessages.policyLocationLookupMissing(ADDRESS_TYPE_POLICY_LOCATION)
      );
    }

    const desiredAddressIdRows: {
      address_id: number;
      location_code: string | null;
    }[] = await entityManager
      .createQueryBuilder()
      .select("a.id", "address_id")
      .addSelect("a.location_code", "location_code")
      .from("company_address", "ca")
      .innerJoin("address", "a", "a.id = ca.address_id AND a.deleted_at IS NULL")
      .where("ca.company_id = :companyId", { companyId })
      .andWhere("ca.deleted_at IS NULL")
      .andWhere("a.address_type_lid = :lid", { lid: policyLocationLid })
      .getRawMany();
    const desiredAddressIds = new Set(
      desiredAddressIdRows.map((r) => Number(r.address_id))
    );

    // Location Code must exist and be unique per company (normalized like the
    // upload matcher in policy-location.util).
    if (
      desiredAddressIdRows.some(
        (r) => !r.location_code || String(r.location_code).trim() === ""
      )
    ) {
      throw new BadRequestException(
        errorMessages.policyLocationAddressCodeRequired
      );
    }
    const seenCodes = new Set<string>();
    const duplicates = new Set<string>();
    for (const r of desiredAddressIdRows) {
      const key = normalizePolicyLocationCode(r.location_code);
      if (seenCodes.has(key)) duplicates.add(String(r.location_code));
      else seenCodes.add(key);
    }
    if (duplicates.size > 0) {
      throw new BadRequestException(
        errorMessages.policyLocationAddressCodeDuplicate(
          Array.from(duplicates).join(", ")
        )
      );
    }

    const existingByAddressId = new Map<number, number>();
    for (const row of await this.getManagedPolicyLocationRows(
      entityManager,
      companyId,
      policyLocationLid
    )) {
      existingByAddressId.set(Number(row.address_id), Number(row.id));
    }

    const toInsert = [...desiredAddressIds].filter(
      (addressId) => !existingByAddressId.has(addressId)
    );
    const toRemoveAddressIds = [...existingByAddressId.keys()].filter(
      (addressId) => !desiredAddressIds.has(addressId)
    );

    if (toInsert.length > 0) {
      const newRows = toInsert.map((addressId) =>
        entityManager.create(CompanyPolicyConfigurationLocation, {
          company: { id: companyId },
          address: { id: addressId },
          isPrimary: null,
        })
      );
      await entityManager.save(newRows);
    }

    if (toRemoveAddressIds.length > 0) {
      // Defense in depth: pre-flight already runs this check, but re-check
      // here in case syncCompanyPolicyConfigurationLocations is invoked
      // outside the updateCompany entry point in the future.
      if (await this.hasEnabledPolicyLocationToggle(entityManager, companyId)) {
        throw new BadRequestException(
          errorMessages.policyLocationRemovalBlockedByEnabledToggle
        );
      }

      await this.companyRepository.deleteEntityTableMapIds(
        COMPANY_MAP_TABLE_DELETE_FIELDS.COMPANY_POLICY_CONFIG_LOCATION,
        toRemoveAddressIds,
        COMPANY_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
        MAPPED_DATA_DELETION.SOFT_DELETE
      );
    }
  }

  async addCompanyAddress(
    entityManager: EntityManager,
    addresses: CreateCompanyAddressDto[],
    companyId: number,
    createdBy: number,
    countryId: number
  ) {
    try {
      await Promise.all(
        addresses.map(async (addressDto) => {
          const addressDetails = await entityManager.findOne(City, {
            where: { id: addressDto.cityId },
          });
          if (!addressDetails) {
            throw new NotFoundException(
              `City with ID ${addressDto.cityId} not found`
            );
          }
          addressDto.stateId = addressDto.stateId ?? addressDetails.stateId;
          addressDto.countryId = addressDto.countryId ?? countryId;
          const savedAddress = await this.addressService.addAddress(
            addressDto,
            createdBy
          );
          const companyAddress = entityManager.create(CompanyAddress, {
            company: { id: companyId },
            address: { id: savedAddress.id },
            isPrimary: false, // Optional: Set this to true if needed
          });
          await entityManager.save(companyAddress);
        })
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getCompanyList(
    page: number,
    limit: number,
    search: string,
    userId: number,
    entityIds?: number[]
  ) {
    try {
      // Check if the user has permission to access the company list
      return await this.companyRepository.CompanyList(
        page,
        limit,
        search,
        userId,
        entityIds
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }

      throw new Error(errorMessages.companyListFailed);
    }
  }

  async getCompanyBasicDetails(
    id: number,
    userId: number,
    contactId?: number,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const fields = ["id", "companyName", "displayName"];
      const relations = [
        "companyAddresses.address",
        "companyContactMaps.contact",
        "companyContactMaps.contact.status",
      ];
      const whereCondition = { id: id };
      const companyDetails = await this.companyRepository.getCompanyListData(
        fields,
        relations,
        whereCondition,
        contactId,
        status
      );
      if (!companyDetails) {
        throw new NotFoundException(errorMessages.companyNotFound);
      }
      return companyDetails;
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async getCompanyContacts(
    companyId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const contacts = await this.companyRepository.getContactsByCompanyId(
        companyId,
        page,
        limit,
        search,
        status
      );
      if (!contacts || contacts.data.length === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedContacts = contacts.data.map((contact) => ({
        id: contact?.contact?.id ?? null,
        firstName: contact?.contact?.firstName ?? null,
        lastName: contact?.contact?.lastName ?? null,
        displayName: contact?.contact?.displayName ?? null,
        status: contact?.contact?.status?.lookUpValue ?? null,
      }));
      return { data: transformedContacts, count: transformedContacts.length };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch contacts for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async getCompanyDocuments(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    searchBy?: string,
    from?: Date,
    to?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyService",
          method: "getCompanyDocuments",
          payload: {
            companyId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const searchParams = search ? mapSearchParams(search) : [];
      const documents = await this.companyRepository.getDocumentsByCompanyId(
        companyId,
        page,
        limit,
        searchParams,
        searchBy,
        from,
        to,
        field
      );
      if (!documents || documents.count === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedDocuments = documents.data.map((document) => ({
        id: document?.id ?? null,
        filePath: document?.fileKey ?? null,
        fileName: document?.fileKey
          ? document?.fileKey?.split("/")?.pop()
          : null,
        documentTypeId: document?.documentType?.id ?? null,
        documentType: document?.documentType?.lookUpValue ?? null,
        uploadedAt: document?.createdAt
          ? new Date(document.createdAt).toISOString().split("T")[0]
          : null,
      }));
      return { data: transformedDocuments, count: documents.count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "getCompanyDocuments",
          payload: {
            companyId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch documents for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async getCompanyLocations(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    searchBy?: string,
    from?: Date,
    to?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyService",
          method: "getCompanyLocations",
          payload: {
            companyId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const searchParams = search ? mapSearchParams(search) : [];
      const locations = await this.companyRepository.getLocationsByCompanyId(
        companyId,
        page,
        limit,
        searchParams,
        searchBy,
        from,
        to,
        field
      );
      if (!locations || locations.count === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedLocations = locations.data.map((location) => ({
        id: location?.addressId ?? null,
        address1: location?.address?.address1 ?? null,
        city: location?.address?.cityId ?? null,
        state: location?.address?.stateId ?? null,
      }));
      return { data: transformedLocations, count: locations.count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "getCompanyLocations",
          payload: {
            companyId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch locations for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async getCompanies(
    page: number,
    limit: number,
    userId: number,
    search?: string
  ) {
    try {
      const companies = await this.companyRepository.getCompanies(
        page,
        limit,
        userId,
        search
      );
      return companies;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(errorMessages.companyListFailed);
    }
  }

  async getCompaniesByHierarchy(
    loggedInUserId: number,
    ownerId?: number,
    viewBy?: (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES],
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    search?: string
  ): Promise<{
    data: {
      companyId: number;
      companyName: string;
      displayName: string | null;
    }[];
    count: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId: loggedInUserId,
        status: "success",
        location: "CompanyService",
        method: "getCompaniesByHierarchy",
        payload: { ownerId, viewBy, page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      const userId = ownerId ?? loggedInUserId;
      let userIds: number[] = [];

      if (viewBy === OWNER_TYPES.TEAM) {
        const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
          userId
        );
        userIds =
          Array.isArray(users) && users.length > 0
            ? users
                .map((u) => u?.userId)
                .filter((id): id is number => typeof id === "number")
            : [userId];
      } else {
        userIds = [userId];
      }

      const uniqueUserIds = Array.from(
        new Set(userIds.filter((id): id is number => typeof id === "number"))
      );

      if (!uniqueUserIds.length) {
        return { data: [], count: 0 };
      }

      return await this.companyRepository.findCompaniesByOwnerIds(
        uniqueUserIds,
        page,
        limit,
        search
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: loggedInUserId,
          status: "failure",
          location: "CompanyService",
          method: "getCompaniesByHierarchy",
          payload: { ownerId, viewBy, page, limit, search },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        (error as Error).message || errorMessages.companyListFailed
      );
    }
  }

  async getCompaniesWithPortalConfiguration(
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    search?: string
  ): Promise<{
    data: {
      companyId: number;
      companyName: string;
      displayName: string | null;
    }[];
    count: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyService",
        method: "getCompaniesWithPortalConfiguration",
        payload: { page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      return await this.companyRepository.findCompaniesWithPortalConfiguration(
        page,
        limit,
        search
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "getCompaniesWithPortalConfiguration",
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        (error as Error).message || "Failed to fetch companies with active policies"
      );
    }
  }

  async getCountryId(userId: number) {
    try {
      const countryId = await this.dataSource.manager.transaction(
        async (entityManager) => {
          return await this.companyRepository.getCountryId(
            entityManager,
            userId
          );
        }
      );
      return countryId;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getCurrencyId(countryId: number) {
    try {
      const currencyId = await this.dataSource.manager.transaction(
        async (entityManager) => {
          return await this.companyRepository.getCurrencyId(
            entityManager,
            countryId
          );
        }
      );
      return currencyId;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async getDefaultPriorty(): Promise<number> {
    try {
      const priority = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_VALUES.PRIORITY
      );
      if (!priority) {
        throw new NotFoundException(
          `Priority with key ${DEFAULT_VALUES.PRIORITY} not found`
        );
      }
      return priority[0].id;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "getDefaultPriorty",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to fetch default priority: ${(error as Error).message}`
      );
    }
  }

  async getDefaultGroupCompany(): Promise<number> {
    try {
      const groupCompany = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_VALUES.GROUP_COMPANY
      );
      if (!groupCompany || groupCompany.length === 0) {
        throw new NotFoundException(
          `Group company with key ${DEFAULT_VALUES.GROUP_COMPANY} not found`
        );
      }
      return groupCompany[0].id;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "getDefaultGroupCompany",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to fetch default group company: ${(error as Error).message}`
      );
    }
  }

  async getGroupCompanies(
    page: number,
    limit: number,
    search: string,
    userId: number
  ) {
    try {
      // Check if the user has permission to access the company list
      const companies = await this.dataSource.manager.transaction(
        async (entityManager) => {
          const countryId = await this.companyRepository.getCountryId(
            entityManager,
            userId
          );
          return await this.companyRepository.getGroupCompanies(
            entityManager,
            page,
            limit,
            search,
            countryId
          );
        }
      );

      return companies;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }
      throw new Error(errorMessages.groupCompanyListNotFound);
    }
  }

  async sendNotification(
    eventType: string,
    url: string,
    notifyUserId: number,
    sendInAppNotification: boolean,
    sendEmailNotification: boolean
  ): Promise<void> {
    try {
      const userEmail = await this.companyRepository.getEntityTableMapIds(
        TABLE_NAMES.USER,
        USER_EMAIL,
        { userId: notifyUserId }
      );

      if (!userEmail || userEmail.length === 0) {
        throw new NotFoundException(
          infoMessages.emailNotFoundWithUserId(notifyUserId)
        );
      }

      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      const parameters = { [`${eventDetails[0].parameterKey}`]: url };
      if (sendInAppNotification) {
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: eventType,
          emailId: userEmail,
          channel: NOTIFICATION_IN_APP,
          parameters: parameters,
          userId: [notifyUserId],
        });
      }
      if (sendEmailNotification) {
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: eventType,
          emailId: userEmail,
          channel: NOTIFICATION_EMAIL,
          parameters: parameters,
          userId: [notifyUserId],
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "sendNotification",
          messageData: error,
        }),
      });
    }
  }

  async createAssistance(
    payload: QuickCreatePayloadDto,
    userId: number,
    request: Request
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "createAssistance",
          payload: JSON.stringify(payload),
          messageData: "method invoked",
        }),
      });
      const createdContacts: number[] = [];

      // Create company
      const company = await this.createCompanyForAssistance(payload, userId);
      // Create contacts
      for (const contact of payload.contacts) {
        const createdContact = await this.createContactForAssistance(
          contact,
          company,
          userId
        );
        createdContacts.push(createdContact.id);
      }

      // Create opportunity if needed
      let opportunityResult: any = null;
      let meetingResult: any = null;

      if (payload.opportunity) {
        opportunityResult = await this.createOpportunityForAssistance(
          payload.opportunity,
          company,
          createdContacts,
          userId,
          request
        );
      }

      // Create meeting if needed
      if (payload.meeting) {
        meetingResult = await this.createMeetingForAssistance(
          payload.meeting,
          company,
          opportunityResult?.data?.data?.opportunityId ?? null,
          createdContacts,
          userId,
          request
        );
      }

      return {
        companyId: company.id,
        contactIds: createdContacts,
        opportunityId: payload.opportunity
          ? opportunityResult?.data?.data?.opportunityId ?? null
          : null,
        meetingId: payload.meeting
          ? meetingResult?.data?.data?.id ?? null
          : null,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "createAssistance",
          payload: JSON.stringify(payload),
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        (error as Error)?.message || "Failed to create assistance"
      );
    }
  }

  public async getLookupByKey(key: string) {
    try {
      const result = await this.lookUpRepository.findByLookUpKey(key);
      if (!result || !result.length) {
        throw new BadRequestException(`Lookup with key ${key} not found`);
      }
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch lookup for key ${key}: ${(error as Error).message}`
      );
    }
  }

  async createCompanyForAssistance(
    payload: QuickCreatePayloadDto,
    userId: number
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "createCompanyForAssistance",
          messageData: "method invoked",
        }),
      });
      if (payload.company.companyId) {
        const companyData = await this.companyRepository.getCompanyById(
          payload.company.companyId,
          userId
        );
        if (companyData) return companyData;
      }
      const [groupCompany, priority, status, addressType] = await Promise.all([
        this.getLookupByKey("GROUP_COMPANY_NO"),
        this.getLookupByKey("PRIORITY_MEDIUM"),
        this.getLookupByKey("COMPANY_STATUS_ACTIVE"),
        this.getLookupByKey("ADDRESS_TYPE_OFFICE"),
      ]);

      const city = await this.entityService.getDataById(
        City,
        payload.company.cityId,
        ["state"]
      );
      const address1 = city ? city.name : "";
      const companyDto: any = {
        companyName: payload.company.companyName,
        companyTypeLid: payload.company.companyTypeLid ?? null,
        industrySegmentLid: payload.company.industrySegmentLid ?? null,
        groupCompanyLid: groupCompany[0].id,
        priorityLid: priority[0].id,
        displayName: payload.company.companyName,
        noOfEmployees: 0,
        website: null,
        source: null,
        leadCrm: userId,
        accountManager: null,
        countryId: payload.company.countryId,
        currencyId: payload.company.currencyId,
        createdBy: payload.company.createdBy,
        updatedBy: payload.company.updatedBy,
        statusLid: status[0].id,
        groupCompanyMap: null,
        companyDocMaps: [],
        addresses: [
          {
            addressTypeLid: addressType[0].id,
            address1: payload.company.address1 ?? address1,
            address2: null,
            area: payload.company.area,
            countryId: payload.company.countryId,
            stateId: city?.stateId ?? city?.state?.id,
            cityId: payload.company.cityId,
            pinCode: payload.company.pinCode ?? null,
            phoneNumber: null,
            alternatePhoneNumber: null,
            supportNumber: null,
            email: null,
          },
        ],
      };

      const companyData = await this.createCompany(companyDto, userId);
      return companyData;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyService",
          method: "createCompanyForAssistance",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        `Failed to create company: ${(error as Error).message}`
      );
    }
  }

  async createContactForAssistance(
    contact: any,
    company: any,
    userId: number
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "createContactForAssistance",
          messageData: "method invoked",
        }),
      });
      const [salutation, recordType, contactStatus] = await Promise.all([
        this.getLookupByKey("SALUTATION_MR"),
        this.getLookupByKey("COMPANY_CONTACT_RECORD_TYPE"),
        this.getLookupByKey("CONTACT_STATUS_ACTIVE"),
      ]);

      const contactDto: any = {
        salutationLid: salutation[0].id,
        firstName: contact.firstName,
        middleName: null,
        lastName: contact.lastName,
        displayName: `${contact.firstName} ${contact.lastName}`,
        companyId: company.id,
        companyLocationId: company?.companyAddresses?.[0]?.address?.cityId?.id,
        companyBranchId: null,
        contactTypeLid: contact.contactTypeLid,
        department: null,
        reportingToId: null,
        relationshipTypeLid: null,
        remarks: null,
        tagLid: null,
        communicationDetails: [
          {
            communicationType: DEFAULT_EMAIL_KEY,
            communicationDetails: contact.email,
            isPrimary: true,
          },
          {
            communicationType: DEFAULT_PHONE_KEY,
            communicationDetails: contact.phoneNumber,
            isPrimary: true,
          },
        ],
        contactRecordTypeLid: recordType[0].id,
        statusLid: contactStatus[0].id,
      };

      const contactData = await this.contactService.addContact(
        contactDto,
        userId
      );
      return contactData;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyService",
          method: "createContactForAssistance",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        `Failed to create contact: ${(error as Error).message}`
      );
    }
  }

  async inceptionCreateCompany(companies: CreateCompanyDto[], userId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyService",
        method: "inceptionCreateCompany",
        messageData: "method invoked",
      }),
    });

    if (!Array.isArray(companies) || companies.length === 0) {
      throw new BadRequestException("No companies provided");
    }

    const defaultPriorty = await this.getDefaultPriorty();
    const defaultGroupCompany = await this.getDefaultGroupCompany();

    const results = await Promise.all(
      companies.map(async (companyDto) => {
        try {
          companyDto.countryId =
            companyDto.countryId ?? (await this.getCountryId(userId));
          companyDto.currencyId = await this.getCurrencyId(
            companyDto.countryId
          );
          companyDto.displayName =
            companyDto.displayName ?? companyDto.companyName;
          companyDto.priorityLid = companyDto.priorityLid ?? defaultPriorty;
          companyDto.groupCompanyLid =
            companyDto.groupCompanyLid ?? defaultGroupCompany;
          companyDto.createdBy = userId;
          companyDto.updatedBy = userId;
          const companyData = await this.createCompany(companyDto, userId);
          return {
            status: "success",
            data: {
              id: companyData?.id,
              companyName: companyData?.companyName,
            },
            message: successMessage.companyCreated,
          };
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyService",
              method: "inceptionCreateCompany",
              payload: { companyDto },
              messageData: err,
            }),
          });
          return {
            status: "failure",
            message:
              err instanceof Error
                ? err.message
                : errorMessages.companyCreationFailed,
            payload: companyDto,
          };
        }
      })
    );

    return results;
  }

  async createOpportunityForAssistance(
    opportunity: any,
    company: any,
    contactIds: number[],
    userId: number,
    request: Request
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "createOpportunityForAssistance",
          messageData: "method invoked",
        }),
      });
      const contactMaps = contactIds.map((id) => ({ contactId: id }));
      const opportunityContacts =
        contactMaps.length > 1 ? [contactMaps[0]] : contactMaps;

      const [opportunityType, policyStatus, serviceLevel, isPolicyMined] =
        await Promise.all([
          this.getLookupByKey("OPPORTUNITY_TYPE_FRESH"),
          this.getLookupByKey("POLICY_STATUS_FRESH"),
          this.getLookupByKey("SERVICE_LEVEL_FULL_SERVICE"),
          this.getLookupByKey("IS_POLICY_MINED_NO"),
        ]);

      const riskLocations = [
        {
          addressId: company?.companyAddresses?.[0]?.address?.id,
        },
      ];

      const oppDto: any = {
        companyId: company.id,
        policyTypeLid: opportunity.policyTypeLid,
        opportunityTypeLid: opportunityType[0].id,
        riskLocations,
        estimatedBrokerage: opportunity.estimatedBrokerageAmount ?? null,
        estimatedBrokeragePercentage:
          opportunity.estimatedBrokeragePercentage ?? null,
        policyStatusLid: opportunity.policyStatusLid ?? policyStatus[0].id,
        serviceLevelLid: serviceLevel[0].id,
        expiryDate: opportunity.expiryDate,
        sumInsured: opportunity.sumInsured ?? null,
        premiumPaid: opportunity.premiumPaid,
        estimatedFee: null,
        isPolicyMinedLid: isPolicyMined[0].id,
        opportunitySourceTypeLid: opportunity.sourceTypeLid,
        source: null,
        salesPitch: null,
        contacts: opportunityContacts,
        previousInsurer: [],
        previousTPA: [],
        previousBroker: [],
      };
      let result: any;
      try {
        result = await axios.post(
          `${ENV.URL_OPPORTUNITY_SERVICE}/opportunity`,
          oppDto,
          {
            headers: {
              Authorization: `${request.headers.authorization}`,
              userid: userId,
            },
          }
        );
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "CompanyService",
            method: "createOpportunityForAssistance",
            messageData: `error in axios call: ${error}`,
          }),
        });
        throw new BadRequestException(
          `Failed to create opportunity in axios call: ${
            (error as Error).message
          }`
        );
      }

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyService",
          method: "createOpportunityForAssistance",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        `Failed to create opportunity: ${(error as Error).message}`
      );
    }
  }

  async createMeetingForAssistance(
    meeting: any,
    company: any,
    opportunityId: number | null,
    contactIds: number[],
    userId: number,
    request: Request
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyService",
          method: "createMeetingForAssistance",
          messageData: "method invoked",
        }),
      });
      const [clientMeetingType] = await Promise.all([
        this.getLookupByKey("MEETING_TYPE_CLIENT"),
      ]);
      const meetingDto: any = {
        meetingTypeLid: clientMeetingType[0].id,
        meetingDate: meeting.meetingDate,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        meetingSubject: meeting.meetingAgenda,
        meetingAgenda: meeting.meetingAgenda,
        companyId: company.id,
        opportunityId: opportunityId,
        companyParticipants: {
          companyId: company.id,
          companyContactPerson: contactIds,
        },
        employeeParticipants: { employees: [userId] },
        documents: [],
      };
      let result: any;
      try {
        result = await axios.post(
          `${ENV.URL_OPPORTUNITY_SERVICE}/meeting`,
          meetingDto,
          {
            headers: {
              Authorization: `${request.headers.authorization}`,
              userid: userId,
            },
          }
        );
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "CompanyService",
            method: "createMeetingForAssistance",
            messageData: `error in axios call: ${error}`,
          }),
        });
        throw new BadRequestException(`${error?.response?.data?.message}`);
      }
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyService",
          method: "createMeetingForAssistance",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        `Failed to create meeting: ${(error as Error).message}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Company Migration
  // ---------------------------------------------------------------------------

  private assertSafeMigrationIdentifier(name: string, label: string): void {
    if (!COMPANY_MIGRATION_IDENTIFIER_RE.test(name)) {
      throw new BadRequestException(`Invalid ${label}: ${name}`);
    }
  }

  private async migCheckIds(table: string, ids: string[]): Promise<Set<string>> {
    if (!ids.length) return new Set<string>();
    const unique = [...new Set(ids)];
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id::text FROM ${table} WHERE id::text = ANY($1::text[])`,
      [unique],
    );
    return new Set(rows.map((r) => r.id));
  }

  // Unlike policy's migCheckLookupIds (scoped to one lookup_name), company
  // migration validates several _lid columns spanning different lookup
  // categories — checked as plain id-existence in lookup_data rather than
  // filtered per lookup_name (a deliberate scope simplification).
  private async migCheckLookupIdsAny(ids: string[]): Promise<Set<string>> {
    if (!ids.length) return new Set<string>();
    const unique = [...new Set(ids)];
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id::text FROM lookup_data WHERE id::text = ANY($1::text[])`,
      [unique],
    );
    return new Set(rows.map((r) => r.id));
  }

  private async nextvalBatch(
    manager: EntityManager,
    seqName: string,
    count: number,
  ): Promise<number[]> {
    if (count === 0) return [];
    const rows: Array<{ id: string }> = await manager.query(
      `SELECT nextval($1)::bigint::text AS id FROM generate_series(1, $2)`,
      [seqName, count],
    );
    return rows.map((r) => Number(r.id));
  }

  private toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.join(",")];
    for (const row of rows) {
      lines.push(columns.map((c) => escape(row[c])).join(","));
    }
    return lines.join("\n");
  }

  private async uploadCsvToS3(
    rows: Array<Record<string, unknown>>,
    columns: string[],
    folder: string,
    fileName: string,
  ): Promise<string | null> {
    if (!this.migrationS3) {
      this.logger.error({
        message: `Cannot upload ${fileName} — S3 is not configured (DOCUMENT_REPOSITORY_MODE !== 'AWS')`,
      });
      return null;
    }
    const bucket = process.env.S3_AWS_BUCKET || "";
    const key = `${folder}/${fileName}`;
    const csv = this.toCsv(rows, columns);
    await this.migrationS3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(csv, "utf-8"),
        ContentType: "text/csv",
      })
      .promise();
    return key;
  }

  private async logMigrationSummary(
    runId: string,
    eventType: string,
    successCount: number,
    errorCount: number,
    successLog: string | null,
    errorLog: string | null,
  ): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO migration_log
           (system, migration_run_id, event_type, success_count, error_count, success_log, error_log)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [MIGRATION_LOG_SYSTEM, runId, eventType, successCount, errorCount, successLog, errorLog],
      );
    } catch (logError) {
      this.logger.error({
        message: `Failed to write migration_log row for ${eventType}: ${
          logError instanceof Error ? logError.message : String(logError)
        }`,
        migrationRunId: runId,
      });
    }
  }

  async migrateCompanies(batchSizeOverride?: number): Promise<CompanyMigrationResult> {
    // pg_advisory_lock/unlock are session-scoped — must run on the SAME
    // physical connection, which a pooled this.dataSource.query() call does
    // not guarantee. Use a dedicated QueryRunner for the lock's lifetime.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const lockResult: Array<{ locked: boolean }> = await queryRunner.query(
        `SELECT pg_try_advisory_lock($1) AS locked`,
        [COMPANY_MIGRATION_ADVISORY_LOCK_KEY],
      );
      if (!lockResult[0]?.locked) {
        throw new Error(
          "A company migration run is already in progress on this database — skipping this invocation to avoid two runs racing to update the same rows.",
        );
      }
      try {
        return await this.migrateCompaniesInternal(batchSizeOverride);
      } finally {
        await queryRunner.query(`SELECT pg_advisory_unlock($1)`, [
          COMPANY_MIGRATION_ADVISORY_LOCK_KEY,
        ]);
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async migrateCompaniesInternal(batchSizeOverride?: number): Promise<CompanyMigrationResult> {
    this.assertSafeMigrationIdentifier(COMPANY_MIGRATION_VIEW_COMPANY, "COMPANY_MIGRATION_VIEW_COMPANY");
    this.assertSafeMigrationIdentifier(COMPANY_MIGRATION_VIEW_CONTACT, "COMPANY_MIGRATION_VIEW_CONTACT");
    this.assertSafeMigrationIdentifier(COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS, "COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS");
    this.assertSafeMigrationIdentifier(COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS, "COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS");
    this.assertSafeMigrationIdentifier(COMPANY_MIGRATION_ORDER_COLUMN, "COMPANY_MIGRATION_ORDER_COLUMN");

    const runId = new Date().toISOString().replace(/\D/g, "").substring(0, 14);
    const batchSize =
      batchSizeOverride && batchSizeOverride > 0 ? batchSizeOverride : COMPANY_MIGRATION_BATCH_SIZE;

    const result: CompanyMigrationResult = {
      migrationRunId: runId,
      totalGroups: 0,
      totalBatches: 0,
      validGroups: 0,
      errorGroups: 0,
      insertedIntoCompany: 0,
      insertedIntoContact: 0,
      insertedIntoAddress: 0,
      insertedIntoCompanyAddress: 0,
      insertedIntoContactAddress: 0,
      insertedIntoCompanyContactMap: 0,
      errorLogTable: "company_migration_error_log",
      batches: [],
      rawDataCsvKeys: { company: null, contact: null, companyAddress: null, contactAddress: null },
      errorCsvKey: null,
      successCsvKey: null,
    };

    // Accumulates one row per successfully-inserted company across all
    // batches, exported as migrate_company_success_log/..._<runId>.csv once
    // the whole run finishes.
    const successRecords: Array<{
      unique_id: string;
      company_id: number;
      company_name: string | null;
      created_at: string | null;
    }> = [];

    // 1. Resolve the source database — MIGRATION_DB_URL (shared with policy
    // migration, configured in service-lib) points this at the client's
    // database; unset falls back to this app's own DataSource for local/dev
    // testing against the sample views.
    const src = await this.migrationDataSourceService.getDataSource(this.dataSource);

    // 2. Target table schemas (defensive column-intersection — only columns
    // the source actually provides get written to; a target column the
    // source doesn't supply is left OUT of the INSERT column list so
    // Postgres applies its table DEFAULT instead of an explicit NULL, same
    // reasoning as the policy migration's `add_only_dependents` fix).
    const fetchCols = async (table: string): Promise<Set<string>> => {
      const rows: Array<{ column_name: string }> = await this.dataSource.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
        [table],
      );
      return new Set(rows.map((r) => r.column_name));
    };
    const [companySchemaSet, contactSchemaSet, addressSchemaSet] = await Promise.all([
      fetchCols("company"),
      fetchCols("contact"),
      fetchCols("address"),
    ]);

    // 3. Source view columns, in stable order
    const fetchViewCols = async (view: string): Promise<string[]> => {
      const rows: Array<{ column_name: string }> = await src.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [view],
      );
      return rows.map((r) => r.column_name);
    };
    const [companyViewColumns, contactViewColumns, companyAddressViewColumns, contactAddressViewColumns] =
      await Promise.all([
        fetchViewCols(COMPANY_MIGRATION_VIEW_COMPANY),
        fetchViewCols(COMPANY_MIGRATION_VIEW_CONTACT),
        fetchViewCols(COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS),
        fetchViewCols(COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS),
      ]);

    // 4. Pull all 4 views in full — both the raw audit dump and the
    // in-memory working set groups/batches are built from, no re-querying.
    const [companyRows, contactRows, companyAddressRows, contactAddressRows]: Array<
      Array<Record<string, unknown>>
    > = await Promise.all([
      src.query(`SELECT * FROM ${COMPANY_MIGRATION_VIEW_COMPANY} ORDER BY ${COMPANY_MIGRATION_ORDER_COLUMN}`),
      src.query(`SELECT * FROM ${COMPANY_MIGRATION_VIEW_CONTACT} ORDER BY ${COMPANY_MIGRATION_ORDER_COLUMN}`),
      src.query(
        `SELECT * FROM ${COMPANY_MIGRATION_VIEW_COMPANY_ADDRESS} ORDER BY ${COMPANY_MIGRATION_ORDER_COLUMN}`,
      ),
      src.query(
        `SELECT * FROM ${COMPANY_MIGRATION_VIEW_CONTACT_ADDRESS} ORDER BY ${COMPANY_MIGRATION_ORDER_COLUMN}`,
      ),
    ]);
    result.totalGroups = companyRows.length;
    result.totalBatches = Math.ceil(companyRows.length / batchSize);

    // 5. Dump exactly what we received from each source view to S3 BEFORE
    // any processing — a daily audit trail of "what the client's views gave
    // us today," independent of validation outcome. Non-fatal per file.
    const dumps: Array<{
      key: keyof CompanyMigrationResult["rawDataCsvKeys"];
      rows: Array<Record<string, unknown>>;
      cols: string[];
      label: string;
    }> = [
      { key: "company", rows: companyRows, cols: companyViewColumns, label: "company" },
      { key: "contact", rows: contactRows, cols: contactViewColumns, label: "contact" },
      {
        key: "companyAddress",
        rows: companyAddressRows,
        cols: companyAddressViewColumns,
        label: "company_address",
      },
      {
        key: "contactAddress",
        rows: contactAddressRows,
        cols: contactAddressViewColumns,
        label: "contact_address",
      },
    ];
    for (const dump of dumps) {
      try {
        result.rawDataCsvKeys[dump.key] = await this.uploadCsvToS3(
          dump.rows,
          dump.cols,
          "migrate_company_log",
          `migrate_company_log_${dump.label}_${runId}.csv`,
        );
      } catch (rawLogError) {
        this.logger.error({
          message: `Failed to upload raw company migration source CSV (${dump.label}): ${
            rawLogError instanceof Error ? rawLogError.message : String(rawLogError)
          } ${(rawLogError as { code?: string })?.code ? `[${(rawLogError as { code?: string }).code}]` : ""}`,
          migrationRunId: runId,
        });
      }
    }

    if (companyRows.length === 0) return result; // nothing to do

    // Helper: get a cell value — returns null for empty or "NULL" — works
    // whether the source hands back strings (our sample: all TEXT) or
    // natively-typed values (a real client view).
    const getVal = (row: Record<string, unknown>, col: string): string | null => {
      const v = row[col];
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return !s || s === "NULL" ? null : s;
    };
    const collectUnique = (rows: Array<Record<string, unknown>>, col: string): string[] => [
      ...new Set(rows.map((r) => getVal(r, col)).filter((v): v is string => v !== null)),
    ];

    // 6. Index the 3 secondary sheets by unique_id — the join key correlating
    // one company with its contact/addresses (no reliable heuristic exists,
    // unlike the legacy script this replaces — see plan notes).
    const byUniqueId = (rows: Array<Record<string, unknown>>): Map<string, Record<string, unknown>> => {
      const map = new Map<string, Record<string, unknown>>();
      for (const row of rows) {
        const uid = getVal(row, "unique_id");
        if (uid && !map.has(uid)) map.set(uid, row);
      }
      return map;
    };
    const contactByUid = byUniqueId(contactRows);
    const companyAddressByUid = byUniqueId(companyAddressRows);
    const contactAddressByUid = byUniqueId(contactAddressRows);

    // 7. FK/lookup validation sets — computed ONCE for the whole run (all
    // rows are already in memory from step 4, so there's no benefit to
    // recomputing these per batch the way policy's per-batch-fetched rows
    // required).
    const [
      validCompanyLookupIds,
      validContactLookupIds,
      validUserIds,
      validCurrencyIds,
      validCountryIds,
      validStateIds,
      validCityIds,
      validBrokerIds,
    ] = await Promise.all([
      this.migCheckLookupIdsAny([
        ...collectUnique(companyRows, "company_type_lid"),
        ...collectUnique(companyRows, "industry_segment_lid"),
        ...collectUnique(companyRows, "status_lid"),
        ...collectUnique(companyRows, "priority_lid"),
        ...collectUnique(companyRows, "group_company_lid"),
        ...collectUnique(companyRows, "source_type_lid"),
        ...collectUnique(companyRows, "sentiment_lid"),
      ]),
      this.migCheckLookupIdsAny([
        ...collectUnique(contactRows, "tag_lid"),
        ...collectUnique(contactRows, "contact_type_lid"),
        ...collectUnique(contactRows, "contact_record_type_lid"),
        ...collectUnique(contactRows, "status_lid"),
        ...collectUnique(contactRows, "salutation_lid"),
        ...collectUnique(contactRows, "title_id"),
      ]),
      this.migCheckIds("users", [
        ...collectUnique(companyRows, "created_by"),
        ...collectUnique(companyRows, "updated_by"),
        ...collectUnique(companyRows, "lead_crm"),
        ...collectUnique(companyRows, "account_manager"),
        ...collectUnique(contactRows, "created_by"),
        ...collectUnique(contactRows, "updated_by"),
      ]),
      this.migCheckIds("currency", collectUnique(companyRows, "currency_id")),
      this.migCheckIds("country", [
        ...collectUnique(companyRows, "country_id"),
        ...collectUnique(companyAddressRows, "country_id"),
        ...collectUnique(contactAddressRows, "country_id"),
      ]),
      this.migCheckIds("state", [
        ...collectUnique(companyAddressRows, "state_id"),
        ...collectUnique(contactAddressRows, "state_id"),
      ]),
      this.migCheckIds("city", [
        ...collectUnique(companyAddressRows, "city_id"),
        ...collectUnique(contactAddressRows, "city_id"),
      ]),
      this.migCheckIds("broker", collectUnique(companyRows, "existing_broker_id")),
    ]);

    // 8. Column lists (view ∩ target schema), shared across all batches
    const companyCols = companyViewColumns.filter(
      (c) => c !== "id" && c !== "unique_id" && companySchemaSet.has(c),
    );
    const contactCols = contactViewColumns.filter(
      (c) => c !== "id" && c !== "unique_id" && c !== "company_id" && contactSchemaSet.has(c),
    );
    const addressCols = [...new Set([...companyAddressViewColumns, ...contactAddressViewColumns])].filter(
      (c) => c !== "id" && c !== "unique_id" && addressSchemaSet.has(c),
    );

    // Migration-tracking columns on `company` (see
    // scripts/company_migration_tracking_columns.sql) — not present in the
    // source view, so populated programmatically rather than copied from
    // the row. Included only if the target table actually has them yet,
    // matching this codebase's defensive column-intersection convention.
    const TOGGLE_TYPE_YES = "9401";
    const TOGGLE_TYPE_NO = "9402";
    const companyTrackingCols = [
      "mig_ref_no",
      "created_via_sql_lid",
      "created_via_sql_at",
      "updated_via_sql_lid",
    ].filter((c) => companySchemaSet.has(c));
    const allCompanyInsertCols = [...companyCols, ...companyTrackingCols];

    interface GroupError {
      uniqueId: string;
      sheet: string;
      column: string | null;
      value: string | null;
      reason: string;
    }
    interface ValidGroup {
      uniqueId: string;
      company: Record<string, unknown>;
      contact: Record<string, unknown>;
      companyAddress: Record<string, unknown> | null;
      contactAddress: Record<string, unknown> | null;
    }

    const validateAddress = (
      row: Record<string, unknown>,
      uid: string,
      sheet: string,
      errsOut: GroupError[],
    ): boolean => {
      const ag = (col: string) => getVal(row, col);
      let ok = true;
      if (!ag("addr_1")) {
        errsOut.push({ uniqueId: uid, sheet, column: "addr_1", value: "", reason: "Required field is null/empty" });
        ok = false;
      }
      const fk = (col: string, validSet: Set<string>, table: string) => {
        const v = ag(col);
        if (v === null) {
          errsOut.push({ uniqueId: uid, sheet, column: col, value: "", reason: "Required field is null/empty" });
          ok = false;
        } else if (!validSet.has(v)) {
          errsOut.push({ uniqueId: uid, sheet, column: col, value: v, reason: `Not found in ${table}` });
          ok = false;
        }
      };
      fk("country_id", validCountryIds, "country");
      fk("state_id", validStateIds, "state");
      fk("city_id", validCityIds, "city");
      return ok;
    };

    // 9. Batch loop — batches the company view's distinct groups; every
    // batch's writes happen in one transaction (a failed batch doesn't roll
    // back earlier committed batches, matching the policy migration convention).
    for (
      let batchNumber = 1, offset = 0;
      offset < companyRows.length;
      batchNumber++, offset += batchSize
    ) {
      const batchStart = Date.now();
      const batchCompanyRows = companyRows.slice(offset, offset + batchSize);
      try {
        const batchErrors: GroupError[] = [];
        const validGroups: ValidGroup[] = [];

        for (const companyRow of batchCompanyRows) {
          const uid = getVal(companyRow, "unique_id");
          if (!uid) {
            batchErrors.push({
              uniqueId: "",
              sheet: "company",
              column: "unique_id",
              value: "",
              reason: "Missing unique_id",
            });
            continue;
          }

          const g = (col: string) => getVal(companyRow, col);
          const errs: GroupError[] = [];
          // Only company_name is actually NOT NULL with no default on the
          // live `company` table (verified against information_schema —
          // the TypeORM entity claims company_type_lid/industry_segment_lid/
          // audit_ref_id are NOT NULL too, but that's stale relative to the
          // real schema; all three are genuinely nullable in production).
          if (!g("company_name")) {
            errs.push({ uniqueId: uid, sheet: "company", column: "company_name", value: "", reason: "Required field is null/empty" });
          }

          const fkCheck = (col: string, validSet: Set<string>, table: string, nullable = false) => {
            const v = g(col);
            if (nullable && v === null) return;
            if (v === null) {
              errs.push({ uniqueId: uid, sheet: "company", column: col, value: "", reason: "Required field is null/empty" });
            } else if (!validSet.has(v)) {
              errs.push({ uniqueId: uid, sheet: "company", column: col, value: v, reason: `Not found in ${table}` });
            }
          };
          fkCheck("company_type_lid", validCompanyLookupIds, "lookup_data", true);
          fkCheck("industry_segment_lid", validCompanyLookupIds, "lookup_data", true);
          fkCheck("currency_id", validCurrencyIds, "currency", true);
          fkCheck("country_id", validCountryIds, "country", true);
          fkCheck("created_by", validUserIds, "users", true);
          fkCheck("updated_by", validUserIds, "users", true);
          fkCheck("lead_crm", validUserIds, "users", true);
          fkCheck("account_manager", validUserIds, "users", true);
          fkCheck("existing_broker_id", validBrokerIds, "broker", true);

          if (errs.length > 0) {
            batchErrors.push(...errs);
            continue;
          }

          const contactRow = contactByUid.get(uid);
          if (!contactRow) {
            batchErrors.push({
              uniqueId: uid,
              sheet: "correlation",
              column: null,
              value: null,
              reason: "No matching contact row found for this unique_id",
            });
            continue;
          }

          const cg = (col: string) => getVal(contactRow, col);
          const contactErrs: GroupError[] = [];
          for (const col of [
            "first_name",
            "last_name",
            "display_name",
            "company_location_id",
            "tag_lid",
            "contact_type_lid",
            "contact_record_type_lid",
          ]) {
            if (!cg(col)) {
              contactErrs.push({ uniqueId: uid, sheet: "contact", column: col, value: "", reason: "Required field is null/empty" });
            }
          }
          const contactFkCheck = (col: string, validSet: Set<string>, table: string, nullable = false) => {
            const v = cg(col);
            if (nullable && v === null) return;
            if (v !== null && !validSet.has(v)) {
              contactErrs.push({ uniqueId: uid, sheet: "contact", column: col, value: v, reason: `Not found in ${table}` });
            }
          };
          contactFkCheck("tag_lid", validContactLookupIds, "lookup_data", true);
          contactFkCheck("contact_type_lid", validContactLookupIds, "lookup_data", true);
          contactFkCheck("contact_record_type_lid", validContactLookupIds, "lookup_data", true);
          contactFkCheck("status_lid", validContactLookupIds, "lookup_data", true);
          contactFkCheck("salutation_lid", validContactLookupIds, "lookup_data", true);
          contactFkCheck("created_by", validUserIds, "users", true);
          contactFkCheck("updated_by", validUserIds, "users", true);

          if (contactErrs.length > 0) {
            batchErrors.push(...contactErrs);
            continue;
          }

          // Addresses are best-effort: a missing/invalid address doesn't
          // block the company/contact/company_contact_map insert.
          let finalCompanyAddress: Record<string, unknown> | null = null;
          let finalContactAddress: Record<string, unknown> | null = null;
          const companyAddressRow = companyAddressByUid.get(uid);
          const contactAddressRow = contactAddressByUid.get(uid);

          if (!companyAddressRow) {
            batchErrors.push({
              uniqueId: uid,
              sheet: "company_address",
              column: null,
              value: null,
              reason: "No matching company_address row found for this unique_id",
            });
          } else {
            const addrErrs: GroupError[] = [];
            if (validateAddress(companyAddressRow, uid, "company_address", addrErrs)) {
              finalCompanyAddress = companyAddressRow;
            } else {
              batchErrors.push(...addrErrs);
            }
          }

          if (!contactAddressRow) {
            batchErrors.push({
              uniqueId: uid,
              sheet: "contact_address",
              column: null,
              value: null,
              reason: "No matching contact_address row found for this unique_id",
            });
          } else {
            const addrErrs: GroupError[] = [];
            if (validateAddress(contactAddressRow, uid, "contact_address", addrErrs)) {
              finalContactAddress = contactAddressRow;
            } else {
              batchErrors.push(...addrErrs);
            }
          }

          validGroups.push({
            uniqueId: uid,
            company: companyRow,
            contact: contactRow,
            companyAddress: finalCompanyAddress,
            contactAddress: finalContactAddress,
          });
        }

        await this.dataSource.transaction(async (manager) => {
          if (validGroups.length > 0) {
            const companyIds = await this.nextvalBatch(manager, "company_id_seq", validGroups.length);
            const contactIds = await this.nextvalBatch(manager, "contact_id_seq", validGroups.length);
            const companyAddressGroups = validGroups.filter((grp) => grp.companyAddress);
            const contactAddressGroups = validGroups.filter((grp) => grp.contactAddress);
            const companyAddressIds = await this.nextvalBatch(manager, "address_id_seq", companyAddressGroups.length);
            const contactAddressIds = await this.nextvalBatch(manager, "address_id_seq", contactAddressGroups.length);
            const companyAddressMapIds = await this.nextvalBatch(
              manager,
              "company_address_id_seq",
              companyAddressGroups.length,
            );
            const contactAddressMapIds = await this.nextvalBatch(
              manager,
              "contact_address_id_seq",
              contactAddressGroups.length,
            );
            const companyContactMapIds = await this.nextvalBatch(
              manager,
              "company_contact_map_id_seq",
              validGroups.length,
            );

            // company
            {
              const createdViaSqlAt = new Date().toISOString();
              const valueRows: unknown[] = [];
              const placeholders = validGroups.map((grp, i) => {
                const base = valueRows.length;
                const trackingVals = companyTrackingCols.map((c) => {
                  if (c === "mig_ref_no") return grp.uniqueId;
                  if (c === "created_via_sql_lid") return TOGGLE_TYPE_YES;
                  if (c === "created_via_sql_at") return createdViaSqlAt;
                  if (c === "updated_via_sql_lid") return TOGGLE_TYPE_NO;
                  return null;
                });
                const vals = [companyIds[i], ...companyCols.map((c) => getVal(grp.company, c)), ...trackingVals];
                valueRows.push(...vals);
                return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
              });
              await manager.query(
                `INSERT INTO company (id, ${allCompanyInsertCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );

              validGroups.forEach((grp, i) => {
                successRecords.push({
                  unique_id: grp.uniqueId,
                  company_id: companyIds[i],
                  company_name: getVal(grp.company, "company_name"),
                  created_at: getVal(grp.company, "created_at"),
                });
              });
            }

            // contact
            {
              const valueRows: unknown[] = [];
              const placeholders = validGroups.map((grp, i) => {
                const base = valueRows.length;
                const vals = [contactIds[i], ...contactCols.map((c) => getVal(grp.contact, c))];
                valueRows.push(...vals);
                return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
              });
              await manager.query(
                `INSERT INTO contact (id, ${contactCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            // address (both company_address rows and contact_address rows
            // go into this one shared target table)
            const addressInsertRows: Array<{ id: number; row: Record<string, unknown> }> = [
              ...companyAddressGroups.map((grp, i) => ({ id: companyAddressIds[i], row: grp.companyAddress! })),
              ...contactAddressGroups.map((grp, i) => ({ id: contactAddressIds[i], row: grp.contactAddress! })),
            ];
            if (addressInsertRows.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = addressInsertRows.map(({ id, row }) => {
                const base = valueRows.length;
                const vals = [id, ...addressCols.map((c) => getVal(row, c))];
                valueRows.push(...vals);
                return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
              });
              await manager.query(
                `INSERT INTO address (id, ${addressCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            // company_address map
            if (companyAddressGroups.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = companyAddressGroups.map((grp, i) => {
                const companyIdx = validGroups.indexOf(grp);
                const base = valueRows.length;
                const vals = [companyAddressMapIds[i], companyIds[companyIdx], companyAddressIds[i], true];
                valueRows.push(...vals);
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
              });
              await manager.query(
                `INSERT INTO company_address (id, company_id, address_id, is_primary) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            // contact_address map
            if (contactAddressGroups.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = contactAddressGroups.map((grp, i) => {
                const contactIdx = validGroups.indexOf(grp);
                const base = valueRows.length;
                const vals = [contactAddressMapIds[i], contactIds[contactIdx], contactAddressIds[i]];
                valueRows.push(...vals);
                return `($${base + 1}, $${base + 2}, $${base + 3})`;
              });
              await manager.query(
                `INSERT INTO contact_address (id, contact_id, address_id) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            // company_contact_map
            {
              const valueRows: unknown[] = [];
              const placeholders = validGroups.map((grp, i) => {
                const base = valueRows.length;
                const vals = [companyContactMapIds[i], companyIds[i], contactIds[i]];
                valueRows.push(...vals);
                return `($${base + 1}, $${base + 2}, $${base + 3})`;
              });
              await manager.query(
                `INSERT INTO company_contact_map (id, company_id, contact_id) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            result.insertedIntoCompany += validGroups.length;
            result.insertedIntoContact += validGroups.length;
            result.insertedIntoAddress += companyAddressGroups.length + contactAddressGroups.length;
            result.insertedIntoCompanyAddress += companyAddressGroups.length;
            result.insertedIntoContactAddress += contactAddressGroups.length;
            result.insertedIntoCompanyContactMap += validGroups.length;
          }

          if (batchErrors.length > 0) {
            const valueRows: unknown[] = [];
            const placeholders = batchErrors.map((e) => {
              const base = valueRows.length;
              valueRows.push(runId, batchNumber, e.uniqueId || null, e.sheet, e.column, e.value, e.reason);
              return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
            });
            await manager.query(
              `INSERT INTO company_migration_error_log
                 (migration_run_id, batch_number, unique_id, sheet_name, column_name, bad_value, reason)
               VALUES ${placeholders.join(", ")}`,
              valueRows,
            );
          }
        });

        const errorGroupCount = new Set(batchErrors.map((e) => e.uniqueId)).size;
        result.validGroups += validGroups.length;
        result.errorGroups += errorGroupCount;
        result.batches.push({
          batchNumber,
          groupsRead: batchCompanyRows.length,
          validGroups: validGroups.length,
          errorGroups: errorGroupCount,
          status: "completed",
          durationMs: Date.now() - batchStart,
        });
      } catch (batchError) {
        this.logger.error({
          message: `Company migration batch ${batchNumber} failed`,
          error: batchError,
        });
        result.batches.push({
          batchNumber,
          groupsRead: batchCompanyRows.length,
          validGroups: 0,
          errorGroups: 0,
          status: "failed",
          error: batchError instanceof Error ? batchError.message : String(batchError),
        });
      }
    }

    // 10. Export ALL of this run's error records to a CSV for the client to
    // review — no dedup against prior runs (same reasoning as the policy
    // migration's final design): the bad data is corrected in the client's
    // own source system, not ours.
    try {
      const runErrors: Array<Record<string, unknown>> = await this.dataSource.query(
        `SELECT migration_run_id, batch_number, unique_id, sheet_name, column_name, bad_value, reason, created_at
         FROM company_migration_error_log
         WHERE migration_run_id = $1
         ORDER BY id`,
        [runId],
      );
      if (runErrors.length > 0) {
        result.errorCsvKey = await this.uploadCsvToS3(
          runErrors,
          ["migration_run_id", "batch_number", "unique_id", "sheet_name", "column_name", "bad_value", "reason", "created_at"],
          "migrate_company_error_log",
          `migrate_company_error_log_${runId}.csv`,
        );
      }
    } catch (exportError) {
      this.logger.error({
        message: `Failed to export/upload company migration error CSV: ${
          exportError instanceof Error ? exportError.message : String(exportError)
        } ${(exportError as { code?: string })?.code ? `[${(exportError as { code?: string }).code}]` : ""}`,
        migrationRunId: runId,
      });
    }

    // 11. Export every successfully-created company from this run to a CSV —
    // (unique_id, company_id, company_name, created_at) — for the client to
    // cross-reference against their source system.
    try {
      if (successRecords.length > 0) {
        result.successCsvKey = await this.uploadCsvToS3(
          successRecords,
          ["company_id", "unique_id", "company_name", "created_at"],
          "migrate_company_success_log",
          `migrate_company_success_log_${runId}.csv`,
        );
      }
    } catch (successExportError) {
      this.logger.error({
        message: `Failed to export/upload company migration success CSV: ${
          successExportError instanceof Error ? successExportError.message : String(successExportError)
        } ${(successExportError as { code?: string })?.code ? `[${(successExportError as { code?: string }).code}]` : ""}`,
        migrationRunId: runId,
      });
    }

    await this.logMigrationSummary(
      runId,
      "company_create",
      result.insertedIntoCompany,
      result.errorGroups,
      result.successCsvKey,
      result.errorCsvKey,
    );

    return result;
  }
}
