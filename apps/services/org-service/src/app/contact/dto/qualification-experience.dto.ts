import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from "class-validator";
export class CreateQualificationExperienceDto {
  // Qualification Details
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Name of qualification must not exceed 100 characters",
  })
  nameOfQualification!: string;

  @IsOptional()
  @IsInt()
  @Min(1900, { message: "Year of qualification must be 1900 or later" })
  @Max(new Date().getFullYear(), {
    message: "Year of qualification cannot be in the future",
  })
  yearOfQualification!: number;

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
  @IsString({ message: "University Name must be a string" })
  @MaxLength(100, { message: "University Name must not exceed 100 characters" })
  universityName?: string;

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
