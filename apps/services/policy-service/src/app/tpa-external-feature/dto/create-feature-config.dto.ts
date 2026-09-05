import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsIn,
  ValidateNested,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class FieldMappingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalFieldName!: string;

  @IsString()
  sourceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceField?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  staticValue?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fieldType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  dateFormat?: string;
}

export class CreateFeatureConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  tpaId?: number | null;

  @IsInt()
  @Min(1)
  featureTypeId!: number;

  @IsOptional()
  @IsInt()
  appRefId?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  buttonLabel!: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Machine key for worker/service routing: FETCH_CLAIMS, FETCH_ECARD, FETCH_HOSPITALS,
  // INTIMATE_CLAIM, SUBMIT_CLAIM. Leave unset for feature configs that only drive an
  // IBP button (no scheduler/service-level routing involved).
  @IsOptional()
  @IsString()
  @MaxLength(50)
  apiType?: string | null;

  // Only meaningful when apiType = INTIMATE_CLAIM: SINGLE = one combined call
  // (legacy/ISBS), MULTI = separate intimate + submit calls (FHPL, Health India).
  @IsOptional()
  @IsIn(["SINGLE", "MULTI"])
  claimFormType?: "SINGLE" | "MULTI" | null;

  // Only meaningful when apiType = SUBMIT_CLAIM on a MULTI-flow TPA: SINGLE_CALL =
  // one request with all fields + documents (FHPL), PER_DOCUMENT = one request per
  // document, looped (Health India).
  @IsOptional()
  @IsIn(["SINGLE_CALL", "PER_DOCUMENT"])
  submitExecutionMode?: "SINGLE_CALL" | "PER_DOCUMENT" | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  fieldMappings!: FieldMappingDto[];
}
