import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import archiver from "archiver";
import { exec } from "child_process";
import type { Response } from "express";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import { formatSize } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { FilePasswordConfigClient } from "../../../../service-lib/src/lib/service-communication/file-password-config-client";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import {
  checkS3KeyExists,
  downloadFromS3,
  prepareFileDownload,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  applyPasswordProtection,
  assertUploadedFileNotPasswordProtected,
  generatePasswordFromConfig,
  isPasswordProtectionEnabled,
  streamToBuffer,
  UserDetailsForPassword,
} from "../../../../service-lib/src/lib/utils/password-protection.utils";
import {
  sanitizeFilename,
} from "../../../../service-lib/src/lib/utils/path-sanitizer.util";
import { CreateFileUploadDto } from "./dto/file-upload.dto";
import { FileUploadRepository } from "./file-upload.repository";

const VALID_MODULE_KEYS = new Set([
  "bizdone_reports",
  "cd_management",
  "company_documents",
  "document_management",
  "endorsement",
  "inception",
  "knowledge_central",
  "opportunity",
  "task_and_meetings",
  "utilization_reports",
  "ilearn",
  "policies",
]);

const execPromise = promisify(exec);

@Injectable()
export class FileUploadService {
  private readonly fileUploadRepository: FileUploadRepository;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    fileUploadRepository: FileUploadRepository,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService
  ) {
    this.fileUploadRepository = fileUploadRepository;
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Fetch module-specific password protection configuration from document-service
   * @param categoryKey - The module category key
   * @returns Boolean indicating if password protection is enabled for this module
   */
  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl = ENV.URL_DOCUMENT_SERVICE || 'http://localhost:3013';
      const fullUrl = `${documentServiceUrl}/password-protection-config/${categoryKey}`;

      console.log(
        "[Password Config] Fetching config for %s from: %s",
        categoryKey,
        fullUrl,
      );

      const response = await this.traceHttpService.get(fullUrl);

      console.log(
        "[Password Config] Response for %s:",
        categoryKey,
        JSON.stringify(response.data),
      );

      // Response structure: { id, categoryName, categoryKey, enablePassword, status }
      // Explicitly convert to boolean to handle 0/1 or "true"/"false" strings
      const enablePassword = response.data?.enablePassword;
      const result = Boolean(
        enablePassword === true ||
          enablePassword === 1 ||
          enablePassword === "true",
      );

      console.log(
        "[Password Config] Final result for %s: %s",
        categoryKey,
        result,
      );

      return result;
    } catch (error) {
      console.error(
        "[Password Config] Error fetching config for %s:",
        categoryKey,
        error,
      );
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'FileUploadService',
          method: 'getModulePasswordConfig',
          messageData: `Failed to fetch module config for ${categoryKey}, defaulting to false: ${error.message || error}`,
        }),
      });
      return false;
    }
  }

  /**
   * Uploads a file by delegating the file upload repository.
   */
  async uploadFile(
    file: Express.Multer.File,
    companyType: string,
    companyId: number | undefined,
    documentTypeLid: number | undefined,
    userId: number,
    opportunityId?: number,
    opportunityActivityId?: number,
    policyId?: number,
    claimId?: number,
    claimActivityId?: number,
    meetingId?: number,
    fileSize?: string,
    endorsementId?: number,
    uploadCategory?: string
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadService",
        method: "uploadFile",
        messageData: "method invoked",
      }),
    });
    try {
      if (!file) {
        throw new BadRequestException("File is required");
      }
      await assertUploadedFileNotPasswordProtected(file);
      if (!companyType) {
        throw new BadRequestException("companyType is required");
      }

      const normalizedCompanyType = companyType.toLowerCase();
      const MAX_POLICY_FEATURE_SIZE = 25 * 1024 * 1024; // 25 MB
      const normalizedTypeForCheck = normalizedCompanyType.replace(/-/g, "");
      if (normalizedTypeForCheck === "policyfeature") {
        const isPdf =
          file.mimetype === "application/pdf" ||
          (file.originalname || "").toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          throw new BadRequestException(
            "Only PDF files are allowed for policyFeature uploads"
          );
        }
        if (file.size > MAX_POLICY_FEATURE_SIZE) {
          throw new BadRequestException(
            "File size must be 25 MB or less for policyFeature uploads"
          );
        }
      }

      const result = await this.fileUploadRepository.uploadFile(
        file,
        companyType,
        companyId,
        documentTypeLid,
        userId,
        opportunityId,
        opportunityActivityId,
        policyId,
        claimId,
        claimActivityId,
        meetingId,
        fileSize,
        endorsementId,
        uploadCategory
      );
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadService",
          method: "uploadFile",
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new NotFoundException("File upload failed");
      }
    }
  }

  async deleteFile(fileId: number, userId: number): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadService",
        method: "deleteFile",
        payload: { fileId },
        messageData: "method invoked",
      }),
    });
    try {
      if (!fileId) {
        throw new BadRequestException("File ID is required");
      }

      const result = await this.fileUploadRepository.deleteFileFromServer(
        fileId,
        userId
      );

      if (result?.status !== HttpStatus.OK) {
        throw new InternalServerErrorException(
          result?.message || "File deletion failed"
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
          location: "FileUploadService",
          method: "deleteFile",
          payload: { fileId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException("File deletion failed");
    }
  }

  async replaceFileFromServer(
    id: number,
    file: Express.Multer.File,
    userId: number,
    body: CreateFileUploadDto
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadService",
        method: "replaceFileFromServer",
        payload: { id },
        messageData: "method invoked",
      }),
    });
    try {
      if (!id) {
        throw new BadRequestException("File ID is required");
      }
      return await this.fileUploadRepository.replaceFileFromServer(
        id,
        file,
        userId,
        body
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadService",
          method: "replaceFileFromServer",
          payload: { id },
          messageData: error,
        }),
      });
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "File replacement failed due to an unknown error"
          );
    }
  }

  async download(documentId: bigint) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadService",
        method: "download",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileResult = await prepareFileDownload(documentId, {
        findDocument: (id) => this.fileUploadRepository.findDocuments(id),
        fetchStream: (key) => this.fileUploadRepository.getFileStream(key),
      });
      return fileResult;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "org-service",
          method: "download",
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }
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
    requestedModuleKey?: string
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        location: "FileUploadService",
        messageData: "method invoked",
      }),
    });
    try {
      // Get the file upload record first to determine entity type
      const fileUpload = await this.fileUploadRepository.findDocuments(
        documentId,
      );
      if (!fileUpload) {
        throw new Error("File not found");
      }

      // Get the original file stream
      const fileResult = await prepareFileDownload(documentId, {
        findDocument: (id) => this.fileUploadRepository.findDocuments(id),
        fetchStream: (key) => this.fileUploadRepository.getFileStream(key),
      });

      // Fetch password configuration from org-service
      const configClient = new FilePasswordConfigClient();
      const passwordConfig = await configClient.getConfiguration();

      // Generate password based on configuration and user details
      const password = generatePasswordFromConfig(passwordConfig, userDetails);

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'FileUploadService',
          method: 'downloadWithPasswordProtection',
          payload: { 
            documentId,
            passwordType: passwordConfig?.passwordType,
            hasUserDetails: !!userDetails,
          },
          messageData: `Generated password using ${passwordConfig?.passwordType || 'default'} configuration`,
        }),
      });

      // Determine module key based on entity type, companyType, or fileKey
      let moduleKey = 'opportunity'; // Default
      const entityTypeLower = fileUpload.entityType?.toLowerCase() || '';
      const companyTypeLower = fileUpload.entityType?.toLowerCase() || '';
      const fileKeyLower = fileUpload.fileKey?.toLowerCase() || '';
      const hasCompanyDocs = (fileUpload.companyDocMaps || []).length > 0;
      const hasTaskDocs = (fileUpload.taskDocs || []).length > 0;
      const hasMeetingDocs =
        Boolean(fileUpload.meetingId) ||
        (fileUpload.meetingDocs || []).length > 0 ||
        (fileUpload.opportunityMeetingDocs || []).length > 0;
      
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'FileUploadService',
          method: 'downloadWithPasswordProtection',
          payload: { 
            documentId, 
            entityType: fileUpload.entityType, 
            companyType: fileUpload.entityType,
            fileKey: fileUpload.fileKey,
            companyId: fileUpload.entityId,
            opportunityId: fileUpload.opportunityId,
            opportunityActivityId: fileUpload.opportunityActivityId,
            meetingId: fileUpload.meetingId,
            companyDocMaps: (fileUpload.companyDocMaps || []).length,
            taskDocs: (fileUpload.taskDocs || []).length,
            meetingDocs: (fileUpload.meetingDocs || []).length,
            opportunityMeetingDocs: (fileUpload.opportunityMeetingDocs || []).length,
          },
          messageData: `Determining module key from entityType/companyType/fileKey`,
        }),
      });
      
      // Check for template files first (highest priority for inception templates)
      if (fileKeyLower.includes('/templates/') || fileKeyLower.includes('_template')) {
        moduleKey = 'inception';
      }
      // Check for endorsement/enrollment files (but not templates)
      else if (
        entityTypeLower.includes('endorsement') || 
        entityTypeLower.includes('enrollment') ||
        fileKeyLower.includes('enrollment') ||
        fileKeyLower.includes('endorsement')
      ) {
        moduleKey = 'endorsement';
      } else if (hasTaskDocs || hasMeetingDocs) {
        moduleKey = 'task_and_meetings';
      } else if (
        fileUpload.policyId ||
        entityTypeLower.includes('policy')
      ) {
        moduleKey = 'policies';
      } else if (
        hasCompanyDocs ||
        entityTypeLower.includes('company') ||
        companyTypeLower.includes('company') ||
        (fileUpload.entityId &&
          !fileUpload.opportunityId &&
          !fileUpload.opportunityActivityId &&
          !fileUpload.policyId &&
          !fileUpload.claimId &&
          !fileUpload.meetingId)
      ) {
        moduleKey = 'company_documents';
      } else if (entityTypeLower.includes('activity') || fileUpload.opportunityActivityId) {
        moduleKey = 'opportunity';
      } else if (entityTypeLower.includes('inception')) {
        moduleKey = 'inception';
      }

      const normalizedRequestedModuleKey = requestedModuleKey?.toLowerCase();
      if (normalizedRequestedModuleKey) {
        if (VALID_MODULE_KEYS.has(normalizedRequestedModuleKey)) {
          moduleKey = normalizedRequestedModuleKey;
        } else {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "info",
              location: "FileUploadService",
              method: "downloadWithPasswordProtection",
              payload: { documentId, requestedModuleKey },
              messageData:
                "Ignoring unknown moduleKey override; using inferred module key.",
            }),
          });
        }
      }

      

      // Fetch module-level password protection config
      const isModulePasswordEnabled = await this.getModulePasswordConfig(
        moduleKey,
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "info",
          location: "FileUploadService",
          method: "downloadWithPasswordProtection",
          payload: { documentId, fileName: fileResult.fileName, moduleKey, isModulePasswordEnabled },
          messageData: `Applying password protection - Module: ${moduleKey}, Enabled: ${isModulePasswordEnabled}`,
        }),
      });

      // Convert stream to buffer for password protection
      const fileBuffer = await streamToBuffer(fileResult.stream);

      console.log('[HERE WE ARE] FILE UPLOAD Applying password protection with config:', {
        moduleKey,
        isModulePasswordEnabled,
        passwordType: passwordConfig?.passwordType,
        generatedPassword: password,
      });
      // Apply password protection with module-specific flag
      const protectedFile = await applyPasswordProtection(
        fileBuffer,
        fileResult.fileName,
        password,
        moduleKey,
        isModulePasswordEnabled,
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadService",
          method: "downloadWithPasswordProtection",
          payload: { documentId },
          messageData: { error: errorMessage, stack: errorStack },
        }),
      });
      throw error;
    }
  }

  /**
   * Logs all FileUpload records where file_size is null
   */
  async updateFileSizesForNullRecords(count: number): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadService",
        method: "updateFileSizesForNullRecords",
        messageData: "method invoked",
      }),
    });

    try {
      const records = await this.fileUploadRepository.findAllWithNullFileSize(
        count
      );
      if (records && records.length === 0) return;

      let updatedRecords = [];
      for (const record of records) {
        const isKeyExists = await checkS3KeyExists(record.fileKey);

        if (record.fileKey && isKeyExists) {
          const buffer = await downloadFromS3(record.fileKey);
          const formattedSize = formatSize(buffer.length);
          updatedRecords.push({
            ...record,
            fileSize: formattedSize,
          })
        }
      }

      // Write to DB if records to update
      if (updatedRecords.length > 0) {
        await this.fileUploadRepository.saveUploadsFileSize(updatedRecords);
      }

        return {
          data: updatedRecords,
          message:
            updatedRecords.length > 0
              ? "File sizes updated successfully"
              : "No file sizes needed updating",
          effectedRecords: updatedRecords.length,
        };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "org-service",
          method: "updateFileSizesForNullRecords",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Abort archive safely across different archiver versions.
   * Tries abort() first, then destroy(), then ends response.
   */
  private abortArchive(archive: archiver.Archiver, res: Response): void {
    if (typeof archive.abort === "function") {
      archive.abort();
    } else if (typeof archive.destroy === "function") {
      archive.destroy();
    } else {
      // Fallback: just end the response
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      } else {
        res.end();
      }
    }
  }

  /**
   * Sanitize zip entry name to prevent zip-slip attacks.
   * Removes path traversal characters and normalizes the filename.
   */
  private sanitizeZipEntryName(fileName: string): string {
    if (!fileName) {
      return "unnamed-file";
    }

    // Strip drive letters (e.g., C:, D:)
    let sanitized = fileName.replace(/^[A-Za-z]:/, "");

    // Remove any path traversal attempts
    sanitized = sanitized.replace(/\.\./g, "");

    // Remove leading/trailing slashes and backslashes
    sanitized = sanitized.replace(/^[\/\\]+|[\/\\]+$/g, "");

    // Replace any remaining slashes/backslashes with underscores
    sanitized = sanitized.replace(/[\/\\]/g, "_");

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "");

    // Remove control characters (carriage return, newline, tab)
    sanitized = sanitized.replace(/[\r\n\t]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    // If result is empty or just a dot, return default name
    return sanitized && sanitized !== "." ? sanitized : "unnamed-file";
  }

  /**
   * Ensure unique zip entry name by appending counter if needed.
   */
  private ensureUniqueZipEntryName(
    baseName: string,
    usedNames: Set<string>,
  ): string {
    let uniqueName = baseName;
    let counter = 1;

    while (usedNames.has(uniqueName)) {
      const lastDotIndex = baseName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        const nameWithoutExt = baseName.substring(0, lastDotIndex);
        const ext = baseName.substring(lastDotIndex);
        uniqueName = `${nameWithoutExt}_(${counter})${ext}`;
      } else {
        uniqueName = `${baseName}_(${counter})`;
      }
      counter++;
    }

    usedNames.add(uniqueName);
    return uniqueName;
  }

  async bulkDownloadAsZip(
    documentIds: bigint[],
    res: Response,
    moduleKey?: string,
    userDetails?: UserDetailsForPassword | null,
  ) {
    const MAX_DOCS = 50;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadService",
        method: "bulkDownloadAsZip",
        payload: {
          documentIds: documentIds.map(String),
          count: documentIds.length,
          moduleKey,
        },
        messageData: "method invoked",
      }),
    });

    try {
      if (!documentIds || documentIds.length === 0) {
        throw new BadRequestException(
          "documentIds array is required and cannot be empty",
        );
      }

      if (documentIds.length > MAX_DOCS) {
        throw new BadRequestException(
          `Maximum ${MAX_DOCS} documents allowed per request. Requested: ${documentIds.length}`,
        );
      }

      const normalizedModuleKey = moduleKey?.toLowerCase();
      const resolvedModuleKey =
        normalizedModuleKey && VALID_MODULE_KEYS.has(normalizedModuleKey)
          ? normalizedModuleKey
          : undefined;
      const globalFlagEnabled = isPasswordProtectionEnabled();
      const isModulePasswordEnabled = resolvedModuleKey
        ? await this.getModulePasswordConfig(resolvedModuleKey)
        : false;
      const shouldProtect = resolvedModuleKey
        ? globalFlagEnabled && isModulePasswordEnabled
        : false;

      if (shouldProtect) {
        const tempDir = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), "bulk-download-"),
        );
        const usedNames = new Set<string>();
        const now = new Date();
        const zipDate = `${String(now.getDate()).padStart(2, "0")}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getFullYear()).slice(-2)}`;
        const zipFileName = `documents-${zipDate}.zip`;
        const zipPath = path.join(tempDir, zipFileName);
        let successCount = 0;

        try {
          const configClient = new FilePasswordConfigClient();
          const passwordConfig = await configClient.getConfiguration();
          const password = generatePasswordFromConfig(passwordConfig, userDetails);

          for (const documentId of documentIds) {
            const fileResult = await prepareFileDownload(
              documentId.toString(),
              {
                findDocument: (id) =>
                  this.fileUploadRepository.findDocuments(id as any),
                fetchStream: (key) => this.fileUploadRepository.getFileStream(key),
              },
            );

            if (fileResult && fileResult.stream) {
              const sanitizedName = this.sanitizeZipEntryName(
                fileResult.fileName,
              );
              const uniqueName = this.ensureUniqueZipEntryName(
                sanitizedName,
                usedNames,
              );
              const sanitizedUniqueName = sanitizeFilename(uniqueName);
              const outputPath = path.join(tempDir, sanitizedUniqueName);
              await pipeline(fileResult.stream, fs.createWriteStream(outputPath));
              successCount++;
            }
          }

          if (successCount === 0) {
            throw new NotFoundException("No valid documents found to download");
          }

          const fileArgs = Array.from(usedNames).map((name) => {
            const escaped = name.replace(/"/g, '\\"');
            return `"${escaped}"`;
          });
          const command = `7z a -tzip -mem=ZipCrypto -p"${password}" "${zipFileName}" ${fileArgs.join(
            " ",
          )}`;

          await execPromise(command, { cwd: tempDir });

          res.setHeader("Content-Type", "application/zip");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${zipFileName}"`,
          );
          res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

          await pipeline(fs.createReadStream(zipPath), res);
          return;
        } finally {
          await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
      }

      // Create ZIP archive
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      // Track used filenames for uniqueness
      const usedNames = new Set<string>();

      // Track if archive is aborted
      let isAborted = false;

      // Track successfully appended files
      let successCount = 0;

      // Track if response has been initialized
      let responseInitialized = false;

      // Handle archive errors - log and abort, do NOT throw
      archive.on("error", (err) => {
        isAborted = true;
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "FileUploadService",
            method: "bulkDownloadAsZip",
            payload: { documentIds: documentIds.map(String) },
            messageData: `Archive error: ${err.message}`,
          }),
        });
        if (responseInitialized) {
          this.abortArchive(archive, res);
        }
      });

      // Handle client disconnect
      res.on("close", () => {
        if (!isAborted) {
          isAborted = true;
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "FileUploadService",
              method: "bulkDownloadAsZip",
              payload: { documentIds: documentIds.map(String) },
              messageData: "Client disconnected, aborting archive",
            }),
          });
          if (responseInitialized) {
            this.abortArchive(archive, res);
          }
        }
      });

      // Process each document sequentially
      for (const documentId of documentIds) {
        if (isAborted) {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "FileUploadService",
              method: "bulkDownloadAsZip",
              payload: { documentId: documentId.toString() },
              messageData: "Skipping document, archive aborted",
            }),
          });
          break;
        }

        try {
          const fileResult = await prepareFileDownload(documentId.toString(), {
            findDocument: (id) =>
              this.fileUploadRepository.findDocuments(id as any),
            fetchStream: (key) => this.fileUploadRepository.getFileStream(key),
          });

          if (fileResult && fileResult.stream) {
            // Initialize response on first successful file
            if (!responseInitialized) {
              const now = new Date();
              const zipDate = `${String(now.getDate()).padStart(2, "0")}-${String(
                now.getMonth() + 1,
              ).padStart(2, "0")}-${String(now.getFullYear()).slice(-2)}`;
              // Set response headers
              res.setHeader("Content-Type", "application/zip");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="documents-${zipDate}.zip"`,
              );
              res.setHeader(
                "Access-Control-Expose-Headers",
                "Content-Disposition",
              );

              // Pipe archive to response
              archive.pipe(res);

              responseInitialized = true;
            }

            // Sanitize and ensure unique filename
            const sanitizedName = this.sanitizeZipEntryName(
              fileResult.fileName,
            );
            const uniqueName = this.ensureUniqueZipEntryName(
              sanitizedName,
              usedNames,
            );

            // Append stream to archive without buffering
            archive.append(fileResult.stream, { name: uniqueName });

            // Increment success counter
            successCount++;

            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "FileUploadService",
                method: "bulkDownloadAsZip",
                payload: {
                  documentId: documentId.toString(),
                  originalFileName: fileResult.fileName,
                  zipEntryName: uniqueName,
                },
                messageData: "File added to archive",
              }),
            });
          }
        } catch (error) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "FileUploadService",
              method: "bulkDownloadAsZip",
              payload: { documentId: documentId.toString() },
              messageData: `Failed to fetch document: ${error.message}`,
            }),
          });
          // Continue with other files instead of failing completely
        }
      }

      if (!isAborted) {
        // Check if any files were successfully appended
        if (successCount === 0) {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "FileUploadService",
              method: "bulkDownloadAsZip",
              payload: {
                documentIds: documentIds.map(String),
                count: documentIds.length,
              },
              messageData: "No files found to archive",
            }),
          });
          throw new NotFoundException("No valid documents found to download");
        }

        // Finalize the archive reliably
        archive.finalize();

        // Wait for archiver to complete (not response stream)
        await new Promise<void>((resolve, reject) => {
          archive.once("close", () => {
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "FileUploadService",
                method: "bulkDownloadAsZip",
                payload: {
                  documentIds: documentIds.map(String),
                  count: documentIds.length,
                  successCount,
                },
                messageData: "ZIP archive closed successfully",
              }),
            });
            resolve();
          });

          archive.once("error", (err) => {
            this.logger.error({
              level: "error",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "failure",
                location: "FileUploadService",
                method: "bulkDownloadAsZip",
                payload: { documentIds: documentIds.map(String) },
                messageData: `Archive finalization error: ${err.message}`,
              }),
            });
            reject(err);
          });

          res.once("close", () => {
            if (!res.writableEnded) {
              this.logger.error({
                level: "error",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "FileUploadService",
                  method: "bulkDownloadAsZip",
                  payload: { documentIds: documentIds.map(String) },
                  messageData: "Response closed before archive completed",
                }),
              });
              reject(new Error("Response closed before archive completed"));
            }
          });
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadService",
          method: "bulkDownloadAsZip",
          payload: { documentIds: documentIds.map(String) },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getAllFileDetails(
    page: number,
    limit: number,
    organisationId?: number,
    companyId?: number,
    companyName?: string,
    companyTypeLid?: number,
    entityType?: string,
    from?: Date,
    to?: Date
  ): Promise<{
    data: { id: number; fileKey: string; createdAt: Date; entityType: string; entityId: number }[];
    count: number;
    totalPages: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadService",
        method: "getAllFileDetails",
        payload: { page, limit, organisationId, companyId, companyName, companyTypeLid, entityType, from, to },
        messageData: "method invoked",
      }),
    });
    return this.fileUploadRepository.getAllFileDetails(
      page, 
      limit, 
      organisationId, 
      companyId, 
      companyName, 
      companyTypeLid, 
      entityType, 
      from, 
      to
    );
  }

  async getFileDetails(documentId: number): Promise<{
    fileKey: string;
    createdAt: Date;
    entityType: string;
    entityId: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadService",
        method: "getFileDetails",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    return this.fileUploadRepository.getFileDetails(documentId);
  }
}
