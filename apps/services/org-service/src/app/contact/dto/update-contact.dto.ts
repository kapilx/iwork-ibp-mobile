import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  MaxLength,
  Matches,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { UpdateAddressDto } from "../../address/dto/update-address.dto";
import { UpdateContactDetailsDto } from "./update-contact-details.dto";
import { UpdateProfessionalExperienceDto } from "./update-professional-experience.dto";
import { UpdateQualificationExperienceDto } from "./update-qualification-experience.dto";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { UpdateContactCommunicationDetailsDto } from "./update-contact-communication-details.dto";
import { UpdateDocumentDto } from "./update-document.dto.ts";
import { BadRequestException } from "@nestjs/common";
export class UpdateContactDto {
  @ApiProperty({ description: "Salutation ID of the contact", required: false })
  @IsOptional()
  @IsInt()
  salutationLid?: number;

  @ApiProperty({ description: "First name of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "First name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  firstName?: string;

  @ApiProperty({ description: "Last name of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Last name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ description: "Middle name of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Middle name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  middleName?: string;

  @ApiProperty({ description: "Display name of the contact", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Display name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName?: string;

  @ApiProperty({
    description: "Company ID associated with the contact",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Company id must be a number." })
  companyId?: number;

  @ApiProperty({ description: "Company location ID", required: false })
  @IsOptional()
  @IsInt({ message: "Company Location id must be a number." })
  companyLocationId?: number;

  @ApiProperty({ description: "Relationship Type ID", required: false })
  @IsOptional()
  @IsInt({ message: "Relationship type id must be a number." })
  relationshipTypeLid?: number;

  @ApiProperty({ description: "Company branch ID", required: false })
  @IsOptional()
  @IsInt({ message: "Company Branch id must be a number." })
  companyBranchId?: number;

  @ApiProperty({
    description: "Tag ID associated with the contact",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Tag id must be a number." })
  tagLid?: number;

  @ApiProperty({ description: "Contact type ID", required: false })
  @IsOptional()
  @IsInt({ message: "Contact type id must be a number." })
  contactTypeLid?: number;

  @ApiProperty({ description: "Department of the contact", required: false })
  @IsOptional()
  @IsString({ message: "department must be a string." })
  @MaxLength(100, { message: "department should not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  department?: string;

  @ApiProperty({
    description: "Designation of the contact",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "department must be a string." })
  @MaxLength(100, { message: "department should not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  designation?: string;

  //commented the below code as per the requirement changes -veda - 09/05/2025
  // @ApiProperty({ description: "Department ID of the contact", required: false })
  // @IsOptional()
  // @IsInt({ message: "department id must be a number." })
  // departmentId?: number;

  // @ApiProperty({
  //   description: "Designation ID of the contact",
  //   required: false,
  // })
  // @IsOptional()
  // @IsInt({ message: "designation id must be a number." })
  // designationId?: number;

  @ApiProperty({ description: "Reporting to ID", required: false })
  @IsOptional()
  @IsInt({ message: "reporting id must be a number." })
  reportingToId?: number;

  @ApiProperty({ description: "Remarks about the contact", required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Contact remarks must not exceed 1000 characters "
      );
    }
    return value;
  })
  remarks?: string;

  @ApiProperty({ description: "Contact LinkedIn URL", required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @Matches(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/, {
    message: "Invalid LinkedIn URL format.",
  })
  linkedInUrl?: string;

  @ApiProperty({ description: "Updated by", required: false })
  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @ApiProperty({ description: "Updated at", required: false })
  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @IsOptional()
  @IsInt({ message: "Status ID must be an integer." })
  statusLid?: number;

  @ApiProperty({
    description: "List of addresses associated with the contact",
    type: [UpdateAddressDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto[];

  @ApiProperty({
    description: "Contact details associated with the contact",
    type: UpdateContactDetailsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactDetailsDto)
  contactDetails?: UpdateContactDetailsDto;

  @ApiProperty({
    description: "List of professional experiences associated with the contact",
    type: [UpdateProfessionalExperienceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProfessionalExperienceDto)
  professionalExperiences?: UpdateProfessionalExperienceDto[];

  @ApiProperty({
    description:
      "List of qualification experiences associated with the contact",
    type: [UpdateQualificationExperienceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQualificationExperienceDto)
  qualificationExperiences?: UpdateQualificationExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContactCommunicationDetailsDto)
  communicationDetails?: UpdateContactCommunicationDetailsDto[];
  @ApiProperty({
    description: "List of documents associated with the contact",
    type: [UpdateDocumentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentDto)
  contactDocMaps?: UpdateDocumentDto[];
}
