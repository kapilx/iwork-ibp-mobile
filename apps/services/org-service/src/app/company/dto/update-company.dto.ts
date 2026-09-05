import { BadRequestException } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
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
import { UpdateAddressDto } from "../../address/dto/update-address.dto";
import { CompanyDetailsDto } from "./company-detail.dto";

export class UpdateGstDto {
  // [x: string]: string | number | undefined;
  @IsOptional()
  @IsInt({ message: "GST ID must be a valid number." })
  id?: number;

  @ApiPropertyOptional({ description: "State ID", example: 1 })
  @IsOptional()
  @IsInt({ message: "State ID must be a valid number." })
  stateId?: number;

  @ApiPropertyOptional({
    description: "GST number",
    example: "22ABCDE1234F1Z5",
  })
  @IsOptional()
  @IsString({ message: "GST number must be a string." })
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

export class UpdateGroupCompanyMapDto {
  @IsOptional()
  @IsInt({ message: "Group Company Map ID must be a valid number." })
  id?: number;

  @IsOptional()
  @IsInt({ message: "Company ID must be a valid number." })
  companyId?: number;

  @ApiPropertyOptional({
    description: "Group Company ID",
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: "Group Company ID must be a valid number." })
  groupCompanyId?: number;
}

export class UpdateCompanyDocMapDto {
  @IsOptional()
  @IsInt({ message: "Company Document Map ID must be a valid number." })
  id?: number;

  @IsOptional()
  @IsInt({ message: "Company ID must be a valid number." })
  companyId?: number;

  @ApiPropertyOptional({
    description: "Document ID",
    example: 101,
  })
  @IsOptional()
  @IsInt({ message: "Document ID must be a valid number." })
  documentId?: number;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: "Initial onboarding mail trigger mode",
    example: "manual",
    enum: ["cron", "manual"],
  })
  @IsOptional()
  @IsString({ message: "Initial onboarding mail trigger mode must be a string." })
  @IsIn(["cron", "manual"], {
    message: "Initial onboarding mail trigger mode must be either cron or manual.",
  })
  initialOnboardingMailTriggerMode?: string;

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

  @ApiPropertyOptional({ description: "Company type ID", example: 1 })
  @IsOptional()
  @IsInt({ message: "Company type id must be a number." })
  companyTypeLid?: number;

  @IsOptional()
  @IsInt({ message: "Currency id must be a number." })
  currencyId?: number;

  @ApiPropertyOptional({ description: "Industry segment ID", example: 191 })
  @IsOptional()
  @IsInt({ message: "Industry segment id must be a number." })
  industrySegmentLid?: number;

  @IsOptional()
  @IsInt({ message: "Company logo file ID must be a number." })
  companyLogoFileId?: number;

  @ApiPropertyOptional({ description: "Group company lid", example: 48 })
  @IsOptional()
  @IsInt({ message: "Group company id must be a number." })
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
    if (date > new Date()) {
      throw new BadRequestException(
        "Date of incorporation cannot be a future date."
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

  @ApiPropertyOptional({
    description: "Service Tax",
    example: "ABCD12345E",
  })
  @IsOptional()
  @IsString({ message: "Service Tax must be a string." })
  serviceTax?: string;

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
        "Company remarks must not exceed 500 characters"
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
  @MaxLength(100, { message: "Source must not exceed 100 characters." })
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  source?: string;

  @ApiPropertyOptional({ description: "Priority ID", example: 1 })
  @IsOptional()
  @IsInt({ message: "Priority ID must be a number." })
  priorityLid?: number;

  @IsOptional()
  @IsInt({ message: "Status ID must be a number." })
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

  @ApiPropertyOptional({
    description: "GST details",
    type: [UpdateGstDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGstDto)
  gstDetails?: UpdateGstDto[];

  @ApiPropertyOptional({
    description: "Group Company Maps",
    type: UpdateGroupCompanyMapDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateGroupCompanyMapDto)
  groupCompanyMap?: UpdateGroupCompanyMapDto;

  @ApiPropertyOptional({
    description: "Company Document Maps",
    type: [UpdateCompanyDocMapDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompanyDocMapDto)
  companyDocMaps?: UpdateCompanyDocMapDto[];

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @ApiPropertyOptional({
    description: "Company Address",
    type: [UpdateAddressDto],
  })
  @IsOptional()
  @IsArray({ message: "Company address must be an array." })
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  addresses?: UpdateAddressDto[];

  @ApiPropertyOptional({
    description: "Company Details",
    type: CompanyDetailsDto,
  })
  @IsOptional()
  companyDetails?: CompanyDetailsDto;
}
