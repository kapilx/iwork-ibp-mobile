import {
  IsOptional,
  IsString,
  IsDate,
  MaxLength,
  IsNumber,
  IsInt,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class UpdateProfessionalExperienceDto {
  @ApiProperty({
    description: "ID of the professional experience",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: "Contact ID associated with the professional experience",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Contact ID must be a number." })
  contact?: number;

  @ApiProperty({
    description: "From date of the professional experience",
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "From date must be a valid date" })
  fromDate?: Date;

  @ApiProperty({
    description: "To date of the professional experience",
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "To date must be a valid date" })
  toDate?: Date;

  @ApiProperty({ description: "Company name", required: false })
  @IsOptional()
  @IsString({ message: "Company name must be a string" })
  @MaxLength(100, { message: "Company name must not exceed 100 characters" })
  company?: string;

  @ApiProperty({ description: "Designation in the company", required: false })
  @IsOptional()
  @IsString({ message: "Designation must be a string" })
  @MaxLength(100, { message: "Designation must not exceed 100 characters" })
  designation?: string;

  @ApiProperty({ description: "Department in the company", required: false })
  @IsOptional()
  @IsString({ message: "Department must be a string" })
  @MaxLength(100, { message: "Department must not exceed 100 characters" })
  department?: string;

  @ApiProperty({
    description: "Details of the professional experience",
    required: false,
  })
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
