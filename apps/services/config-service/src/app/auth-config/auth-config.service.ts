import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import {
  AuthenticationMethod,
  CompanyAuthenticationMapping,
  CompanyAuthenticationConfig,
  FileUpload,
  Company,
} from "../../../../service-lib/src/lib/entities";
import {
  getFileStreamFromStorage,
  prepareFileDownload,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import { ENV } from "../../../../service-lib/src/lib/environment";

export interface AuthMethodResponse {
  methodCode: string;
  methodName: string;
  isEnabled: boolean;
  displayOrder: number;
  configuration?: Record<string, any> | null;
  authenticationMethodKey?: string | null;
}

@Injectable()
export class AuthConfigService {
  constructor(
    @InjectRepository(AuthenticationMethod)
    private readonly authMethodRepository: Repository<AuthenticationMethod>,
    @InjectRepository(CompanyAuthenticationMapping)
    private readonly companyAuthMappingRepository: Repository<CompanyAuthenticationMapping>,
    @InjectRepository(CompanyAuthenticationConfig)
    private readonly companyAuthenticationConfigRepository: Repository<CompanyAuthenticationConfig>,
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Get authentication methods configured for a specific company, optionally
   * scoped to one of its portal domains.
   * @param companyId - The company ID
   * @param configId - The domain's ConfigCompany.id (company_portal_configuration.id).
   *   When provided, a domain-specific override is preferred; falls back to the
   *   company-level default (configId IS NULL) when no override exists yet.
   * @returns Array of enabled authentication methods for the company/domain
   */
  async getCompanyAuthMethods(
    companyId: number,
    configId?: number | null,
  ): Promise<AuthMethodResponse[]> {
    let mappings: CompanyAuthenticationMapping[] = [];
    if (configId) {
      mappings = await this.companyAuthMappingRepository.find({
        where: {
          companyId,
          configId,
          isEnabled: true,
        },
        relations: ["authenticationMethod", "companyAuthenticationConfig"],
        order: { displayOrder: "ASC" },
      });
    }

    if (!mappings.length) {
      mappings = await this.companyAuthMappingRepository.find({
        where: {
          companyId,
          configId: IsNull(),
          isEnabled: true,
        },
        relations: ["authenticationMethod", "companyAuthenticationConfig"],
        order: { displayOrder: "ASC" },
      });
    }

    if (!mappings || mappings.length === 0) {
      // Return default auth methods if no specific config exists
      return await this.getDefaultAuthMethods();
    }

    return mappings
      .filter((mapping) => mapping.authenticationMethod.isActive)
      .map((mapping) => ({
        methodCode: mapping.authenticationMethod.methodCode,
        methodName: mapping.authenticationMethod.methodName,
        isEnabled: mapping.isEnabled,
        displayOrder: mapping.displayOrder,
        configuration:
          mapping.companyAuthenticationConfig?.companyPortalAuthConfig ?? null,
        authenticationMethodKey:
          mapping.authenticationMethodKey ??
          mapping.companyAuthenticationConfig?.authenticationMethodKey ??
          null,
      }));
  }

  /**
   * Get default authentication methods (when no company-specific config exists)
   * Returns only SIMPLE_AUTH by default
   */
  private async getDefaultAuthMethods(): Promise<AuthMethodResponse[]> {
    const simpleAuthMethod = await this.authMethodRepository.findOne({
      where: {
        methodCode: "USERNAME_PASSWORD",
        isActive: true,
      },
    });

    if (!simpleAuthMethod) {
      return [];
    }

    return [
      {
        methodCode: simpleAuthMethod.methodCode,
        methodName: simpleAuthMethod.methodName,
        isEnabled: true,
        displayOrder: 1,
        configuration: simpleAuthMethod.configuration ?? null,
      },
    ];
  }

  /**
   * Get company details by company ID
   * @param companyId - The company ID
   * @returns Company entity or null
   */
  async getCompanyById(companyId: number): Promise<Company | null> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    return company ?? null;
  }

  /**
   * Add authentication method to a company
   */
  async addAuthMethodToCompany(
    companyId: number,
    authMethodId: number,
    displayOrder?: number,
  ): Promise<CompanyAuthenticationMapping> {
    // Check if auth method exists
    const authMethod = await this.authMethodRepository.findOne({
      where: { id: authMethodId },
    });

    if (!authMethod) {
      throw new NotFoundException("Authentication method not found");
    }

    // Create mapping
    const mapping = this.companyAuthMappingRepository.create({
      companyId,
      configId: null,
      authenticationMethodId: authMethodId,
      isEnabled: true,
      displayOrder: displayOrder || 1,
    });

    return await this.companyAuthMappingRepository.save(mapping);
  }

  /**
   * Remove authentication method from a company
   */
  async removeAuthMethodFromCompany(
    companyId: number,
    authMethodId: number,
  ): Promise<void> {
    await this.companyAuthMappingRepository.delete({
      companyId,
      configId: IsNull(),
      authenticationMethodId: authMethodId,
    });
  }

  /**
   * Update company auth method configuration
   */
  async updateCompanyAuthMethod(
    companyId: number,
    authMethodId: number,
    updates: {
      isEnabled?: boolean;
      displayOrder?: number;
      companyPortalAuthConfig?: Record<string, any>;
    },
  ): Promise<CompanyAuthenticationMapping> {
    const mapping = await this.companyAuthMappingRepository.findOne({
      where: {
        companyId,
        configId: IsNull(),
        authenticationMethodId: authMethodId,
      },
      relations: ["companyAuthenticationConfig"],
    });

    if (!mapping) {
      throw new NotFoundException("Company authentication mapping not found");
    }
    const { companyPortalAuthConfig, ...mappingUpdates } = updates;

    if (companyPortalAuthConfig) {
      const authDetail =
        mapping.companyAuthenticationConfig ??
        this.companyAuthenticationConfigRepository.create({
          companyId,
          authenticationMethodId: authMethodId,
          createdBy: null,
          updatedBy: null,
        });
      authDetail.companyPortalAuthConfig = companyPortalAuthConfig;
      authDetail.companyId = companyId;
      authDetail.authenticationMethodId = authMethodId;
      authDetail.updatedBy = null;
      const savedDetail = await this.companyAuthenticationConfigRepository.save(
        authDetail,
      );
      mapping.companyAuthenticationConfig = savedDetail;
      mapping.companyPortalAuthConfigId = savedDetail.id ?? null;
    }

    Object.assign(mapping, mappingUpdates);
    return await this.companyAuthMappingRepository.save(mapping);
  }

  async downloadFile(documentId: bigint): Promise<{
    stream: NodeJS.ReadableStream;
    fileName: string;
    mimeType: string;
    contentLength?: number;
  }> {
    const repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
    const docRepoPath =
      process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
    const bucket = process.env.S3_AWS_BUCKET || "";

    return prepareFileDownload(documentId, {
      findDocument: (id) => this.findFileUpload(id),
      fetchStream: (key) =>
        getFileStreamFromStorage(key, {
          repoMode,
          docRepoPath,
          bucket,
          region: ENV.S3_AWS_REGION,
        }),
    });
  }

  private async findFileUpload(
    documentId: bigint | number,
  ): Promise<{ fileKey: string }> {
    const entry = await this.fileUploadRepository.findOne({
      where: { id: Number(documentId) },
      select: ["fileKey"],
    });
    if (!entry?.fileKey) {
      throw new NotFoundException("Document not found");
    }
    return { fileKey: entry.fileKey };
  }

  /**
   * Seed default authentication methods (call this once during setup)
   */
  async seedDefaultAuthMethods(): Promise<void> {
    const existingMethods = await this.authMethodRepository.count();
    if (existingMethods > 0) {
      return; // Already seeded
    }

    const defaultMethods = [
      {
        methodCode: "SIMPLE_AUTH",
        methodName: "Simple Authentication",
        description: "Username/password based authentication",
        isActive: true,
        configuration: {},
      },
      {
        methodCode: "PHONE_OTP",
        methodName: "Phone OTP",
        description: "Phone number verification with OTP",
        isActive: true,
        configuration: {
          provider: "backend",
          type: "phone",
        },
      },
      {
        methodCode: "EMAIL_OTP",
        methodName: "Email OTP",
        description: "6-digit OTP sent via email using notification service",
        isActive: true,
        configuration: {
          otpLength: 6,
          expiryMinutes: 5,
          maxAttempts: 5,
        },
      },
      {
        methodCode: "GOOGLE_OAUTH",
        methodName: "Google OAuth",
        description: "Sign in with Google account",
        isActive: true,
        configuration: {
          provider: "google",
        },
      },
    ];

    await this.authMethodRepository.save(defaultMethods);
  }
}
