import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum ExternalHrStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export class CompanyAccessDto {
  @IsInt()
  companyId: number;

  @IsArray()
  @IsInt({ each: true })
  policyIds: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  locationIds?: number[];
}

export class CreateExternalHrDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: "phone must be a valid phone number" })
  phone: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsEnum(ExternalHrStatus)
  status: ExternalHrStatus;

  // ── Multi-company access (new) ────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyAccessDto)
  companies?: CompanyAccessDto[];

  // ── Single-company (kept for backward compatibility) ──────────────────────
  @IsOptional()
  @IsInt()
  companyId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  policyIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  locationIds?: number[];

  @IsOptional()
  @IsIn(["EXTERNAL_HR", "HR_ADMIN", "ONLY_HR"])
  roleKey?: string;
}
