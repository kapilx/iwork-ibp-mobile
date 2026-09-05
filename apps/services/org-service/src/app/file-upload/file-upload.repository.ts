import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as AWS from "aws-sdk";
import { Repository } from "typeorm";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { IsNull } from "typeorm";
import { ArchivedFileUpload } from "../../../../service-lib/src/lib/entities/archived-file-upload.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { CreateFileUploadDto } from "./dto/file-upload.dto";
import {
  getFileStreamFromStorage,
  saveFileToStorage,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import {
  sanitizePath,
} from "../../../../service-lib/src/lib/utils/path-sanitizer.util";

@Injectable()
export class FileUploadRepository {
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly initialized: boolean = false;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(ArchivedFileUpload)
    private readonly archivedFileUploadRepository: Repository<ArchivedFileUpload>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
    if (this.repoMode === "AWS") {
      try {
        AWS.config.update({
          accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
          region: process.env.S3_AWS_REGION,
        });
        this.s3 = new AWS.S3();
        this.initialized = true;
      } catch (err) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "FileUploadRepository",
            method: "constructor",
            messageData: `AWS initialization failed: ${err}`,
          }),
        });
        this.initialized = false;
      }
    } else {
      const fs = require("fs");
      try {
        if (
          fs.existsSync(this.docRepoPath) &&
          fs.statSync(this.docRepoPath).isDirectory()
        ) {
          this.initialized = true;
        } else {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "FileUploadRepository",
              method: "constructor",
              messageData: `Local repository path invalid: ${this.docRepoPath}`,
            }),
          });
          this.initialized = false;
        }
      } catch (err) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "FileUploadRepository",
            method: "constructor",
            messageData: `Local repository check failed: ${err}`,
          }),
        });
        this.initialized = false;
      }
    }
  }

  /**
   * Uploads a file using the specified upload strategy.
   */
  async uploadFile(
    file: Express.Multer.File,
    companyType: string,
    companyId: number,
    documentTypeLid: number,
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
        location: "FileUploadRepository",
        method: "uploadFile",
        messageData: "method invoked",
      }),
    });
    let status = "ACTIVE";

    if (opportunityId && opportunityActivityId) {
      status = "INACTIVE";
    }
    try {
      if (!this.initialized) {
        throw new Error(
          "Document repository is not initialized. Cannot create file entry."
        );
      }
      const { key, fileName, uploadType } = await saveFileToStorage(
        file,
        companyType,
        {
          repoMode: this.repoMode,
          bucket: this.bucket,
          docRepoPath: this.docRepoPath,
          region: process.env.S3_AWS_REGION,
          logger: this.logger,
          uploadCategory,
          entityId: endorsementId,
        }
      );
      const fileUpload = this.fileUploadRepository.create({
        fileKey: key,
        entityType: companyType,
        entityId: companyId,
        uploadType,
        documentTypeLid: documentTypeLid,
        opportunityId,
        opportunityActivityId,
        policyId,
        claimId,
        claimActivityId,
        status: status,
        meetingId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        deletedAt: null,
        fileSize: fileSize,
      });
      const savedFile = await this.fileUploadRepository.save(fileUpload);

      if (!savedFile || !savedFile.id) {
        throw new InternalServerErrorException("File metadata not saved");
      }

      const uploadedFile = {
        id: savedFile.id,
        fileKey: savedFile.fileKey,
        fileName: fileName,
        companyType: savedFile.entityType,
        companyId: savedFile.entityId,
        opportunityId: savedFile.opportunityId,
        opportunityActivityId: savedFile.opportunityActivityId,
        policyId: savedFile.policyId,
        claimId: savedFile.claimId,
        claimActivityId: savedFile.claimActivityId,
        meetingId: savedFile.meetingId,
        documentTypeLid: savedFile.documentTypeLid,
        fileSize: savedFile.fileSize,
        fileBuffer: file.buffer.toString("base64"),
      };

      return {
        status: HttpStatus.OK,
        message: "File uploaded successfully",
        data: uploadedFile,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadRepository",
          method: "uploadFile",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException("File upload failed");
      }
    }
  }

  /**
   * Replaces a file on the local server in a type-based and company-based directory structure.
//    */
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
        location: "FileUploadRepository",
        method: "replaceFileFromServer",
        payload: { id },
        messageData: "method invoked",
      }),
    });
    try {
      const fileUpload = await this.fileUploadRepository.findOne({
        where: { id },
      });

      if (!fileUpload) {
        throw new NotFoundException("File not found");
      }

      const oldFileKey = fileUpload.fileKey;

      // Remove spaces from the original file name
      const sanitizedFileName = file.originalname.replace(/\s+/g, "");
      const newFileName = `${Date.now()}_${sanitizedFileName}`;
      const newFileKey = `uploads/company/${body?.companyType}/${newFileName}`;
      const archivedKey = `uploads/company/archived/${
        fileUpload.entityType
      }/${oldFileKey.split("/").pop()}`;
      if (this.repoMode === "AWS") {
        const encodedCopySource = encodeURIComponent(
          `${this.bucket}/${oldFileKey}`
        );
        const res = await this.s3
          .copyObject({
            Bucket: this.bucket,
            CopySource: encodedCopySource,
            Key: archivedKey,
          })
          .promise();
        if (
          res &&
          res.$response &&
          res.$response.httpResponse.statusCode === 200
        ) {
          await this.s3
            .deleteObject({ Bucket: this.bucket, Key: oldFileKey })
            .promise();
        } else {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "FileUploadRepository",
              method: "replaceFileFromServer",
              messageData: `Failed to archive old file in S3: ${res.$response.error}`,
            }),
          });
          throw new InternalServerErrorException("Failed to archive old file");
        }
        await this.s3
          .putObject({
            Bucket: this.bucket,
            Key: newFileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
          .promise();
      } else {
        const fs = require("fs");
        const path = require("path");
        const fullDirPath = path.join(
          this.docRepoPath,
          key.split("/").slice(0, -1).join("/")
        );
        const fullFilePath = path.join(fullDirPath, fileName);

        // Ensure directory exists
        try {
          fs.mkdirSync(fullDirPath, { recursive: true });
        } catch (mkdirErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "FileUploadRepository",
              method: "replaceFileFromServer",
              messageData: `Failed to create directory: ${mkdirErr}`,
            }),
          });
        }

        // Write file
        try {
          fs.writeFileSync(fullFilePath, file.buffer);
        } catch (writeErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "FileUploadRepository",
              method: "replaceFileFromServer",
              messageData: `Failed to write file: ${writeErr}`,
            }),
          });
        }
      }

      // const s3Url = this.s3.getSignedUrl("getObject", {
      //   Bucket: this.bucket,
      //   Key: newFileKey,
      //   Expires: 3600, // URL expiration time in seconds
      // });

      // Archive the existing file details
      const archivedFile = this.archivedFileUploadRepository.create({
        refFileUploadId: fileUpload.id,
        fileKey: fileUpload.fileKey,
        newFileKey: archivedKey, // Store the old file key as newFileKey
        companyType: fileUpload.entityType,
        companyId: fileUpload.entityId,
        opportunityId: fileUpload.opportunityId,
        opportunityActivityId: fileUpload.opportunityActivityId,
        policyId: fileUpload.policyId,
        claimId: fileUpload.claimId,
        claimActivityId: fileUpload.claimActivityId,
        meetingId: fileUpload.meetingId,
        uploadType: fileUpload.uploadType,
        documentTypeLid: fileUpload.documentTypeLid,
        createdBy: fileUpload.createdBy,
        updatedBy: userId,
        deletedAt: new Date(),
      });
      await this.archivedFileUploadRepository.save(archivedFile);

      fileUpload.fileKey = newFileKey;
      fileUpload.updatedBy = userId;
      fileUpload.documentTypeLid =
        body?.documentTypeLid || fileUpload.documentTypeLid;
      fileUpload.entityType = body?.companyType || fileUpload.entityType;
      fileUpload.entityId = body?.companyId || fileUpload.entityId;
      fileUpload.opportunityId =
        body?.opportunityId || fileUpload.opportunityId;
      fileUpload.opportunityActivityId =
        body?.opportunityActivityId || fileUpload.opportunityActivityId;
      fileUpload.policyId = body?.policyId || fileUpload.policyId;
      fileUpload.claimId = body?.claimId || fileUpload.claimId;
      fileUpload.claimActivityId =
        body?.claimActivityId || fileUpload.claimActivityId;
      fileUpload.meetingId = body?.meetingId || fileUpload.meetingId;

      const updatedFileUpload = await this.fileUploadRepository.save(
        fileUpload
      );

      if (!updatedFileUpload.id) {
        throw new InternalServerErrorException("Failed to update file in DB");
      }

      const fileReplacedData = {
        id: updatedFileUpload.id,
        companyType: updatedFileUpload.entityType,
        companyId: updatedFileUpload.entityId,
        opportunityId: updatedFileUpload.opportunityId,
        opportunityActivityId: updatedFileUpload.opportunityActivityId,
        policyId: updatedFileUpload.policyId,
        claimId: updatedFileUpload.claimId,
        claimActivityId: updatedFileUpload.claimActivityId,
        meetingId: updatedFileUpload.meetingId,
        fileKey: updatedFileUpload.fileKey,
        fileName: newFileName,
        documentTypeLid: updatedFileUpload.documentTypeLid,
        fileBuffer: file.buffer.toString("base64"),
      };
      return {
        status: HttpStatus.OK,
        message: "File replaced successfully",
        data: fileReplacedData,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadRepository",
          method: "replaceFileFromServer",
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : `Error replacing file: ${file.originalname}`
      );
    }
  }

  async getCompanyNameById(id: number) {
    const company = await this.companyRepository.findOne({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException("Company not found");
    }
    return company.displayName;
  }

  async deleteFileFromServer(fileId: number, userId: number): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadRepository",
        method: "deleteFileFromServer",
        payload: { fileId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileUpload = await this.fileUploadRepository.findOne({
        where: { id: fileId },
      });

      if (!fileUpload) {
        throw new NotFoundException("File not found");
      }

      const oldFileKey = fileUpload.fileKey;
      const archivedKey = `uploads/company/archived/${
        fileUpload.entityType
      }/${oldFileKey.split("/").pop()}`;

      if (this.repoMode === "AWS") {
        const encodedCopySource = encodeURIComponent(
          `${this.bucket}/${oldFileKey}`
        );
        const res = await this.s3
          .copyObject({
            Bucket: this.bucket,
            CopySource: encodedCopySource,
            Key: archivedKey,
          })
          .promise();
        if (
          res &&
          res.$response &&
          res.$response.httpResponse.statusCode === 200
        ) {
          await this.s3
            .deleteObject({ Bucket: this.bucket, Key: oldFileKey })
            .promise();
        } else {
          throw new InternalServerErrorException("Failed to archive file");
        }
      } else {
        const fs = require("fs");
        const path = require("path");

        const sanitizedOldKey = sanitizePath(oldFileKey, this.docRepoPath);
        const sanitizedArchivedKey = sanitizePath(archivedKey, this.docRepoPath);
        const oldFilePath = path.join(this.docRepoPath, sanitizedOldKey);
        const archivedFilePath = path.join(this.docRepoPath, sanitizedArchivedKey);

        if (fs.existsSync(oldFilePath)) {
          fs.mkdirSync(path.dirname(archivedFilePath), { recursive: true });
          fs.renameSync(oldFilePath, archivedFilePath);
        } else {
          throw new NotFoundException("File not found on disk");
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "FileUploadRepository",
          method: "deleteFileFromServer",
          payload: { fileId },
          messageData: "Inserting deleted file details into archived table",
        }),
      });
      const archivedFile = this.archivedFileUploadRepository.create({
        refFileUploadId: fileUpload.id,
        fileKey: oldFileKey,
        newFileKey: archivedKey,
        companyType: fileUpload.entityType,
        companyId: fileUpload.entityId,
        opportunityId: fileUpload.opportunityId,
        opportunityActivityId: fileUpload.opportunityActivityId,
        policyId: fileUpload.policyId,
        claimId: fileUpload.claimId,
        claimActivityId: fileUpload.claimActivityId,
        meetingId: fileUpload.meetingId,
        uploadType: fileUpload.uploadType,
        documentTypeLid: fileUpload.documentTypeLid,
        createdBy: fileUpload.createdBy,
        updatedBy: userId,
        deletedAt: new Date(),
      });
      await this.archivedFileUploadRepository.save(archivedFile);

      await this.fileUploadRepository.update(fileId, { deletedAt: new Date() });
      const data = {
        id: fileId,
        companyType: fileUpload.entityType,
        companyId: fileUpload.entityId,
        opportunityId: fileUpload.opportunityId,
        opportunityActivityId: fileUpload.opportunityActivityId,
        policyId: fileUpload.policyId,
        claimId: fileUpload.claimId,
        claimActivityId: fileUpload.claimActivityId,
        meetingId: fileUpload.meetingId,
        documentTypeLid: fileUpload.documentTypeLid,
        fileKey: oldFileKey,
        archivedKey,
      };
      return {
        status: HttpStatus.OK,
        message: "File deleted successfully",
        data,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadRepository",
          method: "deleteFileFromServer",
          payload: { fileId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getFileStream(key: string) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadRepository",
        method: "getFileStream",
        payload: { key },
        messageData: "method invoked",
      }),
    });
    // Validation for required field
    if (!key || typeof key !== "string" || !key.trim()) {
      throw new Error("File key is required.");
    }

    return getFileStreamFromStorage(key, {
      repoMode: this.repoMode,
      bucket: this.bucket,
      docRepoPath: this.docRepoPath,
      region: process.env.S3_AWS_REGION,
      logger: this.logger,
    });
  }

  async findDocuments(documentId: any) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadRepository",
        method: "findDocuments",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileUpload = await this.fileUploadRepository.findOne({
        where: { id: documentId },
        relations: [
          "companyDocMaps",
          "taskDocs",
          "meetingDocs",
          "opportunityMeetingDocs",
          "opportunityActivity",
        ],
      });

      this.logger.log({
        level: "debug",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "FileUploadRepository",
          method: "findDocuments",
          payload: { documentId },
          messageData: `Retrieved file upload: ${JSON.stringify(fileUpload)}`,
        }),
      });
      if (!fileUpload) {
        throw new NotFoundException("Document not found");
      }

      return fileUpload;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadRepository",
          method: "findDocuments",
          payload: { documentId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "FileUploadRepository",
            method: "findDocuments",
            payload: { documentId },
            messageData: `Error retrieving document: ${error}`,
          }),
        });
        throw new InternalServerErrorException("Failed to retrieve document");
      }
    }
  }

  async findAllWithNullFileSize(count: number): Promise<FileUpload[]> {
    return this.fileUploadRepository.find({
      where: { fileSize: IsNull() },
      order: { createdAt: "DESC" },
      take: count,
    });
  }

  async saveUploadsFileSize(uploads: FileUpload[]): Promise<void> {
    await this.fileUploadRepository.save(uploads);
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
        location: "FileUploadRepository",
        method: "getAllFileDetails",
        payload: { page, limit, organisationId, companyId, companyName, companyTypeLid, entityType, from, to },
        messageData: "method invoked",
      }),
    });
    try {
      const qb = this.fileUploadRepository
        .createQueryBuilder("fu")
        .leftJoin("fu.createdByUser", "u")
        .leftJoin("fu.company", "c")
        .select([
          "fu.id",
          "fu.fileKey",
          "fu.createdAt",
          "fu.entityType",
          "fu.entityId",
        ]);

      // Apply filters based on the SQL query pattern
      if (organisationId) {
        qb.andWhere("u.organisationId = :organisationId", { organisationId });
      }

      if (companyTypeLid) {
        qb.andWhere("c.companyTypeLid = :companyTypeLid", { companyTypeLid });
      }

      if (companyId) {
        qb.andWhere("fu.entityId = :companyId", { companyId });
      }

      if (companyName) {
        qb.andWhere("c.companyName ILIKE :companyName", { 
          companyName: `%${companyName}%` 
        });
      }

      if (entityType) {
        qb.andWhere("fu.entityType ILIKE :entityType", { 
          entityType: `%${entityType}%` 
        });
      }

      if (from && to) {
        qb.andWhere("fu.createdAt BETWEEN :from AND :to", { from, to });
      } else if (from) {
        qb.andWhere("fu.createdAt >= :from", { from });
      } else if (to) {
        qb.andWhere("fu.createdAt <= :to", { to });
      }

      qb.orderBy("fu.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit);

      const [records, count] = await qb.getManyAndCount();

      return {
        data: records.map((r) => ({
          id: r.id,
          fileKey: r.fileKey,
          createdAt: r.createdAt,
          entityType: r.entityType,
          entityId: r.entityId,
        })),
        count,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadRepository",
          method: "getAllFileDetails",
          payload: { page, limit, organisationId, companyId, companyName, companyTypeLid, entityType, from, to },
          messageData: `${error?.message || error}`,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to retrieve file details list: ${error?.message || error}`
      );
    }
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
        location: "FileUploadRepository",
        method: "getFileDetails",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileUpload = await this.fileUploadRepository
        .createQueryBuilder("fu")
        .select([
          "fu.fileKey",
          "fu.createdAt",
          "fu.entityType",
          "fu.entityId",
        ])
        .where("fu.id = :id", { id: documentId })
        .getOne();

      if (!fileUpload) {
        throw new NotFoundException(`File with ID ${documentId} not found`);
      }

      return {
        fileKey: fileUpload.fileKey,
        createdAt: fileUpload.createdAt,
        entityType: fileUpload.entityType,
        entityId: fileUpload.entityId,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadRepository",
          method: "getFileDetails",
          payload: { documentId },
          messageData: `${error?.message || error}`,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve file details: ${error?.message || error}`
      );
    }
  }
}
