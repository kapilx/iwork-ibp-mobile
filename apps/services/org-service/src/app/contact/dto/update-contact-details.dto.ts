import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  MaxLength,
  IsInt,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UpdateChildDetailsDto } from "./update-child-details.dto";
import { Transform, Type } from "class-transformer";
export class UpdateContactDetailsDto {
  @ApiProperty({ description: "ID of the contact details", required: false })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: "Contact ID associated with the contact details",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Contact ID must be a number." })
  contact?: number;

  @ApiProperty({ description: "Gender of the contact", required: false })
  @IsOptional()
  @IsInt({ message: "Gender should be a number" })
  gender?: number;

  @ApiProperty({ description: "Date of birth of the contact", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Date of birth should be a date" })
  dateOfBirth?: Date;

  @ApiProperty({ description: "Favorite food of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Favourite food must not exceed 100 characters" })
  favouriteFood?: string;

  @ApiProperty({
    description: "Favorite restaurant of the contact",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Favourite restaurant must not exceed 100 characters",
  })
  favouriteRestaurant?: string;

  @ApiProperty({
    description: "Personal history of the contact",
    required: false,
  })
  @IsOptional()
  @IsString()
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

  @ApiProperty({
    description: "Major achievements of the contact",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => {
    if (value) {
      // Strip HTML tags and trim whitespace
      return value.replace(/<[^>]*>/g, '').trim();
    }
    return value;
  })
  @MaxLength(500, {
    message: "Major achievements must not exceed 500 characters",
  })
  majorAchievements?: string;

  @ApiProperty({
    description: "Marital status of the contact",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Marital status should be a number" })
  maritalStatus?: number;

  @ApiProperty({
    description: "Date of wedding of the contact",
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Date of wedding should be a date" })
  dateOfWedding?: Date;

  @ApiProperty({ description: "Spouse name of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Spouse name must not exceed 100 characters" })
  spouseName?: string;

  @ApiProperty({ description: "Spouse date of birth", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Spouse date of birth should be a date" })
  spouseDateOfBirth?: Date;

  @ApiProperty({ description: "Spouse working status", required: false })
  @IsOptional()
  @IsInt({ message: "Spouse working status should be a number" })
  spouseWorkingStatus?: number;

  @ApiProperty({
    description: "Working company of the spouse",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Working company must not exceed 100 characters" })
  workingCompany?: string;

  @ApiProperty({
    description: "List of child details associated with the contact",
    type: [UpdateChildDetailsDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChildDetailsDto)
  childDetails?: UpdateChildDetailsDto[];

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
