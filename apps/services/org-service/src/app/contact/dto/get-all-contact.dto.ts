import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { DEFAULT_COMPANY_CONTACT_RECORD_TYPE } from "../../../../../../../libs/service-lib/src/lib/constants";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetAllContactsDto {
  @IsOptional()
  @ApiProperty({
    description: "Page number (default: 1)",
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = DEFAULT_VALUES.PAGE;

  @IsOptional()
  @ApiProperty({
    description: "Number of items per page (default: 10)",
    example: 10,
    required: false,
  })
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = DEFAULT_VALUES.LIMIT;

  @IsOptional()
  @ApiProperty({
    description: "Contact record type id",
    example: 88,
    required: false,
  })
  @Transform(({ value }) => parseInt(value, 10))
  contactRecordTypeLid?: number = DEFAULT_COMPANY_CONTACT_RECORD_TYPE;

  @IsOptional()
  @ApiProperty({
    description: "Field to sort by",
    example: "id",
    required: false,
  })
  sort?: string = DEFAULT_VALUES.SORT_BY;

  @IsOptional()
  @ApiProperty({
    description: "Search term for filtering",
    example: "Test",
    required: false,
  })
  search?: string;

  @ApiProperty({
    description:
      "Field to search by (e.g., contactName, companyName, phone, status).",
    example: "companyName",
  })
  @IsOptional()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., createdAt, updatedAt).",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({
    description: "End date for the filter.",
    example: "2023-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({
    description: "Period of time in which the contact was created.",
    example: "3 Months",
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: "Financial year to filter.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Time filter on quarter.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "ViewBy to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString()
  viewBy?: "manager" | "team";
}

export class GetContactListDto {
  @ApiProperty({
    description: "Contact record type id",
    example: 88,
    required: false,
  })
  @IsNotEmpty({ message: "contactRecordTypeLid is required" })
  @Transform(({ value }) => parseInt(value, 10))
  contactRecordTypeLid: number = DEFAULT_COMPANY_CONTACT_RECORD_TYPE;

  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search based on first name , last name.",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Comma separated company ids to append in response list",
    example: "1,2",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? String(value)
          .split(",")
          .map((v) => parseInt(v, 10))
      : undefined
  )
  entityIds?: number[];
}
