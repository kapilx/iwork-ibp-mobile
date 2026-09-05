import {
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ArrayMinSize,
  ValidateNested,
  IsBoolean,
  IsObject,
  IsOptional,
} from "class-validator";
import { EntityType } from "../enums/field-operation.enum";

/**
 * DTO for bulk edit request with comprehensive validation
 */
export class BulkEditRequestDto {
  @IsEnum(EntityType, {
    message:
      "entityType must be one of: COMPANY, POLICY, SALES_OPPORTUNITY, RENEWAL_OPPORTUNITY",
  })
  entityType!: (typeof EntityType)[keyof typeof EntityType];

  @IsArray()
  // @ArrayMinSize(1, { message: "recordIds must contain at least one record ID" })
  @IsNumber({}, { each: true, message: "Each record ID must be a number" })
  recordIds!: number[];

  @IsNotEmpty({ message: "fieldUpdates must not be empty" })
  fieldUpdates!: Record<string, number | string | boolean | null>;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsBoolean()
  selectedAll?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true, message: "Each excluded ID must be a number" })
  excludedIds?: number[];

  @IsOptional()
  @IsObject()
  selectedFilterValues?: Record<
    string,
    string | number | boolean | Date | (string | number | Date)[]
  >;
}
