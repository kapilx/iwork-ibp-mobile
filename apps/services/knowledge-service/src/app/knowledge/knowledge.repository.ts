import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KnowledgeCentral } from "../../../../service-lib/src/lib/entities/knowledge-central.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import {
  KNOWLEDGE_STATUS_ACTIVE,
  KNOWLEDGE_STATUS_DELETED,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  sanitizeFilename,
  sanitizePath,
  getFileExtension,
} from "../../../../service-lib/src/lib/utils/path-sanitizer.util";

@Injectable()
export class KnowledgeRepository {
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  private readonly region = process.env.S3_AWS_REGION || "";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly initialized: boolean = false;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(KnowledgeCentral)
    private readonly kcRepo: Repository<KnowledgeCentral>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.KNOWLEDGE_SERVICE
    );
    if (this.repoMode === "AWS") {
      try {
        AWS.config.update({
          // accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
          // secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
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
            location: "KnowledgeRepository",
            method: "constructor",
            messageData: err,
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
              location: "KnowledgeRepository",
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
            location: "KnowledgeRepository",
            method: "constructor",
            messageData: err,
          }),
        });
        this.initialized = false;
      }
    }
  }

  private async getStatusId(key: string): Promise<number> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "getStatusId",
        payload: { key },
        messageData: "method invoked",
      }),
    });
    const status = await this.kcRepo.manager.findOne(LookUp, {
      where: { lookUpKey: key },
    });
    if (!status) {
      throw new Error(`Status lookup not found for key ${key}`);
    }
    return status.id;
  }

  async createFileEntry(
    file: Express.Multer.File,
    data: Partial<KnowledgeCentral>
  ) {
    if (!this.initialized) {
      throw new Error(
        "Document repository is not initialized. Cannot create file entry."
      );
    }
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "createFileEntry",
        messageData: "Document repository initialized successfully.",
      }),
    });

    const sanitizedFilename = sanitizeFilename(file.originalname);
    const fileName = `${Date.now()}_${sanitizedFilename}`;
    const key = `uploads/knowledge-central/${data.categoryId}/${fileName}`;
    let relativePath = key;
    try {
      if (this.repoMode === "AWS") {
        const uploadResult = await this.s3
          .putObject({ Bucket: this.bucket, Key: key, Body: file.buffer })
          .promise();
        if (!uploadResult || uploadResult.$response.error) {
          throw new Error("File upload to S3 failed.");
        }
      } else {
        const fs = require("fs");
        const path = require("path");

        const sanitizedRelativePath = sanitizePath(relativePath, this.docRepoPath);
        const fullDirPath = path.join(this.docRepoPath, sanitizedRelativePath);
        const fullFilePath = path.join(fullDirPath, fileName);
        this.logger.log({
          level: "debug",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "KnowledgeRepository",
            method: "createFileEntry",
            messageData: `Full directory path: ${fullDirPath}`,
          }),
        });
        this.logger.log({
          level: "debug",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "KnowledgeRepository",
            method: "createFileEntry",
            messageData: `Full file path: ${fullFilePath}`,
          }),
        });
        // Ensure directory exists
        try {
          fs.mkdirSync(fullDirPath, { recursive: true });
          this.logger.log({
            level: "debug",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "KnowledgeRepository",
              method: "createFileEntry",
              messageData: `Directory created: ${fullDirPath}`,
            }),
          });
        } catch (mkdirErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "KnowledgeRepository",
              method: "createFileEntry",
              messageData: mkdirErr,
            }),
          });
        }

        // Write file
        try {
          fs.writeFileSync(fullFilePath, file.buffer);
          this.logger.log({
            level: "debug",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "KnowledgeRepository",
              method: "createFileEntry",
              messageData: `File written successfully: ${fullFilePath}`,
            }),
          });
        } catch (writeErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "KnowledgeRepository",
              method: "createFileEntry",
              messageData: writeErr,
            }),
          });
        }
      }

      const newDocumentId: number = Date.now();

      const statusId = await this.getStatusId(KNOWLEDGE_STATUS_ACTIVE);
      const entity = this.kcRepo.create({
        title: data.title,
        docTypeId: data.docTypeId,
        statusId,
        categoryId: data.categoryId,
        fileName: sanitizedFilename,
        relativePath,
        extension: getFileExtension(sanitizedFilename),
        summary: data.summary,
        tags: Array.isArray(data.tags)
          ? data.tags
          : data.tags
          ? [data.tags]
          : [],
        accessCount: 0,
        version: 1,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        documentId: newDocumentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      try {
        const savedData = await this.kcRepo.save(entity);
        return {
          message: "File uploaded successfully",
          data: savedData,
        };
      } catch (saveErr) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "KnowledgeRepository",
            method: "createFileEntry",
            messageData: saveErr,
          }),
        });
        throw new Error("Could not save file metadata to the database.");
      }
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeRepository",
          method: "createFileEntry",
          messageData: err,
        }),
      });
      throw new Error(`File upload failed: ${err.message || err}`);
    }
  }

  async createUrlEntry(data: Partial<KnowledgeCentral>) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "createUrlEntry",
        messageData: "method invoked",
      }),
    });
    const statusId = await this.getStatusId(KNOWLEDGE_STATUS_ACTIVE);
    if (data.tags) {
      data.tags = Array.isArray(data.tags)
        ? data.tags
        : data.tags
        ? [data.tags]
        : [];
    }
    const entity = this.kcRepo.create({
      ...data,
      fileName: data.title,
      statusId,
      relativePath: data.relativePath,
      documentId: Date.now(),
      version: 1,
      accessCount: 0,
    });
    const savedData = await this.kcRepo.save(entity);
    const { relativePath, ...rest } = savedData;
    return {
      message: "URL saved successfully",
      data: {
        ...rest,
        url: relativePath,
      },
    };
  }

  async replaceFile(
    documentId: bigint,
    file: Express.Multer.File,
    updatedBy: number,
    data: Partial<UpdateKnowledgeDto> = {}
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "replaceFile",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const activeStatusId = await this.getStatusId(KNOWLEDGE_STATUS_ACTIVE);
      const deletedStatusId = await this.getStatusId(KNOWLEDGE_STATUS_DELETED);
      const existing = await this.kcRepo.findOne({
        where: { documentId: documentId, statusId: activeStatusId },
        order: { version: "DESC" },
        relations: ["category"],
      });

      if (!existing) {
        throw new Error("Document not found");
      }

      const sanitizedFilename = sanitizeFilename(file.originalname);
      const fileName = `${Date.now()}_${sanitizedFilename}`;
      const category = data.categoryId ?? existing.categoryId;
      const key = `uploads/knowledge-central/${category}/${fileName}`;
      let relativePath = key;

      // Upload the new file to S3 or local file system
      if (this.repoMode === "AWS") {
        await this.s3
          .putObject({ Bucket: this.bucket, Key: key, Body: file.buffer })
          .promise();
      } else {
        const fs = require("fs");
        const path = require("path");
        const sanitizedRelativePath = sanitizePath(
          key.split("/").slice(0, -1).join("/"),
          this.docRepoPath
        );
        const fullDirPath = path.join(this.docRepoPath, sanitizedRelativePath);
        const fullFilePath = path.join(fullDirPath, fileName);

        // Ensure directory exists
        try {
          fs.mkdirSync(fullDirPath, { recursive: true });
          this.logger.log({
            level: "debug",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "KnowledgeRepository",
              method: "replaceFile",
              messageData: `Directory created: ${fullDirPath}`,
            }),
          });
        } catch (mkdirErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "KnowledgeRepository",
              method: "replaceFile",
              messageData: mkdirErr,
            }),
          });
        }

        // Write file
        try {
          fs.writeFileSync(fullFilePath, file.buffer);
          this.logger.log({
            level: "debug",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "KnowledgeRepository",
              method: "replaceFile",
              messageData: `File written successfully: ${fullFilePath}`,
            }),
          });
        } catch (writeErr) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "KnowledgeRepository",
              method: "replaceFile",
              messageData: writeErr,
            }),
          });
        }
      }

      // Mark existing document as deleted
      await this.kcRepo.save({
        ...existing,
        statusId: deletedStatusId,
        deletedAt: new Date(),
        updatedBy,
      });
      if (data.tags) {
        data.tags = Array.isArray(data.tags)
          ? data.tags
          : data.tags
          ? [data.tags]
          : [];
      }
      // Create a new entry with updated details
      const newEntry = this.kcRepo.create({
        ...existing,
        ...data,
        id: undefined,
        relativePath,
        fileName: sanitizedFilename,
        extension: getFileExtension(sanitizedFilename),
        version: (existing.version || 1) + 1,
        statusId: activeStatusId,
        deletedAt: null,
        documentId: documentId,
        createdBy: updatedBy,
        updatedBy,
      });

      await this.kcRepo.save(newEntry);

      return { message: "File updated successfully." };
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeRepository",
          method: "replaceFile",
          messageData: err,
        }),
      });
      throw new Error(`File replacement failed: ${err.message || err}`);
    }
  }

  async replaceUrl(
    documentId: bigint,
    url: string,
    updatedBy: number,
    data: Partial<KnowledgeCentral> = {}
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "replaceUrl",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    const activeStatusId = await this.getStatusId(KNOWLEDGE_STATUS_ACTIVE);
    const deletedStatusId = await this.getStatusId(KNOWLEDGE_STATUS_DELETED);
    const existing = await this.kcRepo.findOne({
      where: { documentId, statusId: activeStatusId },
      order: { version: "DESC" },
    });
    if (!existing) return { message: "Unable to find the requested resource" };
    await this.kcRepo.save({
      ...existing,
      statusId: deletedStatusId,
      deletedAt: new Date(),
      updatedBy,
    });
    const newEntry = this.kcRepo.create({
      ...existing,
      ...data,
      id: undefined,
      fileName: existing.fileName,
      relativePath: url,
      version: (existing.version || 1) + 1,
      statusId: activeStatusId,
      deletedAt: null,
      documentId: existing.documentId,
      createdBy: updatedBy,
      updatedBy,
    });
    return this.kcRepo.save(newEntry);
  }

  async updateMetadata(
    documentId: bigint,
    data: Partial<KnowledgeCentral>,
    updatedBy: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "updateMetadata",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      if (documentId !== data.documentId) {
        throw new Error("Document ID mismatch");
      }
      const existing = await this.kcRepo.findOne({
        where: { documentId, status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE } },
        order: { version: "DESC" },
      });
      if (!existing) {
        return {
          message: "Unable to find the requested resource",
        };
      }
      existing.tags = Array.isArray(data.tags)
        ? data.tags
        : data.tags
        ? [data.tags]
        : [];
      const savedData = await this.kcRepo.save({
        ...existing,
        ...data,
        updatedBy,
      });
      return {
        data: savedData,
        message: "File updated successfully",
      };
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeRepository",
          method: "updateMetadata",
          messageData: err,
        }),
      });
      throw new Error(`Failed to update metadata: ${err.message || err}`);
    }
  }

  async softDelete(documentId: bigint, updatedBy: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "softDelete",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const deletedStatusId = await this.getStatusId(KNOWLEDGE_STATUS_DELETED);
      const existing = await this.kcRepo.findOne({
        where: { documentId, status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE } },
      });
      if (!existing) {
        return {
          message: "Unable to find the requested resource",
        };
      }
      await this.kcRepo.save({
        ...existing,
        statusId: deletedStatusId,
        deletedAt: new Date(),
        updatedBy,
      });

      return {
        message: "Document deleted successfully",
      };
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeRepository",
          method: "softDelete",
          messageData: err,
        }),
      });
      throw new Error(`Failed to delete document: ${err.message || err}`);
    }
  }

  async list(categoryId?: number, page = 1, limit = 10) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "list",
        payload: { categoryId, page, limit },
        messageData: "method invoked",
      }),
    });
    const where: Record<string, any> = {
      status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE },
    };
    if (categoryId) where.categoryId = categoryId;
    return this.kcRepo.find({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async listForAllCategories(start = 0, limit = 10) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "listForAllCategories",
        payload: { start, limit },
        messageData: "method invoked",
      }),
    });
    const categories = await this.kcRepo.manager.find(LookUp, {
      where: { lookUpName: "KNOWLEDGE_CATEGORY" },
      order: { lookUpOrder: "ASC" },
    });
    const docTypes = await this.kcRepo.manager.find(LookUp, {
      where: { lookUpName: "KNOWLEDGE_DOC_TYPE" },
      order: { lookUpOrder: "ASC" },
    });

    const query = `
    WITH categories AS (
      SELECT
        category_id,
        COUNT(*) AS category_count
      FROM knowledge_central
      GROUP BY category_id
    )
    SELECT
      kc.id,
      kc.document_id,
      kc.version,
      kc.title,
      kc.doc_type_id,
      kc.status_id,
      kc.category_id,
      kc.relative_path,
      kc.extension,
      kc.summary,
      kc.tags,
      kc.access_count,
      kc.created_at,
      kc.deleted_at,
      kc.created_by,
      c.category_count
    FROM categories AS c
    CROSS JOIN LATERAL (
      SELECT
        kc.id,
        document_id,
        version,
        title,
        doc_type_id,
        status_id,
        category_id,
        relative_path,
        extension,
        summary,
        tags,
        access_count,
        kc.created_at,
        kc.deleted_at,
        kc.created_by
      FROM knowledge_central AS kc, lookup_data AS ld
      WHERE kc.category_id = c.category_id AND kc.status_id = ld.id
        AND ld.lookup_key = '${KNOWLEDGE_STATUS_ACTIVE}'
      ORDER BY kc.created_at DESC
      LIMIT ${limit} OFFSET ${start}
    ) AS kc
    ORDER BY
      c.category_id,
      kc.created_at DESC;
    `;
    const rawQueryResults: Array<Record<string, any>> = await this.kcRepo.query(
      query
    );
    const data: Record<
      string,
      Array<Omit<KnowledgeCentral, "relativePath"> & { url: string | null }>
    > = {};
    const categoryTotalCounts = new Map<number, number>();

    // Initialize data object with all categories from the LookUp table
    // This ensures that all categories are present in the response, even if empty.
    for (const category of categories) {
      // `categories` is LookUp[]
      data[category.id.toString()] = [];
      categoryTotalCounts.set(category.id, 0);
    }

    // Populate the data object from the raw query results
    for (const row of rawQueryResults) {
      // Map snake_case columns from SQL to camelCase properties of KnowledgeCentral
      const knowledgeEntry: KnowledgeCentral = {
        id: row.id,
        documentId: row.document_id,
        version: row.version,
        title: row.title,
        docTypeId: row.doc_type_id,
        statusId: row.status_id,
        categoryId: row.category_id,
        relativePath: row.relative_path,
        extension: row.extension,
        summary: row.summary,
        tags: row.tags,
        accessCount: row.access_count,
        createdAt: new Date(row.created_at), // Ensure Date type
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        createdBy: row.created_by, // Assuming created_by in DB is a user ID (number)
        // Note: `updatedAt` and `updatedBy` are not selected in the raw query,
        // so they will be undefined in these mapped objects if not added to the SQL SELECT.
      } as KnowledgeCentral; // Cast to KnowledgeCentral type

      categoryTotalCounts.set(row.category_id, row.category_count);
      const categoryIdStr = row.category_id.toString();
      // The categoryIdStr should already exist as a key due to the initialization loop above.
      // Add the entry to the corresponding category list.
      if (data[categoryIdStr]) {
        const { relativePath, ...rest } = knowledgeEntry;
        data[categoryIdStr].push({ ...rest, url: relativePath });
      }
    }

    const augmentedCategories = categories.map((category) => ({
      ...category,
      documentCount: categoryTotalCounts.get(category.id),
    }));

    const mostPopularRaw = await this.kcRepo.find({
      where: { status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE } },
      order: { accessCount: "DESC" },
      skip: start,
      take: limit,
    });
    const recentlyAddedRaw = await this.kcRepo.find({
      where: { status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE } },
      order: { createdAt: "DESC" },
      skip: start,
      take: limit,
    });
    const mostPopular = mostPopularRaw.map((entry) => {
      const { relativePath, ...rest } = entry;
      return { ...rest, url: relativePath };
    });
    const recentlyAdded = recentlyAddedRaw.map((entry) => {
      const { relativePath, ...rest } = entry;
      return { ...rest, url: relativePath };
    });
    return {
      categories: augmentedCategories,
      docTypes,
      data,
      mostPopular,
      recentlyAdded,
    };
  }

  async incrementAccessCount(documentId: bigint) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "incrementAccessCount",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const statusId = await this.getStatusId(KNOWLEDGE_STATUS_ACTIVE);
      await this.kcRepo.increment(
        { documentId: documentId, statusId: statusId },
        "accessCount",
        1
      );

      return {
        message: "Access count incremented successfully",
      };
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeRepository",
          method: "incrementAccessCount",
          messageData: err,
        }),
      });
      throw new Error(
        `Failed to increment access count: ${err.message || err}`
      );
    }
  }

  async findActiveDocument(documentId: bigint) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "findActiveDocument",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    return await this.kcRepo.findOne({
      where: { documentId, status: { lookUpKey: KNOWLEDGE_STATUS_ACTIVE } },
      order: { version: "DESC" },
      relations: ["category"],
    });
  }

  async getFileStream(key: string) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeRepository",
        method: "getFileStream",
        payload: { key },
        messageData: "method invoked",
      }),
    });
    // Validation for required field
    if (!key || typeof key !== "string" || !key.trim()) {
      throw new Error("File key is required.");
    }

    if (this.repoMode === "AWS") {
      // Fetch the file and its metadata from S3
      const params = { Bucket: this.bucket, Key: key };
      try {
        const head = await this.s3.headObject(params).promise();
        const s3Stream = await this.s3.getObject(params).createReadStream();
        return {
          stream: s3Stream,
          mimeType: head.ContentType,
          contentLength: head.ContentLength,
        };
      } catch (err) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "KnowledgeRepository",
            method: "getFileStream",
            messageData: err,
          }),
        });
        throw new Error("File not found in S3.");
      }
    } else {
      // Read the file from the local filesystem (LFS)
      const fs = require("fs");
      const path = require("path");
      const sanitizedKey = sanitizePath(key, this.docRepoPath);
      const fullFilePath = path.join(this.docRepoPath, sanitizedKey);

      if (!fs.existsSync(fullFilePath)) {
        throw new Error("File not found in local storage");
      }
      const localStream = fs.createReadStream(fullFilePath);
      const mime = require("mime-types");
      const mimeType = mime.lookup(fullFilePath) || "application/octet-stream";
      const contentLength = fs.statSync(fullFilePath).size;

      return {
        stream: localStream,
        mimeType,
        contentLength,
      };
    }
  }
}
