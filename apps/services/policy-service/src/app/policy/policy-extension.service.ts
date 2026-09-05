import * as fs from "fs";
import * as path from "path";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import * as XLSX from "xlsx";
import {
  DocumentProcessingFile,
  FileUpload,
  Policy,
  PolicyAssetEndorsement,
  PolicyEnrollmentUploadSummary,
  PolicyExtensionAudit,
  PolicyExtensionDocument,
} from "../../../../service-lib/src/lib/entities";
import { DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  DOCUMENT_PROCESS_STATUS,
  ENDORSEMENT_STATUS,
  ENDORSEMENT_TYPES,
  GROUP_POLICY_TYPES,
  ENTITY_NAME,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  mapSortParams,
  buildOrderCondition,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { ENDORSEMENT_TYPE_EXTENSION } from "../../../../service-lib/src/lib/entities/policy-extension-audit.entity";
import { sanitizePath } from "../../../../service-lib/src/lib/utils/path-sanitizer.util";
import {
  getSignedUrl,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";

export interface SubmitExtensionDto {
  extensionDate: string;
  endorsementType: string;
  premium?: number | null;
  remarks?: string | null;
  osTicketNumber?: string | null;
  endorsementRequestReceivedDate?: string | null;
  endorsementId?: number | null;
}

export interface ExtensionDocumentRecord {
  id: number;
  fileName: string;
  uploadedAt: Date;
  downloadUrl: string;
}

@Injectable()
export class PolicyExtensionService {
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";

  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(FileUpload)
    private readonly fileUploadRepo: Repository<FileUpload>,
    @InjectRepository(DocumentProcessingFile)
    private readonly docProcessingRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(PolicyExtensionAudit)
    private readonly auditRepo: Repository<PolicyExtensionAudit>,
    @InjectRepository(PolicyEnrollmentUploadSummary)
    private readonly summaryRepo: Repository<PolicyEnrollmentUploadSummary>,
    @InjectRepository(PolicyAssetEndorsement)
    private readonly assetEndorsementRepo: Repository<PolicyAssetEndorsement>,
    @InjectRepository(PolicyExtensionDocument)
    private readonly extensionDocRepo: Repository<PolicyExtensionDocument>,
    private readonly dataSource: DataSource,
  ) {}

  private async loadPolicy(policyId: number): Promise<Policy> {
    const policy = await this.policyRepo.findOne({
      where: { id: policyId },
      relations: ["policyType"],
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }
    return policy;
  }

  private assertNonGrouped(policy: Policy): void {
    if (GROUP_POLICY_TYPES.includes(policy.policyType?.lookUpKey)) {
      throw new BadRequestException(
        "Policy is a grouped type and is not eligible for extension",
      );
    }
  }

  // ─── New form-based submit ─────────────────────────────────────────────────

  async submitExtension(
    policyId: number,
    dto: SubmitExtensionDto,
    userId: number,
  ): Promise<{ endorsementId: number; netPremium: number | null }> {
    const policy = await this.loadPolicy(policyId);
    this.assertNonGrouped(policy);

    const currentPolicyTo = policy.policyTo ? new Date(policy.policyTo) : null;
    const newExtensionDate = new Date(dto.extensionDate);

    if (!currentPolicyTo || newExtensionDate <= currentPolicyTo) {
      throw new BadRequestException(
        `Extension date must be after the current policy end date (current: ${currentPolicyTo?.toISOString().split("T")[0] ?? "N/A"})`,
      );
    }

    if (
      dto.endorsementType === ENDORSEMENT_TYPES.FINANCIAL_ENDORSEMENT &&
      (dto.premium === null || dto.premium === undefined)
    ) {
      throw new BadRequestException(
        "Premium is required for financial endorsements",
      );
    }

    const premiumValue =
      dto.premium !== null && dto.premium !== undefined
        ? Number(dto.premium)
        : null;

    // ── In-progress guard ────────────────────────────────────────────────────
    // Block only when creating a NEW extension while one is already in-progress.
    // If dto.endorsementId is provided the caller is updating an existing record
    // and must be allowed through regardless.
    if (!dto.endorsementId) {
      const inProgressAudit = await this.auditRepo.findOne({
        where: { policyId, status: 'in-progress' } as any,
        order: { createdAt: 'DESC' },
        select: ['id'],
      });
      if (inProgressAudit) {
        const inProgressEndorsement = await this.assetEndorsementRepo.findOne({
          where: { policyId, endorsementType: 'EXTENSION' },
          order: { createdAt: 'DESC' },
          select: ['id'],
        });
        throw new BadRequestException(
          `Endorsement ID ${inProgressEndorsement?.id} is already in progress for extension, proceed with that`,
        );
      }
    }

    // ── Update existing endorsement ──────────────────────────────────────────
    if (dto.endorsementId) {
      const existing = await this.assetEndorsementRepo.findOne({
        where: { id: dto.endorsementId, policyId, endorsementType: 'EXTENSION' },
      });
      if (!existing) {
        throw new NotFoundException(
          `Extension endorsement ${dto.endorsementId} not found for policy ${policyId}`,
        );
      }

      await this.assetEndorsementRepo.update(
        { id: dto.endorsementId },
        {
          endorsementEffectiveDate: newExtensionDate,
          netPremium: premiumValue ?? undefined,
          remarks: dto.remarks ?? undefined,
          updatedBy: userId,
        },
      );

      // Update the matching in-progress audit record for this policy
      const auditToUpdate = await this.auditRepo.findOne({
        where: { policyId, status: 'in-progress' } as any,
        order: { createdAt: 'DESC' },
        select: ['id'],
      });
      if (auditToUpdate) {
        await this.auditRepo.update(
          { id: auditToUpdate.id },
          {
            extensionDate: dto.extensionDate,
            remarks: dto.remarks ?? undefined,
          },
        );
      }

      return { endorsementId: dto.endorsementId, netPremium: premiumValue };
    }

    // ── Create new endorsement ───────────────────────────────────────────────
    const previousPolicyToDate = currentPolicyTo.toISOString().split("T")[0];

    const endorsementId = await this.dataSource.transaction(async (manager) => {
      const endorsementEntryDate = dto.endorsementRequestReceivedDate
        ? new Date(dto.endorsementRequestReceivedDate)
        : new Date();

      const insertRows: any[] = await manager.query(
        `INSERT INTO policy_asset_endorsement
           (policy_id, company_id, created_by, updated_by,
            current_endorsement_step, endorsement_status,
            financial_non_financially, remarks,
            os_ticket_number, endorsement_entry_date, endorsement_type,
            endorsement_effective_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          policyId,
          policy.companyId,
          userId,
          userId,
          1,
          ENDORSEMENT_STATUS.ENDORSEMENT_REQUEST_RECEIVED,
          dto.endorsementType ?? null,
          dto.remarks ?? null,
          dto.osTicketNumber ?? null,
          endorsementEntryDate,
          "EXTENSION",
          dto.extensionDate ?? null,
        ],
      );

      const newEndorsementId = insertRows[0].id;

      if (premiumValue !== null) {
        await manager.query(
          `UPDATE policy_asset_endorsement SET net_premium = $1 WHERE id = $2`,
          [premiumValue, newEndorsementId],
        );
      }

      await manager.save(
        manager.create(PolicyExtensionAudit, {
          policyId,
          insurerPolicyNumber: policy.insurerPolicyNumber ?? String(policyId),
          endorsementType: ENDORSEMENT_TYPE_EXTENSION,
          previousPolicyToDate,
          extensionDate: dto.extensionDate,
          remarks: dto.remarks ?? "",
          sourceFileUploadId: null,
          processedBy: userId,
          isReverted: false,
          status: 'in-progress',
        }),
      );

      return newEndorsementId;
    });

    return { endorsementId, netPremium: premiumValue };
  }

  // ─── Document upload after extension ──────────────────────────────────────

  async uploadDocument(
    policyId: number,
    endorsementId: number,
    file: Express.Multer.File,
    userId: number,
  ): Promise<{ documentId: number; policyExtensionDocumentId: number }> {
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `uploads/policy-extension/documents/${policyId}/${timestamp}-${safeFileName}`;

    if (this.repoMode === "AWS") {
      await uploadToS3(file.buffer, fileKey, file.mimetype);
    } else {
      const sanitized = sanitizePath(fileKey, this.docRepoPath);
      const targetPath = path.join(this.docRepoPath, sanitized);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, file.buffer);
    }

    const fileUploadRecord = await this.fileUploadRepo.save(
      this.fileUploadRepo.create({
        fileKey,
        entityType: DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
        entityId: policyId,
        policyId,
        uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
        documentTypeLid: 0,
        createdBy: userId,
        updatedBy: userId,
        status: "ACTIVE",
      }),
    );

    const docRecord = await this.extensionDocRepo.save(
      this.extensionDocRepo.create({
        policyId,
        endorsementId,
        documentId: fileUploadRecord.id,
        status: "active",
        createdBy: userId,
        updatedBy: userId,
      }),
    );

    return {
      id: fileUploadRecord.id,
      documentId: fileUploadRecord.id,
      policyExtensionDocumentId: docRecord.id,
    };
  }

  // ─── List documents for an extension endorsement ──────────────────────────

  async listDocuments(
    policyId: number,
    endorsementId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: ExtensionDocumentRecord[]; total: number }> {
    const [records, total] = await this.extensionDocRepo.findAndCount({
      where: { policyId, endorsementId },
      relations: ["document"],
      order: { createdAt: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const results: ExtensionDocumentRecord[] = [];

    for (const rec of records) {
      const fileKey = rec.document?.fileKey;
      let downloadUrl = fileKey ?? "";

      if (this.repoMode === "AWS" && fileKey) {
        try {
          downloadUrl = await getSignedUrl(fileKey, { expiresSeconds: 3600 });
        } catch {
          downloadUrl = fileKey;
        }
      }

      const rawName = fileKey?.split("/").pop() ?? "document";
      // Strip the leading timestamp prefix (e.g. "1716000000000-filename.pdf" → "filename.pdf")
      const fileName = rawName.replace(/^\d+-/, "");

      results.push({
        id: rec.id,
        fileName,
        uploadedAt: rec.createdAt,
        downloadUrl,
      });
    }

    return { data: results, total };
  }

  // ─── Legacy template + async upload methods (unchanged) ──────────────────

  async generateTemplate(
    policyId: number,
  ): Promise<{ documentId: number; fileName: string }> {
    const policy = await this.loadPolicy(policyId);
    this.assertNonGrouped(policy);

    const fileName = `policy-extension-template-${policyId}.xlsx`;
    const fileKey = `uploads/policy/extension/templates/${fileName}`;

    const headers = [
      "Endorsement Type",
      "IIRM Policy Number",
      "Insurer Policy Number",
      "Extension Date",
      "Remarks",
    ];
    const dataRow = [ENDORSEMENT_TYPE_EXTENSION, policy.id, "", "", ""];

    const ws = XLSX.utils.aoa_to_sheet([headers, dataRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Policy Extension");
    const buffer: Buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    try {
      if (this.repoMode === "AWS") {
        await uploadToS3(
          buffer,
          fileKey,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      } else {
        const sanitized = sanitizePath(fileKey, this.docRepoPath);
        const targetPath = path.join(this.docRepoPath, sanitized);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, buffer);
      }
    } catch (err) {
      throw new InternalServerErrorException(
        "Failed to save policy extension template",
      );
    }

    const existing = await this.fileUploadRepo.findOne({ where: { fileKey } });
    const fileUploadEntry =
      existing ??
      (await this.fileUploadRepo.save(
        this.fileUploadRepo.create({
          fileKey,
          entityType: DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
          entityId: policyId,
          policyId,
          uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
          documentTypeLid: 0,
          createdBy: 0,
          updatedBy: 0,
        }),
      ));

    return { documentId: fileUploadEntry.id, fileName };
  }

  async createExtensionUpload(
    policyId: number,
    userId: number,
    documentId: number,
    endorsementId?: number,
    osTicketNumber?: string,
    endorsementType?: string,
    endorsementEntryDate?: string,
  ): Promise<DocumentProcessingFile> {
    const policy = await this.loadPolicy(policyId);
    this.assertNonGrouped(policy);

    let resolvedEndorsementId = endorsementId;
    if (!resolvedEndorsementId) {
      const endorsement = this.assetEndorsementRepo.create({
        policyId,
        companyId: policy.companyId,
        createdBy: userId,
        updatedBy: userId,
        currentEndorsementStep: 1,
        endorsementStatus: ENDORSEMENT_STATUS.ENDORSEMENT_REQUEST_RECEIVED,
        osTicketNumber: osTicketNumber ?? null,
        endorsementType: endorsementType ?? null,
        endorsementEntryDate: endorsementEntryDate
          ? new Date(endorsementEntryDate)
          : new Date(),
      });
      const saved = await this.assetEndorsementRepo.save(endorsement);
      resolvedEndorsementId = saved.id;
    }

    const record = this.docProcessingRepo.create({
      entityType: "policy",
      entityId: policyId,
      documentId,
      documentType: DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
      processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
      createdBy: userId,
      updatedBy: userId,
      endorsementId: resolvedEndorsementId,
    });
    return this.docProcessingRepo.save(record);
  }

  async getAuditHistory(
    policyId: number,
    page: number,
    limit: number,
    sort?: string,
  ): Promise<{ data: PolicyExtensionAudit[]; total: number }> {
    const sortParams = mapSortParams(
      sort,
      ENTITY_NAME.POLICY_EXTENSION_AUDIT.toUpperCase(),
    );
    const order =
      sortParams.length > 0
        ? buildOrderCondition(this.auditRepo, sortParams, undefined)
        : { createdAt: "DESC" as const };
    const [data, total] = await this.auditRepo.findAndCount({
      where: { policyId },
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getUploadStatus(
    dpfId: number,
  ): Promise<{ processStatus: string; errorFileUploadId: number | null }> {
    const dpf = await this.docProcessingRepo.findOne({ where: { id: dpfId } });
    if (!dpf) {
      throw new NotFoundException(
        `Document processing file ${dpfId} not found`,
      );
    }

    const summary = await this.summaryRepo.findOne({
      where: { documentProcessingFileId: dpfId },
    });

    return {
      processStatus: dpf.processStatus,
      errorFileUploadId: summary?.errorFileUploadId ?? null,
    };
  }

  async getExtensionDetails(policyId: number, endorsementId: number) {
    const endorsement = await this.assetEndorsementRepo.findOne({
      where: { id: endorsementId, policyId },
      select: [
        "id",
        "netPremium",
        "remarks",
        "financialNonFinancially",
        "osTicketNumber",
        "endorsementEntryDate",
        "endorsementEffectiveDate",
        "endorsementType",
      ],
    });

    if (!endorsement) {
      throw new NotFoundException(
        `Extension endorsement ${endorsementId} not found for policy ${policyId}`,
      );
    }

    const toDateStr = (value: Date | string | null | undefined): string | null => {
      if (!value) return null;
      const d = value instanceof Date ? value : new Date(value);
      return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
    };

    return {
      endorsementId: endorsement.id,
      extensionDate: toDateStr(endorsement.endorsementEffectiveDate),
      premium: endorsement.netPremium ?? null,
      remarks: endorsement.remarks ?? null,
      endorsementType: endorsement.financialNonFinancially ?? null,
      osTicketNumber: endorsement.osTicketNumber ?? null,
      endorsementRequestReceivedDate: toDateStr(endorsement.endorsementEntryDate),
    };
  }
}
