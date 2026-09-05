import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CompanyEmployeeFileUploadDto {
  @IsNotEmpty()
  @IsString()
  companyType!: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  documentTypeLid?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  companyId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityActivityId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  policyId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  claimId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  claimActivityId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  meetingId?: number;
}
