import { Type } from "class-transformer";
import { IsInt, IsOptional, ValidateNested } from "class-validator";

export class ContactMatrixLevelDto {
  @IsInt()
  contactId!: number;

  @IsOptional()
  @IsInt()
  tpaId?: number;

  @IsOptional()
  @IsInt()
  insurerId?: number;
}

export class ContactMatrixEntityDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactMatrixLevelDto)
  primary?: ContactMatrixLevelDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactMatrixLevelDto)
  secondary?: ContactMatrixLevelDto;
}

export class UpdatePolicyContactMatrixDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactMatrixEntityDto)
  tpa?: ContactMatrixEntityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactMatrixEntityDto)
  insurer?: ContactMatrixEntityDto;
}
