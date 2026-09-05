import {
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
import { validatePastDate } from "../../../../../service-lib/src/lib/utils/validate-date";
export class CreateChildDetailsDto {
  @IsOptional()
  @IsInt({ message: "Contact Details ID should be a number" })
  contactDetailsId?: number;

  @IsOptional()
  @IsString({ message: "Child name should be a string" })
  @MaxLength(100, { message: "Child name must not exceed 100 characters" })
  childName?: string;

  @IsOptional()
  @IsString({ message: "Child date of birth should be a date." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Child date of birth must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "Child date of birth")
  )
  childDob?: string;

  @IsOptional()
  @IsInt({ message: "Child gender should be a number" })
  childGender?: number;

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
