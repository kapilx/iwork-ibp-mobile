
import { MESSAGES, DATA_TYPE, FIELD_TYPE, EXCEL_DATE_FORMATS, VALIDATION_ERRORS, DEFAULT_GENDER_VALUES, DEFAULT_SEPARATORS, REGEX_PATTERNS } from "./constants";
/**
 * Converts Excel serial date number to DD/MM/YYYY string format
 * Excel stores dates as the number of days since 1899-12-30
 * 
 * @param serialNumber - Excel serial date number (e.g., 44927 for 2023-01-01)
 * @returns Date string in DD/MM/YYYY format
 * 
 * @example
 * convertExcelDateToString(44927) // Returns "01/01/2023"
 */

export const convertExcelDateToString = (serialNumber: number): string => {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const dateObj = new Date(excelEpoch.getTime() + serialNumber * 24 * 60 * 60 * 1000);
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Validates if a file has an allowed extension
 * 
 * @param fileName - Name of the file to validate
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.xlsx', '.csv'])
 * @returns true if file extension is allowed, false otherwise
 * 
 * @example
 * validateFileType('data.xlsx', ['.xlsx', '.csv']) // Returns true
 * validateFileType('data.pdf', ['.xlsx', '.csv']) // Returns false
 */
export const validateFileType = (
  fileName: string,
  allowedExtensions: string[]
): boolean => {
  return allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext.toLowerCase()));
};

/**
 * Validates if a file size is within the maximum allowed limit
 * 
 * @param fileSizeBytes - File size in bytes
 * @param maxSizeMB - Maximum allowed file size in megabytes
 * @returns true if file size is within limit, false otherwise
 * 
 * @example
 * validateFileSize(5242880, 10) // Returns true (5MB is less than 10MB)
 * validateFileSize(15728640, 10) // Returns false (15MB exceeds 10MB limit)
 */
export const validateFileSize = (
  fileSizeBytes: number,
  maxSizeMB: number
): boolean => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
};

/**
 * Extracts unique values from a specific column in file data
 * 
 * @param fileData - 2D array of file data rows
 * @param sourceColumn - Name of the source column
 * @param sourceColumns - Array of all source column names
 * @returns Array of unique non-empty values from the specified column
 * 
 * @example
 * const data = [['M', 'John'], ['F', 'Jane'], ['M', 'Bob']];
 * const columns = ['Gender', 'Name'];
 * getSourceColumnData(data, 'Gender', columns) // Returns ['M', 'F']
 */
export const getSourceColumnData = (
  fileData: any[][],
  sourceColumn: string,
  sourceColumns: string[]
): string[] => {
  const columnIndex = sourceColumns.indexOf(sourceColumn);
  if (columnIndex === -1 || fileData.length === 0) {
    return [];
  }
  
  const uniqueValues = Array.from(
    new Set(
      fileData
        .map(row => row[columnIndex])
        .filter(value => value !== undefined && value !== null && value !== '')
    )
  );
  
  return uniqueValues;
};
// ... existing imports if any
import * as XLSX from "xlsx";

/**
 * Detects the most likely date format from a string
 */
export const detectDateFormat = (sample: any): string => {
  if (sample === undefined || sample === null) return EXCEL_DATE_FORMATS.DD_MM_YYYY;
  const s = String(sample).trim();
  if (!s) return EXCEL_DATE_FORMATS.DD_MM_YYYY;
  
  // Excel serial number
  if (REGEX_PATTERNS.EXCEL_SERIAL_DATE.test(s)) return EXCEL_DATE_FORMATS.DD_MM_YYYY;

  // Match pattern like 1997-01-04 or 1997/1/4
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(s)) {
    const sep = s.includes("-") ? "-" : "/";
    return `YYYY${sep}MM${sep}DD`;
  }
  
  // Match pattern like 04-01-1997 or 4/1/1997
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(s)) {
    const sep = s.includes("-") ? "-" : "/";
    const parts = s.split(/[/-]/);
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    
    // If first part is > 12, it must be day
    if (p0 > 12) return `DD${sep}MM${sep}YYYY`;
    // If second part is > 12, it must be day
    if (p1 > 12) return `MM${sep}DD${sep}YYYY`;
    
    // Default based on separator
    return sep === "-" ? EXCEL_DATE_FORMATS.DD_MM_YYYY_DASH : EXCEL_DATE_FORMATS.DD_MM_YYYY;
  }

  return EXCEL_DATE_FORMATS.DD_MM_YYYY;
};

/**
 * Formats date parts based on target format
 */
export const formatDateParts = (day: string, month: string, year: string, targetFormat: string): string => {
  const separator = targetFormat.includes("-") ? "-" : "/";
  const d = day.padStart(2, "0");
  const m = month.padStart(2, "0");
  const y = year.padStart(4, "0");

  if (targetFormat.startsWith("DD")) {
    return `${d}${separator}${m}${separator}${y}`;
  } else if (targetFormat.startsWith("MM")) {
    return `${m}${separator}${d}${separator}${y}`;
  } else {
    return `${y}${separator}${m}${separator}${d}`;
  }
};

/**
 * Transforms date string from source format to target format
 */
export const transformDate = (date: any, sourceFormat: string, targetFormat: string): string => {
  if (!date) return "";
  let workingDate = String(date).trim();
  let workingSourceFormat = sourceFormat;

  // Excel serial date conversion
  if (REGEX_PATTERNS.EXCEL_SERIAL_DATE.test(workingDate)) {
    const serialNum = Number(workingDate);
    if (!isNaN(serialNum)) {
      workingDate = convertExcelDateToString(serialNum);
      workingSourceFormat = EXCEL_DATE_FORMATS.DD_MM_YYYY;
    }
  }

  try {
    const parts = workingDate.split(/[/-]/);
    if (parts.length !== 3) return workingDate;

    let day, month, year;
    
    // AUTO-CORRECTION: If the data obviously contradicts the sourceFormat
    // e.g. Data is 1997-01-04 but Format is DD/MM/YYYY
    let effectiveFormat = workingSourceFormat;
    if (!effectiveFormat || 
        (parts[0].length === 4 && !effectiveFormat.startsWith("YYYY")) || 
        (parts[2].length === 4 && effectiveFormat.startsWith("YYYY"))) {
      if (parts[0].length === 4) effectiveFormat = EXCEL_DATE_FORMATS.YYYY_MM_DD;
      else if (parts[2].length === 4) effectiveFormat = EXCEL_DATE_FORMATS.DD_MM_YYYY;
    }

    if (effectiveFormat.startsWith("DD")) {
      [day, month, year] = parts;
    } else if (effectiveFormat.startsWith("MM")) {
      [month, day, year] = parts;
    } else {
      [year, month, day] = parts;
    }

    // Heuristic: Swap day and month if month is invalid (>12) but day is valid (<=12)
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (!isNaN(mNum) && !isNaN(dNum) && mNum > 12 && dNum <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    return formatDateParts(day, month, year, targetFormat);
  } catch {
    return workingDate;
  }
};

/**
 * Formats number string based on decimal and thousand separators
 */
export const formatNumber = (value: string, config: { decimalSeparator: string; thousandSeparator: string }): string => {
  if (!value) return "";
  try {
    // We allow digits, dots, hyphens, spaces, and commas (as thousands separators).
    if (/[^\d.\-\s,]/.test(value)) {
      return value;
    }

    const cleaned = value.replace(REGEX_PATTERNS.NON_DIGIT_DOT, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) return value;

    const parts = num.toString().split(DEFAULT_SEPARATORS.DECIMAL);
    parts[0] = parts[0].replace(REGEX_PATTERNS.THOUSAND_GROUP, config.thousandSeparator || "");

    return parts.join(config.decimalSeparator);
  } catch {
    return value;
  }
};

/**
 * Extracts headers and data from an Excel or CSV file
 * @param file - The file to extract data from
 * @returns Promise resolving to an object with headers and data
 */
export const extractColumnsFromFile = async (file: File): Promise<{ headers: string[], data: any[][] }> => {
  return new Promise<{ headers: string[], data: any[][] }>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use ArrayBuffer for better compatibility with both .xls and .xlsx
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON to get headers and data
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length > 0) {
          // Identify valid header indices to maintain column alignment in data rows
          const headerRow = jsonData[0];
          const validIndices: number[] = [];
          const rawHeaders: string[] = [];

          headerRow.forEach((header, index) => {
            if (header !== undefined && header !== null && header.toString().trim() !== "") {
              validIndices.push(index);
              rawHeaders.push(header.toString().trim());
            }
          });

          if (rawHeaders.length === 0) {
            reject(new Error(MESSAGES.NO_HEADERS || "No valid headers found in the file"));
            return;
          }

          // Handle duplicate headers to avoid indexOf ambiguity in the UI
          const headerCounts: Record<string, number> = {};
          const headers = rawHeaders.map(header => {
            if (headerCounts[header] === undefined) {
              headerCounts[header] = 0;
              return header;
            } else {
              headerCounts[header]++;
              return `${header} (${headerCounts[header]})`;
            }
          });

          // Get all data rows (excluding header) using only the valid header indices
          // Filter out rows that are entirely empty
          const dataRows = jsonData.slice(1)
            .map(row => validIndices.map(idx => row[idx]))
            .filter(row => row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== ""));

          resolve({ headers, data: dataRows });
        } else {
          reject(new Error(MESSAGES.NO_DATA_FOUND));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error(MESSAGES.FAILED_READ_FILE));
    };

    // Use ArrayBuffer for better compatibility with both .xls and .xlsx formats
    reader.readAsArrayBuffer(file);
  });
};

export interface ValidationResult {
  value: string;
  isValid: boolean;
  error?: string;
}

/**
 * Transforms a cell value based on target column configuration
 * Supports both legacy UI format and new Backend format
 */
export const transformValue = (
  cellValue: any,
  targetColName: string,
  targetColDef: any,
  config: any
): ValidationResult => {
  if (cellValue === undefined || cellValue === null || cellValue === '') {
    return { value: '—', isValid: true };
  }

  let finalValue: any = cellValue;
  let isValid = true;
  let error: string | undefined;

  /* -------------------- helpers -------------------- */

  const invalidate = (err: string) => {
    isValid = false;
    error = err;
  };

  const validateNumber = (value: any, formatConfig?: any) => {
    const valueStr = String(value).trim();
    const cleanString = valueStr.replace(REGEX_PATTERNS.CLEAN_NUMBER, '');

    const hasAlphaChars = /[a-zA-Z]/.test(valueStr);
    const isEmpty = cleanString === '';
    const isNotANumber = isNaN(Number(cleanString));

    if (hasAlphaChars || isEmpty || isNotANumber) {
      invalidate(VALIDATION_ERRORS.INVALID_NUMBER);
      return value;
    }

    return formatConfig
      ? formatNumber(valueStr, formatConfig)
      : valueStr;
  };

  const validateDate = (value: any) => {
    const str = String(value);
    const hasDateChars = REGEX_PATTERNS.DATE_CHARS.test(str);
    const parsed = Date.parse(str.replace(/\//g, '-'));

    if (!hasDateChars || isNaN(parsed)) {
      invalidate(VALIDATION_ERRORS.INVALID_DATE_FORMAT);
    }

    return value;
  };

  const validateGender = (
    value: any,
    mappings?: Record<string, string>,
    allowedValues?: string[],
  ) => {
    const valStr = String(value).trim().toLowerCase();

    // 1️⃣ Mapping has highest priority
    if (mappings && Object.keys(mappings).length > 0) {
      const key = Object.keys(mappings).find((k) => k.toLowerCase() === valStr);

      if (key) {
        return mappings[key];
      }

      // Not found in mappings → INVALID
      invalidate(VALIDATION_ERRORS.VALUE_NOT_ALLOWED(value));
      return value;
    }

    // 2️⃣ Allowed values (or default)
    const allowed =
      allowedValues && allowedValues.length > 0
        ? allowedValues
        : DEFAULT_GENDER_VALUES;

    const match = allowed.find((v) => v.toLowerCase() === valStr);

    if (!match) {
      invalidate(VALIDATION_ERRORS.VALUE_NOT_ALLOWED(value));
      return value;
    }

    return match;
  };

  /* -------------------- NEW CONFIG FLOW -------------------- */

  if (config?.type) {
    const { type, source, target } = config;

    switch (type) {
      case DATA_TYPE.GENDER:
        finalValue = validateGender(
          finalValue,
          target?.mappings,
          target?.allowedValues || targetColDef?.config?.allowedValues
        );
        break;

      case DATA_TYPE.DATE:
        if (source?.format && target?.format) {
          finalValue = transformDate(
            finalValue,
            source.format,
            target.format
          );
        }
        validateDate(finalValue);
        break;

      case DATA_TYPE.NUMBER:
        finalValue = validateNumber(finalValue, {
          decimalSeparator:
            target?.decimalSeparator || DEFAULT_SEPARATORS.DECIMAL,
          thousandSeparator:
            target?.thousandSeparator || DEFAULT_SEPARATORS.THOUSAND,
        });
        break;

      case DATA_TYPE.STRING:
        // STRING accepts everything (numbers, text, alphanumeric)
        finalValue = String(finalValue).trim();
        break;
    }
  }

  /* -------------------- LEGACY CONFIG FLOW -------------------- */

  else if (config && (config.gender || config.date || config.number || config.isLegacy)) {
    if (
      (targetColDef?.type === FIELD_TYPE.GENDER ||
        targetColDef?.dataType === DATA_TYPE.GENDER) &&
      config.gender
    ) {
      finalValue = validateGender(
        finalValue,
        config.gender.mappings,
        config.gender.allowedValues ||
          targetColDef?.config?.allowedValues
      );
    }

    if (
      (targetColDef?.type === FIELD_TYPE.DATE ||
        targetColDef?.dataType === DATA_TYPE.DATE) &&
      config.date
    ) {
      finalValue = transformDate(
        finalValue,
        config.date.sourceFormat,
        config.date.targetFormat
      );
      validateDate(finalValue);
    }

    if (
      (targetColDef?.type === FIELD_TYPE.NUMBER ||
        targetColDef?.dataType === DATA_TYPE.NUMBER) &&
      config.number
    ) {
      finalValue = validateNumber(finalValue, config.number);
    }

    if (
      targetColDef?.type === FIELD_TYPE.TEXT ||
      targetColDef?.dataType === DATA_TYPE.STRING
    ) {
      finalValue = String(finalValue).trim();
    }
  }

  /* -------------------- DEFAULT FLOW -------------------- */

  else {
    if (
      targetColDef?.type === FIELD_TYPE.GENDER ||
      targetColDef?.dataType === DATA_TYPE.GENDER
    ) {
      finalValue = validateGender(
        finalValue,
        undefined,
        targetColDef?.config?.allowedValues
      );
    }

    if (
      targetColDef?.type === FIELD_TYPE.DATE ||
      targetColDef?.dataType === DATA_TYPE.DATE
    ) {
      validateDate(finalValue);
    }

    if (
      targetColDef?.type === FIELD_TYPE.NUMBER ||
      targetColDef?.dataType === DATA_TYPE.NUMBER
    ) {
      finalValue = validateNumber(finalValue);
    }

    if (
      targetColDef?.type === FIELD_TYPE.TEXT ||
      targetColDef?.dataType === DATA_TYPE.STRING
    ) {
      finalValue = String(finalValue).trim();
    }
  }

  return {
    value:
      finalValue !== undefined &&
      finalValue !== null &&
      finalValue !== ''
        ? String(finalValue)
        : '—',
    isValid,
    error,
  };
};

/**
 * Retrieves the authentication token from sessionStorage.
 * Explores possible structures of the 'user' object in sessionStorage.
 * @returns {string | null} The access token or null if not found.
 */
export const getAuthToken = (): string | null => {
  try {
    const userStr = sessionStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    // Check for nested accessToken structure as seen in SignIn logic
    return user?.accessToken?.accessToken || user?.accessToken || null;
  } catch (error) {
    return null;
  }
};

/**
 * Formats a date string or Date object to a readable string
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "12/31/2023") or empty string if invalid
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};
