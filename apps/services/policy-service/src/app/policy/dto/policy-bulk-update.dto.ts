import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  ArrayMinSize,
  IsString,
  ValidateIf,
  IsIn,
  IsBoolean,
  IsOptional,
  IsObject,
} from "class-validator";

const FIELD_OPERATIONS = ["set", "clear"] as const;
type FieldUpdateOperation = (typeof FIELD_OPERATIONS)[number];

export class PolicyFieldUpdateDto {
  @IsNotEmpty()
  @IsString()
  fieldName!: string;

  @ValidateIf((o) => o.operation === "set")
  @IsNotEmpty({ message: "newValue is required when operation is set" })
  newValue?: unknown;

  @IsIn(FIELD_OPERATIONS, {
    message: 'operation must be either "set" or "clear"',
  })
  operation!: FieldUpdateOperation;
}

/**
 * DTO for policy bulk update request
 */
export class PolicyBulkUpdateDto {
  @ValidateIf((o) => !o.selectedAll)
  @IsArray()
  @ArrayMinSize(1, {
    message:
      "recordIds must contain at least one record ID when selectedAll is false",
  })
  @IsNumber({}, { each: true, message: "Each record ID must be a number" })
  recordIds?: number[];

  @IsNotEmpty({ message: "fieldUpdates must not be empty" })
  fieldUpdates!: Record<string, number | string | boolean | null>;

  @IsNotEmpty()
  @IsNumber()
  userId!: number;

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

/**
 * DTO for policy bulk update response
 */
export class PolicyBulkUpdateResponseDto {
  /** Total number of records attempted to be updated */
  totalRecords!: number;

  /** Number of records successfully updated */
  successCount!: number;

  /** Number of records that failed to update */
  failureCount!: number;

  /** Array of errors encountered during the operation */
  errors!: {
    recordId: number;
    fieldName: string;
    errorCode: string;
    errorMessage: string;
  }[];

  /** Array of record IDs that were successfully affected */
  affectedRecords!: number[];

  /** Processing duration in milliseconds */
  processingDuration!: number;
}
