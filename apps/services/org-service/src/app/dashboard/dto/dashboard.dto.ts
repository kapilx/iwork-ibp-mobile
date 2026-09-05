import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class CreateAnnouncementDto {
  @ApiProperty({
    description: "Organisation ID",
    type: Number,
    example: 1,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: "Organisation id is required." })
  @IsInt({ message: "Organisation id must be a number." })
  @Min(1, {
    message: "Organisation id must be positive number.",
  })
  organisationId!: number;

  @ApiProperty({
    description: "Title",
    type: String,
    example: "Announcement title",
  })
  @IsString({ message: "Title must be a string." })
  @IsNotEmpty({ message: "Title is required." })
  @MaxLength(255, {
    message: "Title must not exceed 255 characters.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  title!: string;

  @ApiPropertyOptional({
    description: "Description",
    type: String,
    example: "Announcement description",
  })
  @IsString({ message: "Announcement description must be a string." })
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  description?: string;

  @ApiProperty({
    description: "ExpiryDate in YYYY-MM-DD format",
    example: "2026-12-31",
  })
  @IsNotEmpty({ message: "ExpiryDate is required" })
  @IsString({ message: "ExpiryDate must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "ExpiryDate must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    if (date < new Date()) {
      throw new BadRequestException("ExpiryDate cannot be a past date.");
    }
    return value;
  })
  expiryDate!: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class GetAnnouncementsDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter announcements.",
    example: "description:Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., description:ASC,createdAt:DESC).",
    example: "createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., description).",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;
}

export interface EmployeeCelebrationDto {
  employeeId: string;
  userId: number;
  fullName: string;
  emailId: string;
  celebrationType: "BIRTHDAY" | "WORK_ANNIVERSARY";
  celebrationDate: Date | string;
  profileUrl: string;
}

export class GetCelebrationsDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;
}
