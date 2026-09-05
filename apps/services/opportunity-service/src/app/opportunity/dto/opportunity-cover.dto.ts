import { IsInt, IsOptional, IsString, IsJSON } from "class-validator";

export class OpportunityCoverDto {
  @IsInt()
  id!: number;

  @IsInt()
  opportunityId!: number;

  @IsInt()
  policyTypeId!: number;

  @IsInt()
  coverId!: number;

  @IsString()
  mandateType!: string;

  @IsString()
  approvalRequired!: string;

  @IsOptional()
  @IsString()
  coverName?: string;

  @IsOptional()
  @IsString()
  coverDescription?: string;

  @IsOptional()
  @IsInt()
  displaySequence?: number;

  @IsOptional()
  @IsString()
  displayCategory?: string;

  @IsOptional()
  @IsInt()
  coverTypeLid?: number;

  @IsOptional()
  @IsString()
  inputType?: string;

  @IsOptional()
  @IsJSON()
  inputLov?: Record<string, any>;

  @IsOptional()
  @IsJSON()
  coversMeta?: Record<string, any>;

  @IsOptional()
  @IsInt()
  sectionId?: number;

  @IsOptional()
  @IsString()
  visibleUntilActivityKey?: string | null;
}
