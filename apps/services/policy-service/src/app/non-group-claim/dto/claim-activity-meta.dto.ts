import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class ClaimActivityMetaDto {
  @IsOptional()
  @IsNumber()
  policyId?: number;

  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsOptional()
  @IsString()
  activityTable?: string;

  @IsOptional()
  activityData?: unknown; // Will be validated dynamically based on activityTable
}

// Base response DTO
export class ClaimActivityResponseDto {
  id!: number;
  policyId?: number;
  claimNumber?: string;
  activityTable?: string;
  statusLid?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt!: Date;
  updatedAt!: Date;
}

// Non-group claim DTOs
export class SaveNonGroupClaimDto {
  @IsOptional()
  @IsNumber()
  policyId?: number;

  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @IsNumber()
  opportunityId?: number;

  @IsOptional()
  @IsString()
  claimNumber?: string;
}

export class ValidateNonGroupClaimDto {
  @Type(() => Number)
  @IsInt()
  policyId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  companyId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityId?: number;

  @IsString()
  @IsOptional()
  claimNumber?: string;
}

export class GetNonGroupClaimQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter claims by company name.",
    example: "claimStage: Under Review, claimPriority: High",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort must be a string.",
    example: "claimId: ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Search by based on the property.",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., createdAt, updatedAt).",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({
    description: "End date for the filter.",
    example: "2023-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({
    description: "Period of time in which the claim was created.",
    example: "3 Months",
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: "Financial year to filter.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Time filter on quarter.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "ViewBy to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString()
  viewBy?: "manager" | "team";
}
