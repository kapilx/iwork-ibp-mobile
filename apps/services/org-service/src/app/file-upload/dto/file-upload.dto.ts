import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsInt, IsOptional } from "class-validator";

export class CreateFileUploadDto {
  @IsNotEmpty()
  @IsString()
  companyType: string; // Example: "opportunity"

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  documentTypeLid: number; // Example: 123

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  companyId: number; // Example: 122

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityId?: number; // Optional: ID of the related opportunity

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityActivityId?: number; // Optional: ID of the related opportunity activity

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  policyId?: number; // Optional: ID of the related policy

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  claimId?: number; // Optional: ID of the related claim

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  claimActivityId?: number; // Optional: ID of the related claim activity

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  meetingId?: number; // Optional: ID of the related meeting

  @IsOptional()
  @IsString()
  fileSize?: string; // Formatted file size (e.g., "1.23 MB")

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  endorsementId?: number; // Optional: endorsement/inception id used in the storage key

  @IsOptional()
  @IsString()
  uploadCategory?: string; // Optional: storage namespace (e.g., "insurer_ack")
}

import { PartialType } from "@nestjs/mapped-types";

export class UpdateFileUploadDto extends PartialType(CreateFileUploadDto) {}
