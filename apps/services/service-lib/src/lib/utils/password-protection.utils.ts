import { BadRequestException } from "@nestjs/common";
import { encrypt } from "node-qpdf2";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as XLSX from 'xlsx';
import { exec } from "child_process";
import { promisify } from "util";
import { ENV } from "../environment";
import * as officecrypto from "officecrypto-tool";
import libre from "libreoffice-convert";
import { sanitizeFilename, safePathJoin } from "./path-sanitizer.util";

const execPromise = promisify(exec);




/**
 * Get qpdf binary path based on operating system
 * For Windows: Tries common installation locations
 * For Unix: Uses system PATH
 */
function getQpdfPath(): string | undefined {
    if (process.platform === 'win32') {
        // Common Windows qpdf locations
        const possiblePaths = [
            'C:\\ProgramData\\chocolatey\\bin\\qpdf.exe',
            'C:\\Program Files\\qpdf\\bin\\qpdf.exe',
            'C:\\Program Files (x86)\\qpdf\\bin\\qpdf.exe',
        ];
        
        // Return first path that exists, or undefined to use PATH
        return possiblePaths.find(p => {
            try {
                require('fs').accessSync(p);
                return true;
            } catch {
                return false;
            }
        });
    }
    // For macOS/Linux, rely on PATH
    return undefined;
}

/**
 * Default password used when user details are not available
 */
const DEFAULT_PASSWORD = "Secure@123";

/**
 * Checks if file password protection feature is enabled via environment variable
 * 
 * @returns true if ENABLE_FILE_PASSWORD_PROTECTION is set to 'true', false otherwise
 */
export function isPasswordProtectionEnabled(): boolean {
    return ENV.ENABLE_FILE_PASSWORD_PROTECTION === "true";
}

/**
 * Interface for user details required for password generation
 */
export interface UserDetailsForPassword {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobileNumber?: string;
    dob?: string;
    organisationKey?: string;
}

/**
 * Interface for file password configuration from database
 */
export interface FilePasswordConfigData {
    passwordType: 'custom' | 'user_details';
    customPassword?: string;
    userFields?: string[];
}

/**
 * Generates a password based on configuration and user details
 * 
 * @param config - Configuration object containing passwordType and related fields
 * @param userDetails - User details containing firstName, lastName, email, mobileNumber
 * @returns Generated password string
 * 
 * @example
 * // Custom password
 * generatePasswordFromConfig({ passwordType: 'custom', customPassword: 'MyPass@123' }, {}) // returns "MyPass@123"
 * 
 * // User details based
 * generatePasswordFromConfig({ 
 *   passwordType: 'user_details', 
 *   userFields: ['firstName', 'email'] 
 * }, { firstName: 'John', email: 'john@example.com' }) // returns "john-john@example.com"
 */
export function generatePasswordFromConfig(
    config: FilePasswordConfigData | null | undefined,
    userDetails: UserDetailsForPassword | null | undefined
): string {
    // If no config provided, use default
    if (!config) {
        console.log('[Password Generation] No config provided, using default password');
        return DEFAULT_PASSWORD;
    }

    // Custom password type
    if (config.passwordType === 'custom') {
        const password = config.customPassword || DEFAULT_PASSWORD;
        console.log('[Password Generation] Custom password type:', password);
        return password;
    }

    // User details based password
    if (config.passwordType === 'user_details' && config.userFields && config.userFields.length > 0) {
        console.log('[Password Generation] User details config:', {
            fields: config.userFields,
            userDetails: userDetails
        });
        
        const passwordParts = config.userFields
            .map((field) => {
                let value = '';
                switch (field) {
                    case 'firstName':
                        value = userDetails?.firstName?.trim() || '';
                        break;
                    case 'lastName':
                        value = userDetails?.lastName?.trim() || '';
                        break;
                    case 'email':
                        value = userDetails?.email?.trim() || '';
                        break;
                    case 'mobileNumber':
                        value = userDetails?.mobileNumber?.trim() || '';
                        break;
                    case 'dob':
                        value = userDetails?.dob?.trim() || '';
                        break;
                    case 'organisationKey':
                        value = userDetails?.organisationKey?.trim() || '';
                        break;
                    default:
                        value = '';
                }
                console.log(`[Password Generation] Field ${field} -> value: "${value}"`);
                return value;
            })
            .filter(part => part !== '');

        if (passwordParts.length > 0) {
            const finalPassword = passwordParts.join('-');
            console.log('[Password Generation] Final password:', finalPassword);
            return finalPassword;
        }
    }

    // Fallback to default
    console.log('[Password Generation] Fallback to default password');
    return DEFAULT_PASSWORD;
}

/**
 * Generates a password based on user's firstname and lastname (Legacy function - kept for backward compatibility)
 * Format: firstname-lastname (lowercase)
 * Falls back to default password if user details are missing
 * 
 * @deprecated Use generatePasswordFromConfig instead
 * @param userDetails - User details containing firstName and lastName
 * @returns Generated password string
 * 
 * @example
 * generatePasswordFromUser({ firstName: "John", lastName: "Doe" }) // returns "john-doe"
 * generatePasswordFromUser({}) // returns "Secure@123"
 */
export function generatePasswordFromUser(
    userDetails: UserDetailsForPassword | null | undefined
): string {
    if (
        userDetails &&
        userDetails.firstName &&
        userDetails.lastName &&
        userDetails.firstName.trim() !== "" &&
        userDetails.lastName.trim() !== ""
    ) {
        const firstName = userDetails.firstName.trim().toLowerCase();
        const lastName = userDetails.lastName.trim().toLowerCase();
        return `${firstName}-${lastName}`;
    }
    return DEFAULT_PASSWORD;
}

/**
 * Creates a password-protected ZIP archive containing the file using 7z command-line
 * Uses ZipCrypto (PKZIP 2.0) for Windows/macOS native compatibility
 * 
 * NOTE: Requires p7zip to be installed (added to Dockerfile like qpdf)
 * Windows Explorer and macOS Archive Utility both support ZipCrypto natively
 * 
 * @param fileBuffer - Buffer containing the file data
 * @param fileName - Original file name
 * @param password - Password to protect the ZIP with
 * @returns Buffer containing the password-protected ZIP file
 */
export async function createPasswordProtectedZip(
    fileBuffer: Buffer,
    fileName: string,
    password: string
): Promise<Buffer> {
    let inputPath: string | undefined;
    let outputPath: string | undefined;
    
    try {
        // Create temporary files for 7z (similar to qpdf)
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        
        // Extract just the base filename (without path) and sanitize it
        const extractedFileName = fileName.includes('/') || fileName.includes('\\')
            ? fileName.split(/[/\\]/).pop() || fileName
            : fileName;
        const baseFileName = sanitizeFilename(extractedFileName);
        
        inputPath = safePathJoin(tempDir, `file-input-${timestamp}-${randomStr}-${baseFileName}`);
        outputPath = safePathJoin(tempDir, `zip-output-${timestamp}-${randomStr}.zip`);
        
        // Write input buffer to temporary file
        await fs.writeFile(inputPath, fileBuffer);
        
        // Use 7z to create password-protected ZIP with ZipCrypto
        // -tzip = ZIP format
        // -mem=ZipCrypto = Use ZipCrypto encryption (Windows compatible)
        // -p = password
        const command = `7z a -tzip -mem=ZipCrypto -p"${password}" "${outputPath}" "${inputPath}"`;
        
        await execPromise(command);
        
        // Read the encrypted ZIP from output file
        const encryptedZipBuffer = await fs.readFile(outputPath);
        
        return encryptedZipBuffer;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
            `Failed to create password protected ZIP: ${errorMessage}`
        );
    } finally {
        // Clean up temporary files
        try {
            if (inputPath) {
                await fs.unlink(inputPath).catch(() => {
                    // Ignore cleanup errors
                });
            }
            if (outputPath) {
                await fs.unlink(outputPath).catch(() => {
                    // Ignore cleanup errors
                });
            }
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Checks if a file is a PDF based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a PDF, false otherwise
 */
export function isPDFFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
}

/**
 * Checks if a file is an Excel file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is an Excel file, false otherwise
 */
export function isExcelFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls');
}

/**
 * Checks if a file is a Word file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a Word file, false otherwise
 */
export function isWordFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.docx') || lowerFileName.endsWith('.doc');
}

/**
 * Checks if a file is a text file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a text file, false otherwise
 */
export function isTextFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.txt');
}

/**
 * Checks if a file is a CSV file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a CSV file, false otherwise
 */
export function isCSVFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.csv');
}

/**
 * Checks if a file is an Office file (Excel or Word)
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is an Office file, false otherwise
 */
export function isOfficeFile(fileName: string): boolean {
    return isExcelFile(fileName) || isWordFile(fileName);
}

/**
 * Checks if a file is a PowerPoint file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a PowerPoint file, false otherwise
 */
export function isPowerPointFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.pptx') || lowerFileName.endsWith('.ppt');
}

/**
 * Checks if a file is a ZIP file based on its extension
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is a ZIP file, false otherwise
 */
export function isZipFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.zip');
}

/**
 * Checks if a file is a modern Office Open XML format (.xlsx or .docx)
 * These formats support native encryption via officecrypto-tool
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is .xlsx or .docx, false otherwise
 */
export function isModernOfficeFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.docx');
}

/**
 * Checks if a file is a legacy Office format (.xls or .doc)
 * These formats do NOT support officecrypto-tool encryption
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is .xls or .doc, false otherwise
 */
export function isLegacyOfficeFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return (lowerFileName.endsWith('.xls') && !lowerFileName.endsWith('.xlsx')) || 
           (lowerFileName.endsWith('.doc') && !lowerFileName.endsWith('.docx'));
}

/**
 * Checks if a file is an image based on its extension
 * Images should NOT be password protected
 * 
 * @param fileName - Name of the file to check
 * @returns true if the file is an image, false otherwise
 */
export function isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Checks if a PDF buffer appears to be password-protected
 * 
 * @param fileBuffer - Buffer containing the PDF file data
 * @returns true if the PDF appears to be encrypted, false otherwise
 */
export function isPasswordProtectedPdf(fileBuffer: Buffer): boolean {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        return false;
    }
    return fileBuffer.includes(Buffer.from('/Encrypt'));
}

/**
 * Checks if an Office file buffer is password-protected
 * Supports XLS/XLSX/DOC/DOCX/PPT/PPTX via officecrypto-tool
 * 
 * @param fileBuffer - Buffer containing the Office file data
 * @param fileName - File name used to confirm Office type
 * @returns true if encrypted, false otherwise
 */
export function isPasswordProtectedOfficeFile(
    fileBuffer: Buffer,
    fileName: string
): boolean {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        return false;
    }
    if (!isOfficeFile(fileName) && !isPowerPointFile(fileName)) {
        return false;
    }
    try {
        return officecrypto.isEncrypted(fileBuffer);
    } catch {
        return false;
    }
}

/**
 * Checks if a ZIP buffer is password-protected by inspecting the encryption flag
 * 
 * @param fileBuffer - Buffer containing the ZIP data
 * @returns true if encrypted, false otherwise
 */
export function isPasswordProtectedZip(fileBuffer: Buffer): boolean {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        return false;
    }
    const localFileHeaderSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    let offset = 0;

    while (offset >= 0 && offset < fileBuffer.length) {
        const headerIndex = fileBuffer.indexOf(localFileHeaderSignature, offset);
        if (headerIndex < 0) {
            break;
        }
        const flagOffset = headerIndex + 6;
        if (flagOffset + 2 <= fileBuffer.length) {
            const flags = fileBuffer.readUInt16LE(flagOffset);
            if ((flags & 0x0001) === 0x0001) {
                return true;
            }
        }
        offset = headerIndex + 4;
    }
    return false;
}

/**
 * Throws if the uploaded file is password-protected (PDF/Office/ZIP)
 * 
 * @param file - Multer file-like object
 */
export async function assertUploadedFileNotPasswordProtected(
    file: { buffer?: Buffer; originalname?: string; path?: string }
): Promise<void> {
    if (!file || (!file.buffer && !file.path)) {
        return;
    }

    const fileName = file.originalname || file.path || "file";
    const fileBuffer = file.buffer ?? await fs.readFile(file.path as string);

    if (isPDFFile(fileName) && isPasswordProtectedPdf(fileBuffer)) {
        throw new BadRequestException("Password protected PDF files are not allowed for upload.");
    }

    if (isZipFile(fileName) && isPasswordProtectedZip(fileBuffer)) {
        throw new BadRequestException("Password protected ZIP files are not allowed for upload.");
    }

    if (isPasswordProtectedOfficeFile(fileBuffer, fileName)) {
        throw new BadRequestException("Password protected files are not allowed for upload.");
    }
}

/**
 * Converts a legacy .xls file buffer to .xlsx format
 * Uses SheetJS (xlsx) library for reliable conversion
 *
 * @param xlsBuffer - Buffer containing the .xls file data
 * @returns Buffer containing the converted .xlsx file
 */
export async function convertXlsToXlsx(xlsBuffer: Buffer): Promise<Buffer> {
    try {
        // Read the .xls file from the buffer
        const workbook = XLSX.read(xlsBuffer, {
            type: 'buffer',
            cellFormula: true,
            cellStyles: true
        });

        // Write the workbook to .xlsx format
        const xlsxBuffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        return xlsxBuffer;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
            `Failed to convert .xls to .xlsx: ${errorMessage}`
        );
    }
}

/**
 * Converts a legacy .doc buffer to .docx format WITHOUT data loss
 * Preserves formatting, tables, images, headers, footers, etc.
 *
 * @param docBuffer Buffer containing the .doc file
 * @returns Buffer containing the converted .docx file
 */
export async function convertDocToDocx(docBuffer: Buffer): Promise<Buffer> {
    try {
        console.log(`[DOC Conversion] Starting conversion. Input size: ${docBuffer.length} bytes`);
        
        // libre.convert uses callback pattern, wrap in Promise
        const docxBuffer = await new Promise<Buffer>((resolve, reject) => {
            libre.convert(docBuffer, '.docx', undefined, (err, data) => {
                if (err) {
                    console.error(`[DOC Conversion] Conversion failed:`, err);
                    reject(err);
                } else {
                    console.log(`[DOC Conversion] Conversion successful. Output size: ${data.length} bytes`);
                    resolve(data);
                }
            });
        });
        
        // Validate the converted buffer
        if (!docxBuffer || docxBuffer.length === 0) {
            throw new Error('Conversion resulted in empty buffer');
        }
        
        console.log(`[DOC Conversion] Returning converted buffer of size: ${docxBuffer.length} bytes`);
        return docxBuffer;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DOC Conversion] Error in convertDocToDocx:`, errorMessage);
        throw new BadRequestException(
            `Failed to convert .doc to .docx: ${errorMessage}`
        );
    }
}

/**
 * Converts a CSV file buffer to an XLSX file buffer
 * Uses ExcelJS to create a proper Excel workbook from CSV data
 * 
 * @param csvBuffer - Buffer containing the CSV file data
 * @returns Buffer containing the XLSX file
 */
export async function convertCsvToXlsx(csvBuffer: Buffer): Promise<Buffer> {
    try {
        const ExcelJS = require('exceljs');

        // Parse CSV content
        const csvContent = csvBuffer.toString('utf8');
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            throw new BadRequestException('CSV file is empty');
        }

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Parse CSV lines (simple CSV parser)
        const rows = lines.map(line => {
            // Handle quoted values and commas within quotes
            const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
            const values: string[] = [];
            let match;

            while ((match = regex.exec(line)) !== null) {
                let value = match[1];
                // Remove surrounding quotes and unescape double quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1).replace(/""/g, '"');
                }
                values.push(value);
            }

            return values.filter(v => v !== '');
        });

        // Add rows to worksheet
        rows.forEach(row => {
            worksheet.addRow(row);
        });

        // Auto-size columns based on content
        worksheet.columns.forEach(column => {
            let maxLength = 10;
            if (column && column.eachCell) {
                column.eachCell({ includeEmpty: false }, cell => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    maxLength = Math.max(maxLength, cellValue.length);
                });
            }
            if (column) {
                column.width = Math.min(maxLength + 2, 50);
            }
        });

        // Write workbook to buffer
        const xlsxBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(xlsxBuffer);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
            `Failed to convert CSV to XLSX: ${errorMessage}`
        );
    }
}

/**
 * Converts a text file buffer to a DOCX file buffer
 * Creates a simple Word document with the text content
 * 
 * @param textBuffer - Buffer containing the text file data
 * @returns Buffer containing the DOCX file
 */
export async function convertTextToDocx(textBuffer: Buffer): Promise<Buffer> {
    try {
        // Create a new workbook (we'll use ExcelJS's Document class approach)
        // Actually, we need to create a proper DOCX file structure
        // For simplicity, we'll create a minimal DOCX file manually
        
        const textContent = textBuffer.toString('utf8');
        
        // Create a minimal DOCX file structure
        // DOCX is essentially a ZIP file with XML files
        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        
        // Add [Content_Types].xml
        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
        zip.addFile('[Content_Types].xml', Buffer.from(contentTypes, 'utf8'));
        
        // Add _rels/.rels
        const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
        zip.addFile('_rels/.rels', Buffer.from(rels, 'utf8'));
        
        // Escape XML special characters in text content
        const escapedText = textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        
        // Split text into paragraphs
        const paragraphs = escapedText.split('\n').map(line => 
            `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`
        ).join('');
        
        // Add word/document.xml with text content
        const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
  </w:body>
</w:document>`;
        zip.addFile('word/document.xml', Buffer.from(document, 'utf8'));
        
        return zip.toBuffer();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
            `Failed to convert text to DOCX: ${errorMessage}`
        );
    }
}

/**
 * Applies native password protection to Office files (Excel, Word) using officecrypto-tool
 * Uses Microsoft Office encryption standard (AES-256)
 * ONLY works with .xlsx and .docx files (Office Open XML format)
 * Does NOT work with legacy .xls or .doc files
 * 
 * @param fileBuffer - Buffer containing the Office file data
 * @param password - Password to protect the file with
 * @param fileName - File name to determine file type and validate format
 * @returns Buffer containing the password-protected Office file
 */
export async function protectOfficeFile(
    fileBuffer: Buffer,
    password: string,
    fileName: string
): Promise<Buffer> {
    try {
        // Validate input buffer
        if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
            throw new BadRequestException('Invalid file buffer provided');
        }

        // Validate that file is in Office Open XML format (.xlsx or .docx only)
        const lowerFileName = fileName.toLowerCase();
        const isValidFormat = lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.docx');
        
        if (!isValidFormat) {
            throw new BadRequestException(
                `officecrypto-tool only supports .xlsx and .docx files. ` +
                `Legacy formats (.xls, .doc) are not supported. File: ${fileName}`
            );
        }

        // Log encryption attempt
        console.log(`[Password Protection] Encrypting Office file: ${fileName}, Size: ${fileBuffer.length} bytes`);

        // officecrypto-tool works directly with buffers and returns a Buffer
        const encryptedBuffer = await officecrypto.encrypt(fileBuffer, {
            password: password,
        });
        
        // Validate encrypted output
        if (!encryptedBuffer || encryptedBuffer.length === 0) {
            throw new BadRequestException('Encryption failed: empty result');
        }

        console.log(`[Password Protection] Successfully encrypted: ${fileName}, Encrypted size: ${encryptedBuffer.length} bytes`);

        return encryptedBuffer;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Password Protection] Failed to encrypt %s:", fileName, errorMessage);
        throw new BadRequestException(
            `Failed to apply password protection to Office file '${fileName}': ${errorMessage}`
        );
    }
}

/**
 * Applies native password protection to a PDF file using QPDF
 * Requires qpdf binary to be installed on the system
 * 
 * @param fileBuffer - Buffer containing the PDF file data
 * @param password - Password to protect the PDF with
 * @returns Buffer containing the password-protected PDF file
 */
export async function protectPDFFile(
    fileBuffer: Buffer,
    password: string
): Promise<Buffer> {
    let inputPath: string | undefined;
    let outputPath: string | undefined;
    
    try {
        // Create temporary files for QPDF (it requires file paths)
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        inputPath = safePathJoin(tempDir, `pdf-input-${timestamp}-${randomStr}.pdf`);
        outputPath = safePathJoin(tempDir, `pdf-output-${timestamp}-${randomStr}.pdf`);
        
        // Write input buffer to temporary file
        await fs.writeFile(inputPath, fileBuffer);
        
        // Get qpdf path for Windows compatibility
        const qpdfPath = getQpdfPath();
        
        // Encrypt the PDF using QPDF with AES-256 encryption
        await encrypt({
            input: inputPath,
            output: outputPath,
            password: password,
            keyLength: 256,
            restrictions: {
                useAes: "y", // Use AES encryption
            },
            ...(qpdfPath && { qpdfPath }), // Add qpdfPath only if defined
        });
        
        // Read the encrypted PDF from output file
        const encryptedPdfBuffer = await fs.readFile(outputPath);
        
        return encryptedPdfBuffer;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
            `Failed to apply password protection to PDF: ${errorMessage}`
        );
    } finally {
        // Clean up temporary files
        try {
            if (inputPath) {
                await fs.unlink(inputPath).catch(() => {
                    // Ignore errors during cleanup
                });
            }
            if (outputPath) {
                await fs.unlink(outputPath).catch(() => {
                    // Ignore errors during cleanup
                });
            }
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Main function to apply password protection to a file based on its type
 * - PDF files: Native PDF encryption with password prompt on open (requires qpdf)
 * - Other files: AES-256 encrypted ZIP archive
 * 
 * Feature flag controlled by:
 * 1. Global flag: ENABLE_FILE_PASSWORD_PROTECTION environment variable
 * 2. Module-specific flag: Checked from database via PasswordProtectionConfigService
 * 
 * @param fileBuffer - Buffer containing the file data
 * @param fileName - Original file name
 * @param password - Password to protect the file with
 * @param moduleKey - Optional module key to check module-specific password protection setting
 * @param isModulePasswordEnabled - Optional boolean indicating if module-specific password protection is enabled (from database)
 * @returns Object containing the protected file buffer and updated filename
 */
export async function applyPasswordProtection(
    fileBuffer: Buffer,
    fileName: string,
    password: string,
    moduleKey?: string,
    isModulePasswordEnabled?: boolean
): Promise<{
    data: Buffer;
    fileName: string;
    mimeType: string;
}> {
    // Check global password protection feature flag
    const globalFlagEnabled = isPasswordProtectionEnabled();

    // Determine if password protection should be applied
    // Both global flag and module-specific flag (if provided) must be true
    const shouldProtect = moduleKey 
        ? globalFlagEnabled && (isModulePasswordEnabled ?? true)
        : globalFlagEnabled;

    // Skip password protection for image files (they should always be accessible)
    if (isImageFile(fileName)) {
        return {
            data: fileBuffer,
            fileName: fileName,
            mimeType: "application/octet-stream",
        };
    }

    if (!shouldProtect) {
        // Return file as-is without password protection
        return {
            data: fileBuffer,
            fileName: fileName,
            mimeType: "application/octet-stream",
        };
    }

    try {
        // Check if file is PDF
        if (isPDFFile(fileName)) {
            // Apply native PDF password protection (works everywhere)
            const protectedPdfBuffer = await protectPDFFile(fileBuffer, password);
            
            return {
                data: protectedPdfBuffer,
                fileName: fileName, // Keep original .pdf extension
                mimeType: "application/pdf",
            };
        } else if (isCSVFile(fileName)) {
            const zipBuffer = await createPasswordProtectedZip(
                fileBuffer,
                fileName,
                password
            );

            return {
                data: zipBuffer,
                fileName: `${fileName}.zip`,
                mimeType: "application/zip",
            };
        } else if (isTextFile(fileName)) {
            // Convert TXT to DOCX, then apply password protection
            const docxBuffer = await convertTextToDocx(fileBuffer);
            const protectedDocxBuffer = await protectOfficeFile(docxBuffer, password, 'converted.docx');
            
            // Change extension from .txt to .docx
            const newFileName = fileName.replace(/\.txt$/i, '.docx');
            
            return {
                data: protectedDocxBuffer,
                fileName: newFileName,
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            };
        } else if (isModernOfficeFile(fileName)) {
            // For modern Office files (.xlsx, .docx), use native password protection
            // Uses Microsoft Office encryption standard (AES-256)
            const protectedOfficeBuffer = await protectOfficeFile(
                fileBuffer,
                password,
                fileName
            );

            return {
                data: protectedOfficeBuffer,
                fileName: fileName, // Keep original extension
                mimeType: isExcelFile(fileName) 
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            };
        } else if (isLegacyOfficeFile(fileName)) {
            // Legacy Office formats (.xls, .doc) don't support native encryption
            // Convert to modern format (.xlsx, .docx) and apply password protection
            console.log(`[Password Protection] Legacy Office format detected: ${fileName}. Converting to modern format.`);

            const lowerFileName = fileName.toLowerCase();

            if (lowerFileName.endsWith('.xls')) {
                // Convert .xls to .xlsx
                const xlsxBuffer = await convertXlsToXlsx(fileBuffer);
                const protectedXlsxBuffer = await protectOfficeFile(xlsxBuffer, password, 'converted.xlsx');

                // Change extension from .xls to .xlsx
                const newFileName = fileName.replace(/\.xls$/i, '.xlsx');

                return {
                    data: protectedXlsxBuffer,
                    fileName: newFileName,
                    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                };
            } else if (lowerFileName.endsWith('.doc')) {
                // Convert .doc to .docx
                console.log(`[Password Protection] Converting .doc to .docx. Original file size: ${fileBuffer.length} bytes`);
                const docxBuffer = await convertDocToDocx(fileBuffer);
                console.log(`[Password Protection] Conversion complete. DOCX size: ${docxBuffer.length} bytes`);
                
                console.log(`[Password Protection] Applying password protection to converted DOCX`);
                const protectedDocxBuffer = await protectOfficeFile(docxBuffer, password, 'converted.docx');
                console.log(`[Password Protection] Protection complete. Protected size: ${protectedDocxBuffer.length} bytes`);

                // Change extension from .doc to .docx
                const newFileName = fileName.replace(/\.doc$/i, '.docx');
                console.log(`[Password Protection] Final filename: ${newFileName}`);

                return {
                    data: protectedDocxBuffer,
                    fileName: newFileName,
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                };
            }

            // Fallback to ZIP if unable to determine specific type
            const zipBuffer = await createPasswordProtectedZip(
                fileBuffer,
                fileName,
                password
            );

            return {
                data: zipBuffer,
                fileName: `${fileName}.zip`,
                mimeType: "application/zip",
            };
        } else {
            // For all other files, wrap in password-protected ZIP
            const zipBuffer = await createPasswordProtectedZip(
                fileBuffer,
                fileName,
                password
            );

            return {
                data: zipBuffer,
                fileName: `${fileName}.zip`,
                mimeType: "application/zip",
            };
        }
    } catch (error) {
        console.error("Error applying password protection:", error);
        throw new BadRequestException(
            `Failed to apply password protection to file: ${fileName}`
        );
    }
}

/**
 * Utility function to convert a stream to a Buffer
 * 
 * @param stream - Readable stream to convert
 * @returns Promise that resolves to a Buffer
 */
export async function streamToBuffer(
    stream: NodeJS.ReadableStream
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}
