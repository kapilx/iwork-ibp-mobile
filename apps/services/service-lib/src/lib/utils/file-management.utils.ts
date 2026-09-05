import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";
import { resolveLocale, formatNumberByLocalization } from "./currency-format.util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { S3 } from "aws-sdk";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ENV } from "../environment";
import axios from "axios";
import {
  applyPasswordProtection,
  generatePasswordFromConfig,
  type UserDetailsForPassword,
} from "./password-protection.utils";
import { FilePasswordConfigClient } from "../service-communication/file-password-config-client";
import {
  iirmLogo,
  iirmSriLankaLogo,
  DEFAULT_POLICY_REPORT_FIELDS,
  DEFAULT_TAB_COLOR,
  DEFAULT_POLICY_REPORT_DATATYPE_FLOAT,
  DEFAULT_POLICY_REPORT_DATATYPE_INTEGER,
  DEFAULT_POLICY_REPORT_DATATYPE_DATE,
  DEFAULT_POLICY_REPORT_TOTAL_FIELDS,
  DEFAULT_POLICY_REPORT_TOTAL_FIELDS_VALUES,
  ORGANISATION_KEYS,
  iirmKenyaLogo,
} from "../constants";
import * as mime from "mime-types";
import { PassThrough } from "stream";
import {
  sanitizeFilename,
  sanitizePath,
  safePathJoin,
} from "./path-sanitizer.util";

const DEFAULT_DOCUMENT_SERVICE_URL = "http://localhost:3013";

const coerceBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return Boolean(value);
};

const createS3Client = (region?: string) => {
  const resolvedRegion = region || ENV.S3_AWS_REGION;
  if (!resolvedRegion) {
    throw new BadRequestException("S3 region is not configured");
  }

  const accessKeyId = ENV.S3_AWS_ACCESS_KEY_ID;
  const secretAccessKey = ENV.S3_AWS_SECRET_ACCESS_KEY;

  // Local/dev: use explicit keys if provided.
  // Server/prod: fall back to IAM role / default AWS credential chain.
  if (accessKeyId && secretAccessKey) {
    return new S3({
      region: resolvedRegion,
      accessKeyId,
      secretAccessKey,
    });
  }

  return new S3({ region: resolvedRegion });
};

const getModulePasswordConfig = async (
  categoryKey: string,
  logger?: FileStorageOptions["logger"]
): Promise<boolean> => {
  try {
    const documentServiceUrl =
      ENV.URL_DOCUMENT_SERVICE || DEFAULT_DOCUMENT_SERVICE_URL;
    const response = await axios.get(
      `${documentServiceUrl}/password-protection-config/${categoryKey}`,
      { timeout: 5000 }
    );
    const enablePassword = response?.data?.enablePassword;
    const result = coerceBoolean(enablePassword);

    logger?.log?.({
      level: "info",
      message: `Module password protection flag for ${categoryKey}: ${result}`,
    });

    return result;
  } catch (error) {
    logger?.error?.({
      level: "error",
      message: `Failed to fetch module config for ${categoryKey}, defaulting to false`,
      error,
    });
    return false;
  }
};

export interface FileStreamResult {
  stream: NodeJS.ReadableStream;
  mimeType?: string;
  contentLength?: number;
}

export interface FileStorageOptions {
  repoMode: string;
  bucket?: string;
  docRepoPath: string;
  region?: string;
  // When both are present, the storage key is namespaced as
  // uploads/company/{companyType}/{entityId}/{uploadCategory}/{timestamp}/{fileName}.
  // Used to keep e.g. insurer acknowledgement docs grouped per endorsement.
  uploadCategory?: string;
  entityId?: number | string;
  logger?: {
    log?: (entry: unknown) => void;
    error?: (entry: unknown) => void;
  };
}

export interface FileDownloadDependencies {
  findDocument: (documentId: number | bigint) => Promise<{ fileKey: string }>;
  fetchStream: (fileKey: string) => Promise<FileStreamResult>;
}

export function extractFileNameFromKey(filePath: string): string {
  const parts = String(filePath).split("/");
  return parts[parts.length - 1];
}

export async function saveFileToStorage(
  file: Express.Multer.File,
  companyType: string,
  options: FileStorageOptions
): Promise<{ key: string; fileName: string; uploadType: string }> {
  const repoMode = options.repoMode || "LFS";
  const sanitizedOriginalName = file.originalname.replace(/\s+/g, "");
  // Store under the original (whitespace-stripped) name so the display and
  // download name matches exactly what the user uploaded, and so every
  // `fileKey.split("/").pop()` in the services keeps returning a clean name.
  const fileName = sanitizedOriginalName;
  // The timestamp goes in the *directory*, not the filename: putObject is an
  // upsert and the key was otherwise scoped only by companyType, so two uploads
  // of the same filename silently overwrote each other (both DB rows then
  // resolved to the newest object). A per-upload folder makes the key unique
  // without touching the basename any consumer reads.
  const uploadDir = String(Date.now());
  const key =
    options.uploadCategory && options.entityId != null
      ? `uploads/company/${companyType}/${options.entityId}/${options.uploadCategory}/${uploadDir}/${fileName}`
      : `uploads/company/${companyType}/${uploadDir}/${fileName}`;

  if (repoMode === "AWS") {
    const bucket = options.bucket || ENV.S3_AWS_BUCKET;
    if (!bucket) {
      throw new BadRequestException("S3 bucket is not configured");
    }
    const s3Client = createS3Client(options.region);
    await s3Client
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return { key, fileName, uploadType: "AWS" };
  }

  if (!options.docRepoPath) {
    throw new BadRequestException("Local repository path is not configured");
  }

  const sanitizedKey = sanitizePath(key, options.docRepoPath);
  const sanitizedFileNameForPath = sanitizeFilename(fileName);
  const fullDirPath = safePathJoin(options.docRepoPath, sanitizedKey);
  const fullFilePath = safePathJoin(fullDirPath, sanitizedFileNameForPath);

  fs.mkdirSync(fullDirPath, { recursive: true });
  fs.writeFileSync(fullFilePath, file.buffer);

  return { key, fileName, uploadType: "LFS" };
}

export async function checkS3KeyExists(key: string): Promise<boolean> {
  const bucket = ENV.S3_AWS_BUCKET;
  if (!bucket) {
    throw new BadRequestException("S3 bucket is not configured");
  }

  const s3Client = createS3Client();

  try {
    await s3Client.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (err: any) {
    if (err.code === "NotFound" || err.statusCode === 404) {
      return false; // key truly does not exist
    }
    throw new BadRequestException(`Error checking S3 key: ${err.message || err}`);
  }
}

export async function getFileStreamFromStorage(
  key: string,
  options: FileStorageOptions
): Promise<FileStreamResult> {
  if (!key || typeof key !== "string" || !key.trim()) {
    throw new Error("File key is required.");
  }

  if (options.repoMode === "AWS") {
    const bucket = options.bucket || ENV.S3_AWS_BUCKET || "";
    const s3Client = createS3Client(options.region);
    const params = { Bucket: bucket, Key: key };
    try {
      const head = await s3Client.headObject(params).promise();
      const s3Stream = await s3Client.getObject(params).createReadStream();
      return {
        stream: s3Stream,
        mimeType: head.ContentType,
        contentLength: head.ContentLength,
      };
    } catch (error) {
      options.logger?.error?.({
        level: "error",
        message: `Failed to fetch ${key} from S3`,
        error,
      });
      throw new Error("File not found in S3.");
    }
  }

  const sanitizedKey = sanitizePath(key, options.docRepoPath);
  const fullFilePath = safePathJoin(options.docRepoPath, sanitizedKey);

  if (!fs.existsSync(fullFilePath)) {
    throw new Error("File not found in local storage");
  }
  const localStream = fs.createReadStream(fullFilePath);
  const mimeType = mime.lookup(fullFilePath) || "application/octet-stream";
  const contentLength = fs.statSync(fullFilePath).size;

  return {
    stream: localStream,
    mimeType,
    contentLength,
  };
}

export async function prepareFileDownload(
  documentId: bigint,
  dependencies: FileDownloadDependencies
): Promise<{
  stream: NodeJS.ReadableStream;
  fileName: string;
  mimeType: string;
  contentLength?: number;
}> {
  if (!documentId || isNaN(Number(documentId))) {
    throw new BadRequestException(
      "documentId is required and must be a valid number."
    );
  }

  const entry = await dependencies.findDocument(documentId);
  if (!entry) {
    throw new NotFoundException("Document not found");
  }

  const fileName = extractFileNameFromKey(entry.fileKey);
  const fileResult = await dependencies.fetchStream(entry.fileKey);

  if (!fileResult || !fileResult.stream) {
    throw new NotFoundException("File not found in storage");
  }

  return {
    stream: fileResult.stream,
    fileName,
    mimeType: fileResult.mimeType || "application/octet-stream",
    contentLength: fileResult.contentLength,
  };
}
export interface VersionFormData {
  generalData: Record<string, unknown>;
  preferredTpaDetails?: Record<string, unknown>[];
  expiringPolicyDetails: Record<string, unknown>;
  preferredInsurerDetails?: Record<string, unknown>[];
  coversConfig: Record<string, unknown>;
  coversConfigRows?: Array<{
    sectionName?: string | null;
    key: string;
    value: unknown;
  }>;
  otherTermsAndConditions: Record<string, unknown>;
  disclaimer: Record<string, unknown>;
}

export interface VersionSheet {
  versionName: string;
  policyType: string;
  formData: VersionFormData;
  organisationName: string;
}

export async function excelSheetGeneration(
  fileName: string,
  versions: VersionSheet[],
  userDetails?: UserDetailsForPassword
): Promise<string> {
  try {
    let excelBuffer = await generateBrokingSlipExcel(versions);
    let name = `${fileName}_${Date.now()}.xlsx`;
    
    // Apply password protection before upload
    const filePasswordConfigClient = new FilePasswordConfigClient(null);
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, userDetails || null);
    const isModulePasswordEnabled = await getModulePasswordConfig("opportunity");
    const protectedFile = await applyPasswordProtection(
      excelBuffer,
      name,
      password,
      "opportunity",
      isModulePasswordEnabled
    );
    
    // Use protected file data and filename
    excelBuffer = protectedFile.data;
    name = protectedFile.fileName;
    
    const url = await uploadToS3(
      excelBuffer,
      name,
      protectedFile.mimeType
    );
    return url;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

export async function generateBrokingSlipExcel(
  versions: VersionSheet[]
): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    let logoPath;
    if (versions[0].organisationName === "iirm_srilanka") {
      logoPath = path.resolve(__dirname, iirmSriLankaLogo);
    } else if (versions[0].organisationName === "iirm_kenya") {
      logoPath = path.resolve(__dirname, iirmKenyaLogo);
    } else {
      // Default to India branding for India / holdings / saferisk / maldives /
      // null / any unmapped organisation so the export does not fail.
      if (versions[0].organisationName !== "iirm_india") {
        console.warn(
          `[Excel] Unmapped organisation "${versions[0].organisationName}" - defaulting to India logo`
        );
      }
      logoPath = path.resolve(__dirname, iirmLogo);
    }
    const boldKeys = new Set([
      "Name of the insured",
      "Address of Insured/Proposer",
      "Name of the Intermediary ( Existing & New if applicable )",
      "Contact Details including E Mail ID",
      "Name and Address",
      "Contact details",
      "Expiring Policy Details",
      "Period of Insurance and Policy Number (Inception Date and Expiry Date)",
      "Policy copy with terms/conditions including extensions is to be mandatorily provided by the Proposer",
      "Other Terms & Conditions:",
      "DISCLAIMER",
    ]);
    const mergeKeys = new Set([
      "I/We hereby declare , on my behalf and on behalf of all persons proposed to be insured, that the above statements , answers and/ or particulars given by me are true and complete in all respects to the best of my knowledge and that I/We am/are authorized to propose on behalf of these persons.",
      "To the best of our knowledge, the information supplied in this document is accurate. India Insure accepts no liability for any loss arising out of your reliance on information, which has been supplied, to India Insure by or on behalf of India Insure’s clients",
    ]);

    versions.forEach(({ versionName, policyType, formData }) => {
      const sheet = workbook.addWorksheet(versionName.slice(0, 31));
      // Leave three empty rows at the top of the sheet
      // Set default column widths for columns A and B
      sheet.getColumn(1).width = 80;
      sheet.getColumn(2).width = 80;

      sheet.addRow([]);
      sheet.addRow([]);

      // Add three empty rows at the top
      // Insert logo in the first row, center aligned across columns A and B
      if (fs.existsSync(logoPath)) {
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: "png",
        });
        // Add an empty row for the logo
        const logoRow = sheet.addRow(["", ""]);
        // Merge A and B for the logo row
        sheet.mergeCells(`A${logoRow.number}:B${logoRow.number}`);
        // Calculate the center position of the merged cell for the image
        // The merged cell is from column 1 (A) to column 2 (B)
        // Place the image so it is centered horizontally in the merged cell
        // Add the logo image with top margin by adjusting the row height and image position
        // Increase the row height for extra top space (already set to 45 below)
        // Adjust the image's top-left (tl) row to add vertical offset (e.g., -0.2 for slight top margin)
        sheet.addImage(imageId, {
          tl: { col: 1, row: logoRow.number - 1 + 0.4 }, // Negative offset for top margin
          ext: { width: 120, height: 40 },
          editAs: "oneCell",
        });
        // Place the logo centered in the merged cell
        // sheet.addImage(imageId, {
        //   tl: { col: 1, row: logoRow.number - 1 }, // Centered horizontally
        //   ext: { width: 120, height: 40 },
        //   editAs: "oneCell",
        // });
        logoRow.getCell(1).alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        sheet.getRow(logoRow.number).height = 45;
      } else {
        // If logo not found, still add an empty row for spacing
        sheet.addRow(["", ""]);
      }

      // Add header row with text in cell A, merged across A and B, center aligned
      const headerText = `BROKINGSLIP FOR ${policyType} POLICY`;
      const headerRow = sheet.addRow([headerText, ""]);
      sheet.mergeCells(`A${headerRow.number}:B${headerRow.number}`);
      headerRow.getCell(1).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      headerRow.getCell(1).font = { bold: true, size: 16 };

      Object.entries(formData.generalData).forEach(([key, value]) => {
        const row = sheet.addRow([key, String(value)]);
        if (boldKeys.has(key)) {
          row.getCell(1).font = { bold: true };
        }
      });
      sheet.addRow([]);
      const tpaHeader = sheet.addRow(["TPA Details"]);
      tpaHeader.getCell(1).font = { bold: true };
      if (formData.preferredTpaDetails && formData.preferredTpaDetails.length) {
        formData.preferredTpaDetails.forEach((rowObj) => {
          Object.entries(rowObj).forEach(([key, value]) => {
            const row = sheet.addRow([
              key,
              value !== undefined && value !== null ? String(value) : "",
            ]);
            if (boldKeys.has(key)) {
              row.getCell(1).font = { bold: true };
            }
          });
        });
      } else {
        const tpaNameAndAddress = sheet.addRow(["Name and Address"]);
        tpaNameAndAddress.getCell(1).font = { bold: true };
        const tpaContactDetails = sheet.addRow(["Contact details"]);
        tpaContactDetails.getCell(1).font = { bold: true };
      }

      sheet.addRow([]);
      const expiringHeader = sheet.addRow(["Expiring Policy Details"]);
      expiringHeader.getCell(1).font = { bold: true };
      Object.entries(formData.expiringPolicyDetails).forEach(([key, value]) => {
        const row = sheet.addRow([key, String(value)]);
        if (boldKeys.has(key)) {
          row.getCell(1).font = { bold: true };
        }
      });

      if (
        formData.preferredInsurerDetails &&
        formData.preferredInsurerDetails.length > 0
      ) {
        sheet.addRow([]);
        const insurerHeader = sheet.addRow(["Insurer Details"]);
        insurerHeader.getCell(1).font = { bold: true };
        formData.preferredInsurerDetails.forEach((rowObj) => {
          Object.entries(rowObj).forEach(([key, value]) => {
            sheet.addRow([
              key,
              value !== undefined && value !== null ? String(value) : "",
            ]);
          });
        });
      }

      sheet.addRow([]);
      const coversHeader = sheet.addRow([
        "Policy copy with terms/conditions including extensions is to be mandatorily provided by the Proposer",
      ]);
      coversHeader.getCell(1).font = { bold: true };
      if (formData.coversConfigRows && formData.coversConfigRows.length > 0) {
        let previousSectionName: string | null = null;
        let previousCoverWasMapped: boolean | null = null;
        formData.coversConfigRows.forEach((coverRow) => {
          const sectionName =
            typeof coverRow.sectionName === "string" &&
            coverRow.sectionName.trim()
              ? coverRow.sectionName.trim()
              : null;
          const isMappedCoverRow = !!sectionName;

          if (previousCoverWasMapped === true && !isMappedCoverRow) {
            const separatorRow = sheet.addRow(["", ""]);
            sheet.mergeCells(`A${separatorRow.number}:B${separatorRow.number}`);
            separatorRow.getCell(1).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE5E7EB" },
            };
            separatorRow.height = 10;
          }

          if (sectionName && sectionName !== previousSectionName) {
            if (previousSectionName) {
              sheet.addRow([]);
            }
            const sectionRow = sheet.addRow([sectionName, ""]);
            sheet.mergeCells(`A${sectionRow.number}:B${sectionRow.number}`);
            sectionRow.getCell(1).font = { bold: true };
            sectionRow.getCell(1).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE5E7EB" },
            };
            sectionRow.getCell(1).alignment = {
              horizontal: "left",
              vertical: "middle",
              wrapText: true,
            };
            sectionRow.height = 20;
          }
          previousSectionName = sectionName;
          const coverDataRow = sheet.addRow([
            coverRow.key,
            coverRow.value !== undefined && coverRow.value !== null
              ? String(coverRow.value)
              : "",
          ]);
          if (sectionName) {
            coverDataRow.getCell(1).alignment = {
              horizontal: "left",
              vertical: "top",
              wrapText: true,
              indent: 1,
            };
          }
          previousCoverWasMapped = isMappedCoverRow;
        });
      } else {
        Object.entries(formData.coversConfig).forEach(([key, value]) => {
          sheet.addRow([key, String(value)]);
        });
      }

      sheet.addRow([]);
      const otherHeader = sheet.addRow(["Other Terms & Conditions:"]);
      otherHeader.getCell(1).font = { bold: true };
      Object.entries(formData.otherTermsAndConditions).forEach(
        ([key, value]) => {
          const row = sheet.addRow([key, String(value)]);
          if (mergeKeys.has(key)) {
            sheet.mergeCells(`A${row.number}:B${row.number}`);
          }
        }
      );

      sheet.addRow([]);
      const discHeader = sheet.addRow(["DISCLAIMER"]);
      discHeader.getCell(1).font = { bold: true };
      Object.entries(formData.disclaimer).forEach(([key, value]) => {
        const row = sheet.addRow([key, String(value)]);
        if (mergeKeys.has(key)) {
          sheet.mergeCells(`A${row.number}:B${row.number}`);
        }
      });
      // Apply border to all cells in columns A and B for all used rows
      const lastRowNumber = sheet.rowCount;
      for (let rowNum = 3; rowNum <= lastRowNumber; rowNum++) {
        for (let colNum = 1; colNum <= 2; colNum++) {
          const cell = sheet.getCell(rowNum, colNum);
          const existingAlignment = cell.alignment || {};
          cell.alignment = {
            ...existingAlignment,
            horizontal: existingAlignment.horizontal || "left",
            vertical: existingAlignment.vertical || "top",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

export async function quoteComparisonReportExcelSheetGeneration(
  fileName: string,
  qcrData: any,
  organisationKey: string,
  userDetails?: UserDetailsForPassword
): Promise<string> {
  try {
    let excelBuffer = await generateQuoteComparisonReportExcel(
      qcrData,
      organisationKey
    );
    let name = `${fileName}_${Date.now()}.xlsx`;
    
    // Apply password protection before upload
    const filePasswordConfigClient = new FilePasswordConfigClient();
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, userDetails || null);
    const isModulePasswordEnabled = await getModulePasswordConfig(
      "opportunity"
    );
    const protectedFile = await applyPasswordProtection(
      excelBuffer,
      name,
      password,
      "opportunity",
      isModulePasswordEnabled
    );
    
    // Use protected file data and filename
    excelBuffer = protectedFile.data;
    name = protectedFile.fileName;
    
    const url = await uploadToS3(
      excelBuffer,
      name,
      protectedFile.mimeType
    );
    return url;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

// export async function downloadFromS3(key: string) {
//   try {
//     const bucket = ENV.S3_AWS_BUCKET || "default-bucket";
//     const s3Client = new S3({ region: ENV.S3_AWS_REGION });
//     const fileUrl = `https://${bucket}.s3.${ENV.S3_AWS_REGION}.amazonaws.com/${key}`; // Ensure key does not start with a slash
//     // If the key is a signed URL, fetch the file using HTTP
//     if (/^https?:\/\//.test(fileUrl)) {
//       const response = await fetch(key);
//       if (!response.ok) {
//         throw new Error(`Failed to fetch file: ${response.statusText}`);
//       }
//       const arrayBuffer = await response.arrayBuffer();
//       return Buffer.from(arrayBuffer);
//     }

//     const res = await s3Client
//       .getObject({ Bucket: bucket, Key: key })
//       .promise();
//     return res.Body as Buffer;
//   } catch (error) {
//     if (error instanceof BadRequestException) {
//       throw error;
//     }
//     throw new BadRequestException((error as Error).message);
//   }
// }

export async function downloadFromS3(key: string): Promise<Buffer> {
  const bucket = ENV.S3_AWS_BUCKET || "default-bucket";
  const s3Client = createS3Client();

  const res = await s3Client
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .promise();

  if (!res.Body) {
    throw new Error("File not found in S3");
  }

  return res.Body as Buffer;
}

export function getS3ReadStream(key: string): NodeJS.ReadableStream {
  const bucket = ENV.S3_AWS_BUCKET || "default-bucket";
  const s3Client = createS3Client();

  return s3Client
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .createReadStream();
}

export async function generateQuoteComparisonReportExcel(
  qcrData: any,
  organisationKey: string
): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quote Comparison");

    sheet.getColumn(1).width = 80;
    sheet.getColumn(2).width = 80;

    const organisationConfig = getOrganisationConfig(organisationKey, qcrData);
    renderHeader(sheet, workbook, organisationConfig, qcrData.companyName);

    addCoverInfoTable(sheet, organisationConfig.currency, qcrData.policyType);

    // Render sections dynamically based on organisation config
    organisationConfig.sections.forEach((section) => {
      if (!section?.data?.headers || !section?.data?.data?.length) return;
      sheet.addRow([]);
      renderSection(sheet, section.title, section.data);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
}

function getOrganisationConfig(organisationKey: string, qcrData: any) {
  const config: Record<
    string,
    {
      logo: string;
      details: string[];
      currency: string;
      sections: { title: string; data: any }[];
    }
  > = {
    [ORGANISATION_KEYS.INDIA]: {
      logo: iirmLogo,
      details: [
        "INDIA INSURE RISK MANAGEMENT AND INSURANCE BROKING SERVICES PVT LTD",
        "Ashoka My Home Chambers, 5th Floor, #1-8-301-306, Sindhi Colony, Sardar Patel Road,",
        "Begumpet, Secunderabad, Hyderabad - 500003",
        "PH: 040-27822990 | FAX: 040-27822991",
      ],
      currency: "INR",
      sections: [
        {
          title: "Premium Comparison Section",
          data: qcrData?.premiumComparisonSection,
        },
        {
          title: "Cover Details Comparison",
          data: qcrData?.coverDetailSection,
        },
      ],
    },
    [ORGANISATION_KEYS.SRILANKA]: {
      logo: iirmSriLankaLogo,
      details: [
        "IIRM Lanka Insurance Brokers (Pvt) Ltd",
        "(formerly Finlay Insurance Brokers (Pvt) Ltd.)",
        "3rd Floor, No. 131, W.A.D. Ramanayake Mawatha, Colombo 02.",
        "General Line: +94117589600 | Fax: +94112540396",
      ],
      currency: "LKR",
      sections: [
        {
          title: "Cover Details Comparison",
          data: qcrData?.coverDetailSection,
        },
        {
          title: "Premium Comparison Section",
          data: qcrData?.premiumComparisonSection,
        },
      ],
    },
    [ORGANISATION_KEYS.KENYA]: {
      logo: iirmKenyaLogo,
      details: [
        "IIRM KENYA - The risk managers",
        "Sky Park Building, First Floor, Of Pio Gama Pinto Rd., Of Waiyaki Way, Westlands Dist. Nairobi.",
        "PO Box 2829- 00606",
      ],
      currency: "KES",
      sections: [
        {
          title: "Cover Details Comparison",
          data: qcrData?.coverDetailSection,
        },
        {
          title: "Premium Comparison Section",
          data: qcrData?.premiumComparisonSection,
        },
      ],
    },
  };
  const org = config[organisationKey];
  if (!org) throw new BadRequestException("Invalid organisation name");
  return org;
}

function renderHeader(
  sheet: ExcelJS.Worksheet,
  workbook: ExcelJS.Workbook,
  org: { logo: string; details: string[] },
  companyName: string
) {
  sheet.addRow([]);

  const sanitizedLogoPath = sanitizePath(org.logo, __dirname);
  const logoPath = safePathJoin(__dirname, sanitizedLogoPath);

  const headerLines = [
    ...org.details,
    "Quotation Request",
    `Name of Insured: ${companyName}`,
  ];

  let startRowNumber = sheet.lastRow!.number + 1;

  headerLines.forEach((text, index) => {
    const row = sheet.addRow([text, ""]);

    // Merge A & B for each row (horizontal merge only)
    sheet.mergeCells(`A${row.number}:B${row.number}`);

    const cell = row.getCell(1);

    cell.font = {
      color: { argb: "FFFFFFFF" }, // white
      bold: true,
      size: 12,
    };

    cell.alignment = {
      horizontal: "left",
      vertical: "middle",
    };

    cell.fill = solidGray();

    row.height = 22;
  });

  // Add logo aligned to the first header row
  if (fs.existsSync(logoPath)) {
    const imageId = workbook.addImage({
      filename: logoPath,
      extension: "png",
    });

    sheet.addImage(imageId, {
      tl: { col: 2 - 0.4, row: startRowNumber - 1 + 0.4 },
      ext: { width: 120, height: 40 },
      editAs: "oneCell",
    });
  }
}

function addCoverInfoTable(
  sheet: ExcelJS.Worksheet,
  currency: string,
  policyType: string
) {
  sheet.addRow([]); // spacing before table

  const tableData = [
    ["Type of Cover :", policyType],
    ["Currency :", currency],
    ["Period or Cover :", ""],
  ];

  const startRow = sheet.lastRow!.number + 1;

  tableData.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);

    // Styling
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
  });

  const endRow = sheet.lastRow!.number;

  // Apply borders
  applyTableBorders(sheet, startRow, endRow, 1, 2, true);
}

function styleSectionTitle(cell: ExcelJS.Cell) {
  cell.fill = solidGray();
  cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleSectionGroupTitle(cell: ExcelJS.Cell) {
  cell.fill = solidGray();
  cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function renderSection(
  sheet: ExcelJS.Worksheet,
  title: string,
  sectionData: { headers: object; data: any[] }
) {
  const columnCount = Object.keys(sectionData.headers).length;
  const headerKeys = Object.keys(sectionData.headers);
  const wrapTextIfLong = (input: string, maxChars = 80): string => {
    if (input.length <= maxChars) return input;
    return input
      .split("\n")
      .map((line) =>
        (line.match(new RegExp(`.{1,${maxChars}}(\\s|$)`, "g")) || [line])
          .map((chunk) => chunk.trimEnd())
          .join("\n")
      )
      .join("\n");
  };
  for (let col = 1; col <= columnCount; col++) {
    const currentWidth = Number(sheet.getColumn(col).width || 0);
    const desiredWidth = col === 1 ? 55 : 40;
    sheet.getColumn(col).width = Math.max(currentWidth, desiredWidth);
  }

  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, columnCount);

  styleSectionTitle(titleRow.getCell(1));

  const headerRow = sheet.addRow(Object.values(sectionData.headers).map(String));
  for (let col = 1; col <= columnCount; col++) {
    headerRow.getCell(col).alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };
  }
  const startRow = headerRow.number;
  let previousDataWasMapped: boolean | null = null;

  sectionData.data.forEach((row) => {
    if (
      row &&
      typeof row === "object" &&
      row.__rowType === "section" &&
      row.__sectionName
    ) {
      const sectionGroupRow = sheet.addRow([String(row.__sectionName)]);
      sheet.mergeCells(
        sectionGroupRow.number,
        1,
        sectionGroupRow.number,
        columnCount
      );
      styleSectionGroupTitle(sectionGroupRow.getCell(1));
      return;
    }

    const sectionName =
      typeof row?.__sectionName === "string" && row.__sectionName.trim()
        ? row.__sectionName.trim()
        : "";
    const isMappedDataRow = sectionName.length > 0;

    if (previousDataWasMapped === true && !isMappedDataRow) {
      const separatorRow = sheet.addRow([""]);
      sheet.mergeCells(
        separatorRow.number,
        1,
        separatorRow.number,
        columnCount
      );
      separatorRow.getCell(1).fill = solidGray();
      separatorRow.height = 10;
    }

    const values = headerKeys.map((headerKey) => {
      const value = row?.[headerKey];
      if (value === undefined || value === null) return "";
      return wrapTextIfLong(String(value));
    });
    const dataRow = sheet.addRow(values);
    for (let col = 1; col <= columnCount; col++) {
      dataRow.getCell(col).alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };
    }
    previousDataWasMapped = isMappedDataRow;
  });

  const endRow = sheet.lastRow!.number;

  applyTableBorders(sheet, startRow, endRow, 1, columnCount);
}

function solidGray() {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF808080" },
  } as ExcelJS.Fill;
}

function applyTableBorders(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  thickOuterBorder: boolean = false
) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const isTop = row === startRow;
      const isLeft = col === startCol;
      const isBottom = row === endRow;
      const isRight = col === endCol;

      sheet.getCell(row, col).border = {
        top: { style: thickOuterBorder && isTop ? "thick" : "thin" },
        left: { style: thickOuterBorder && isLeft ? "thick" : "thin" },
        bottom: { style: thickOuterBorder && isBottom ? "thick" : "thin" },
        right: { style: thickOuterBorder && isRight ? "thick" : "thin" },
      };
    }
  }
}

export async function uploadToS3(file: any, name: any, mimetype: any) {
  try {
    const bucket = ENV.S3_AWS_BUCKET;
    const s3 = createS3Client();
    const params: any = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: "inline",
    };
    const s3Response = await s3.upload(params).promise();

    const paramsToFetch = {
      Bucket: s3Response.Bucket,
      Key: s3Response.Key,
      // Expires: 60 * 5, // URL valid for 5 minutes
    };
    const uploadUrl = await s3.getSignedUrlPromise("getObject", paramsToFetch);

    return uploadUrl;
  } catch (error) {
    console.log("error in uploadToS3", error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}
export async function getSignedUrl(
  urlPath: any,
  options?: {
    expiresSeconds?: number;
    responseContentDisposition?: string;
    responseContentType?: string;
  }
) {
  try {
    const bucket = ENV.S3_AWS_BUCKET;
    const s3 = createS3Client();
    const paramsToFetch = {
      Bucket: bucket,
      Key: urlPath,
      ...(options?.expiresSeconds ? { Expires: options.expiresSeconds } : {}),
      ...(options?.responseContentDisposition
        ? { ResponseContentDisposition: options.responseContentDisposition }
        : {}),
      ...(options?.responseContentType
        ? { ResponseContentType: options.responseContentType }
        : {}),
    };

    const uploadUrl = await s3.getSignedUrlPromise("getObject", paramsToFetch);
    return uploadUrl;
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
}
const POLICY_REPORT_HEADER_OVERRIDES: Record<string, string> = {
  SBU: "SBU",
  iirmCategory: "IIRM Category",
  leadCrm: "Lead CRM",
  policyOwner: "Created By",
  // crmManager (leadCrm's manager's manager) is deactivated in the DB; the
  // surviving crmTeamLead column is what the business now calls "CRM Manager".
  crmTeamLead: "CRM Manager",
  centralOpsTeamLead: "Central OPS Team Lead",
  terrorismCommissionAmount: "Terrorism Brokerage Amount",
  terrorismCommissionPercentage: "Terrorism Brokerage Percentage",
  ingestedMode: "Ingested Mode",
  brokerName: "Broker Agent",
};

const SRI_LANKA_COUNTRY_ID = 8;

// India-only Biz Done header renames (keyed by field_label). Applied when countryId === 1.
const POLICY_REPORT_HEADER_OVERRIDES_INDIA: Record<string, string> = {
  iirmBranch: "Branch",
  custId: "Customer Id",
  companyName: "Customer Name",
  policyOwner: "Policy Created By",
  insPolNo: "Insurer Policy No",
  netPremium: "Basic Premium",
  terrorism: "Terrorism Premium",
  gstPercentage: "GST Percentage",
  serviceTax: "GST Amount",
  other: "Other Amount",
  brokeragePercentage: "Basic Brokerage Percentage",
  brokerageAmount: "Basic Brokerage Amount",
  totalBrokerageAmount: "Total Income",
  sharePercentage: "Insurer Share Percentage",
  shareAmount: "Insurer Share Amount",
  brokerageAmountAsEnteredByIsg: "Brokerage Amount As Entered By ISG",
  iirmPolNo: "IIRM Policy No",
};

// Sri Lanka-only Biz Done header renames (keyed by field_label). Applied when countryId === 8.
const POLICY_REPORT_HEADER_OVERRIDES_SRI_LANKA: Record<string, string> = {
  iirmBranch: "Branch",
  parentCompanyName: "Group Company",
  policyCategory: "IIRM Category",
  policyName: "Policy Type",
  insPolNo: "Insurer Policy No",
  empName: "Policy Created By",
  totalBrokerageAmount: "Total Income",
  terrorismCommissionPercentage: "TC Brokerage Percentage",
  tcBrokerageAmount: "TC Brokerage Amount",
  srccbrokeragepercentage: "SRCC Brokerage Percentage",
  srccBrokerageAmount: "SRCC Brokerage Amount",
  tcPremiumAmount: "TC Premium Amount",
  srccPremiumAmount: "SRCC Premium Amount",
  vatPercentage: "VAT Percentage",
  vatAmount: "VAT Amount",
  other: "Other Amount",
  sharePercentage: "Insurer Share Percentage",
  shareAmount: "Insurer Share Amount",
  brokerageAmountAsEnteredByIsg: "Brokerage Amount As Entered By ISG",
  iirmPolNo: "IIRM Policy No",
};

// Generic normalization applied for ALL countries: Iirm -> IIRM, Ins -> Insurer.
const normalizeHeaderTokens = (h: string): string =>
  h.replace(/\bIirm\b/g, "IIRM").replace(/\bIns\b/g, "Insurer");

// Country-aware header formatter factory. Country map (if any) wins, then the
// shared override map, then camelCase -> Title Case; finally the generic token
// normalization runs on the result.
const makeFormatHeader =
  (countryId?: number) =>
  (header: string): string => {
    const countryMap =
      countryId === SRI_LANKA_COUNTRY_ID
        ? POLICY_REPORT_HEADER_OVERRIDES_SRI_LANKA
        : POLICY_REPORT_HEADER_OVERRIDES_INDIA;
    if (countryMap && countryMap[header]) return countryMap[header];
    const base =
      POLICY_REPORT_HEADER_OVERRIDES[header] ??
      header.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
    return normalizeHeaderTokens(base);
  };

/**
 * Report date normaliser — guarantees a single display format (DD/MM/YYYY) for
 * every date column, regardless of whether the DB/query provided a JS Date, an
 * ISO string, or an already-formatted DD/MM/YYYY (or D/M/YYYY) string. This is
 * the single source of truth for date rendering in the Biz Done report so
 * columns never disagree (e.g. Policy From Date vs Date Of Business). Returns ""
 * for empty values and leaves genuinely unparseable strings untouched.
 */
export function formatReportDateDDMMYYYY(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const fromParts = (d: number, m: number, y: number) =>
    `${pad(d)}/${pad(m)}/${y}`;
  const fromDate = (dt: Date) =>
    fromParts(dt.getDate(), dt.getMonth() + 1, dt.getFullYear());

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : fromDate(value);
  }
  if (typeof value === "string") {
    const str = value.trim();
    if (!str) return "";
    // Already day/month/year (our SQL TO_CHAR output) — treat slashed as DD/MM/YYYY.
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
    if (dmy) return fromParts(Number(dmy[1]), Number(dmy[2]), Number(dmy[3]));
    // ISO date / datetime — read parts directly to avoid timezone shifts.
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (iso) return fromParts(Number(iso[3]), Number(iso[2]), Number(iso[1]));
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? str : fromDate(parsed);
  }
  const dt = new Date(value as any);
  return isNaN(dt.getTime()) ? String(value) : fromDate(dt);
}

export async function policyReportExcelSheetGeneration(
  fileName: string,
  policyData: any,
  userDetails?: UserDetailsForPassword,
  moduleKey: string = "bizdone_reports"
): Promise<string> {
  try {
    console.log("Generating policy report Excel sheet...");
    const generatePolicyStartTime = Date.now();
    let excelBuffer = await generatePolicyReportExcel(policyData);
    const generatePolicyEndTime = Date.now();
    console.log(
      `generatePolicyReportExcel took ${
        generatePolicyEndTime - generatePolicyStartTime
      } ms`
    );

    let name = `${fileName}_${Date.now()}.xlsx`;
    
    // Apply password protection before upload
    const filePasswordConfigClient = new FilePasswordConfigClient();
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, userDetails || null);
    const isModulePasswordEnabled = await getModulePasswordConfig(moduleKey);
    const protectedFile = await applyPasswordProtection(
      excelBuffer,
      name,
      password,
      moduleKey,
      isModulePasswordEnabled
    );
    
    // Use protected file data and filename
    excelBuffer = protectedFile.data;
    name = protectedFile.fileName;
    
    console.log("Uploading policy report to S3...fileName:", name);
    const uploadStartTime = Date.now();
    const url = await uploadToS3(
      excelBuffer,
      name,
      protectedFile.mimeType
    );
    const uploadEndTime = Date.now();
    console.log(`uploadToS3 took ${uploadEndTime - uploadStartTime} ms`);
    console.log("Policy report URL:", url);
    return url;
  } catch (error) {
    console.log("Error in policyReportExcelSheetGeneration:", error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

/**
 * Header row styling shared by both report writers: bold text on a yellow fill.
 * Paired with a frozen top row (views: ySplit 1) so the labels stay visible.
 */
export function styleReportHeaderRow(headerRow: ExcelJS.Row): void {
  headerRow.font = { bold: true };
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    };
  });
}

/**
 * Excel equivalent of the app's comma logic. The UI resolves
 * localization_country.number_format to an Intl locale (en-IN vs en-US) and
 * lets Intl group the digits; Excel has no locale-aware grouping, so the same
 * decision picks a numFmt pattern instead — lakh/crore grouping for en-IN,
 * thousands for en-US. Same resolveLocale, so the two can't drift.
 */
export function excelNumberFormat(
  numberFormat?: string | null,
  fractionDigits = 2
): string {
  const decimals = fractionDigits > 0 ? `.${"0".repeat(fractionDigits)}` : "";
  return resolveLocale(numberFormat) === "en-IN"
    ? `#,##,##0${decimals}`
    : `#,##0${decimals}`;
}

/**
 * Column width from the widest thing that will sit in it: the header label or
 * any sampled cell. Clamped so one long remark can't push a column off-screen.
 */
export function fitReportColumnWidths(
  worksheet: ExcelJS.Worksheet,
  headerLabels: string[],
  fieldKeys: string[],
  sampleRows: any[],
  extraLabels: string[] = []
): void {
  headerLabels.forEach((label, idx) => {
    const key = fieldKeys[idx];
    let widest = Math.max(label?.length ?? 0, extraLabels[idx]?.length ?? 0);
    for (const row of sampleRows) {
      const len = String(row?.[key] ?? "").length;
      if (len > widest) widest = len;
    }
    worksheet.getColumn(idx + 1).width = Math.min(Math.max(widest + 2, 10), 60);
  });
}

export async function policyReportExcelSheetGenerationBatch(
  fileName: string,
  stream: AsyncGenerator<
    {
      type: string;
      rows: any[];
      sampleHeaders: any;
      countryId?: number;
      numberFormat?: string | null;
    },
    void,
    unknown
  >,
  userDetails?: UserDetailsForPassword,
  isModulePasswordEnabled?: boolean
): Promise<string> {
  try {
    const temp = path.join(os.tmpdir(), `${Date.now()}-policy.xlsx`);
    // Archiver defaults to zlib level 1 (fastest), which leaves ~23% on the table
    // for a report whose bytes are almost entirely one highly-repetitive sheet XML.
    // Measured on 100k rows x 29 cols: 19.06 MB at the default vs 14.72 MB at
    // level 9, with no measurable increase in write time.
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: temp,
      zip: {
        zlib: {
          level: 9,
        },
      },
      useStyles: true,
      useSharedStrings: true 
    });

    const sheetNames: Record<string, string> = {
      appliedFilters: "Applied Filters",
      companySummary: "Summary-Comp Classification",
      policySummary: "Summary-Policy Classification",
      insurerSummary: "Summary-Insurer Classification",
      policyDetails: "Details-Policy Based",
      coInsurerDetails: "Details-Co-Insurer Based",
      rewards: "Rewards",
    };

    // Rebuilt per stream chunk using the yielded countryId (see loop below).
    let formatHeader = makeFormatHeader(undefined);

    // Prepare datatype maps for each sheet. Sets, not arrays: these are probed
    // once per cell, so an array scan costs 3 x columns x rows comparisons.
    const floatFields = new Set<string>([
      ...DEFAULT_POLICY_REPORT_DATATYPE_FLOAT,
      "premiumCollected",
      "brokerageCollected",
      "rewardAmount",
    ]);
    const integerFields = new Set<string>(
      DEFAULT_POLICY_REPORT_DATATYPE_INTEGER
    );
    const dateFields = new Set<string>(DEFAULT_POLICY_REPORT_DATATYPE_DATE);

    const worksheets: Record<string, ExcelJS.Worksheet> = {} as Record<
      string,
      ExcelJS.Worksheet & { commit: () => void }
    >;
    const headersMap: Record<string, string[]> = {};
    const totals: Record<string, Record<string, number>> = {};

    let numberFormat: string | null = null;
    for await (const {
      type,
      rows,
      sampleHeaders,
      countryId,
      numberFormat: chunkNumberFormat,
    } of stream) {
      if (chunkNumberFormat !== undefined) numberFormat = chunkNumberFormat;
      // Only country-bearing chunks rebuild the formatter. The appended
      // "rewards" chunk carries no countryId; letting it through reset the
      // formatter to camelCase and broke the totals row written after the loop.
      if (countryId !== undefined && countryId !== null) {
        formatHeader = makeFormatHeader(countryId);
      }
      if (!worksheets[type]) {
        const ws = workbook.addWorksheet(sheetNames[type] ?? type, {
          views: [{ state: "frozen", ySplit: 1 }],
        });
        const headers = sampleHeaders[type].map(formatHeader);
        const totalsLabels: string[] =
          type === "appliedFilters"
            ? []
            : sampleHeaders[type].map((h: string, idx: number) => {
                if (idx === 0) return "Totals";
                if (DEFAULT_POLICY_REPORT_TOTAL_FIELDS[h])
                  return String(DEFAULT_POLICY_REPORT_TOTAL_FIELDS[h]);
                if (DEFAULT_POLICY_REPORT_TOTAL_FIELDS_VALUES[h])
                  return `${formatHeader(h)}: 0000000000.00`;
                return "";
              });
        fitReportColumnWidths(
          ws,
          headers,
          sampleHeaders[type],
          rows,
          totalsLabels
        );
        // Grouping is a cell format, not a string — the numbers stay numeric so
        // Excel can still sum them. Set on the column before the first row
        // commits, since the stream writer emits <cols> only once.
        sampleHeaders[type].forEach((columnHeader: string, idx: number) => {
          if (floatFields.has(columnHeader)) {
            ws.getColumn(idx + 1).numFmt = excelNumberFormat(numberFormat, 2);
          }
        });
        const headerRow = ws.addRow(headers);
        styleReportHeaderRow(headerRow);
        headerRow.commit();
        worksheets[type] = ws;
        headersMap[type] = sampleHeaders[type];
        totals[type] = {};
      }
      const ws = worksheets[type];
      const headers = headersMap[type];
      for (const row of rows) {
        // Prepare row values with correct datatypes
        const rowValues = headers.map((columnHeader) => {
          const value = row[columnHeader];
          if (floatFields.has(columnHeader)) {
            const num = parseFloat(value);
            return !isNaN(num) ? num : null;
          }
          if (integerFields.has(columnHeader)) {
            const num = parseInt(value, 10);
            return !isNaN(num) ? num : null;
          }
          if (dateFields.has(columnHeader)) {
            // Emit a single DD/MM/YYYY text value for every date column so the
            // format is consistent regardless of the underlying DB type
            // (date vs string). See formatReportDateDDMMYYYY.
            return formatReportDateDDMMYYYY(value);
          }
          return value !== undefined && value !== null ? String(value) : "";
        });
        ws.addRow(rowValues).commit();
        headers.forEach((columnHeader) => {
          if (!totals[type][columnHeader]) totals[type][columnHeader] = 0;
          const value = parseFloat(row[columnHeader]);
          if (!isNaN(value)) totals[type][columnHeader] += value;
        });
      }
    }

    Object.entries(worksheets).forEach(([type, ws]) => {
      // The Applied Filters sheet is a plain Filter/Value list — no totals row.
      if (type === "appliedFilters") {
        ws.commit();
        return;
      }
      const headers = headersMap[type];
      const values = headers.map((h, idx) => {
        if (idx === 0) return "Totals";
        // Check for default total field value (e.g., serialNumber: "Totals")
        if (DEFAULT_POLICY_REPORT_TOTAL_FIELDS[h]) {
          return DEFAULT_POLICY_REPORT_TOTAL_FIELDS[h];
        }
        // Check for total sum field with prefix (e.g., netPremium: "Net Premium")
        if (DEFAULT_POLICY_REPORT_TOTAL_FIELDS_VALUES[h]) {
          const sum = totals[type][h];
          if (typeof sum === "number" && !isNaN(sum)) {
            // Label the totals row with the same (country-aware) header as the
            // column so renamed headers stay in sync with their sum labels.
            return `${formatHeader(h)}: ${formatNumberByLocalization(
              sum,
              { numberFormat },
              2
            )}`;
          }
        }
        return "";
      });
      ws.addRow(values).commit();
      ws.commit();
    });

    await workbook.commit();
    let buffer = await fs.promises.readFile(temp);
    const now = new Date();
    const dateParts = [
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ];
    const timestamp = dateParts
      .map((part) => part.toString().padStart(2, "0"))
      .join("");
    let name = `${fileName}_${timestamp}.xlsx`;
    // Apply password protection before upload
    const filePasswordConfigClient = new FilePasswordConfigClient();
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, userDetails || null);
    const protectedFile = await applyPasswordProtection(
      buffer,
      name,
      password,
      'bizdone_reports', // Module key for BizDone reports
      isModulePasswordEnabled // Pass module config from database
    );
    
    // Use protected file data and filename
    buffer = protectedFile.data;
    name = protectedFile.fileName;
    
    await uploadToS3(
      buffer,
      name,
      protectedFile.mimeType
    );
    await fs.promises.unlink(temp);
    // Return the S3 object KEY (not a pre-signed URL). Pre-signed URLs expire
    // (default 900s); callers store the key and regenerate a fresh URL at
    // download time via getSignedUrl.
    return name;
  } catch (error) {
    console.log("Error in policyReportExcelSheetGenerationBatch:", error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

export async function generatePolicyReportExcel(
  policyData: any
): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    // Use worksheet creator that doesn't immediately add to workbook
    workbook.creator = "Biz Report";
    workbook.created = new Date();

    const sheetNames: Record<string, string> = {
      appliedFilters: "Applied Filters",
      companySummary: "Summary-Comp Classification",
      policySummary: "Summary-Policy Classification",
      insurerSummary: "Summary-Insurer Classification",
      policyDetails: "Details-Policy Based",
      coInsurerDetails: "Details-Co-Insurer Based",
      rewards: "Rewards",
    };

    const amountColumns = [
      "netPremium",
      "grossPremium",
      "premiumCollected",
      "commissionAmount",
      "terrorismCommissionAmount",
      "commissionAmountAsEnteredByIsg",
      "commissionAmountAsPerIwork",
      "fees",
      "terrorism",
      "other",
      "gstAmount",
      "commissionPercentage",
      "brokerageCollected",
      "sharePercentage",
      "terrorismCommissionPercentage",
    ];

    // Labels that camelCase -> Title Case cannot render correctly.
    // Cache formatHeader function
    const formatHeader = makeFormatHeader(undefined);

    // Get sample headers
    const sampleHeaders: Record<string, string[]> = {
      companySummary: DEFAULT_POLICY_REPORT_FIELDS.COMPANY_SUMMARY_FIELDS,
      policySummary: DEFAULT_POLICY_REPORT_FIELDS.POLICY_SUMMARY_FIELDS,
      insurerSummary: DEFAULT_POLICY_REPORT_FIELDS.INSURER_SUMMARY_FIELDS,
      policyDetails: DEFAULT_POLICY_REPORT_FIELDS.POLICY_DETAILS_FIELDS,
      coInsurerDetails: DEFAULT_POLICY_REPORT_FIELDS.CO_INSURER_DEFAULT_FIELDS,
    };

    // Process sheets in parallel where possible
    await Promise.all(
      Object.entries(sheetNames).map(async ([key, name]) => {
        const data = policyData?.[key] || [];
        const headers =
          data.length > 0 ? Object.keys(data[0]) : sampleHeaders[key];
        const formattedHeaders = headers.map(formatHeader);

        // Create worksheet with optimized settings
        const worksheet = workbook.addWorksheet(name, {
          views: [
            { showGridLines: false, state: "frozen", ySplit: 1 }, // Improves performance
          ],
          properties: { tabColor: { argb: DEFAULT_TAB_COLOR } }, // Green tab color
        });

        // Add headers with style
        const headerRow = worksheet.addRow(formattedHeaders);
        styleReportHeaderRow(headerRow);

        // Optimization: Prepare all rows data first
        if (data.length > 0) {
          const rowsData = data.map((row: any) =>
            headers.map((h) => {
              const value = row[h];
              return amountColumns.includes(h) &&
                value !== null &&
                value !== undefined &&
                !isNaN(value)
                ? Number(value)
                : String(value ?? "");
            })
          );

          // Use worksheet.addRows instead of multiple addRow calls
          worksheet.addRows(rowsData);

          // Apply number formatting only to amount columns
          headers.forEach((header, idx) => {
            if (amountColumns.includes(header)) {
              worksheet.getColumn(idx + 1).numFmt = "#,##0.00";
            }
          });
        }

        // Apply styles in bulk
        const borderStyle = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Only style non-empty cells
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell({ includeEmpty: false }, (cell) => {
            cell.border = borderStyle;
          });
        });

        // Auto-fit columns from actual content. ponytail: first 1000 rows only
        // — past that the widest cell has almost certainly already appeared.
        fitReportColumnWidths(
          worksheet,
          formattedHeaders,
          headers,
          data.slice(0, 1000)
        );
      })
    );

    // Use streaming write for large files
    const buffer = await workbook.xlsx.writeBuffer({
      useStyles: true,
      useSharedStrings: true, // Helps with duplicate values
    });

    return buffer as Buffer;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException((error as Error).message);
  }
}

/**
 * Generates an Excel file from the provided data.
 * @param data - Array of objects representing rows of the Excel file.
 * @returns A buffer containing the Excel file.
 */
export async function generateExcel(data: any[]): Promise<Buffer> {
  try {
    const workbook = XLSX.utils.book_new();
    const rows: any[][] = [];

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      rows.push(headers);
      data.forEach((row) => {
        rows.push(headers.map((h) => String(row[h] ?? "")));
      });
    }

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Errors");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer as Buffer;
  } catch (error) {
    throw new Error(`Failed to generate Excel: ${(error as Error).message}`);
  }
}

// camelCase -> Title Case, e.g. "opportunityId" -> "Opportunity Id" — same
const formatHeaderLabel = (header: string): string =>
  header.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

function stringifyExcelCell(cellValue: unknown): string {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }
  if (Array.isArray(cellValue)) {
    return cellValue
      .map(stringifyExcelCell)
      .filter((value) => value !== "")
      .join(", ");
  }
  if (typeof cellValue === "object" && !(cellValue instanceof Date)) {
    const obj = cellValue as Record<string, unknown>;
    const displayValue =
      obj.lookUpValue ?? obj.name ?? obj.value ?? obj.displayName ?? obj.displayname;
    return displayValue == null ? "" : String(displayValue);
  }
  return String(cellValue);
}

export async function generateExcelWithAppliedFilters(
  data: any[],
  appliedFilters: { filter: string; value: string }[],
  dataSheetName = "Filtered Data",
  columns?: { key: string; label: string }[],
): Promise<Buffer> {
  const temp = path.join(os.tmpdir(), `${Date.now()}-export.xlsx`);
  try {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: temp });

    // "Applied Filters" sheet — small, plain Filter/Value list, no batching needed.
    const filtersSheet = workbook.addWorksheet("Applied Filters");
    filtersSheet.addRow(["Filter", "Value"]).commit();
    (appliedFilters?.length
      ? appliedFilters
      : [{ filter: "Filters", value: "None (all records)" }]
    ).forEach((row) => {
      filtersSheet.addRow([row.filter, row.value]).commit();
    });
    filtersSheet.commit();

    // Data sheet — each row is committed (flushed to the temp file) as soon
    // as it's added, so memory use stays flat regardless of row count.
    const dataSheet = workbook.addWorksheet(dataSheetName);
    if (data.length > 0) {
      const allKeys = Object.keys(data[0]);
      const requestedColumns: { key: string; label: string }[] = columns ?? [];
      const selectedColumns: { key: string; label: string }[] =
        requestedColumns.length > 0
          ? requestedColumns.filter((c) => allKeys.includes(c.key))
          : allKeys.map((key) => ({ key, label: formatHeaderLabel(key) }));
      const headers = ["S.No", ...selectedColumns.map((c) => c.label)];
      dataSheet.addRow(headers).commit();
      data.forEach((row, index) => {
        dataSheet
          .addRow([
            index + 1,
            ...selectedColumns.map((c) => stringifyExcelCell(row[c.key])),
          ])
          .commit();
      });
    }
    dataSheet.commit();

    await workbook.commit();
    return await fs.promises.readFile(temp);
  } catch (error) {
    throw new Error(`Failed to generate Excel: ${(error as Error).message}`);
  } finally {
    await fs.promises.unlink(temp).catch(() => undefined);
  }
}

export async function generateExcelStream(
  data: AsyncIterable<any>,
  options?: {
    batchSize?: number;
    maxMemoryUsage?: number;
    timeout?: number;
    sheetName?: string;
  }
): Promise<PassThrough> {
  const {
    batchSize = 1000,
    maxMemoryUsage = 100 * 1024 * 1024, // 100MB
    timeout = 30 * 60 * 1000, // 30 minutes
    sheetName = "Errors",
  } = options || {};

  const stream = new PassThrough({
    highWaterMark: 64 * 1024, // 64KB buffer
    objectMode: false,
  });

  // Set timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Excel generation timeout after ${timeout}ms`)),
      timeout
    );
  });

  const generationPromise = (async () => {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream,
        useStyles: false,
        useSharedStrings: false,
      });

      const worksheet = workbook.addWorksheet(sheetName);

      let headersWritten = false;
      let headers: string[] = [];
      let rowCount = 0;
      let processedRows = 0;

      for await (const row of data) {
        if (!headersWritten) {
          headers = Object.keys(row);
          worksheet.addRow(headers).commit();
          headersWritten = true;
        }

        // Add row data
        const rowData = headers.map((h) => row[h] ?? "");
        worksheet.addRow(rowData).commit();

        processedRows++;

        // Log progress every batchSize rows
        if (processedRows % batchSize === 0) {
          // Check memory usage
          const memUsage = process.memoryUsage();
          // Yield control to prevent blocking
          await new Promise((resolve) => setImmediate(resolve));
        }
      }
      await workbook.commit();
    } catch (error) {
      stream.destroy(error as Error);
      throw error;
    }
  })();

  // Race between generation and timeout
  Promise.race([generationPromise, timeoutPromise]).catch((error) => {
    if (!stream.destroyed) {
      stream.destroy(error as Error);
    }
  });

  return stream;
}

export async function* processChunksAsStream(data: any[], chunkSize: number) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkNumber = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(data.length / chunkSize);

    // Yield each record in the chunk
    for (const record of chunk) {
      yield record;
    }

    // Memory cleanup and progress logging
    // Log every 10% of total chunks or every 30 seconds, whichever comes first
    const logInterval = Math.max(1, Math.ceil(totalChunks / 10)); // Every 10% of chunks
    const shouldLogProgress = chunkNumber % logInterval === 0;
    const shouldLogMemory = chunkNumber === 1 || shouldLogProgress;

    if (shouldLogMemory) {
      const memUsage = process.memoryUsage();
      console.log(
        `Memory usage after chunk ${chunkNumber}: ${Math.round(
          memUsage.heapUsed / 1024 / 1024
        )}MB`
      );

      // Yield control to prevent blocking
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
}

export async function* errorStream(
  errors: any[],
  options?: { chunkSize?: number }
) {
  const { chunkSize = 100 } = options || {};

  for (let i = 0; i < errors.length; i += chunkSize) {
    const chunk = errors.slice(i, i + chunkSize);

    for (const err of chunk) {
      yield err;
    }

    // Yield control to event loop to prevent blocking
    await new Promise((resolve) => setImmediate(resolve));
  }
}
