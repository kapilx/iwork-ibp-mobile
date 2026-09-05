import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CompanyDetailsDto } from "./company-detail.dto";

export class CreateCompanyAddressDto {
  @ApiProperty({
    description: "Address Type ID",
    type: Number,
    required: true,
    example: 25,
  })
  @IsNotEmpty({ message: "Address Type id is required." })
  @IsInt({ message: "Address Type id must be a number." })
  addressTypeLid!: number;

  @ApiPropertyOptional({
    description: "Address",
    type: String,
    example: "123 Main St",
  })
  @IsNotEmpty({ message: "Address Line is required." })
  @IsString({ message: "Address Line must be a string." })
  @MaxLength(255, { message: "Address Line must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address1!: string;

  @ApiPropertyOptional({
    description: "Country ID",
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "Country id must be a number." })
  countryId?: number;

  @ApiPropertyOptional({
    description: "State ID",
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "State id must be a number." })
  stateId?: number;

  @ApiProperty({
    description: "City ID",
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: "City id is required." })
  @IsInt({ message: "City id must be a number." })
  cityId!: number;

  @ApiPropertyOptional({
    description: "Address 2",
    type: String,
    example: "Address v23",
  })
  @IsOptional()
  @IsString({ message: "Address 2 must be a string." })
  @MaxLength(255, { message: "Address 2 must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address2?: string;

  @ApiPropertyOptional({
    description: "Area",
    type: String,
    example: "Downtown",
  })
  @IsOptional()
  @IsString({ message: "Area must be a string." })
  @MaxLength(100, { message: "Area must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  area?: string;

  @ApiPropertyOptional({
    description: "Postal Code",
    type: String,
    example: "12345",
  })
  @IsOptional()
  @IsString({ message: "Postal code must be a string." })
  @Matches(/^[A-Za-z0-9\s\-]{3,10}$/, {
    message:
      "Postal code must be 3-10 characters long and can only contain letters, numbers, spaces, and hyphens.",
  })
  pinCode?: string;

  @ApiPropertyOptional({
    description: "Phone Number",
    type: String,
    example: "1234567890",
  })
  @IsOptional()
  @IsString({ message: "Phone number must be a string." })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "Alternate Phone Number",
    type: String,
    example: "0987654321",
  })
  @IsOptional()
  @IsString({ message: "Alternate Phone number must be a string." })
  alternatePhoneNumber?: string;

  @ApiPropertyOptional({
    description: "Email",
    type: String,
    example: "email@1811.com",
  })
  @IsOptional()
  @IsString({ message: "Email must be a string." })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: "Invalid email format.",
  })
  email?: string;

  @ApiPropertyOptional({
    description: "Support Number",
    type: String,
    example: "1234567890",
  })
  @IsOptional()
  @IsString({ message: "Support number must be a string." })
  supportNumber?: string;

  @ApiPropertyOptional({
    description:
      "Location Code (mandatory when addressType = Associated Location)",
    type: String,
    example: "MUM01",
  })
  @IsOptional()
  @IsString({ message: "Location code must be a string." })
  @MaxLength(100, { message: "Location code must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  locationCode?: string | null;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
export class CreateGstDto {
  @ApiPropertyOptional({ description: "State ID", example: 1 })
  @IsInt({ message: "State ID must be a valid number." })
  @IsOptional()
  stateId?: number;

  @ApiPropertyOptional({
    description: "GST number",
    example: "22ABCDE1234F1Z5",
  })
  @IsString({ message: "GST number must be a string." })
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ description: "GST category ID", example: 101 })
  @IsOptional()
  @IsInt({ message: "GST category ID must be a valid number." })
  gstCategoryLid?: number;

  @ApiPropertyOptional({ description: "Entity type", example: "COMPANY" })
  @IsOptional()
  @IsString({ message: "Entity type must be a string." })
  entityType?: string;

  @ApiPropertyOptional({ description: "Status LID", example: 1 })
  @IsOptional()
  @IsInt()
  statusLid?: number;

  @ApiPropertyOptional({ description: "Created by user ID" })
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @ApiPropertyOptional({ description: "Updated by user ID" })
  @IsOptional()
  @IsInt()
  updatedBy?: number;
}

export class CreateGroupCompanyMapDto {
  @ApiProperty({ description: "Group Company ID", example: 2 })
  @IsInt({ message: "Group Company ID must be a valid number." })
  @IsNotEmpty({ message: "Group Company ID is required." })
  groupCompanyId!: number;
}

export class CreateCompanyDocMapDto {
  @ApiProperty({ description: "Document ID", example: 101 })
  @IsInt({ message: "Document ID must be a valid number." })
  @IsNotEmpty({ message: "Document ID is required." })
  documentId!: number;
}

export class CreateCompanyDto {
  @ApiProperty({
    description: "Name of the company",
    example: "Tech Solutions Inc.",
  })
  @IsNotEmpty({ message: "Company name is required." })
  @IsString({ message: "Company name must be a string." })
  @MinLength(3, { message: "Company name must be at least 3 characters long." })
  @MaxLength(200, { message: "Company name must not exceed 200 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  companyName!: string;

  @ApiPropertyOptional({
    description: "Display name of the company",
    example: "Tech Solutions",
  })
  @IsOptional()
  @IsString({ message: "Display name must be a string." })
  @MinLength(3, { message: "Display name must be at least 3 characters long." })
  @MaxLength(100, { message: "Display name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName?: string;

  @ApiProperty({ description: "Company type ID", example: 20 })
  @IsOptional()
  @IsInt({ message: "Company type id must be a number." })
  companyTypeLid?: number;

  @IsOptional()
  @IsInt({ message: "Currency id must be a number." })
  currencyId?: number;

  @ApiProperty({ description: "Industry segment ID", example: 191 })
  @IsOptional()
  @IsInt({ message: "Industry segment id must be a number." })
  industrySegmentLid?: number;

  @ApiPropertyOptional({ description: "Group company lid", example: 48 })
  @IsOptional()
  @IsInt({ message: "Group company Lid must be a number." })
  groupCompanyLid?: number;

  @IsOptional()
  existingBrokerName?: string;

  @IsOptional()
  insurerName?: string;

  @IsOptional()
  tpaName?: string;

  @ApiPropertyOptional({
    description: "Number of employees",
    example: 500,
  })
  @IsOptional()
  @IsInt({ message: "Number of employees must be a valid number." })
  @Min(0, { message: "Number of employees must be a positive number." })
  noOfEmployees?: number;

  @ApiPropertyOptional({
    description: "Date of incorporation",
    example: "2020-01-15",
  })
  @IsOptional()
  @IsString({ message: "Date of incorporation must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of incorporation must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of the day
    if (date >= today) {
      throw new BadRequestException(
        "The date of incorporation cannot be today or a future date. Please provide a valid past date."
      );
    }
    return value;
  })
  dateOfIncorporation?: string;

  @ApiPropertyOptional({
    description: "PAN card number",
    example: "ABCDE1234F",
  })
  @IsOptional()
  @IsString({ message: "PAN card number must be a string." })
  panCardNumber?: string;

  @ApiPropertyOptional({
    description: "Registration number",
    example: "L98765DL1999PLC987654",
  })
  @IsOptional()
  @IsString({ message: "Registration number must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  registrationNo?: string;

  @ApiPropertyOptional({ description: "Annual premium", example: 1000000 })
  @IsOptional()
  @IsNumber({}, { message: "Annual premium must be a valid number." })
  @Min(0, { message: "Annual premium must be a positive number." })
  annualPremium?: number;

  @ApiPropertyOptional({
    description: "TAN number",
    example: "ABCD12345E",
  })
  @IsOptional()
  @IsString({ message: "TAN number must be a string." })
  tanNumber?: string;

  @IsOptional()
  @IsInt({ message: "Company logo file ID must be a number." })
  companyLogoFileId?: number;
  
  @ApiPropertyOptional({
    description: "Website URL",
    example: "https://www.techsolutions.com",
  })
  @IsOptional()
  @IsString({ message: "Website must be a string." })
  @IsUrl({}, { message: "Website must be a valid URL." })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  website?: string;

  @ApiPropertyOptional({
    description: "Remarks",
    example: "Strong potential for growth in the next 5 years.",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 500) {
      throw new BadRequestException(
        "remarks reason must not exceed 500 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  remarks?: string;

  @ApiPropertyOptional({ description: "Source Type", example: 2 })
  @IsOptional()
  @IsInt({ message: "Source type must be a number." })
  sourceTypeLid?: number;

  @ApiPropertyOptional({ description: "Source", example: "Internal" })
  @IsOptional()
  @IsString({ message: "Source must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 100) {
      throw new BadRequestException(
        "source reason must not exceed 100 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  source?: string;

  @ApiPropertyOptional({ description: "Priority ID", example: 1 })
  @IsOptional()
  @IsInt({ message: "Priority ID must be a number." })
  priorityLid?: number;

  @IsOptional()
  @IsInt({ message: "Status ID must be an integer." })
  statusLid?: number;

  @ApiPropertyOptional({ description: "LeadCRM", example: 2 })
  @IsOptional()
  @IsInt({ message: "LeadCRM must be a number." })
  leadCrm?: number;

  @ApiPropertyOptional({ description: "Associate CRM", example: 2 })
  @IsOptional()
  @IsInt({ message: "Associate CRM must be a number." })
  associateCrmId?: number;

  @ApiPropertyOptional({ description: "Account Manager", example: 4 })
  @IsOptional()
  @IsInt({ message: "Account manager must be a number." })
  accountManager?: number;

  @IsOptional()
  @IsInt({ message: "Country id must be a number." })
  countryId?: number;

  @ApiPropertyOptional({
    description: "Sentiment ID",
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "Sentiment id must be a number." })
  sentimentLid?: number;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @ApiPropertyOptional({
    description: "GST details",
    type: [CreateGstDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGstDto)
  gstDetails?: CreateGstDto[];

  @ApiPropertyOptional({
    description: "Group Company Maps",
    type: CreateGroupCompanyMapDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGroupCompanyMapDto)
  groupCompanyMap?: CreateGroupCompanyMapDto;

  @ApiPropertyOptional({
    description: "Company Document Maps",
    type: [CreateCompanyDocMapDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompanyDocMapDto)
  companyDocMaps?: CreateCompanyDocMapDto[];

  @ApiProperty({
    description: "Company Address",
    type: [CreateCompanyAddressDto],
  })
  @IsNotEmpty({ message: "Company address is required." })
  @IsArray({ message: "Company address must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateCompanyAddressDto)
  addresses!: CreateCompanyAddressDto[];

  @ApiPropertyOptional({
    description: "Company Details",
    type: CompanyDetailsDto,
  })
  @IsOptional()
  companyDetails?: CompanyDetailsDto;
}
