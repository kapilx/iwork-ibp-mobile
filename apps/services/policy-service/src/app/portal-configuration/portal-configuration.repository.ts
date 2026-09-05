import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, IsNull, EntityManager } from "typeorm";
import {
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  HospitalFileUploadTracking,
  FileUpload,
  User,
  PolicyFaq,
  PolicyFaqUpload,
  PolicyFeatureDocument,
  Policy,
  PolicyContactMetric,
  Contact,
  TpaContact,
  InsureContact,
  PolicyTpaMap,
  PolicyInsurerMap,
  Tpa,
  Insurer,
  State,
} from "../../../../service-lib/src/lib/entities";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  serviceNames,
  DEFAULT_VALUES,
} from "../../../../service-lib/src/lib/constants";
import {
  POLICY_FAQ_UPLOAD_STATUS,
  POLICY_FEATURE_DOCUMENT_STATUS,
} from "../../../../../../libs/service-lib/src/lib/constants";

import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  exportHospitalsWithFilters,
  getActivePolicyFeatureDocumentFromRepository,
  getPolicyLocationDataFromRepository,
  searchHospitalsWithFilters,
} from "../../../../service-lib/src/lib/utils/portal-configuration.util";

export interface HospitalUploadHistoryResponse {
  id: number;
  policyId: number;
  fileId: number;
  fileName: string;
  fileStatus: string;
  errorCount: number;
  successCount: number;
  networkHospitalCount: number;
  excludedHospitalCount: number;
  totalRows: number;
  errorFileId?: number;
  successFileId?: number;
  createdAt: Date;
  createdBy: number;
  createdByName: string;
  createdByEmail?: string;
  updatedAt: Date;
  updatedBy: number;
  updatedByName: string;
  updatedByEmail?: string;
}
export interface PolicyContactMetricPayload {
  partyType: "TPA" | "INSURER";
  contactLevel: "PRIMARY" | "SECONDARY";
  isPrimary: boolean;
  contactId: number;
  tpaId?: number;
  insurerId?: number;
}

export type PartyInfo = {
  id?: number;
  name?: string | null;
  displayName?: string | null;
};
import { SearchHospitalDto } from "./dto/search-hospital.dto";

@Injectable()
export class PortalConfigurationRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(MstrHospital)
    private readonly hospitalRepository: Repository<MstrHospital>,
    @InjectRepository(MstrHospitalAddress)
    private readonly hospitalAddressRepository: Repository<MstrHospitalAddress>,
    @InjectRepository(MstrPolicyHospitalMap)
    private readonly policyHospitalMapRepository: Repository<MstrPolicyHospitalMap>,
    @InjectRepository(HospitalFileUploadTracking)
    private readonly uploadTrackingRepository: Repository<HospitalFileUploadTracking>,
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    @InjectRepository(PolicyFaq)
    private readonly policyFaqRepository: Repository<PolicyFaq>,
    @InjectRepository(PolicyFaqUpload)
    private readonly policyFaqUploadRepository: Repository<PolicyFaqUpload>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PolicyFeatureDocument)
    private readonly policyFeatureDocumentRepository: Repository<PolicyFeatureDocument>,
    @InjectRepository(PolicyContactMetric)
    private readonly policyContactMetricRepository: Repository<PolicyContactMetric>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(TpaContact)
    private readonly tpaContactRepository: Repository<TpaContact>,
    @InjectRepository(InsureContact)
    private readonly insurerContactRepository: Repository<InsureContact>,
    @InjectRepository(PolicyTpaMap)
    private readonly policyTpaMapRepository: Repository<PolicyTpaMap>,
    @InjectRepository(PolicyInsurerMap)
    private readonly policyInsurerMapRepository: Repository<PolicyInsurerMap>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  async getHospitals(params: { page: number; limit: number }) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getHospitals",
          payload: { params },
          messageData: "method invoked",
        }),
      });

      const { page, limit } = params;
      const offset = (page - 1) * limit;

      const [hospitals, total] = await this.hospitalRepository.findAndCount({
        relations: ["addresses"],
        take: limit,
        skip: offset,
        order: {
          name: "ASC",
        },
      });

      return {
        data: hospitals,
        count: total,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "getHospitals",
          payload: { params },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  async searchHospitals(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{
    data: MstrHospital[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
  }> {
    return searchHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyIds: [policyId],
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "PortalConfigurationRepository",
    });
  }

  async searchHospitalsByPolicyIds(
    policyIds: number[],
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{
    data: MstrHospital[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
  }> {
    return searchHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyIds,
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "PortalConfigurationRepository",
    });
  }

  async getPolicyFaqs(
    policyId: number,
    category?: string,
    search?: string,
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT
  ): Promise<{
    faqs: any[];
    total: number;
    availableCategories: string[];
  }> {
    this.logger.log({
      level: "info",
      message: `Getting FAQs for policies: ${[policyId].join(
        ", "
      )} with category: ${category || "ALL"} and search: ${search || "NONE"}`,
    });

    try {
      // First, check if the policy exists and is active
      const activePolicy = await this.policyRepository
        .createQueryBuilder("policy")
        .select("policy.id")
        .where("policy.id = :policyId", { policyId })
        .getOne();

      if (!activePolicy) {
        this.logger.warn({
          level: "warn",
          message: `No active policy found for ID: ${policyId}`,
        });
        return {
          faqs: [],
          total: 0,
          availableCategories: [],
        };
      }

      // Build base query for FAQs
      let baseQuery = this.dataSource
        .getRepository(PolicyFaq)
        .createQueryBuilder("faq")
        .leftJoinAndSelect("faq.policy", "policy")
        .where("faq.policyId = :policyId", { policyId })
        .andWhere("faq.isActive = :isActive", { isActive: true });

      if (category && category.toUpperCase() !== "ALL") {
        baseQuery = baseQuery.andWhere(
          "LOWER(faq.category) = LOWER(:category)",
          { category }
        );
      }

      if (search && search.trim()) {
        baseQuery = baseQuery.andWhere(
          "(LOWER(faq.question) LIKE LOWER(:search) OR LOWER(faq.answer) LIKE LOWER(:search))",
          { search: `%${search.trim()}%` }
        );
      }

      const total = await baseQuery.getCount();

      const faqs = await baseQuery
        .orderBy("faq.category", "ASC")
        .addOrderBy("faq.createdAt", "DESC")
        .skip((page - DEFAULT_VALUES.PAGE) * limit)
        .take(limit)
        .getMany();

      const categoryResults = await this.dataSource
        .getRepository(PolicyFaq)
        .createQueryBuilder("faq")
        .select("DISTINCT faq.category", "category")
        .where("faq.policyId = :policyId", { policyId })
        .andWhere("faq.isActive = :isActive", { isActive: true })
        .orderBy("faq.category", "ASC")
        .getRawMany();

      const availableCategories = categoryResults.map(
        (result) => result.category
      );

      this.logger.log({
        level: "info",
        message: `Successfully retrieved ${faqs.length} FAQs from ${total} total for policy: ${policyId}`,
      });

      return {
        faqs,
        total,
        availableCategories,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: `Failed to get FAQs for policy: ${policyId} - ${
          (error as Error).message
        }`,
      });
      throw error;
    }
  }

  async getActivePolicyFaqs(policyId: number): Promise<PolicyFaq[]> {
    try {
      const policyExists = await this.policyRepository
        .createQueryBuilder("policy")
        .select("policy.id")
        .where("policy.id = :policyId", { policyId })
        .getOne();

      if (!policyExists) {
        this.logger.warn({
          level: "warn",
          message: `No policy found for ID: ${policyId} while fetching active FAQs`,
        });
        return [];
      }

      const faqs = await this.dataSource
        .getRepository(PolicyFaq)
        .createQueryBuilder("faq")
        .where("faq.policyId = :policyId", { policyId })
        .andWhere("faq.isActive = :isActive", { isActive: true })
        .orderBy("faq.category", "ASC")
        .addOrderBy("faq.createdAt", "DESC")
        .getMany();

      this.logger.log({
        level: "info",
        message: `Retrieved ${faqs.length} active FAQs for policy: ${policyId}`,
      });

      return faqs;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: `Failed to fetch active FAQs for policy: ${policyId} - ${
          (error as Error).message
        }`,
      });
      throw error;
    }
  }

  async getFaqUploads(
    policyId?: number,
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT
  ): Promise<{
    data: any[];
    total: number;
  }> {
    try {
      const query = this.dataSource
        .getRepository(PolicyFaqUpload)
        .createQueryBuilder("upload")
        .leftJoinAndSelect("upload.uploadedByUser", "uploadedByUser")
        .leftJoinAndSelect("upload.status", "status")
        .leftJoinAndSelect("upload.policy", "policy")
        .orderBy("upload.uploadedAt", "DESC");

      if (policyId) {
        query.andWhere("upload.policyId = :policyId", { policyId });
      }

      const [uploads, total] = await query.getManyAndCount();

      const data = uploads.map((upload) => ({
        id: upload.id,
        policyId: upload.policyId,
        fileId: upload.fileId,
        fileName: upload.fileName,
        uploadedBy: upload.uploadedByUser
          ? `${upload.uploadedByUser.firstName || ""} ${
              upload.uploadedByUser.lastName || ""
            }`.trim()
          : "",
        uploadedAt: upload.uploadedAt,
        faqCount: upload.faqCount,
        fileStatus: upload.status?.lookUpValue || "",
        updatedAt: upload.uploadedAt?.toISOString() || "",
        updatedBy: upload.uploadedBy || 0,
      }));

      this.logger.log({
        level: "info",
        message: `Successfully retrieved ${data.length} FAQ uploads from ${total} total`,
      });

      return {
        data,
        total,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: `Failed to get FAQ uploads - ${(error as Error).message}`,
      });
      throw error;
    }
  }

  async createPolicyFeatureDocument(
    policyId: number,
    documentId: number,
    userId: number
  ): Promise<PolicyFeatureDocument> {
    const policyFeatureDocument = this.policyFeatureDocumentRepository.create({
      policyId,
      documentId,
      status: POLICY_FEATURE_DOCUMENT_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.policyFeatureDocumentRepository.save(
      policyFeatureDocument
    );
  }

  async getActivePolicyFeatureDocument(
    policyId: number
  ): Promise<{ data: unknown[]; count: number }> {
    return getActivePolicyFeatureDocumentFromRepository({
      policyFeatureDocumentRepository: this.policyFeatureDocumentRepository,
      policyId,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "PortalConfigurationRepository",
    });
  }

  async getPolicyFeatureDocumentUploadHistory(
    policyId: number,
    pageParam?: string,
    limitParam?: string
  ): Promise<{ data: unknown[]; count: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, pageParam, limitParam },
          messageData: "Fetching policy feature document upload history",
        }),
      });

      let page = 1;
      let limit: number;

      if (
        pageParam !== undefined &&
        pageParam !== null &&
        pageParam.trim() !== ""
      ) {
        const parsedPage = parseInt(pageParam);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          page = parsedPage;
        }
      }

      if (
        limitParam !== undefined &&
        limitParam !== null &&
        limitParam.trim() !== ""
      ) {
        const parsedLimit = parseInt(limitParam);
        limit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
      } else {
        const totalCount = await this.policyFeatureDocumentRepository.count({
          where: {
            policyId,
            deletedAt: IsNull(),
          },
        });
        limit = totalCount > 0 ? totalCount : 10;
      }

      const [documents, count] =
        await this.policyFeatureDocumentRepository.findAndCount({
          where: {
            policyId,
            deletedAt: IsNull(),
          },
          relations: ["fileUpload", "createdByUser"],
          order: {
            createdAt: "DESC",
          },
          skip: (page - 1) * limit,
          take: limit,
        });

      const data = documents.map((doc) => ({
        id: doc.id,
        policyId: doc.policyId,
        documentId: doc.documentId,
        fileName:
          this.extractFileNameFromKey(doc.fileUpload?.fileKey) ||
          doc.fileUpload?.uploadType ||
          "Policy Feature Document",
        fileStatus: doc.status || "ACTIVE",
        uploadedAt: this.formatDate(doc.createdAt),
        updatedBy: doc.createdBy,
        uploadedBy: doc.createdByUser
          ? `${doc.createdByUser.firstName || ""} ${
              doc.createdByUser.lastName || ""
            }`.trim()
          : "Unknown User",
      }));

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, count, page, limit: limit },
          messageData: `Successfully fetched ${data.length} policy feature document upload records`,
        }),
      });

      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, pageParam, limitParam },
          messageData: `Failed to fetch policy feature document upload history: ${
            (error as Error).message
          }`,
        }),
      });
      throw error;
    }
  }

  async getPolicyById(policyId: number): Promise<Policy | null> {
    return this.policyRepository.findOne({ where: { id: policyId } });
  }

  async getFileUploadById(id: number): Promise<FileUpload | null> {
    return this.fileUploadRepository.findOne({ where: { id } });
  }

  async markAsReplacedPolicyFeatureDocument(
    id: number,
    userId: number
  ): Promise<PolicyFeatureDocument> {
    await this.policyFeatureDocumentRepository.update(id, {
      status: POLICY_FEATURE_DOCUMENT_STATUS.REPLACED,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    return await this.policyFeatureDocumentRepository.findOne({
      where: { id },
    });
  }

  // Soft-delete the active policy feature document(s) for a policy: stamps
  // deleted_at (via TypeORM softDelete, which manages @DeleteDateColumn) and
  // deleted_by, so the rows are recoverable and excluded from the active/get
  // queries (which filter deletedAt IS NULL).
  async deleteActivePolicyFeatureDocument(
    policyId: number,
    userId: number
  ): Promise<{ deletedCount: number }> {
    // find() auto-excludes already soft-deleted rows (deleted_at IS NULL).
    const activeDocuments = await this.policyFeatureDocumentRepository.find({
      where: { policyId, status: POLICY_FEATURE_DOCUMENT_STATUS.ACTIVE },
      select: ["id"],
    });

    if (activeDocuments.length === 0) {
      return { deletedCount: 0 };
    }

    const ids = activeDocuments.map((doc) => doc.id);

    // Stamp deleted_by (a plain column) explicitly.
    await this.policyFeatureDocumentRepository.update(ids, {
      deletedBy: userId,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    // Stamp deleted_at via TypeORM's managed soft-delete on @DeleteDateColumn.
    await this.policyFeatureDocumentRepository.softDelete(ids);

    return { deletedCount: ids.length };
  }

  private extractFileNameFromKey(fileKey: string): string | null {
    if (!fileKey) return null;

    try {
      const parts = fileKey.split("/");
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  }

  /**
   * Geocode address to get latitude and longitude using Google Maps API
   */
  private async geocodeAddress(address: string, cityName: string, stateName: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const fullAddress = `${address}, ${cityName}, ${stateName}, India`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "PortalConfigurationRepository",
            method: "geocodeAddress",
            payload: { fullAddress },
            messageData: "Google Maps API key is missing",
          }),
        });
        return null;
      }
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "geocodeAddress",
          payload: { 
            fullAddress, 
            keyPresent: Boolean(apiKey) 
          },
          messageData: "Attempting to geocode address",
        }),
      });

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "geocodeAddress",
          payload: {
            fullAddress,
            geocodeStatus: data?.status,
            errorMessage: data?.error_message || null,
          },
          messageData: "Geocode API response received",
        }),
      });

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationRepository",
            method: "geocodeAddress",
            payload: { fullAddress, latitude: location.lat, longitude: location.lng },
            messageData: "Successfully geocoded address",
          }),
        });

        return {
          longitude: location.lng,
          latitude: location.lat,
        };
      } else {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PortalConfigurationRepository",
            method: "geocodeAddress",
            payload: { fullAddress, geocodeStatus: data.status },
            messageData: "Failed to geocode address - using null coordinates",
          }),
        });
        return null;
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "geocodeAddress",
          payload: { address, cityName, stateName },
          messageData: `Geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
        }),
      });
      return null;
    }
  }

  /**
   * Export hospitals to Excel - same as searchHospitals but returns all records (no pagination)
   */
  async exportHospitalsToExcel(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{
    data: MstrHospital[];
    networkHospitalCount: number;
    excludedHospitalCount: number;
  }> {
    return exportHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyId,
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "PortalConfigurationRepository",
    });
  }

  /**
   * Format date to display format like "28/10/2024, 2:30 PM" in IST timezone
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // Force IST timezone
    };
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
    // Convert am/pm to AM/PM
    return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
  }

  /**
   * Get hospital file upload tracking records for a specific policy
   * Returns paginated upload history with file details
   */
  async getHospitalUploadTracking(
    policyId: number,
    page = 1,
    limit?: number
  ): Promise<{ data: MstrHospital[]; count: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getHospitalUploadTracking",
          payload: { policyId, page, limit },
          messageData: "method invoked",
        }),
      });

      // If no limit provided, get total count first and use it as limit to return ALL records
      let finalLimit = limit;
      if (!limit) {
        const totalCount = await this.uploadTrackingRepository.count({
          where: { policyId },
        });
        finalLimit = totalCount || 1000; // Use total count or fallback to large number
      }

      const offset = (page - 1) * finalLimit;

      // Use TypeORM findAndCount with relations
      const [trackingRecords, count] =
        await this.uploadTrackingRepository.findAndCount({
          where: { policyId },
          relations: ["file", "errorFile", "successFile", "policy"],
          order: { createdAt: "DESC" },
          skip: offset,
          take: finalLimit,
        });

      // Get unique user IDs to fetch user details separately
      const userIds = new Set<number>();
      trackingRecords.forEach((record) => {
        if (record.createdBy) userIds.add(record.createdBy);
        if (record.updatedBy) userIds.add(record.updatedBy);
      });

      // Fetch user details separately
      const users = await this.userRepository.findByIds(Array.from(userIds));
      const userMap = new Map(users.map((user) => [user.userId, user]));

      // Transform data for response with proper API labels
      const transformedData = trackingRecords.map((record) => {
        const createdByUser = userMap.get(record.createdBy);
        const updatedByUser = userMap.get(record.updatedBy);

        return {
          id: record.id,
          policyId: record.policyId,
          fileId: record.fileId,
          fileName: record.file?.fileKey
            ? record.file.fileKey.split("/").pop() || "Unknown"
            : "Unknown",
          uploadedBy: createdByUser
            ? `${createdByUser.firstName || ""} ${
                createdByUser.lastName || ""
              }`.trim()
            : "Unknown User",
          uploadedAt: record.createdAt
            ? this.formatDate(record.createdAt)
            : null,
          inclusionCount: record.networkHospitalCount || 0,
          exclusionCount: record.excludedHospitalCount || 0,
          total:
            (record.networkHospitalCount || 0) +
            (record.excludedHospitalCount || 0),
          fileStatus: record.fileStatus,
          errorCount: record.errorCount,
          successCount: record.successCount,
          totalRecords: record.totalRecords || 0,
          errorFileId: record.errorFileId,
          successFileId: record.successFileId,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
          createdByName: createdByUser
            ? `${createdByUser.firstName || ""} ${
                createdByUser.lastName || ""
              }`.trim()
            : "Unknown User",
          createdByEmail: createdByUser?.emailId || null,
          updatedAt: record.updatedAt,
          updatedBy: record.updatedBy,
          updatedByName: updatedByUser
            ? `${updatedByUser.firstName || ""} ${
                updatedByUser.lastName || ""
              }`.trim()
            : "Unknown User",
          updatedByEmail: updatedByUser?.emailId || null,
        };
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getHospitalUploadTracking",
          payload: { policyId, count, recordsFound: trackingRecords.length },
          messageData: "upload tracking retrieved successfully",
        }),
      });

      return { data: transformedData, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "getHospitalUploadTracking",
          payload: { policyId, page, limit },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  // Upload tracking methods
  async createUploadTracking(data: {
    policyId: number;
    fileId: number;
    status: string;
    uploadedBy: number;
  }): Promise<HospitalFileUploadTracking> {
    const tracking = this.uploadTrackingRepository.create({
      policyId: data.policyId,
      fileId: data.fileId,
      fileStatus: data.status,
      errorCount: 0,
      successCount: 0,
      createdBy: data.uploadedBy,
      updatedBy: data.uploadedBy,
    });
    return await this.uploadTrackingRepository.save(tracking);
  }

  async updateUploadTracking(
    id: number,
    data: {
      successCount: number;
      errorCount: number;
      networkHospitalCount?: number;
      excludedHospitalCount?: number;
      totalRecords?: number;
      errorFileId?: number | null;
      status: string;
    }
  ): Promise<void> {
    const updateData: Partial<HospitalFileUploadTracking> = {
      fileStatus: data.status,
      errorCount: data.errorCount,
      successCount: data.successCount,
      errorFileId: data.errorFileId,
      updatedAt: new Date(),
    };

    // Add hospital count fields if provided
    if (data.networkHospitalCount !== undefined) {
      updateData.networkHospitalCount = data.networkHospitalCount;
    }
    if (data.excludedHospitalCount !== undefined) {
      updateData.excludedHospitalCount = data.excludedHospitalCount;
    }
    if (data.totalRecords !== undefined) {
      updateData.totalRecords = data.totalRecords;
    }

    await this.uploadTrackingRepository.update(id, updateData);
  }

  // Location data methods for policy-based filtering
  async getLocationData(
    policyId: number,
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }> {
    return getPolicyLocationDataFromRepository({
      hospitalRepository: this.hospitalRepository,
      policyIds: [policyId],
      state,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "PortalConfigurationRepository",
    });
  }

  // Hospital methods
  async findHospitalByNameAndAddress(
    name: string,
    address: string,
    cityName: string,
    stateName: string
  ): Promise<MstrHospital | null> {
    return await this.hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoinAndSelect("hospital.addresses", "address")
      .where("LOWER(hospital.name) = :name", { name })
      .andWhere("LOWER(address.addressLine1) = :address", { address })
      .andWhere("LOWER(address.cityName) = :cityName", {
        cityName: cityName.toLowerCase(),
      })
      .andWhere("LOWER(address.stateName) = :stateName", {
        stateName: stateName.toLowerCase(),
      })
      .getOne();
  }

  async createHospital(data: {
    name: string;
    code: string | null;
    addressId: number;
    createdBy: number;
    updatedBy: number;
  }): Promise<MstrHospital> {
    const hospital = this.hospitalRepository.create({
      name: data.name,
      code: data.code,
      addressId: data.addressId,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    });
    return await this.hospitalRepository.save(hospital);
  }

  private async getCountryNameFromState(stateName: string): Promise<string> {
    const normalized = stateName.trim().toLowerCase();
    const state = await this.stateRepository
      .createQueryBuilder("state")
      .leftJoinAndSelect("state.country", "country")
      .where(
        "LOWER(TRIM(state.name)) = :name OR LOWER(TRIM(state.stateCode)) = :name",
        { name: normalized }
      )
      .getOne();

    return state?.country?.name?.trim() || "India";
  }

  async createHospitalAddress(data: {
    address: string;
    cityName: string;
    stateName: string;
    pinCode: string | null;
    email: string | null;
    phone: string | null;
    createdBy: number;
    updatedBy: number;
    longitude?: number;
    latitude?: number;
  }): Promise<MstrHospitalAddress> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "createHospitalAddress",
          payload: { data },
          messageData: "Creating hospital address with geocoding",
        }),
      });

      let longitude = data.longitude;
      let latitude = data.latitude;

      // If coordinates are not provided, attempt to geocode the address
      if (latitude === undefined || longitude === undefined) {
        const geocodeResult = await this.geocodeAddress(
          data.address,
          data.cityName,
          data.stateName
        );
        
        if (geocodeResult) {
          longitude = geocodeResult.longitude;
          latitude = geocodeResult.latitude;
        }
      }

      const countryName = await this.getCountryNameFromState(data.stateName);
      const address = new MstrHospitalAddress(
        data.address,
        data.cityName,
        data.stateName,
        data.createdBy,
        data.updatedBy,
        countryName,
        data.pinCode || undefined,
        undefined, // addressLine2
        undefined, // landmark
        data.phone || undefined,
        undefined, // alternatePhoneNumber
        data.email || undefined,
        longitude, // longitude
        latitude // latitude
      );
      return await this.hospitalAddressRepository.save(address);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "createHospitalAddress",
          payload: { data },
          messageData: `Failed to create hospital address: ${error instanceof Error ? error.message : error}`,
        }),
      });
      throw error;
    }
  }

  async ensureHospitalAddressCoordinates(
    address: MstrHospitalAddress | null | undefined
  ): Promise<MstrHospitalAddress | null> {
    if (!address) {
      return null;
    }

    if (address.latitude != null && address.longitude != null) {
      return address;
    }

    const geocodeResult = await this.geocodeAddress(
      address.addressLine1,
      address.cityName,
      address.stateName
    );

    if (!geocodeResult) {
      return address;
    }

    address.latitude = geocodeResult.latitude;
    address.longitude = geocodeResult.longitude;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PortalConfigurationRepository",
        method: "ensureHospitalAddressCoordinates",
        payload: { addressId: address.id, latitude: address.latitude, longitude: address.longitude },
        messageData: "Updated hospital address coordinates via geocoding",
      }),
    });

    return await this.hospitalAddressRepository.save(address);
  }

  /**
   * Find hospitals within a radius using PostGIS geospatial queries
   * @param policyId Policy ID to filter hospitals
   * @param userLatitude User's current latitude
   * @param userLongitude User's current longitude
   * @param radiusInMeters Radius in meters (default: 5000m = 5km)
   * @param page Page number for pagination
   * @param limit Number of results per page
   */
  async findHospitalsWithinRadius(
    policyId: number,
    userLatitude: number,
    userLongitude: number,
    radiusInMeters: number = 5000,
    page: number = 1,
    limit: number = 50,
    isNetworkHospital?: boolean
  ): Promise<{
    data: Array<{
      hospital: MstrHospital;
      address: MstrHospitalAddress;
      distanceInMeters: number;
      isNetworkHospital: boolean;
    }>;
    count: number;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "findHospitalsWithinRadius",
          payload: { policyId, userLatitude, userLongitude, radiusInMeters, page, limit },
          messageData: "Finding hospitals within radius using PostGIS",
        }),
      });

      const offset = (page - 1) * limit;
      // DB-agnostic geospatial query (Haversine approximation) to avoid PostGIS dependency
      // Explicit aliases are required because raw SQL returns snake_case columns
      // (e.g., address_line_1) but the mapping below expects camelCase keys
      // (e.g., addressLine1). Aliases also avoid collisions between hospital
      // and address columns like "id".
      const query = `
        SELECT 
          h.id as "hospitalId",
          h.name as "hospitalName",
          h.code as "hospitalCode",
          h.address_id as "hospitalAddressId",
          h.created_at as "hospitalCreatedAt",
          h.updated_at as "hospitalUpdatedAt",
          h.created_by as "hospitalCreatedBy",
          h.updated_by as "hospitalUpdatedBy",
          a.id as "addressId",
          a.address_line_1 as "addressLine1",
          a.address_line_2 as "addressLine2",
          a.landmark as "landmark",
          a.city_name as "cityName",
          a.state_name as "stateName",
          a.country_name as "countryName",
          a.pin_code as "pinCode",
          a.phone_number as "phoneNumber",
          a.alternate_phone_number as "alternatePhoneNumber",
          a.email as "email",
          a.longitude as "longitude",
          a.latitude as "latitude",
          phm.is_network_hospital as "isNetworkHospital",
          6371000 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                COS(RADIANS($2::double precision)) * COS(RADIANS(a.latitude::double precision))
                  * COS(RADIANS(a.longitude::double precision) - RADIANS($1::double precision))
                + SIN(RADIANS($2::double precision)) * SIN(RADIANS(a.latitude::double precision))
              )
            )
          ) as distance_in_meters
        FROM mstr_hospital h
        INNER JOIN mstr_hospital_address a ON h.address_id = a.id
        INNER JOIN mstr_policy_hospital_map phm ON h.id = phm.hospital_id
        WHERE phm.policy_id = $3
          AND ($7::boolean IS NULL OR phm.is_network_hospital = $7::boolean)
          AND a.latitude IS NOT NULL 
          AND a.longitude IS NOT NULL
          AND (
            6371000 * ACOS(
              LEAST(
                1,
                GREATEST(
                  -1,
                  COS(RADIANS($2::double precision)) * COS(RADIANS(a.latitude::double precision))
                    * COS(RADIANS(a.longitude::double precision) - RADIANS($1::double precision))
                  + SIN(RADIANS($2::double precision)) * SIN(RADIANS(a.latitude::double precision))
                )
              )
            )
          ) <= $4
        ORDER BY distance_in_meters ASC
        LIMIT $5 OFFSET $6
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM mstr_hospital h
        INNER JOIN mstr_hospital_address a ON h.address_id = a.id
        INNER JOIN mstr_policy_hospital_map phm ON h.id = phm.hospital_id
        WHERE phm.policy_id = $3
          AND ($5::boolean IS NULL OR phm.is_network_hospital = $5::boolean)
          AND a.latitude IS NOT NULL 
          AND a.longitude IS NOT NULL
          AND (
            6371000 * ACOS(
              LEAST(
                1,
                GREATEST(
                  -1,
                  COS(RADIANS($2::double precision)) * COS(RADIANS(a.latitude::double precision))
                    * COS(RADIANS(a.longitude::double precision) - RADIANS($1::double precision))
                  + SIN(RADIANS($2::double precision)) * SIN(RADIANS(a.latitude::double precision))
                )
              )
            )
          ) <= $4
      `;

      const networkFilter =
        typeof isNetworkHospital === "boolean" ? isNetworkHospital : null;

      const [results, countResult] = await Promise.all([
          this.dataSource.query(query, [
          userLongitude,
          userLatitude,
          policyId,
          radiusInMeters,
          limit,
          offset,
          networkFilter,
        ]),
      this.dataSource.query(countQuery, [
          userLongitude,
          userLatitude,
          policyId,
          radiusInMeters,
          networkFilter,
        ]),
      ]);

      const count = parseInt(countResult[0]?.total || '0');
      
      const data = results.map((row: any) => ({
        hospital: {
          id: row.hospitalId,
          name: row.hospitalName,
          code: row.hospitalCode,
          addressId: row.hospitalAddressId,
          createdAt: row.hospitalCreatedAt,
          updatedAt: row.hospitalUpdatedAt,
          createdBy: row.hospitalCreatedBy,
          updatedBy: row.hospitalUpdatedBy
        },
        address: {
          id: row.addressId,
          addressLine1: row.addressLine1,
          addressLine2: row.addressLine2,
          landmark: row.landmark,
          cityName: row.cityName,
          stateName: row.stateName,
          countryName: row.countryName,
          pinCode: row.pinCode,
          phoneNumber: row.phoneNumber,
          alternatePhoneNumber: row.alternatePhoneNumber,
          email: row.email,
          longitude: row.longitude,
          latitude: row.latitude,
        },
        distanceInMeters: Math.round(row.distance_in_meters),
        isNetworkHospital: row.isNetworkHospital
      }));

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "findHospitalsWithinRadius",
          payload: { policyId, count, resultsFound: data.length },
          messageData: "Successfully found hospitals within radius",
        }),
      });

      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "findHospitalsWithinRadius",
          payload: { policyId, userLatitude, userLongitude, radiusInMeters },
          messageData: `Failed to find hospitals within radius: ${error instanceof Error ? error.message : String(error)}`,
        }),
      });
      throw error;
    }
  }

  /**
   * Policy hospital mapping methods
   */
  async findPolicyHospitalMapping(
    policyId: number,
    hospitalId: number
  ): Promise<MstrPolicyHospitalMap | null> {
    return await this.policyHospitalMapRepository.findOne({
      where: { policyId, hospitalId },
    });
  }

  async deleteAllPolicyHospitalMappings(policyId: number): Promise<void> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "deleteAllPolicyHospitalMappings",
          payload: { policyId },
          messageData: "deleting all hospital mappings for policy",
        }),
      });

      // Hard delete all policy hospital mappings for this policy
      const result = await this.policyHospitalMapRepository.delete({
        policyId,
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "deleteAllPolicyHospitalMappings",
          payload: { policyId, deletedCount: result.affected || 0 },
          messageData: "hospital mappings deleted successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "deleteAllPolicyHospitalMappings",
          payload: { policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  async createPolicyHospitalMapping(data: {
    policyId: number;
    hospitalId: number;
    classification: string;
    createdBy: number;
    updatedBy: number;
  }): Promise<MstrPolicyHospitalMap> {
    const mapping = this.policyHospitalMapRepository.create({
      policyId: data.policyId,
      hospitalId: data.hospitalId,
      isNetworkHospital: data.classification === "Network",
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    });
    return await this.policyHospitalMapRepository.save(mapping);
  }

  // File management methods
  async findFileById(fileId: number): Promise<FileUpload | null> {
    return await this.fileUploadRepository.findOne({
      where: { id: fileId },
    });
  }

  async createFileRecord(data: {
    fileName: string;
    fileKey: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: number;
  }): Promise<FileUpload> {
    // Truncate filename if it exceeds 50 characters for uploadType field
    const truncatedFileName =
      data.fileName.length > 50
        ? data.fileName.substring(0, 47) + "..."
        : data.fileName;

    const fileUpload = this.fileUploadRepository.create({
      fileKey: data.fileKey,
      uploadType: truncatedFileName, // Store truncated filename in uploadType field
      status: "ACTIVE",
      createdBy: data.uploadedBy,
      updatedBy: data.uploadedBy,
      companyType: "ERROR_FILE",
      documentTypeLid: 1, // Default document type, should be adjusted
      companyId: 1, // Default company, should be adjusted
    });
    return await this.fileUploadRepository.save(fileUpload);
  }

  /**
   * Get hospital network overview for a policy
   * Returns last upload date, network/excluded counts, and upload status flag
   */
  async getPortalConfigurationOverview(policyId: number): Promise<{
    lastUploadDate: string | null;
    totalNetworkHospitals: number;
    totalExcludedHospitals: number;
    totalHospitals: number;
    hasUploadedData: boolean;
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
      hasUploadedData: boolean;
      categoryStats: { category: string; count: number }[];
    };
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });

      // Get the latest upload tracking record for this policy
      const latestUpload = await this.uploadTrackingRepository
        .createQueryBuilder("tracking")
        .where("tracking.policyId = :policyId", { policyId })
        .orderBy("tracking.createdAt", "DESC")
        .getOne();

      // Get total network and excluded hospitals count for this policy
      const networkCount = await this.policyHospitalMapRepository
        .createQueryBuilder("mapping")
        .where("mapping.policyId = :policyId", { policyId })
        .andWhere("mapping.isNetworkHospital = :isNetwork", { isNetwork: true })
        .getCount();

      const excludedCount = await this.policyHospitalMapRepository
        .createQueryBuilder("mapping")
        .where("mapping.policyId = :policyId", { policyId })
        .andWhere("mapping.isNetworkHospital = :isNetwork", {
          isNetwork: false,
        })
        .getCount();

      const totalHospitals = networkCount + excludedCount;
      const lastUploadDate = latestUpload?.createdAt
        ? this.formatDate(latestUpload.createdAt)
        : null;
      // Flag to indicate if policy has attempted any upload (successful or failed)
      const hasUploadedData = latestUpload !== null; // True if there was any upload attempt, regardless of success

      const latestFaqUpload = await this.policyFaqUploadRepository
        .createQueryBuilder("faqUpload")
        .where("faqUpload.policyId = :policyId", { policyId })
        .orderBy("faqUpload.uploadedAt", "DESC")
        .getOne();

      const categoryStatsRaw = await this.policyFaqRepository
        .createQueryBuilder("faq")
        .select("faq.category", "category")
        .addSelect("COUNT(*)", "count")
        .where("faq.policyId = :policyId", { policyId })
        .andWhere("faq.isActive = :isActive", { isActive: true })
        .groupBy("faq.category")
        .getRawMany<{ category: string; count: string }>();

      const categoryStats = categoryStatsRaw.map((stat) => ({
        category: stat.category,
        count: Number(stat.count),
      }));

      const totalFaqsCount = categoryStats
        .map((stat) => stat?.count)
        .reduce((totalCount, value) => totalCount + value, 0);

      const faqLastUploadDate = latestFaqUpload?.uploadedAt
        ? this.formatDate(latestFaqUpload.uploadedAt)
        : null;

      const hasFaqUploadedData = latestFaqUpload !== null;

      const faqOverview = {
        lastUploadDate: faqLastUploadDate,
        totalSuccessCount: totalFaqsCount ?? latestFaqUpload?.faqCount ?? 0,
        totalCategories: categoryStats.length,
        categoryStats,
        hasUploadedData: hasFaqUploadedData,
      };

      // Get latest policy feature document for this policy
      const latestPolicyFeature = await this.policyFeatureDocumentRepository
        .createQueryBuilder("pfd")
        .leftJoinAndSelect("pfd.fileUpload", "fileUpload")
        .leftJoinAndSelect("pfd.createdByUser", "createdByUser")
        .where("pfd.policyId = :policyId", { policyId })
        .andWhere("pfd.status = :status", { status: "ACTIVE" })
        .orderBy("pfd.createdAt", "DESC")
        .getOne();

      const policyFeatureLastUploadDate = latestPolicyFeature?.createdAt
        ? this.formatDate(latestPolicyFeature.createdAt)
        : null;

      const policyFeatureUploadedByName = latestPolicyFeature?.createdByUser
        ? `${latestPolicyFeature.createdByUser.firstName || ""} ${
            latestPolicyFeature.createdByUser.lastName || ""
          }`.trim()
        : null;

      const policyFeatureStatus = latestPolicyFeature
        ? "Document uploaded"
        : "Not uploaded";
      const hasPolicyFeatureUploadedData = latestPolicyFeature !== null;

      const policyFeatureOverview = {
        lastUploadDate: policyFeatureLastUploadDate,
        uploadedByName: policyFeatureUploadedByName,
        status: policyFeatureStatus,
        hasUploadedData: hasPolicyFeatureUploadedData,
      };

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationRepository",
          method: "getPortalConfigurationOverview",
          payload: {
            policyId,
            lastUploadDate,
            totalNetworkHospitals: networkCount,
            totalExcludedHospitals: excludedCount,
            totalHospitals,
            hasUploadedData,
            faqOverview,
            policyFeatureOverview,
          },
          messageData: "hospital network overview retrieved successfully",
        }),
      });

      return {
        lastUploadDate,
        totalNetworkHospitals: networkCount,
        totalExcludedHospitals: excludedCount,
        totalHospitals,
        hasUploadedData,
        policyFeature: policyFeatureOverview,
        faq: faqOverview,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  async getFileUploadWithPolicy(
    fileId: number,
    policyId: number
  ): Promise<{
    fileUpload: FileUpload | null;
    policyExists: boolean;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "portalConfigurationRepository",
          method: "getFileUploadWithPolicy",
          payload: { policyId, fileId },
          messageData: "Fetching file upload and policy validation",
        }),
      });

      const [fileUpload, policyExists] = await Promise.all([
        this.fileUploadRepository.findOne({
          where: { id: fileId },
          // relations: ["createdByUser"],
        }),
        this.validatePolicyExists(policyId),
      ]);

      return {
        fileUpload,
        policyExists,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "portalConfigurationRepository",
          method: "getFileUploadWithPolicy",
          payload: { policyId, fileId },
          messageData:
            error instanceof Error
              ? error.message
              : String(error) || "Failed to generate FAQ template",
        }),
      });

      throw error;
    }
  }

  async bulkUploadFaqWithErrors(
    policyId: number,
    fileUpload: FileUpload,
    validFaqs: Partial<PolicyFaq>[],
    errors: string[],
    replaceAll: boolean,
    userId: number,
    manager: EntityManager
  ): Promise<{
    uploadId: number;
    successCount: number;
    finalStatus: string;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "portalConfigurationRepository",
          method: "bulkUploadFaqWithErrors",
          payload: { policyId, userId },
          messageData: "Starting FAQ bulk upload with errors",
        }),
      });

      // 1. Create upload record
      const faqUpload = manager.create(PolicyFaqUpload, {
        policyId,
        fileId: fileUpload.id,
        fileName: fileUpload.fileKey.split("/").pop() || "unknown",
        filePath: fileUpload.fileKey,
        faqCount: 0,
        uploadedBy: userId,
        statusLkey: POLICY_FAQ_UPLOAD_STATUS.PROCESSING,
      });
      const savedUpload = await manager.save(faqUpload);

      try {
        // 2. Handle replaceAll option
        if (replaceAll && validFaqs.length > 0) {
          await manager.update(
            PolicyFaq,
            { policyId },
            { isActive: false, updatedBy: userId, updatedAt: new Date() }
          );
        }

        // 3. Insert valid FAQs
        let successCount = 0;
        if (validFaqs.length > 0) {
          const createdFaqs = await manager.save(PolicyFaq, validFaqs);
          successCount = createdFaqs.length;
        }

        // 4. Update with completed with errors status
        const finalStatus = POLICY_FAQ_UPLOAD_STATUS.COMPLETED_WITH_ERRORS;
        Object.assign(savedUpload, {
          faqCount: successCount,
          statusLkey: finalStatus,
        });
        await manager.save(PolicyFaqUpload, savedUpload);

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "portalConfigurationRepository",
            method: "bulkUploadFaqWithErrors",
            payload: { policyId, userId },
            messageData: "FAQ bulk upload with errors completed",
          }),
        });

        return {
          uploadId: savedUpload.id,
          successCount,
          finalStatus,
        };
      } catch (processingError) {
        Object.assign(savedUpload, {
          statusLkey: POLICY_FAQ_UPLOAD_STATUS.FAILED,
        });
        await manager.save(PolicyFaqUpload, savedUpload);
        throw processingError;
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "portalConfigurationRepository",
          method: "bulkUploadFaqWithErrors",
          payload: { policyId, userId },
          messageData:
            error instanceof Error
              ? error.message
              : String(error) || "Failed to generate FAQ template",
        }),
      });

      throw error;
    }
  }

  async validatePolicyExists(policyId: number): Promise<boolean> {
    try {
      const policy = await this.policyRepository.findOne({
        where: { id: policyId },
        select: ["id"],
      });
      return !!policy;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to validate policy existence: ${error.message}`
      );
    }
  }

  async bulkUploadFaqData(
    policyId: number,
    fileUpload: FileUpload,
    validFaqs: Partial<PolicyFaq>[],
    replaceAll: boolean,
    userId: number,
    manager: EntityManager
  ): Promise<{
    uploadId: number;
    successCount: number;
    finalStatus: string;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "portalConfigurationRepository",
          method: "bulkUploadFaqData",
          payload: { policyId, userId },
          messageData: "Starting FAQ bulk upload database operations",
        }),
      });

      // 1. Create upload record in policy_faq_uploads
      const faqUpload = manager.create(PolicyFaqUpload, {
        policyId,
        fileId: fileUpload.id,
        fileName: fileUpload.fileKey.split("/").pop() || "unknown",
        filePath: fileUpload.fileKey,
        faqCount: 0, // Will be updated after processing
        uploadedBy: userId,
        statusLkey: POLICY_FAQ_UPLOAD_STATUS.PROCESSING,
      });
      const savedUpload = await manager.save(faqUpload);

      try {
        // 2. Handle replaceAll option
        if (validFaqs.length === 0) {
          throw new BadRequestException(
            "No FAQs found to replace the existing. please upload valid file."
          );
        }
        if (replaceAll && validFaqs.length > 0) {
          // Mark existing FAQs as inactive
          await manager.update(
            PolicyFaq,
            { policyId },
            { isActive: false, updatedBy: userId, updatedAt: new Date() }
          );

          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "portalConfigurationRepository",
              method: "bulkUploadFaqData",
              payload: { policyId, userId },
              messageData: "Marked existing FAQs as inactive",
            }),
          });
        }

        // 3. Insert new FAQs
        let successCount = 0;
        if (validFaqs.length > 0) {
          const createdFaqs = await manager.save(PolicyFaq, validFaqs);
          successCount = createdFaqs.length;

          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "portalConfigurationRepository",
              method: "bulkUploadFaqData",
              payload: { policyId, userId },
              messageData: "Successfully created FAQs",
            }),
          });
        }

        // 4. Update upload record with final status
        const finalStatus = POLICY_FAQ_UPLOAD_STATUS.COMPLETED;
        Object.assign(savedUpload, {
          faqCount: successCount,
          statusLkey: finalStatus,
        });
        await manager.save(PolicyFaqUpload, savedUpload);
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "portalConfigurationRepository",
            method: "bulkUploadFaqData",
            payload: { policyId, userId },
            messageData:
              "FAQ bulk upload database operations completed successfully",
          }),
        });

        return {
          uploadId: savedUpload.id,
          successCount,
          finalStatus,
        };
      } catch (processingError) {
        // Update upload record with error status
        Object.assign(savedUpload, {
          statusLkey: POLICY_FAQ_UPLOAD_STATUS.FAILED,
        });
        await manager.save(PolicyFaqUpload, savedUpload);

        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "portalConfigurationRepository",
            method: "bulkUploadFaqData",
            payload: { policyId, userId },
            messageData:
              processingError instanceof Error
                ? processingError.message
                : String(processingError) || "Failed to generate FAQ template",
          }),
        });

        throw processingError;
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "portalConfigurationRepository",
          method: "bulkUploadFaqData",
          payload: { policyId, userId },
          messageData:
            error instanceof Error
              ? error.message
              : String(error) || "Failed to generate FAQ template",
        }),
      });

      throw error;
    }
  }

  async ensurePolicyExists(policyId: number): Promise<void> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
      select: ["id"],
    });
    if (!policy) {
      throw new NotFoundException(`Policy with id ${policyId} not found`);
    }
  }

  async getTpaContactsWithCommunication(tpaId: number): Promise<TpaContact[]> {
    return this.tpaContactRepository
      .createQueryBuilder("tpaContact")
      .innerJoinAndSelect("tpaContact.linkedContact", "contact")
      .leftJoinAndSelect(
        "contact.communicationDetails",
        "communicationDetails"
      )
      .where("tpaContact.tpa_id = :tpaId", { tpaId })
      .orderBy("tpaContact.tpaContactId", "ASC")
      .getMany();
  }

  async getInsurerContactsWithCommunication(
    insurerId: number
  ): Promise<InsureContact[]> {
    return this.insurerContactRepository
      .createQueryBuilder("insurerContact")
      .innerJoinAndSelect("insurerContact.contact", "contact")
      .leftJoinAndSelect(
        "contact.communicationDetails",
        "communicationDetails"
      )
      .where("insurerContact.insurer_id = :insurerId", { insurerId })
      .orderBy("insurerContact.id", "ASC")
      .getMany();
  }

  async getPolicyTpaInsurerInfo(policyId: number): Promise<{
    policyId: number;
    tpa: PartyInfo;
    insurer: PartyInfo;
  }> {
    const primaryTpa = await this.policyTpaMapRepository
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.tpa", "tpa")
      .where("map.policy_id = :policyId", { policyId })
      .orderBy("map.id", "ASC")
      .limit(1)
      .getOne();

    const primaryInsurer = await this.policyInsurerMapRepository
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.insurer", "insurer")
      .where("map.policy_id = :policyId", { policyId })
      .orderBy("map.id", "ASC")
      .limit(1)
      .getOne();

    const tpaInfo: PartyInfo = primaryTpa
      ? {
          id: primaryTpa.tpaId,
          name: primaryTpa.tpa?.tpaName ?? null,
          displayName: primaryTpa.tpa?.displayName ?? null,
        }
      : {};

    const insurerInfo: PartyInfo = primaryInsurer
      ? {
          id: primaryInsurer.insurerId,
          name: primaryInsurer.insurer?.insurerName ?? null,
          displayName: primaryInsurer.insurer?.displayName ?? null,
        }
      : {};

    return {
      policyId,
      tpa: tpaInfo,
      insurer: insurerInfo,
    };
  }

  async getSubmittedContactsForPolicy(
    policyId: number,
    partyType: "TPA" | "INSURER"
  ): Promise<PolicyContactMetric[]> {
    return this.policyContactMetricRepository
      .createQueryBuilder("metric")
      .leftJoinAndSelect("metric.contact", "contact")
      .leftJoinAndSelect(
        "contact.communicationDetails",
        "communicationDetails"
      )
      .where("metric.policy_id = :policyId", { policyId })
      .andWhere("metric.party_type = :partyType", { partyType })
      .orderBy("metric.contact_level", "ASC")
      .getMany();
  }

  async getPolicyContactMatrixStatus(
    policyId: number
  ): Promise<{
    configured: boolean;
    configuredBy: string | null;
    lastConfiguredAt: string | null;
  }> {
    const latestMetric = await this.policyContactMetricRepository
      .createQueryBuilder("metric")
      .where("metric.policy_id = :policyId", { policyId })
      .orderBy("metric.updated_at", "DESC")
      .limit(1)
      .getOne();

    if (!latestMetric) {
      return {
        configured: false,
        configuredBy: null,
        lastConfiguredAt: null,
      };
    }

    const user = await this.userRepository.findOne({
      where: { userId: latestMetric.updatedBy },
      select: ["firstName", "lastName"],
    });

    const configuredBy = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : null;

    return {
      configured: true,
      configuredBy: configuredBy || null,
      lastConfiguredAt: latestMetric.updatedAt
        ? this.formatDate(latestMetric.updatedAt)
        : null,
    };
  }

  async upsertPolicyContactMetrics(
    policyId: number,
    metrics: PolicyContactMetricPayload[],
    userId: number
  ): Promise<void> {
    if (metrics.length === 0) {
      throw new BadRequestException(
        "At least one contact metric entry must be provided"
      );
    }

    await this.ensurePolicyExists(policyId);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PolicyContactMetric, { policyId });

      for (const metric of metrics) {
        const metricEntity = manager.create(PolicyContactMetric, {
          ...metric,
          policyId,
          createdBy: userId,
          updatedBy: userId,
        });
        await manager.save(metricEntity);
      }
    });
  }

  async getUserDetails(userId: number): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { userId },
        relations: ["organisation"],
      });
      return user;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationRepository",
          method: "getUserDetails",
          payload: { userId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch user details for userId ${userId}`
      );
    }
  }
}
