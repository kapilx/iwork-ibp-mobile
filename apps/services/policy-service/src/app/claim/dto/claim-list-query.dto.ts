import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsArray,
  IsBoolean,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import {
  ENDORSEMENT_TAT_FILTER_LABELS,
  EndorsementTatFilterLabel,
  normalizeEndorsementTatFilter,
} from "../../../../../../../libs/service-lib/src/lib/utils/tat.utils";
import { MONTHS_WITH_QUARTERS_ENUM } from "../../../../../../../libs/service-lib/src/lib/constants";

export class ClaimListQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiProperty({ required: false, example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @Type(() => Date)
  from?: Date;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @Type(() => Date)
  to?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiProperty({
    required: false,
    enum: Object.values(MONTHS_WITH_QUARTERS_ENUM),
    description: "Filter data by month (January, February, etc.)."
  })
  @IsOptional()
  @IsIn(Object.values(MONTHS_WITH_QUARTERS_ENUM))
  month?: string;

  @ApiProperty({
    required: false,
    enum: ["Q1", "Q2", "Q3", "Q4"],
    description: "Filter data by quarter (Q1, Q2, Q3, Q4)."
  })
  @IsOptional()
  @IsIn(["Q1", "Q2", "Q3", "Q4"])
  quarter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  financialYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiProperty({ required: false, enum: ["manager", "team"] })
  @IsOptional()
  @IsIn(["manager", "team"])
  viewBy?: "manager" | "team";

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  organisationId?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sbuId?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  verticalId?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  branchId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeCompanyPriority(value))
  @IsArray()
  @IsNumber({}, { each: true })
  companyPriority?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  policyType?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description:
      "Claim status array. Accepts formats: claimStatus=SETTLED, claimStatus=[SETTLED], claimStatus=[SETTLED,REJECTED]",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => normalizeClaimStatus(value))
  claimStatus?: string[];

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tatFrom?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tatTo?: number;

  @ApiProperty({
    required: false,
    enum: ENDORSEMENT_TAT_FILTER_LABELS,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(ENDORSEMENT_TAT_FILTER_LABELS, { each: true })
  @Transform(({ value }) => normalizeTatRange(value))
  tatRange?: EndorsementTatFilterLabel[];

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => normalizeBoolean(value))
  @IsBoolean()
  openTatOnly?: boolean;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;
}

function normalizeCompanyPriority(raw: any): number[] | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  // Already array
  if (Array.isArray(raw))
    return raw
      .map((v) => Number(String(v).replace(/[\[\]\s]/g, "")))
      .filter((v) => !isNaN(v));
  // String: could be "[3302]" or "3302,3303" or "3302"
  let s = String(raw).trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  if (s === "") return undefined;
  return s
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => !isNaN(v));
}

function normalizeTatRange(
  raw: any
): EndorsementTatFilterLabel[] | undefined {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }

  const values: string[] = [];

  const collect = (input: any) => {
    if (input === undefined || input === null) {
      return;
    }
    if (Array.isArray(input)) {
      input.forEach(collect);
      return;
    }

    let token = String(input).trim();
    if (!token) {
      return;
    }

    if (token.startsWith("[") && token.endsWith("]")) {
      token = token.slice(1, -1);
    }

    token
      .split(",")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .forEach((segment) => values.push(segment));
  };

  collect(raw);

  const normalized = new Set<EndorsementTatFilterLabel>();
  values.forEach((value) => {
    const match = normalizeEndorsementTatFilter(value);
    if (match) {
      normalized.add(match);
    }
  });

  return normalized.size > 0 ? Array.from(normalized) : undefined;
}

function normalizeClaimStatus(raw: any): string[] | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  // Already array (multiple params or parsed)
  if (Array.isArray(raw)) {
    return raw
      .flatMap(splitStatusPossiblyCombined)
      .map(cleanStatus)
      .filter((v) => v.length > 0);
  }
  // String: could be "[SETTLED]" "[SETTLED,REJECTED]" "SETTLED,REJECTED" "SETTLED"
  let s = String(raw).trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  if (s === "") return undefined;
  return s
    .split(",")
    .map(cleanStatus)
    .filter((v) => v.length > 0);
}

function splitStatusPossiblyCombined(v: any): string[] {
  if (typeof v !== "string") return [];
  let s = v.trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  if (s.includes(",")) return s.split(",");
  return [s];
}

function cleanStatus(v: string): string {
  return v.trim().replace(/\s+/g, "_").toUpperCase();
}

function normalizeBoolean(raw: any): boolean | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw === "boolean") return raw;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return undefined;
}
