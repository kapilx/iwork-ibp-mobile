import { Injectable } from "@nestjs/common";
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from "@aws-sdk/client-ses";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as AWS from "aws-sdk";
import { promises as fsPromises } from "fs";
import * as path from "path";
import * as mime from "mime-types";
import { randomUUID } from "crypto";
import { PassThrough, Readable } from "stream";
import archiver from "archiver";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";

import { ENV } from "../../../../service-lib/src/lib/environment";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import {
  generatePasswordFromUser,
  applyPasswordProtection,
  UserDetailsForPassword,
} from "../../../../service-lib/src/lib/utils/password-protection.utils";
import { sanitizePath } from "../../../../service-lib/src/lib/utils/path-sanitizer.util";

type AttachmentContent = {
  fileName: string;
  contentType: string;
  buffer: Buffer;
};

type EmailAttachment = {
  fileName: string;
  contentType: string;
  content: string;
};
@Injectable()
export class EmailService {
  private sesClient: SESClient;
  private repositoryMode: string = "";
  private bucket: string = "";
  private documentRepositoryPath: string = "";
  private s3Client?: AWS.S3;
  private readonly maxAttachmentSizeBytes = 10 * 1024 * 1024;
  private readonly zipAttachmentType = "application/zip";
  private readonly targetCompressionRatio = 0.75;
  private readonly tarGzAttachmentType = "application/gzip";
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService
  ) {
    this.sesClient = new SESClient({
      region: ENV.AWS_REGION,
    });
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE
    );
    this.repositoryMode = (ENV.DOCUMENT_REPOSITORY_MODE || "LFS").toUpperCase();
    this.bucket = ENV.S3_AWS_BUCKET || "";
    this.documentRepositoryPath =
      ENV.DOCUMENT_REPOSITORY || "tmp/document-repository";

    if (this.repositoryMode === "AWS") {
      AWS.config.update({
        region: ENV.S3_AWS_REGION,
      });
      this.s3Client = new AWS.S3();
    }
  }

  async sendEmailViaSendGrid(
    toAddress: string[],
    ccAddress: string[],
    subject: string,
    body: string
  ): Promise<{ provider: string; messageId: string | null; fromSender: string }> {
    const apiKey = ENV.SENDGRID_API_KEY;
    const fromEmail = ENV.SENDGRID_FROM_EMAIL || ENV.EMAIL_FROM;
    const fromName = ENV.SENDGRID_FROM_NAME || "";

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EmailService",
        method: "sendEmailViaSendGrid",
        messageData: `[SENDGRID] Attempting to send email | from=${fromEmail} | to=${toAddress.join(",")} | cc=${ccAddress.join(",") || "none"} | subject=${subject}`,
      }),
    });

    if (!apiKey || !fromEmail) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmailService",
          method: "sendEmailViaSendGrid",
          messageData: `[SENDGRID] FAILED — missing config | SENDGRID_API_KEY=${apiKey ? "set" : "MISSING"} | SENDGRID_FROM_EMAIL=${fromEmail ? fromEmail : "MISSING"}`,
        }),
      });
      throw new Error("SendGrid not configured: SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required");
    }

    const payload: Record<string, any> = {
      personalizations: [
        {
          to: toAddress.map((e) => ({ email: e })),
          ...(ccAddress.length ? { cc: ccAddress.map((e) => ({ email: e })) } : {}),
        },
      ],
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      subject,
      content: [{ type: "text/html", value: body }],
    };

    try {
      const sendGridApiUrl = ENV.SENDGRID_API_URL || "https://api.sendgrid.com/v3/mail/send";
      const response = await this.traceHttpService.post(
        sendGridApiUrl,
        payload,
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      );

      const messageId = (response?.headers?.["x-message-id"] as string) ?? null;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmailService",
          method: "sendEmailViaSendGrid",
          messageData: `[SENDGRID] Email sent successfully | messageId=${messageId ?? "none"} | from=${fromEmail} | to=${toAddress.join(",")} | httpStatus=${response?.status}`,
        }),
      });
      return { provider: "SENDGRID", messageId, fromSender: fromEmail };
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = JSON.stringify(err?.response?.data ?? err?.message ?? err);
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmailService",
          method: "sendEmailViaSendGrid",
          messageData: `[SENDGRID] Email FAILED | httpStatus=${status ?? "unknown"} | error=${detail} | from=${fromEmail} | to=${toAddress.join(",")}`,
        }),
      });
      throw err;
    }
  }

  async sendEmail(
    toAddress: string[],
    ccAddress: string[],
    subject: string,
    body: string,
    attachments?: number[],
    userId?: number,
    isServiceEmail: boolean = false,
    skipPasswordProtection: boolean = false
  ) {
    try {
      let sourceEmail = ENV.EMAIL_FROM;
      if (isServiceEmail ) {
        sourceEmail = ENV.SERVICE_EMAIL_FROM ?? ENV.EMAIL_FROM
      }
      if (attachments && attachments.length > 0) {
        const attachmentUploads = await this.prepareAttachments(attachments, userId, skipPasswordProtection);
        const rawMessage = this.buildRawEmail(
          toAddress,
          ccAddress,
          subject,
          body,
          attachmentUploads
        );
        const sendRawEmailCommand = new SendRawEmailCommand({
          Source: sourceEmail,
          Destinations: [...toAddress, ...ccAddress],
          RawMessage: { Data: rawMessage },
        });
        return await this.sesClient.send(sendRawEmailCommand);
      } else {
        const sendEmailCommand = new SendEmailCommand({
          Destination: {
            CcAddresses: ccAddress,
            ToAddresses: toAddress,
          },
          Message: {
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: body,
              },
              Text: {
                Charset: "UTF-8",
                Data: body,
              },
            },
            Subject: {
              Charset: "UTF-8",
              Data: subject,
            },
          },
          Source: ENV.EMAIL_FROM,
        });
        return await this.sesClient.send(sendEmailCommand);
      }
    } catch (e) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmailService",
          method: "sendEmail",
          messageData: `Error in sendEmail: ${e}`,
        }),
      });
      throw new Error("Failed to send email. " + e);
    }
  }
  private async prepareAttachments(
    attachmentIds: number[],
    userId?: number,
    skipPasswordProtection: boolean = false
  ): Promise<EmailAttachment[]> {
    if (!attachmentIds || attachmentIds.length === 0) {
      return [];
    }

    const sanitizedIds = Array.from(
      new Set(
        attachmentIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    if (sanitizedIds.length === 0) {
      return [];
    }

    // Fetch user details for password generation
    let userDetails: UserDetailsForPassword | null = null;
    if (userId) {
      try {
        userDetails = await this.getUserDetails(userId);
      } catch (error) {
        this.logger.warn({
          level: 'warn',
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: 'failure',
            location: 'EmailService',
            method: 'prepareAttachments',
            messageData: `Failed to fetch user details for userId ${userId}, using default password`,
          }),
        });
      }
    }

    const uploads = await this.fileUploadRepository.find({
      where: { id: In(sanitizedIds) },
    });

    const uploadMap = new Map(uploads.map((upload) => [upload.id, upload]));
    const attachments: EmailAttachment[] = [];

    for (const id of sanitizedIds) {
      const fileUpload = uploadMap.get(id);
      if (!fileUpload) {
        throw new Error(`Attachment with id ${id} was not found`);
      }
      attachments.push(await this.buildAttachment(fileUpload, userDetails, skipPasswordProtection));
    }

    return attachments;
  }

  private async buildAttachment(
    fileUpload: FileUpload,
    userDetails: UserDetailsForPassword | null = null,
    skipPasswordProtection: boolean = false
  ): Promise<EmailAttachment> {
    const fileKey = fileUpload.fileKey;
    const fileName = this.extractFileName(fileKey);
    let buffer: Buffer;
    let contentType: string;

    if (this.repositoryMode === "AWS") {
      if (!this.s3Client || !this.bucket) {
        throw new Error("AWS S3 configuration is missing.");
      }

      const result = await this.s3Client
        .getObject({ Bucket: this.bucket, Key: fileKey })
        .promise();

      if (!result.Body) {
        throw new Error(`Empty file received for attachment ${fileUpload.id}`);
      }

      buffer = await this.toBuffer(result.Body);
      contentType =
        result.ContentType ||
        ((mime.lookup(fileName) || "application/octet-stream") as string);
    } else {
      const sanitizedFileKey = sanitizePath(fileKey, this.documentRepositoryPath);
      const absolutePath = path.join(this.documentRepositoryPath, sanitizedFileKey);
      buffer = await fsPromises.readFile(absolutePath);
      contentType = (mime.lookup(absolutePath) ||
        "application/octet-stream") as string;
    }

    const password = generatePasswordFromUser(userDetails);
    const moduleKey = this.determineModuleKey(fileUpload);
    const isModulePasswordEnabled = skipPasswordProtection
      ? false
      : await this.getModulePasswordConfig(moduleKey);

    const protectedFile = await applyPasswordProtection(
      buffer,
      fileName,
      password,
      moduleKey,
      isModulePasswordEnabled
    );

    return await this.processAttachment(
      protectedFile.fileName,
      protectedFile.data,
      protectedFile.mimeType
    );
  }

  private extractFileName(fileKey: string): string {
    if (!fileKey) {
      throw new Error("Invalid file key for attachment");
    }
    const parts = fileKey.split("/");
    return parts[parts.length - 1] || `attachment-${Date.now()}`;
  }

  private async getUserDetails(userId: number): Promise<UserDetailsForPassword | null> {
    try {
      const authServiceUrl = ENV.URL_AUTH_SERVICE || 'http://localhost:3001';
      const response = await this.traceHttpService.get(
        `${authServiceUrl}/users/${userId}`
      );

      const user = response.data?.data;
      if (!user) return null;

      return {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      };
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'EmailService',
          method: 'getUserDetails',
          messageData: `Failed to fetch user details for userId ${userId}: ${error.message}`,
        }),
      });
      return null;
    }
  }

  private determineModuleKey(fileUpload: FileUpload): string {
    // Determine module key based on fileUpload metadata
    const companyType = fileUpload.entityType?.toLowerCase();
    const fileKey = fileUpload.fileKey?.toLowerCase();

    // Check for endorsement/enrollment
    if (fileKey?.includes('enrollment') || fileKey?.includes('endorsement')) {
      return 'endorsement';
    }

    // Check for company documents
    if (companyType?.includes('company') || fileKey?.includes('company')) {
      return 'company_documents';
    }

    // Check for policy
    if (companyType === 'policy' || fileKey?.includes('policy')) {
      return 'policy';
    }

    // Check for opportunity
    if (fileUpload.opportunityId) {
      if (fileUpload.opportunityActivityId) {
        return 'opportunity_activity';
      }
      return 'opportunity';
    }

    // Check for employee documents
    if (fileKey?.includes('employee')) {
      return 'employee_documents';
    }

    // Default to general documents
    return 'company_documents';
  }

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
          location: 'EmailService',
          method: 'getModulePasswordConfig',
          messageData: `Failed to fetch module config for ${categoryKey}, defaulting to false: ${error.message}`,
        }),
      });
      return false;
    }
  }

  private async toBuffer(body: AWS.S3.Body): Promise<Buffer> {
    if (Buffer.isBuffer(body)) {
      return body;
    }
    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }
    if (typeof body === "string") {
      return Buffer.from(body);
    }
    if (body instanceof Readable) {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        body.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        body.on("end", () => resolve(Buffer.concat(chunks)));
        body.on("error", (err) => reject(err));
      });
    }
    const maybeBlob = body as { arrayBuffer?: () => Promise<ArrayBuffer> };
    if (maybeBlob && typeof maybeBlob.arrayBuffer === "function") {
      const arrayBuffer = await maybeBlob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    throw new Error("Unsupported S3 body type");
  }

  private async processAttachment(
    fileName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<EmailAttachment> {
    if (buffer.length <= this.maxAttachmentSizeBytes) {
      return {
        fileName,
        contentType,
        content: buffer.toString("base64"),
      };
    }

    const compressedContent = await this.compressAttachment(fileName, buffer);

    return {
      fileName: compressedContent.fileName,
      contentType: compressedContent.contentType,
      content: compressedContent.buffer.toString("base64"),
    };
  }

  private async compressAttachment(
    fileName: string,
    buffer: Buffer
  ): Promise<AttachmentContent> {
    const [zipCompressed, tarGzCompressed] = await Promise.all([
      this.compressWithZip(fileName, buffer),
      this.compressWithTarGz(fileName, buffer),
    ]);
    const candidates = [zipCompressed, tarGzCompressed].filter(
      (value): value is AttachmentContent => value != null
    );

    if (candidates.length === 0) {
      throw new Error("Failed to compress attachment with archiver");
    }

    const bestCandidate = candidates.reduce((smallest, current) =>
      current.buffer.length < smallest.buffer.length ? current : smallest
    );

    const achievedRatio = bestCandidate.buffer.length / buffer.length;
    if (achievedRatio > this.targetCompressionRatio) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          payload: {},
          status: "success",
          location: "EmailService",
          method: "compressAttachment",
          messageData: `Attachment compression ratio (${(
            achievedRatio * 100
          ).toFixed(2)}%) exceeded target of ${
            this.targetCompressionRatio * 100
          }%`,
        }),
      });
    }

    return bestCandidate;
  }

  private async compressWithZip(
    fileName: string,
    buffer: Buffer
  ): Promise<AttachmentContent | null> {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const zipStream = new PassThrough();
      const chunks: Buffer[] = [];

      zipStream.on("data", (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );

      const archivePromise = new Promise<AttachmentContent>(
        (resolve, reject) => {
          zipStream.on("end", () => {
            resolve({
              fileName: fileName.endsWith(".zip")
                ? fileName
                : `${fileName}.zip`,
              contentType: this.zipAttachmentType,
              buffer: Buffer.concat(chunks),
            });
          });

          const handleError = (error: Error) => reject(error);

          zipStream.on("error", handleError);
          archive.on("error", handleError);
          archive.on("warning", (error) => {
            if ((error as { code?: string }).code === "ENOENT") {
              this.logger.log({
                level: "error",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "EmailService",
                  method: "compressWithZip",
                  messageData: `Zip compression failed, skipping zip candidate: ${error}`,
                }),
              });
            } else {
              reject(error);
            }
          });
        }
      );

      archive.pipe(zipStream);
      archive.append(buffer, { name: fileName });
      await archive.finalize();

      return await archivePromise;
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmailService",
          method: "compressWithZip",
          messageData: `Zip compression failed, skipping zip candidate: ${error}`,
        }),
      });
      return null;
    }
  }

  private async compressWithTarGz(
    fileName: string,
    buffer: Buffer
  ): Promise<AttachmentContent | null> {
    try {
      const archive = archiver("tar", {
        gzip: true,
        gzipOptions: { level: 9 },
      });
      const tarGzStream = new PassThrough();
      const chunks: Buffer[] = [];

      tarGzStream.on("data", (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );

      const archivePromise = new Promise<AttachmentContent>(
        (resolve, reject) => {
          tarGzStream.on("end", () =>
            resolve({
              fileName: fileName.endsWith(".tar.gz")
                ? fileName
                : `${fileName}.tar.gz`,
              contentType: this.tarGzAttachmentType,
              buffer: Buffer.concat(chunks),
            })
          );

          const handleError = (error: Error) => reject(error);

          tarGzStream.on("error", handleError);
          archive.on("error", handleError);
          archive.on("warning", (error) => {
            if ((error as { code?: string }).code === "ENOENT") {
              this.logger.log({
                level: "error",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "EmailService",
                  method: "compressWithTarGz",
                  messageData: `Tar.gz compression failed, skipping tar.gz candidate: ${error}`,
                }),
              });
            } else {
              reject(error);
            }
          });
        }
      );

      archive.pipe(tarGzStream);
      archive.append(buffer, { name: fileName });
      await archive.finalize();

      return await archivePromise;
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmailService",
          method: "compressWithTarGz",
          messageData: `Tar.gz compression failed, skipping tar.gz candidate: ${error}`,
        }),
      });
      return null;
    }
  }

  private buildRawEmail(
    toAddress: string[],
    ccAddress: string[],
    subject: string,
    body: string,
    attachments: EmailAttachment[]
  ): Uint8Array {
    const boundary = `----=_Part_${randomUUID()}`;
    const alternativeBoundary = `----=_Part_${randomUUID()}`;
    const textBody = this.stripHtml(body);

    const headerLines = [
      `From: ${ENV.EMAIL_FROM}`,
      `To: ${toAddress.join(", ")}`,
      ccAddress.length ? `Cc: ${ccAddress.join(", ")}` : undefined,
      `Subject: ${this.encodeSubject(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      "",
      `--${alternativeBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      textBody,
      "",
      `--${alternativeBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
      "",
      `--${alternativeBoundary}--`,
      "",
    ].filter((line): line is string => line != null);

    for (const attachment of attachments) {
      headerLines.push(`--${boundary}`);
      headerLines.push(
        `Content-Type: ${attachment.contentType}; name="${attachment.fileName}"`
      );
      headerLines.push("Content-Transfer-Encoding: base64");
      headerLines.push(
        `Content-Disposition: attachment; filename="${attachment.fileName}"`
      );
      headerLines.push("");
      headerLines.push(attachment.content);
      headerLines.push("");
    }

    headerLines.push(`--${boundary}--`, "");

    const message = headerLines.join("\r\n");
    return Buffer.from(message);
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, " ");
  }

  private encodeSubject(subject: string): string {
    if (/^[\x00-\x7F]*$/.test(subject)) {
      return subject;
    }
    const base64Subject = Buffer.from(subject).toString("base64");
    return `=?UTF-8?B?${base64Subject}?=`;
  }
}
