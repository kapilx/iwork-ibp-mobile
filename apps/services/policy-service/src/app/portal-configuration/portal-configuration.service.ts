import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { PortalConfigurationRepository, PolicyContactMetricPayload } from './portal-configuration.repository';
import { SearchHospitalDto } from './dto/search-hospital.dto';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { DataSource } from "typeorm";
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames, DEFAULT_VALUES } from '../../../../service-lib/src/lib/constants';
import { ENV } from '../../../../service-lib/src/lib/environment';
import {
  generatePasswordFromUser,
  generatePasswordFromConfig,
  applyPasswordProtection,
  streamToBuffer,
  UserDetailsForPassword,
} from '../../../../service-lib/src/lib/utils/password-protection.utils';
import { getFilePasswordConfigClient } from '../../../../service-lib/src/lib/service-communication/file-password-config-client';
import { POLICY_FAQ_HEADERS, FAQ_TEMPLATE_DEFAULTS } from '../../../../../../libs/service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import {
  downloadFromS3,
  generateExcel,
  uploadToS3
} from '../../../../service-lib/src/lib/utils/file-management.utils';
import {
  executeHospitalSearch,
  executeHospitalSearchByPolicyIds,
  executeGeospatialHospitalSearch,
  generateHospitalExport,
  getActivePolicyFeatureDocument,
  getPolicyLocationData,
} from '../../../../service-lib/src/lib/utils/portal-configuration.util';
import {
  HOSPITAL_TEMPLATE_HEADERS,
  MOCK_HOSPITAL_DATA,
  TEMPLATE_CONFIG ,
  HOSPITAL_UPLOAD_MESSAGES
} from '../../../../service-lib/src/lib/constants';
import { BulkUploadFaqDto } from './dto/bulk-upload-faq.dto';
import { BulkUploadFaqResponseDto } from './dto/bulk-upload-faq-response.dto';
import {
  ContactMatrixEntityDto,
  ContactMatrixLevelDto,
  UpdatePolicyContactMatrixDto,
} from './dto/contact-matrix.dto';
import {
  PortalContactDto,
  PortalContactsResponseDto,
} from './dto/portal-contact.dto';
import { PolicyTpaInsurerInfoDto } from './dto/policy-tpa-insurer-info.dto';
import {
  SubmittedContactsDto,
  SubmittedPartyContactsDto,
} from './dto/submitted-contacts.dto';
import {
  Contact,
  FileUpload,
  PolicyFaq,
  PolicyContactMetric,
  MstrHospital,
} from "../../../../service-lib/src/lib/entities";
import { TraceHttpService } from '../../../../service-lib/src/lib/trace-http.service';

export interface ProcessFileResponse {
  successCount: number;
  errorCount: number;
  errorFileId?: number;
  message: string;
  isReplaceAll?: boolean;
}

interface HospitalRowData {
  'Hospital Name': string;
  'Hospital Code': string;
  'Address': string;
  'City': string;
  'State': string;
  'Pin Code': string;
  'Email': string;
  'Phone': string;
  'Classification': string;
  _originalRowIndex: number;
  _originalRowData: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  rowData: HospitalRowData;
}



@Injectable()
export class PortalConfigurationService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly portalConfigurationRepository: PortalConfigurationRepository,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService,
    public readonly dataSource: DataSource,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  /**
   * Fetch module-specific password protection configuration from document-service
   */
  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl = ENV.URL_DOCUMENT_SERVICE || 'http://localhost:3013';
      const response = await this.traceHttpService.get(
        `${documentServiceUrl}/password-protection-config/${categoryKey}`
      );
      
      return response.data?.enablePassword ?? false;
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'PortalConfigurationService',
          method: 'getModulePasswordConfig',
          messageData: `Failed to fetch module config for ${categoryKey}, defaulting to false: ${error.message}`,
        }),
      });
      return false;
    }
  }

  async getUserDetails(userId: number): Promise<UserDetailsForPassword | null> {
    try {
      const user = await this.portalConfigurationRepository.getUserDetails(userId);
      if (!user) return null;
      
      return {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailId || '',
        mobileNumber: user.mobile || '',
        dob: user.dob || '',
        organisationKey: user.organisation?.organisationKey || '',
      };
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'PortalConfigurationService',
          method: 'getUserDetails',
          messageData: `Failed to fetch user details for userId ${userId}: ${error.message}`,
        }),
      });
      return null;
    }
  }

  getPolicyFaqs(
    policyId: number,
    category?: string,
    search?: string,
    page?: number,
    limit?: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PortalConfigurationService",
        method: "getPolicyFaqs",
        payload: {
          policyId,
          category: category || "ALL",
          search: search || "NONE",
          page,
          limit,
        },
        messageData: "Getting FAQs for policy",
      }),
    });

    try {
      if (!policyId) {
        throw new BadRequestException("Policy ID is required");
      }

      const safePage = page ?? DEFAULT_VALUES.PAGE;
      const safeLimit = limit ?? DEFAULT_VALUES.LIMIT;

      if (safePage < DEFAULT_VALUES.PAGE) {
        throw new BadRequestException("Page number must be greater than 0");
      }

      if (safeLimit < DEFAULT_VALUES.PAGE || safeLimit > DEFAULT_VALUES.MAX_LIMIT) {
        throw new BadRequestException(
          `Limit must be between ${DEFAULT_VALUES.PAGE} and ${DEFAULT_VALUES.MAX_LIMIT}`
        );
      }

      return this.portalConfigurationRepository.getPolicyFaqs(
        policyId,
        category,
        search,
        safePage,
        safeLimit
      ).then((result) => {
        const totalPages = Math.ceil(result.total / safeLimit);
        const transformedFaqs = result.faqs.map((faq) => ({
          id: faq.id,
          policyId: faq.policyId,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          isActive: faq.isActive,
          createdAt: faq.createdAt,
          updatedAt: faq.updatedAt,
        }));

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationService",
            method: "getPolicyFaqs",
            payload: {
              policyId,
              resultCount: transformedFaqs.length,
              totalCount: result.total,
              categoriesCount: result.availableCategories.length,
            },
            messageData: "Successfully retrieved FAQs for policy",
          }),
        });

        return {
          faqs: transformedFaqs,
          total: result.total,
          page: safePage,
          limit: safeLimit,
          totalPages,
          availableCategories: result.availableCategories,
        };
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "getPolicyFaqs",
          payload: {
            policyId,
            category: category || "ALL",
            search: search || "NONE",
            page,
            limit,
          },
          messageData: `Failed to get FAQs for policy: ${(error as Error).message}`,
        }),
      });
      throw error;
    }
  }

  async updatePolicyContactMatrix(
    policyId: number,
    payload: UpdatePolicyContactMatrixDto,
    userId: number
  ): Promise<{ policyId: number; updatedAt: Date }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationService",
        method: "updatePolicyContactMatrix",
        payload: {
          policyId,
          payload,
        },
        messageData: "Updating contact matrix for policy",
      }),
    });

    const entries = [
      ...this.buildContactMetricsEntries("TPA", payload.tpa),
      ...this.buildContactMetricsEntries("INSURER", payload.insurer),
    ];

    await this.portalConfigurationRepository.upsertPolicyContactMetrics(
      policyId,
      entries,
      userId
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationService",
        method: "updatePolicyContactMatrix",
        payload: {
          policyId,
          updatedEntries: entries.length,
        },
        messageData: "Contact matrix updated successfully",
      }),
    });

    return {
      policyId,
      updatedAt: new Date(),
    };
  }

  async getTpaContactsWithCommunication(
    tpaId: number
  ): Promise<PortalContactsResponseDto> {
    const contacts =
      await this.portalConfigurationRepository.getTpaContactsWithCommunication(
        tpaId
      );

    const payload = contacts.map((tpaContact) =>
      this.mapContactToPortalDto(tpaContact.linkedContact)
    );

    return {
      party: "TPA",
      entityId: tpaId,
      contacts: payload,
    };
  }

  async getInsurerContactsWithCommunication(
    insurerId: number
  ): Promise<PortalContactsResponseDto> {
    const contacts =
      await this.portalConfigurationRepository.getInsurerContactsWithCommunication(
        insurerId
      );

    const payload = contacts.map((insurerContact) =>
      this.mapContactToPortalDto(insurerContact.contact)
    );

    return {
      party: "INSURER",
      entityId: insurerId,
      contacts: payload,
    };
  }

  async getPolicyTpaInsurerInfo(
    policyId: number
  ): Promise<PolicyTpaInsurerInfoDto> {
    const result = await this.portalConfigurationRepository.getPolicyTpaInsurerInfo(
      policyId
    );

    return {
      policyId: result.policyId,
      tpa: {
        tpaId: result.tpa.id,
        name: result.tpa.name ?? null,
        displayName: result.tpa.displayName ?? null,
      },
      insurer: {
        insurerId: result.insurer.id,
        name: result.insurer.name ?? null,
        displayName: result.insurer.displayName ?? null,
      },
    };
  }

  async getSubmittedPolicyContacts(
    policyId: number,
    partyType: "TPA" | "INSURER"
  ): Promise<PortalContactsResponseDto> {
    const metrics =
      await this.portalConfigurationRepository.getSubmittedContactsForPolicy(
        policyId,
        partyType
      );

    const contacts = metrics
      .map((metric) => metric.contact)
      .filter((contact): contact is Contact => Boolean(contact));

    const payload = contacts.map((contact) =>
      this.mapContactToPortalDto(contact)
    );
    return {
      party: partyType,
      entityId: policyId,
      contacts: payload,
    };
  }

  async getSubmittedPolicyContactsCombined(
    policyId: number
  ): Promise<SubmittedContactsDto> {
    const [tpaMetrics, insurerMetrics] = await Promise.all([
      this.portalConfigurationRepository.getSubmittedContactsForPolicy(
        policyId,
        "TPA"
      ),
      this.portalConfigurationRepository.getSubmittedContactsForPolicy(
        policyId,
        "INSURER"
      ),
    ]);

    const buildPartyContacts = (
      metrics: PolicyContactMetric[]
    ): SubmittedPartyContactsDto => {
      const partyContacts = new SubmittedPartyContactsDto();
      for (const metric of metrics) {
        if (!metric.contact) {
          continue;
        }

        const contactDto = this.mapContactToPortalDto(metric.contact);

        if (metric.contactLevel === "PRIMARY") {
          partyContacts.primary = contactDto;
        }

        if (metric.contactLevel === "SECONDARY") {
          partyContacts.secondary = contactDto;
        }
      }

      return partyContacts;
    };

    return {
      policyId,
      tpa: buildPartyContacts(tpaMetrics),
      insurer: buildPartyContacts(insurerMetrics),
    };
  }

  private mapContactToPortalDto(contact: Contact): PortalContactDto {
    const communications = contact.communicationDetails ?? [];
    const phone = communications.find((detail) =>
      detail.communicationType?.toLowerCase().includes("phone")
    );
    const email = communications.find((detail) =>
      detail.communicationType?.toLowerCase().includes("email")
    );

    return {
      contactId: contact.id ?? 0,
      displayName: contact.displayName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      designation: contact.designation,
      department: contact.department,
      phone: phone?.communicationDetails ?? "",
      email: email?.communicationDetails ?? "",
    };
  }

  private buildContactMetricsEntries(
    partyType: "TPA" | "INSURER",
    entity?: ContactMatrixEntityDto
  ): PolicyContactMetricPayload[] {
    if (!entity) {
      return [];
    }

    const entries: PolicyContactMetricPayload[] = [];

    if (entity.primary) {
      entries.push(
        this.buildContactMetricEntry(
          partyType,
          "PRIMARY",
          entity.primary,
          true
        )
      );
    }

    if (entity.secondary) {
      entries.push(
        this.buildContactMetricEntry(
          partyType,
          "SECONDARY",
          entity.secondary,
          false
        )
      );
    }

    return entries;
  }

  private buildContactMetricEntry(
    partyType: "TPA" | "INSURER",
    level: "PRIMARY" | "SECONDARY",
    data: ContactMatrixLevelDto,
    isPrimary: boolean
  ): PolicyContactMetricPayload {
    const metric: PolicyContactMetricPayload = {
      partyType,
      contactLevel: level,
      isPrimary,
      contactId: data.contactId,
    };

    if (partyType === "TPA") {
      if (!data.tpaId) {
        throw new BadRequestException(
          "TPA id is required for contact matrix entries"
        );
      }
      metric.tpaId = data.tpaId;
    } else {
      if (!data.insurerId) {
        throw new BadRequestException(
          "Insurer id is required for contact matrix entries"
        );
      }
      metric.insurerId = data.insurerId;
    }

    return metric;
  }

  getFaqUploads(policyId?: number, page?: number, limit?: number) {
    try {
      let safePage = page ?? DEFAULT_VALUES.PAGE;
      let safeLimit = limit ?? DEFAULT_VALUES.LIMIT;

      if (safePage < DEFAULT_VALUES.PAGE) safePage = DEFAULT_VALUES.PAGE;
      if (safeLimit < DEFAULT_VALUES.PAGE || safeLimit > DEFAULT_VALUES.MAX_LIMIT) {
        safeLimit = DEFAULT_VALUES.LIMIT;
      }
      if (policyId !== undefined && policyId < DEFAULT_VALUES.PAGE) {
        throw new Error("Invalid policy ID");
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "getFaqUploads",
          payload: { policyId, page: safePage, limit: safeLimit },
          messageData: "Fetching FAQ uploads",
        }),
      });

      return this.portalConfigurationRepository
        .getFaqUploads(policyId, safePage, safeLimit)
        .then(({ data, total }) => {
          const totalPages = Math.ceil(total / safeLimit);

          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "PortalConfigurationService",
              method: "getFaqUploads",
              payload: { policyId, page: safePage, limit: safeLimit },
              messageData: `Successfully retrieved ${data.length} FAQ uploads`,
            }),
          });

          return { data, total, page: safePage, limit: safeLimit, totalPages };
        });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "getFaqUploads",
          payload: { policyId, page, limit },
          messageData: `Failed to get FAQ uploads: ${(error as Error).message}`,
        }),
      });
      throw error;
    }
  }

 async generatePolicyFaqExport(policyId: number, userDetails: UserDetailsForPassword | null) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PortalConfigurationService",
        method: "generatePolicyFaqExport",
        payload: { policyId },
        messageData: "Generating active FAQ export for policy",
      }),
    });

    try {
      const policy = await this.portalConfigurationRepository.getPolicyById(policyId);

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      const faqs = await this.portalConfigurationRepository.getActivePolicyFaqs(policyId);

      if (!faqs.length) {
        throw new NotFoundException(
          `No active FAQs found for policy with ID ${policyId}`
        );
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Policy FAQs");

      const headerRow = worksheet.addRow([
        POLICY_FAQ_HEADERS.SNO,
        POLICY_FAQ_HEADERS.CATEGORY,
        POLICY_FAQ_HEADERS.FAQ_QUESTION,
        POLICY_FAQ_HEADERS.FAQ_ANSWER,
      ]);
      headerRow.font = { bold: true };

      worksheet.columns.forEach((column, index) => {
        if (index === 0) column.width = 10;
        else if (index === 1) column.width = 25;
        else if (index === 2) column.width = 60;
        else if (index === 3) column.width = 90;
      });

      faqs.forEach((faq, index) => {
        worksheet.addRow([
          index + 1,
          faq.category || "",
          faq.question || "",
          faq.answer || "",
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const policyNumber = (policy as any)?.insurerPolicyNumber || policyId;
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `Policy_${policyNumber}_Active_FAQs_${currentDate}.xlsx`;

      // Apply password protection
      const configClient = getFilePasswordConfigClient();
      const passwordConfig = await configClient.getConfiguration();
      const password = generatePasswordFromConfig(passwordConfig, userDetails);
      const isModulePasswordEnabled = await this.getModulePasswordConfig('policies');

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'PortalConfigurationService',
          method: 'generatePolicyFaqExport',
          payload: { policyId, moduleKey: 'policies', isModulePasswordEnabled, passwordType: passwordConfig?.passwordType },
          messageData: `Module password protection flag: ${isModulePasswordEnabled}, using ${passwordConfig?.passwordType || 'default'} password type`,
        }),
      });

      const protectedFile = await applyPasswordProtection(
        Buffer.from(buffer),
        fileName,
        password,
        'policies',
        isModulePasswordEnabled
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "generatePolicyFaqExport",
          payload: { policyId, fileName, faqCount: faqs.length },
          messageData: "Active FAQ export generated successfully",
        }),
      });

      return {
        stream: Readable.from(protectedFile.data),
        fileName: protectedFile.fileName,
        mimeType: protectedFile.mimeType,
        contentLength: protectedFile.data.length,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "generatePolicyFaqExport",
          payload: { policyId },
          messageData:
            error instanceof Error
              ? `Failed to generate FAQ export: ${error.message}`
              : "Failed to generate FAQ export",
        }),
      });

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to generate FAQ export: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async generateFaqTemplate(policyId: number, userDetails: UserDetailsForPassword | null) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "generateFaqTemplate",
          payload: { policyId },
          messageData: "generating FAQ template",
        }),
      });

      const policy = await this.portalConfigurationRepository.getPolicyById(
        policyId
      );

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(FAQ_TEMPLATE_DEFAULTS.TEMPLATE_NAME);

      const headerRow = worksheet.addRow(Object.values(POLICY_FAQ_HEADERS));
      headerRow.font = { bold: true };
      headerRow.fill = FAQ_TEMPLATE_DEFAULTS.TEMPLATE_FONT_STYLES as any;

      worksheet.columns.forEach((column, index) => {
        if (index === 0) column.width = 10;
        else if (index === 1) column.width = 20;
        else if (index === 2) column.width = 50;
        else if (index === 3) column.width = 80;
      });

      const instructionsSheet = workbook.addWorksheet(
        FAQ_TEMPLATE_DEFAULTS.INSTRUCTIONS_SHEET_NAME
      );
      const instructions = FAQ_TEMPLATE_DEFAULTS.FAQ_TEMPLATE_INSTRUCTIONS;

      instructions.forEach((instruction) => {
        instructionsSheet.addRow([instruction]);
      });

      instructionsSheet.columns.forEach((column) => {
        column.width = 60;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const policyNumber = policy?.insurerPolicyNumber || policyId;
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `FAQ_Template_Policy_${policyNumber}_${currentDate}.xlsx`;

      // Apply password protection
      const configClient = getFilePasswordConfigClient();
      const passwordConfig = await configClient.getConfiguration();
      const password = generatePasswordFromConfig(passwordConfig, userDetails);
      const isModulePasswordEnabled = await this.getModulePasswordConfig('policies');

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'PortalConfigurationService',
          method: 'generateFaqTemplate',
          payload: { policyId, moduleKey: 'policies', isModulePasswordEnabled, passwordType: passwordConfig?.passwordType },
          messageData: `Module password protection flag: ${isModulePasswordEnabled}, using ${passwordConfig?.passwordType || 'default'} password type`,
        }),
      });

      const protectedFile = await applyPasswordProtection(
        Buffer.from(buffer),
        fileName,
        password,
        'policies',
        isModulePasswordEnabled
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "generateFaqTemplate",
          payload: {
            policyId,
            fileName,
          },
          messageData: "FAQ template generated successfully",
        }),
      });

      return {
        stream: Readable.from(protectedFile.data),
        fileName: protectedFile.fileName,
        mimeType: protectedFile.mimeType,
        contentLength: protectedFile.data.length,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "generateFaqTemplate",
          payload: { policyId },
          messageData: 
            error instanceof Error ? error.message : String(error),
        }),
      });

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to generate FAQ template: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async bulkUploadFaq(
    dto: BulkUploadFaqDto,
    userId: number
  ): Promise<BulkUploadFaqResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationService",
        method: "bulkUploadFaq",
        payload: {
          policyId: dto.policyId,
          fileId: dto.fileId,
          userId,
        },
        messageData: "Starting FAQ bulk upload",
      }),
    });

    return await this.dataSource.transaction(async (manager) => {
      try {
        // 1. Validate policy and get file details
        const { fileUpload, policyExists } =
          await this.portalConfigurationRepository.getFileUploadWithPolicy(
            dto.fileId,
            dto.policyId
          );

        if (!policyExists) {
          throw new NotFoundException(
            `Policy with ID ${dto.policyId} not found`
          );
        }

        if (!fileUpload) {
          throw new NotFoundException(`File with ID ${dto.fileId} not found`);
        }

        // 2. Process Excel file and validate data
        const { validFaqs, errors, processedCount } =
          await this.processExcelFile(fileUpload, dto.policyId, userId);

        // 3. Handle database operations based on validation results
        let result;
        if (errors.length > 0) {
          // Has validation errors
          result = await this.portalConfigurationRepository.bulkUploadFaqWithErrors(
            dto.policyId,
            fileUpload,
            validFaqs,
            errors,
            dto.replaceAll,
            userId,
            manager
          );
        } else {
          // No validation errors
          result = await this.portalConfigurationRepository.bulkUploadFaqData(
            dto.policyId,
            fileUpload,
            validFaqs,
            dto.replaceAll,
            userId,
            manager
          );
        }

        const response: BulkUploadFaqResponseDto = {
          uploadId: result.uploadId,
          processedCount,
          successCount: result.successCount,
          errorCount: errors.length,
          errors,
          status: result.finalStatus,
          replacedExisting: dto.replaceAll,
        };

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "PortalConfigurationService",
            method: "bulkUploadFaq",
            payload: {
              uploadId: result.uploadId,
              processedCount,
              successCount: result.successCount,
              errorCount: errors.length,
              errors,
              status: result.finalStatus,
              replacedExisting: dto.replaceAll,
            },
            messageData: "FAQ bulk upload completed",
          }),
        });

        return response;
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "PortalConfigurationService",
            method: "bulkUploadFaq",
            payload: { policyId: dto.policyId, fileId: dto.fileId, userId },
            messageData:
              error instanceof Error
                ? error.message
                : String(error) || "Failed to bulk upload FAQ",
          }),
        });

        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException(
          `Failed to process FAQ bulk upload: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }


  private async processExcelFile(
    fileUpload: FileUpload,
    policyId: number,
    userId: number
  ): Promise<{
    validFaqs: Partial<PolicyFaq>[];
    errors: string[];
    processedCount: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationService",
        method: "processExcelFile",
        payload: {
          fileId: fileUpload.id,
          policyId,
          userId,
        },
        messageData: "FAQ excel file processing started",
      }),
    });

    try {
      // 1. Download and load Excel file
      const fileBuffer = await downloadFromS3(fileUpload.fileKey);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException("Excel file contains no worksheets");
      }

      // 2. Parse and validate data
      const errors: string[] = [];
      const validFaqs: Partial<PolicyFaq>[] = [];
      let processedCount = 0;

      // Get header row (assume first row contains headers)
      const headerRow = worksheet.getRow(1);
      const headers = this.mapExcelHeaders(headerRow);

      // Validate required headers exist
      if (!headers.category || !headers.question || !headers.answer) {
        throw new BadRequestException(
          `Missing required headers. Expected: ${Object.values(
            POLICY_FAQ_HEADERS
          ).join(", ")}`
        );
      }

      // Process data rows (skip header row)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        processedCount++;

        // Check if row is empty
        if (row.cellCount === 0 || !row.hasValues) {
          continue;
        }

        const rowData = this.extractRowData(row, headers, rowNumber);

        if (rowData.errors.length > 0) {
          errors.push(...rowData.errors);
          continue;
        }

        validFaqs.push({
          policyId,
          category: rowData.category!.trim().toLocaleUpperCase(),
          question: rowData.question!,
          answer: rowData.answer!,
          isActive: true,
          createdBy: userId,
        });
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationService",
          method: "processExcelFile",
          payload: {
            processedCount,
            validFaqsCount: validFaqs.length,
            errorsCount: errors.length,
          },
          messageData: "Excel file processing completed",
        }),
      });

      return {
        validFaqs,
        errors,
        processedCount,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "processExcelFile",
          payload: {
            fileId: fileUpload.id,
            policyId: policyId,
            userId: userId,
          },
          messageData:
            error instanceof Error
              ? error.message
              : String(error) || "Failed to process Excel file",
        }),
      });
      throw error;
    }
  }


  private mapExcelHeaders(headerRow: ExcelJS.Row): { [key: string]: number } {
    const headers: { [key: string]: number } = {};

    headerRow.eachCell((cell, colNumber) => {
      const cellValue = cell.value?.toString().trim().toLowerCase();
      if (cellValue) {
        // Map header values to expected keys
        if (
          cellValue.includes("category") ||
          cellValue === POLICY_FAQ_HEADERS.CATEGORY.toLowerCase()
        ) {
          headers.category = colNumber;
        } else if (
          cellValue.includes("question") ||
          cellValue === POLICY_FAQ_HEADERS.FAQ_QUESTION.toLowerCase()
        ) {
          headers.question = colNumber;
        } else if (
          cellValue.includes("answer") ||
          cellValue === POLICY_FAQ_HEADERS.FAQ_ANSWER.toLowerCase()
        ) {
          headers.answer = colNumber;
        }
      }
    });

    return headers;
  }

  private extractRowData(
    row: ExcelJS.Row,
    headers: { [key: string]: number },
    rowNumber: number
  ): {
    category?: string;
    question?: string;
    answer?: string;
    errors: string[];
  } {
    const category = row.getCell(headers.category).value?.toString().trim();
    const question = row.getCell(headers.question).value?.toString().trim();
    const answer = row.getCell(headers.answer).value?.toString().trim();

    // Validate required fields
    const errors: string[] = [];

    if (!category) {
      errors.push(`Row ${rowNumber}: Category is required`);
    } else if (category.length > 100) {
      errors.push(`Row ${rowNumber}: Category cannot exceed 100 characters`);
    }

    if (!question) {
      errors.push(`Row ${rowNumber}: Question is required`);
    }

    if (!answer) {
      errors.push(`Row ${rowNumber}: Answer is required`);
    }

    return {
      category,
      question,
      answer,
      errors,
    };
  }



  createPolicyFeatureDocument(policyId: number, documentId: number, userId: number) {
    return (async () => {
      try {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationService",
            method: "createPolicyFeatureDocument",
            payload: { policyId, documentId, userId },
            messageData: "Creating policy feature document",
          }),
        });

        const fileUpload = await this.portalConfigurationRepository.getFileUploadById(documentId);

        if (!fileUpload) {
          throw new NotFoundException('Document not found in file uploads');
        }

        const existingDocuments = await this.portalConfigurationRepository.getActivePolicyFeatureDocument(policyId);
        const isReplacement = existingDocuments.count > 0;

        if (existingDocuments.count > 0 && (existingDocuments.data as { id: number }[]).length > 0) {
          const existingDocument = (existingDocuments.data[0] as { id: number });
          await this.portalConfigurationRepository.markAsReplacedPolicyFeatureDocument(existingDocument.id, userId);
        }

        const policyFeatureDocument = await this.portalConfigurationRepository.createPolicyFeatureDocument(
          policyId,
          documentId,
          userId
        );

        const operationType = isReplacement ? 'replaced' : 'created';
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationService",
            method: "createPolicyFeatureDocument",
            payload: { policyId, documentId, result: policyFeatureDocument, operationType },
            messageData: `Policy feature document ${operationType} successfully`,
          }),
        });

        return {
          id: policyFeatureDocument.id,
          policyId: policyFeatureDocument.policyId,
          documentId: policyFeatureDocument.documentId,
          status: policyFeatureDocument.status,
          createdAt: policyFeatureDocument.createdAt,
          updatedAt: policyFeatureDocument.updatedAt,
          createdBy: policyFeatureDocument.createdBy,
          updatedBy: policyFeatureDocument.updatedBy,
          isReplacement,
        };
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "PortalConfigurationService",
            method: "createPolicyFeatureDocument",
            payload: { policyId, documentId, userId },
            messageData: `Failed to create policy feature document: ${(error as Error).message}`,
          }),
        });
        throw error;
      }
    })();
  }

  deletePolicyFeatureDocument(policyId: number, userId: number) {
    return (async () => {
      try {
        const existingDocuments =
          await this.portalConfigurationRepository.getActivePolicyFeatureDocument(
            policyId
          );

        if (!existingDocuments.count) {
          throw new NotFoundException(
            "No active policy feature document found to delete"
          );
        }

        const { deletedCount } =
          await this.portalConfigurationRepository.deleteActivePolicyFeatureDocument(
            policyId,
            userId
          );

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationService",
            method: "deletePolicyFeatureDocument",
            payload: { policyId, userId, deletedCount },
            messageData: "Policy feature document deleted successfully",
          }),
        });

        return { policyId, deletedCount };
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "PortalConfigurationService",
            method: "deletePolicyFeatureDocument",
            payload: { policyId, userId },
            messageData: `Failed to delete policy feature document: ${(error as Error).message}`,
          }),
        });
        throw error;
      }
    })();
  }

  getActivePolicyFeatureDocument(policyId: number) {
    return getActivePolicyFeatureDocument({
      repository: this.portalConfigurationRepository,
      policyId,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  getPolicyFeatureDocumentUploadHistory(policyId: number, page?: string, limit?: string) {
    return this.portalConfigurationRepository.getPolicyFeatureDocumentUploadHistory(policyId, page, limit);
  }

  async getHospitals(params: { page: number; limit: number }): Promise<{ data: unknown[]; count: number }> {
    const traceId = this.traceIdService.traceId;
    console.log(`PortalConfigurationService.getHospitals - TraceId: ${traceId}`);
    
    try {
      const result = await this.portalConfigurationRepository.getHospitals(params);
      console.log(`Successfully retrieved hospitals - TraceId: ${traceId}`);
      return result;
    } catch (error) {
      console.error(`Error retrieving hospitals - TraceId: ${traceId}, Error: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async searchHospitals(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{ data: unknown[]; count: number; networkHospitalCount: number; excludedHospitalCount: number }> {
    try {
      // Check if this is a geospatial query (both latitude and longitude provided)
      const isGeospatialQuery = searchParams.latitude !== undefined && searchParams.longitude !== undefined;
      
      if (isGeospatialQuery) {
        // Use geospatial search utility with radius
        const radiusInMeters = searchParams.radius ? searchParams.radius * 1000 : 5000; // Default 5km
        const page = searchParams.page || DEFAULT_VALUES.PAGE;
        const limit = searchParams.limit || DEFAULT_VALUES.LIMIT;
        
        return await executeGeospatialHospitalSearch({
          repository: this.portalConfigurationRepository,
          policyId,
          userLatitude: searchParams.latitude!,
          userLongitude: searchParams.longitude!,
          radiusInMeters,
          page,
          limit,
          isNetworkHospital: searchParams.isNetworkHospital,
          logger: this.logger,
          traceIdService: this.traceIdService,
        });
      } else {
        // Use regular search
        return await executeHospitalSearch({
          repository: this.portalConfigurationRepository,
          policyId,
          searchParams,
          userId,
          logger: this.logger,
          traceIdService: this.traceIdService,
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "searchHospitals",
          payload: { policyId, searchParams },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  async searchHospitalsByPolicyIds(
    policyIds: number[],
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{ data: unknown[]; count: number; networkHospitalCount: number; excludedHospitalCount: number }> {
    try {
      const isGeospatialQuery =
        searchParams.latitude !== undefined && searchParams.longitude !== undefined;

      if (isGeospatialQuery) {
        const radiusInMeters = searchParams.radius ? searchParams.radius * 1000 : 5000;
        const page = searchParams.page || DEFAULT_VALUES.PAGE;
        const limit = searchParams.limit || DEFAULT_VALUES.LIMIT;
        const offset = (page - 1) * limit;

        const perPolicyResults = await Promise.all(
          policyIds.map((policyId) =>
            executeGeospatialHospitalSearch({
              repository: this.portalConfigurationRepository,
              policyId,
              userLatitude: searchParams.latitude!,
              userLongitude: searchParams.longitude!,
              radiusInMeters,
              page: DEFAULT_VALUES.PAGE,
              limit: 10000,
              isNetworkHospital: searchParams.isNetworkHospital,
              logger: this.logger,
              traceIdService: this.traceIdService,
            })
          )
        );

        const dedupedMap = new Map<number, any>();
        for (const result of perPolicyResults) {
          for (const hospital of result.data as any[]) {
            const existing = dedupedMap.get(hospital.id);
            if (!existing) {
              dedupedMap.set(hospital.id, hospital);
              continue;
            }

            if ((hospital.distanceInMeters ?? Number.MAX_SAFE_INTEGER) < (existing.distanceInMeters ?? Number.MAX_SAFE_INTEGER)) {
              dedupedMap.set(hospital.id, {
                ...hospital,
                isNetworkHospital: Boolean(existing.isNetworkHospital || hospital.isNetworkHospital),
              });
            } else if (hospital.isNetworkHospital) {
              dedupedMap.set(hospital.id, {
                ...existing,
                isNetworkHospital: true,
              });
            }
          }
        }

        const deduped = Array.from(dedupedMap.values()).sort(
          (a, b) => (a.distanceInMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceInMeters ?? Number.MAX_SAFE_INTEGER)
        );
        const paged = deduped.slice(offset, offset + limit);

        return {
          data: paged,
          count: deduped.length,
          networkHospitalCount: paged.filter((item) => item.isNetworkHospital).length,
          excludedHospitalCount: paged.filter((item) => !item.isNetworkHospital).length,
        };
      }

      return await executeHospitalSearchByPolicyIds({
        repository: this.portalConfigurationRepository,
        policyIds,
        searchParams,
        userId,
        logger: this.logger,
        traceIdService: this.traceIdService,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "searchHospitalsByPolicyIds",
          payload: { policyIds, searchParams },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Generate Excel template with mock hospital data
   * Template is policy-independent and uses entity column headers
   * Returns a stream similar to exportHospitalsToExcel method
   */
  async generateTemplate(
    userDetails: UserDetailsForPassword | null
  ): Promise<{ stream: Readable; fileName: string; mimeType: string; contentLength: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "generateTemplate",
          payload: {},
          messageData: "generating hospital template",
        }),
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(TEMPLATE_CONFIG.sheetName);

      // Add headers from entity columns using constants from service-lib
      const headerRow = worksheet.addRow(HOSPITAL_TEMPLATE_HEADERS);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add mock hospital data using constants from service-lib
      MOCK_HOSPITAL_DATA.forEach((hospital: {
        hospitalName: string;
        hospitalCode: string;
        address: string;
        city: string;
        state: string;
        pinCode: string;
        email: string;
        phone: string;
        classification: string;
      }) => {
        worksheet.addRow([
          hospital.hospitalName,
          hospital.hospitalCode,
          hospital.address,
          hospital.city,
          hospital.state,
          hospital.pinCode,
          hospital.email,
          hospital.phone,
          hospital.classification,
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      // Add instructions sheet using constants from service-lib
      const instructionsSheet = workbook.addWorksheet('Instructions');
      TEMPLATE_CONFIG.instructions.forEach((instruction: string) => {
        instructionsSheet.addRow([instruction]);
      });

      const buffer = await workbook.xlsx.writeBuffer();

      // Create filename using constants from service-lib
      const fileName = TEMPLATE_CONFIG.fileName;

      // Apply password protection
      const configClient = getFilePasswordConfigClient();
      const passwordConfig = await configClient.getConfiguration();
      const password = generatePasswordFromConfig(passwordConfig, userDetails);
      const isModulePasswordEnabled = await this.getModulePasswordConfig('policies');

      const protectedFile = await applyPasswordProtection(
        Buffer.from(buffer),
        fileName,
        password,
        'policies',
        isModulePasswordEnabled
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "generateTemplate",
          payload: { 
            recordsCount: MOCK_HOSPITAL_DATA.length,
            fileName 
          },
          messageData: "template generated successfully",
        }),
      });

      // Create readable stream from buffer (same as file-upload service)
      const stream = Readable.from(protectedFile.data);
      
      return {
        stream,
        fileName: protectedFile.fileName,
        mimeType: protectedFile.mimeType,
        contentLength: protectedFile.data.length
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "generateTemplate",
          payload: {},
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Export hospitals data to Excel file
   * Returns a stream similar to file-upload service download method
   */
  async exportHospitalsToExcel(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{ stream: Readable; fileName: string; mimeType: string; contentLength: number }> {
    const result = await generateHospitalExport({
      repository: this.portalConfigurationRepository,
      policyId,
      searchParams,
      userId,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });

    const userDetails = await this.getUserDetails(userId);
    const buffer = await streamToBuffer(result.stream);

    const configClient = getFilePasswordConfigClient();
    const passwordConfig = await configClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, userDetails);
    const isModulePasswordEnabled = await this.getModulePasswordConfig('policies');

    const protectedFile = await applyPasswordProtection(
      buffer,
      result.fileName,
      password,
      'policies',
      isModulePasswordEnabled
    );

    return {
      stream: Readable.from(protectedFile.data),
      fileName: protectedFile.fileName,
      mimeType: protectedFile.mimeType,
      contentLength: protectedFile.data.length,
    };
  }

  /**
   * Get available states and cities for hospitals in a policy
   * Returns all states by default, or cities for a specific state
   */
  async getLocationData(
    policyId: number,
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }> {
    try {
      return await getPolicyLocationData({
        repository: this.portalConfigurationRepository,
        policyId,
        state,
        logger: this.logger,
        traceIdService: this.traceIdService,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "getLocationData",
          payload: { policyId, state },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Get upload tracking history for a specific policy
   * Returns paginated list of file upload tracking records with user details
   */
  async getUploadHistory(
    policyId: number,
    page = 1,
    limit?: number
  ): Promise<{ data: unknown[]; count: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "getUploadHistory",
          payload: { policyId, page, limit },
          messageData: "retrieving upload history",
        }),
      });

      const result = await this.portalConfigurationRepository.getHospitalUploadTracking(
        policyId,
        page,
        limit
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "getUploadHistory",
          payload: { policyId, count: result.count },
          messageData: "upload history retrieved successfully",
        }),
      });

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "getUploadHistory",
          payload: { policyId, page, limit },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Process hospitals Excel file upload by fileId
   * Downloads file from S3, normalizes data and maps to existing records where possible
   */
  async processHospitalFileUpload(
    fileId: number,
    policyId: number,
    userId: number,
    isReplaceAll = false
  ): Promise<{
    success: boolean;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    uploadTrackingId: number;
    isReplaceAll: boolean;
    message: string;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "processHospitalFileUpload",
          payload: { policyId, fileId, userId },
          messageData: "starting hospital file upload processing",
        }),
      });

      // Get file details from file_uploads table
      const fileRecord = await this.portalConfigurationRepository.findFileById(fileId);
      if (!fileRecord) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      // Create upload tracking record with PROCESSING status
      const uploadTracking = await this.portalConfigurationRepository.createUploadTracking({
        policyId,
        fileId,
        status: 'PROCESSING',
        uploadedBy: userId,
      });

      try {
        // Download file from S3 using fileKey
        const buffer = await downloadFromS3(fileRecord.fileKey);

        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays to preserve original structure
        const rawData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        }) as string[][];

        if (!rawData || rawData.length === 0) {
          throw new BadRequestException('Excel file is empty or invalid');
        }

        // First row should contain headers
        const headers = rawData[0];
        if (!headers || headers.length === 0) {
          throw new BadRequestException('Excel file must contain headers');
        }

        // Validate headers match template
        const expectedHeaders = HOSPITAL_TEMPLATE_HEADERS;
        const missingHeaders = expectedHeaders.filter((header: string) => !headers.includes(header));
        if (missingHeaders.length > 0) {
          throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        // Convert data rows to objects using headers
        const dataRows = rawData.slice(1); // Skip header row
        if (dataRows.length === 0) {
          throw new BadRequestException('Excel file contains no data rows');
        }

        const hospitalData: HospitalRowData[] = dataRows.map((row, index) => {
          const rowData = {
            'Hospital Name': '',
            'Hospital Code': '',
            'Address': '',
            'City': '',
            'State': '',
            'Pin Code': '',
            'Email': '',
            'Phone': '',
            'Classification': '',
            _originalRowIndex: index + 2,
            _originalRowData: row
          } as HospitalRowData;
          
          headers.forEach((header, colIndex) => {
            if (HOSPITAL_TEMPLATE_HEADERS.includes(header)) {
              (rowData as unknown as Record<string, string>)[header] = row[colIndex] || '';
            }
          });
          return rowData;
        });

        // Store initial total records count (this is the actual uploaded file row count)
        const totalRecords = hospitalData.length;

        // Handle replace all logic - delete existing mappings if requested
        if (isReplaceAll) {
          await this.portalConfigurationRepository.deleteAllPolicyHospitalMappings(policyId);
          
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "PortalConfigurationService",
              method: "processHospitalFileUpload",
              payload: { policyId, isReplaceAll },
              messageData: "existing hospital mappings deleted for replace all operation",
            }),
          });
        }

        // Process hospitals with normalization and validation
        const result = await this.processHospitalData(
          hospitalData,
          policyId,
          userId,
          isReplaceAll
        );

        // Handle errors - create error Excel file if there are errors
        let errorFileId: number | null = null;
        if (result.errors.length > 0) {
          // Extract filename from fileKey or use a default name
          const fileName = fileRecord.fileKey.split('/').pop() || `hospital_upload_${fileId}.xlsx`;
          errorFileId = await this.createErrorFile(result.errors, fileName, userId);
        }

        // Update upload tracking with results (including total records)
        await this.portalConfigurationRepository.updateUploadTracking(uploadTracking.id, {
          successCount: result.successCount,
          errorCount: result.errorCount,
          networkHospitalCount: result.networkHospitalCount,
          excludedHospitalCount: result.excludedHospitalCount,
          totalRecords: totalRecords, // NEW: Store initial file row count
          errorFileId,
          status: result.errorCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        });

        // Determine response message based on success/error counts
        let responseMessage: string;
        if (result.errorCount === 0) {
          // All success
          responseMessage = HOSPITAL_UPLOAD_MESSAGES.ALL_SUCCESS;
        } else if (result.successCount === 0) {
          // All failed
          responseMessage = HOSPITAL_UPLOAD_MESSAGES.ALL_FAILED;
        } else {
          // Partial success - replace placeholder with actual error count
          responseMessage = HOSPITAL_UPLOAD_MESSAGES.PARTIAL_SUCCESS.replace('{errorCount}', result.errorCount.toString());
        }

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationService",
            method: "processHospitalFileUpload",
            payload: { 
              policyId, 
              totalProcessed: result.totalProcessed,
              successCount: result.successCount,
              errorCount: result.errorCount,
              uploadTrackingId: uploadTracking.id,
              message: responseMessage
            },
            messageData: "hospital file upload processing completed",
          }),
        });

        return {
          success: result.errorCount === 0,
          totalProcessed: result.totalProcessed,
          successCount: result.successCount,
          errorCount: result.errorCount,
          uploadTrackingId: uploadTracking.id,
          isReplaceAll,
          message: responseMessage,
        };

      } catch (processingError) {
        // Update tracking record with FAILED status
        await this.portalConfigurationRepository.updateUploadTracking(uploadTracking.id, {
          status: 'FAILED',
          successCount: 0,
          errorCount: 0,
        });
        throw processingError;
      }

    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "processHospitalFileUpload",
          payload: { policyId, fileId, userId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Process hospital data with normalization and validation
   */
  private async processHospitalData(
    hospitalData: HospitalRowData[],
    policyId: number,
    userId: number,
    isReplaceAll = false
  ): Promise<{
    success: boolean;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
    errors: ValidationError[];
  }> {
    const errors: ValidationError[] = [];
    let successCount = 0;
    let networkHospitalCount = 0;
    let excludedHospitalCount = 0;
    const failedRows = new Set<number>(); // Track failed row numbers for accurate error count
    const processedHospitals = new Set<string>();

    for (let i = 0; i < hospitalData.length; i++) {
      const hospital = hospitalData[i];
      const rowIndex = hospital._originalRowIndex;

      try {
        // Validate mandatory fields
        const validationErrors = this.validateHospitalRow(hospital, rowIndex);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          failedRows.add(rowIndex); // Track this row as failed
          continue;
        }

        // Get both original and normalized hospital data
        const hospitalData = this.normalizeHospitalData(hospital);
        
        // Check for duplicates within file using normalized values
        const hospitalKey = `${hospitalData.normalized.name}-${hospitalData.normalized.address}`;
        if (processedHospitals.has(hospitalKey)) {
          errors.push({
            row: rowIndex,
            field: 'Hospital Name',
            message: 'Duplicate hospital found in file',
            rowData: hospital
          });
          failedRows.add(rowIndex); // Track this row as failed
          continue;
        }
        processedHospitals.add(hospitalKey);

        // Check if hospital already exists using normalized values for comparison
        const existingHospital = await this.findExistingHospital(
          hospitalData.normalized.name,
          hospitalData.normalized.address,
          hospitalData.normalized.city,
          hospitalData.normalized.state
        );
        let hospitalId: number;
        if (existingHospital) {
          hospitalId = existingHospital.id;

          await this.portalConfigurationRepository.ensureHospitalAddressCoordinates(
            existingHospital.addresses
          );
          
          // IMPORTANT: Check if hospital is already mapped to this policy (skip if replace all)
          if (!isReplaceAll) {
            const existingMapping = await this.portalConfigurationRepository.findPolicyHospitalMapping(
              policyId,
              hospitalId
            );

            if (existingMapping) {
              // Hospital is already mapped to this policy - reject with appropriate message
              const currentClassification = existingMapping.isNetworkHospital ? 'Network' : 'Excluded';
              errors.push({
                row: rowIndex,
                field: 'Hospital Name',
                message: `Hospital is already added to this policy as ${currentClassification}`,
                rowData: hospital
              });
              failedRows.add(rowIndex); // Track this row as failed
              continue;
            }
          }
        } else {
          // Create hospital address first using original values for storage
          const hospitalAddress = await this.portalConfigurationRepository.createHospitalAddress({
            address: hospitalData.original.address,
            cityName: hospitalData.original.city,
            stateName: hospitalData.original.state,
            pinCode: hospital['Pin Code'] || null,
            email: hospital['Email'] || null,
            phone: hospital['Phone'] || null,
            createdBy: userId,
            updatedBy: userId,
          });

          // Create new hospital with original name for storage
          const newHospital = await this.portalConfigurationRepository.createHospital({
            name: hospitalData.original.name,
            code: hospital['Hospital Code'] || null,
            addressId: hospitalAddress.id,
            createdBy: userId,
            updatedBy: userId,
          });

          hospitalId = newHospital.id;
        }

        // Create new policy-hospital mapping using original classification
        await this.portalConfigurationRepository.createPolicyHospitalMapping({
          policyId,
          hospitalId,
          classification: hospitalData.original.classification,
          createdBy: userId,
          updatedBy: userId,
        });

        successCount++;

        // Count network vs excluded hospitals using original classification
        if (hospitalData.original.classification === 'Network') {
          networkHospitalCount++;
        } else if (hospitalData.original.classification === 'Excluded') {
          excludedHospitalCount++;
        }

      } catch (error) {
        errors.push({
          row: rowIndex,
          field: 'general',
          message: error instanceof Error ? error.message : 'Processing error',
          rowData: hospital
        });
        failedRows.add(rowIndex); // Track this row as failed
      }
    }

    return {
      success: failedRows.size === 0,
      totalProcessed: hospitalData.length,
      successCount,
      errorCount: failedRows.size, // Count failed rows, not total error messages
      networkHospitalCount,
      excludedHospitalCount,
      errors,
    };
  }

  /**
   * Validate mandatory fields in hospital row
   */
  private validateHospitalRow(hospital: HospitalRowData, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const mandatoryFields = [
      { field: 'Hospital Name', label: 'Hospital Name' },
      { field: 'Address', label: 'Address' },
      { field: 'City', label: 'City' },
      { field: 'State', label: 'State' },
      { field: 'Classification', label: 'Classification' }
    ];

    mandatoryFields.forEach(({ field, label }) => {
      const value = hospital[field as keyof HospitalRowData];
      if (!value || !value.toString().trim()) {
        errors.push({
          row: rowIndex,
          field,
          message: `${label} is mandatory`,
          rowData: hospital
        });
      }
    });

    // Validate classification values
    if (hospital['Classification'] && !['Network', 'Excluded'].includes(hospital['Classification'].trim())) {
      errors.push({
        row: rowIndex,
        field: 'Classification',
        message: 'Classification must be either "Network" or "Excluded"',
        rowData: hospital
      });
    }

    return errors;
  }

  /**
   * Normalize hospital data for comparison purposes only
   * Returns both original values (for storage) and normalized values (for comparison)
   */
  private normalizeHospitalData(hospital: HospitalRowData): {
    original: {
      name: string;
      address: string;
      city: string;
      state: string;
      classification: string;
    };
    normalized: {
      name: string;
      address: string;
      city: string;
      state: string;
      classification: string;
    };
  } {
    return {
      original: {
        name: hospital['Hospital Name'].toString().trim(),
        address: hospital['Address'].toString().trim(),
        city: hospital['City'].toString().trim(),
        state: hospital['State'].toString().trim(),
        classification: hospital['Classification'].toString().trim(),
      },
      normalized: {
        name: hospital['Hospital Name'].toString().trim().toLowerCase(),
        address: hospital['Address'].toString().trim().toLowerCase(),
        city: hospital['City'].toString().trim().toLowerCase(),
        state: hospital['State'].toString().trim().toLowerCase(),
        classification: hospital['Classification'].toString().trim(),
      }
    };
  }



  /**
   * Find existing hospital by normalized name, address, city, and state
   */
  private async findExistingHospital(
    normalizedName: string,
    normalizedAddress: string,
    cityName: string,
    stateName: string
  ): Promise<MstrHospital | null> {
    return await this.portalConfigurationRepository.findHospitalByNameAndAddress(
      normalizedName,
      normalizedAddress,
      cityName,
      stateName
    );
  }

  /**
   * Create error Excel file and upload to S3
   */
  private async createErrorFile(
    errors: ValidationError[],
    originalFileName: string,
    userId: number
  ): Promise<number> {
    try {
      // Group errors by row to combine multiple field errors into single row
      const errorsByRow = new Map<number, ValidationError[]>();
      errors.forEach(error => {
        if (!errorsByRow.has(error.row)) {
          errorsByRow.set(error.row, []);
        }
        const errorList = errorsByRow.get(error.row);
        if (errorList) {
          errorList.push(error);
        }
      });

      // Create error data with original row structure + Remarks column
      const errorData = Array.from(errorsByRow.entries()).map(([, rowErrors]) => {
        const rowData = rowErrors[0].rowData;
        const remarks = rowErrors.map(err => `${err.field}: ${err.message}`).join('; ');
        
        return {
          'Hospital Name': rowData['Hospital Name'],
          'Hospital Code': rowData['Hospital Code'],
          'Address': rowData['Address'],
          'City': rowData['City'],
          'State': rowData['State'],
          'Pin Code': rowData['Pin Code'],
          'Email': rowData['Email'],
          'Phone': rowData['Phone'],
          'Classification': rowData['Classification'],
          'Remarks': remarks
        };
      });

      // Generate Excel buffer
      const excelBuffer = await generateExcel(errorData);

      // Create error file name (keep it short to fit in uploadType field limit of 50 chars)
      const baseFileName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
      const timestamp = new Date().getTime();
      // Keep filename under 50 characters: "hosp_err_" (9) + base (20) + "_" (1) + timestamp (13) + ".xlsx" (5) = 48 chars max
      const truncatedBase = baseFileName.length > 20 ? baseFileName.substring(0, 20) : baseFileName;
      const errorFileName = `hosp_err_${truncatedBase}_${timestamp}.xlsx`;

      // Upload to S3
      const s3Url = await uploadToS3(
        excelBuffer,
        `hospital-uploads/errors/${errorFileName}`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Create file record in database
      const errorFileRecord = await this.portalConfigurationRepository.createFileRecord({
        fileName: errorFileName,
        fileKey: `hospital-uploads/errors/${errorFileName}`,
        fileUrl: s3Url,
        fileSize: excelBuffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: userId,
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "createErrorFile",
          payload: { 
            errorFileName,
            errorCount: errors.length,
            fileId: errorFileRecord.id
          },
          messageData: "error file created and uploaded successfully",
        }),
      });

      return errorFileRecord.id;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "createErrorFile",
          payload: { originalFileName, errorCount: errors.length },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  /**
   * Get hospital network overview including last upload date and hospital counts
   * Returns structured response with hospitalNetwork and faq sections
   */
    async getPortalConfigurationOverview(
    policyId: number
  ): Promise<{
    hospitalNetwork: {
      lastUploadDate: string | null;
      totalNetworkHospitals: number;
      totalExcludedHospitals: number;
      totalHospitals: number;
      hasUploadedData: boolean;
    };
    policyFeature: {
      lastUploadDate: string | null;
      uploadedByName: string | null;
      status: string;
      hasUploadedData: boolean;
    };
    faq: {
      lastUploadDate: string | null;
      totalSuccessCount: number;
      totalCategories: number;
      categoryStats: { category: string; count: number }[];
      hasUploadedData: boolean;
    };
    contactMatrix: {
      configured: boolean;
      configuredBy: string | null;
      lastConfiguredAt: string | null;
    };
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });

      const overview = await this.portalConfigurationRepository.getPortalConfigurationOverview(policyId);

      // Structure response as requested
      const contactMatrixStatus =
        await this.portalConfigurationRepository.getPolicyContactMatrixStatus(
          policyId
        );

      const response = {
        hospitalNetwork: {
          lastUploadDate: overview.lastUploadDate,
          totalNetworkHospitals: overview.totalNetworkHospitals,
          totalExcludedHospitals: overview.totalExcludedHospitals,
          totalHospitals: overview.totalHospitals,
          hasUploadedData: overview.hasUploadedData,
        },
        policyFeature: {
          lastUploadDate: overview.policyFeature.lastUploadDate,
          uploadedByName: overview.policyFeature.uploadedByName,
          status: overview.policyFeature.status,
          hasUploadedData: overview.policyFeature.hasUploadedData,
        },
        faq: {
          lastUploadDate: overview.faq.lastUploadDate,
          totalSuccessCount: overview.faq.totalSuccessCount,
          totalCategories: overview.faq.totalCategories,
          categoryStats: overview.faq.categoryStats,
          hasUploadedData: overview.faq.hasUploadedData,
        },
        contactMatrix: contactMatrixStatus,
      };

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationService",
          method: "getPortalConfigurationOverview",
          payload: {
            policyId,
            ...response.hospitalNetwork,
            policyFeature: response.policyFeature,
            faq: response.faq,
            contactMatrix: response.contactMatrix,
          },
          messageData: "hospital network overview retrieved successfully",
        }),
      });

      return response;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationService",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }
}
