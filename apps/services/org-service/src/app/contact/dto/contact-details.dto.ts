import {
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  IsArray,
  ValidateNested,
  Matches,
} from "class-validator";
import { CreateChildDetailsDto } from "./child-details.dto";
import { Type, Transform } from "class-transformer";
import { validatePastDate } from "../../../../../service-lib/src/lib/utils/validate-date";

export class CreateContactDetailsDto {
  @IsOptional()
  @IsInt({ message: "Gender should be a number" })
  gender?: number;

  @IsOptional()
  @IsString({ message: "Date of birth must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of birth must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "Date of birth")
  )
  dateOfBirth?: string;

  @IsOptional()
  @IsString({ message: "Favourite food should be a string" })
  @MaxLength(100, { message: "Favourite food must not exceed 100 characters" })
  favouriteFood?: string;

  @IsOptional()
  @IsString({ message: "Favourite restaurant should be a string" })
  @MaxLength(100, {
    message: "Favourite restaurant must not exceed 100 characters",
  })
  favouriteRestaurant?: string;

  @IsOptional()
  @IsString({ message: "personal history should be a string" })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      // Strip HTML tags and trim whitespace
      const strippedValue = value.replace(/<[^>]*>/g, '').trim();
      return strippedValue;
    }
    return value;
  })
  @MaxLength(500, {
    message: "Personal history must not exceed 500 characters",
  })
  personalHistory?: string;

  @IsOptional()
  @IsString({ message: "major achievements should be a string" })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      // Strip HTML tags and trim whitespace
      const strippedValue = value.replace(/<[^>]*>/g, '').trim();
      return strippedValue;
    }
    return value;
  })
  @MaxLength(500, {
    message: "Major achievements must not exceed 500 characters",
  })
  majorAchievements?: string;

  @IsOptional()
  @IsInt({ message: "Marital status should be a number" })
  maritalStatus?: number;

  @IsOptional()
  @IsString({ message: "Date of wedding should be a date." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of wedding must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "Date of wedding")
  )
  dateOfWedding?: string;

  // Spouse Information
  @IsOptional()
  @IsString({ message: "Spouse name should be a string" })
  @MaxLength(100, { message: "Spouse name must not exceed 100 characters" })
  spouseName?: string;

  @IsOptional()
  @IsString({ message: "Spouse date of birth should be a date." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Spouse date of birth must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string | null }) =>
    validatePastDate(value, "Spouse date of birth")
  )
  spouseDateOfBirth?: string;

  @IsOptional()
  @IsInt({ message: "Spouse working status should be a number" })
  spouseWorkingStatus?: number;

  @IsOptional()
  @IsString({ message: "Spouse working company should be a string" })
  @MaxLength(100, { message: "Working company must not exceed 100 characters" })
  workingCompany?: string;

  @IsArray()
  @ValidateNested({ each: false })
  @Type(() => CreateChildDetailsDto)
  @IsOptional()
  childDetails?: CreateChildDetailsDto[];

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
