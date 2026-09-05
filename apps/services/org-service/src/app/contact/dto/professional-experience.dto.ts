import {
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
import { validatePastDate } from "../../../../../service-lib/src/lib/utils/validate-date";

export class CreateProfessionalExperienceDto {
  // Experience Details
  @IsOptional()
  @IsString({ message: "From date should be a date." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "From date must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "fromDate ")
  )
  fromDate?: string;

  @IsOptional()
  @IsString({ message: "To date should be a date." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "To date must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "toDate ")
  )
  toDate?: string;

  @IsOptional()
  @IsString({ message: "Company name must be a string" })
  @MaxLength(100, { message: "Company name must not exceed 100 characters" })
  company?: string;

  @IsOptional()
  @IsString({ message: "Designation must be a string" })
  @MaxLength(100, { message: "Designation must not exceed 100 characters" })
  designation?: string;

  @IsOptional()
  @IsString({ message: "Department must be a string" })
  @MaxLength(100, { message: "Department must not exceed 100 characters" })
  department?: string;

  @IsOptional()
  @IsString({ message: "Details must be a string" })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      // Strip HTML tags and trim whitespace
      const strippedValue = value.replace(/<[^>]*>/g, '').trim();
      return strippedValue;
    }
    return value;
  })
  @MaxLength(500, { message: "Details must not exceed 500 characters" })
  details?: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsString()
  createdAt?: Date;

  @IsOptional()
  @IsString()
  updatedAt?: Date;
}
