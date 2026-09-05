import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { KnowledgeRepository } from './knowledge.repository';
import { CreateKnowledgeFileDto } from './dto/create-knowledge-file.dto';
import { CreateKnowledgeUrlDto } from './dto/create-knowledge-url.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import {
  generatePasswordFromConfig,
  applyPasswordProtection,
  streamToBuffer,
  UserDetailsForPassword,
  assertUploadedFileNotPasswordProtected,
} from '../../../../service-lib/src/lib/utils/password-protection.utils';
import { FilePasswordConfigClient } from '../../../../service-lib/src/lib/service-communication/file-password-config-client';
import { TraceHttpService } from '../../../../service-lib/src/lib/trace-http.service';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { Readable } from 'stream';

@Injectable()
export class KnowledgeService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly repo: KnowledgeRepository,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService,
    private readonly filePasswordConfigClient: FilePasswordConfigClient,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.KNOWLEDGE_SERVICE);
    this.filePasswordConfigClient = new FilePasswordConfigClient();
  }

  /**
   * Fetch module-specific password protection configuration from document-service
   * @param categoryKey - The module category key (e.g., 'knowledge_central')
   * @returns Boolean indicating if password protection is enabled for this module
   */
  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl = ENV.URL_DOCUMENT_SERVICE || 'http://localhost:3013';
      const response = await this.traceHttpService.get(
        `${documentServiceUrl}/password-protection-config/${categoryKey}`
      );
      
      // Response structure: { id, categoryName, categoryKey, enablePassword, status }
      return response.data?.enablePassword ?? false;
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'KnowledgeService',
          method: 'getModulePasswordConfig',
          messageData: `Failed to fetch module config for ${categoryKey}, defaulting to false: ${error.message}`,
        }),
      });
      return false; // Default to disabled if API fails
    }
  }
  async createFile(file: Express.Multer.File, dto: CreateKnowledgeFileDto, userId: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'createFile',
        messageData: 'method invoked',
      }),
    });
    try {
      await assertUploadedFileNotPasswordProtected(file);
      return await this.repo.createFileEntry(file, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'createFile',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  createUrl(dto: CreateKnowledgeUrlDto, userId: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'createUrl',
        messageData: 'method invoked',
      }),
    });
    try {
      return this.repo.createUrlEntry({
        ...dto,
        relativePath: dto.url,
        createdBy: userId,
        updatedBy: userId,
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'createUrl',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async replaceFile(
    documentId: bigint,
    file: Express.Multer.File,
    userId: number,
    data: Partial<UpdateKnowledgeDto>,
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'replaceFile',
        messageData: 'method invoked',
      }),
    });
    try {
      return await this.repo.replaceFile(documentId, file, userId, data);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'replaceFile',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async replaceUrl(
    documentId: bigint,
    url: string,
    userId: number,
    data: Partial<CreateKnowledgeUrlDto> = {},
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'replaceUrl',
        messageData: 'method invoked',
      }),
    });
    try {
      return await this.repo.replaceUrl(documentId, url, userId, data);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'replaceUrl',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async updateMetadata(
    documentId: bigint,
    dto: Partial<CreateKnowledgeFileDto>,
    userId: number,
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'updateMetadata',
        messageData: 'method invoked',
      }),
    });
    try {
      return await this.repo.updateMetadata(documentId, dto, userId);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'updateMetadata',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async delete(documentId: bigint, userId: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'delete',
        messageData: 'method invoked',
      }),
    });
    try {
      return await this.repo.softDelete(documentId, userId);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'delete',
          messageData: error,
        }),
      });
      throw error;
    }
  }

  list(categoryId?: number, page = 1, limit = 10) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'list',
        payload: { categoryId, page, limit },
        messageData: 'method invoked',
      }),
    });
    return this.repo.list(categoryId, page, limit);
  }

  listForAllCategories(start = 0, limit = 10) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'listForAllCategories',
        payload: { start, limit },
        messageData: 'method invoked',
      }),
    });
    return this.repo.listForAllCategories(start, limit);
  }

  async incrementAccess(documentId: bigint) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'incrementAccess',
        payload: { documentId },
        messageData: 'method invoked',
      }),
    });
    try {
      return await this.repo.incrementAccessCount(documentId);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'incrementAccess',
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async download(documentId: bigint) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'download',
        payload: { documentId },
        messageData: 'method invoked',
      }),
    });
    // Validation for required field
    if (!documentId || isNaN(Number(documentId))) {
      throw new BadRequestException("documentId is required and must be a valid number.");
    }

    const entry = await this.repo.findActiveDocument(documentId);
    if (!entry) {
      throw new NotFoundException('Document not found');
    }

    await this.repo.incrementAccessCount(documentId);
    const fileName = entry.fileName;

    // Get the file stream and metadata (works for both S3 and local)
    let fileResult;
    try {
      fileResult = await this.repo.getFileStream(entry.relativePath);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'download',
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }

    // Validate fileResult and stream
    if (!fileResult || !fileResult.stream) {
      throw new NotFoundException('File not found in storage');
    }

    return {
      stream: fileResult.stream,
      fileName,
      mimeType: fileResult.mimeType || 'application/octet-stream',
      contentLength: fileResult.contentLength,
    };
  }

  /**
   * Downloads a file with password protection
   * Password is generated from user's firstName-lastName or defaults to Secure@123
   * 
   * @param documentId - ID of the document to download
   * @param userDetails - User details for password generation (firstName, lastName)
   * @returns Protected file with stream/buffer, filename, and mimeType
   */
  async downloadWithPasswordProtection(
    documentId: bigint,
    userDetails: UserDetailsForPassword | null,
    countryId?: number
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'downloadWithPasswordProtection',
        payload: { documentId },
        messageData: 'method invoked',
      }),
    });

    // Validation for required field
    if (!documentId || isNaN(Number(documentId))) {
      throw new BadRequestException("documentId is required and must be a valid number.");
    }

    const entry = await this.repo.findActiveDocument(documentId);
    if (!entry) {
      throw new NotFoundException('Document not found');
    }

    await this.repo.incrementAccessCount(documentId);
    const fileName = entry.fileName;

    // Get the file stream and metadata
    let fileResult;
    try {
      fileResult = await this.repo.getFileStream(entry.relativePath);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'downloadWithPasswordProtection',
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }

    // Validate fileResult and stream
    if (!fileResult || !fileResult.stream) {
      throw new NotFoundException('File not found in storage');
    }

    // Get password configuration and generate password
    const passwordConfig = await this.filePasswordConfigClient.getConfiguration(countryId);
    const password = generatePasswordFromConfig(passwordConfig, userDetails);

    console.log('[KnowledgeService] Generated password for documentId', documentId, ':', {password, passwordConfig});

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'KnowledgeService',
        method: 'downloadWithPasswordProtection',
        payload: { 
          documentId, 
          fileName,
          passwordType: passwordConfig?.passwordType,
          userFields: passwordConfig?.userFields,
          generatedPassword: password 
        },
        messageData: 'Applying password protection with generated password',
      }),
    });

    try {
      // Convert stream to buffer for password protection
      const fileBuffer = await streamToBuffer(fileResult.stream);

      const categoryValueKey =
        entry?.category?.lookUpValueKey?.toString().toLowerCase() || "";
      const isTrainingCategory =
        categoryValueKey === "training" || categoryValueKey.includes("training");
      const moduleKey = isTrainingCategory ? "ilearn" : "knowledge_central";

      // Fetch module-level password protection config from document-service
      const isModulePasswordEnabled = await this.getModulePasswordConfig(
        moduleKey
      );

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'KnowledgeService',
          method: 'downloadWithPasswordProtection',
          payload: { documentId, moduleKey, isModulePasswordEnabled },
          messageData: `Module password protection flag: ${isModulePasswordEnabled}`,
        }),
      });

      console.log('[HERE WE ARE] KNOWLEDGE SERVICE Applying password protection with config:', {
        moduleKey,
        isModulePasswordEnabled,
        passwordType: passwordConfig?.passwordType,
        generatedPassword: password,
      });
      // Apply password protection with module-specific flag
      const protectedFile = await applyPasswordProtection(
        fileBuffer,
        fileName,
        password,
        moduleKey,
        isModulePasswordEnabled
      );

      // Return the protected file as a Readable stream
      const finalStream = Readable.from(protectedFile.data);

      return {
        stream: finalStream,
        fileName: protectedFile.fileName,
        mimeType: protectedFile.mimeType,
        contentLength: protectedFile.data.length,
      };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'KnowledgeService',
          method: 'downloadWithPasswordProtection',
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }
  }
}
