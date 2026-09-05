import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
} from "class-validator";
import { BulkEditErrorCode } from "../enums/bulk-edit-error-code.enum";

/**
 * DTO for bulk edit error information
 */
export class BulkEditErrorDto {
  @IsNotEmpty()
  @IsNumber()
  recordId!: number;

  @IsNotEmpty()
  @IsString()
  fieldName!: string;

  @IsEnum(BulkEditErrorCode)
  errorCode!: BulkEditErrorCode;

  @IsNotEmpty()
  @IsString()
  errorMessage!: string;
}

/**
 * DTO for bulk edit operation result
 */
export class BulkEditResultDto {
  @IsNotEmpty()
  @IsNumber()
  totalRecords!: number;

  @IsNotEmpty()
  @IsNumber()
  successCount!: number;

  @IsNotEmpty()
  @IsNumber()
  failureCount!: number;

  @IsArray()
  errors!: BulkEditErrorDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  affectedRecords!: number[];

  @IsArray()
  @IsOptional()
  leadCrmUserList?: any[];

  @IsArray()
  @IsOptional()
  accountManagerUserList?: any[];

  @IsArray()
  @IsOptional()
  bdOwnerUserList?: any[];

  @IsArray()
  @IsOptional()
  isgOwnerUserList?: any[];
}

/**
 * DTO for validation result
 */
export class ValidationResultDto {
  @IsNotEmpty()
  @IsBoolean()
  isValid!: boolean;

  @IsArray()
  errors!: BulkEditErrorDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];
}
