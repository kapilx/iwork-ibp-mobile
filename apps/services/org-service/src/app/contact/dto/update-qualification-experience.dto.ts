import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsDate,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class UpdateQualificationExperienceDto {
  @ApiProperty({ description: "ID of the qualification", required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: "Contact ID associated with the qualification",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Contact ID must be a number." })
  contact?: number;

  @ApiProperty({ description: "Name of the qualification", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Name of qualification must not exceed 100 characters",
  })
  nameOfQualification!: string;

  @ApiProperty({ description: "Year of the qualification", required: false })
  @IsOptional()
  @IsInt()
  @Min(1900, { message: "Year of qualification must be 1900 or later" })
  @Max(new Date().getFullYear(), {
    message: "Year of qualification cannot be in the future",
  })
  yearOfQualification!: number;

  @ApiProperty({ description: "Details of the qualification", required: false })
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

  @ApiProperty({
    description: "University Name of the qualification",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "University Name must be a string" })
  @MaxLength(100, { message: "University Name must not exceed 100 characters" })
  universityName?: string;

  @ApiProperty({ description: "Created by", required: false })
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @ApiProperty({ description: "Updated by", required: false })
  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @ApiProperty({ description: "Created at", required: false })
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @ApiProperty({ description: "Updated at", required: false })
  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
