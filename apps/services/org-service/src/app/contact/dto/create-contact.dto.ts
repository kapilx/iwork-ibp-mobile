import { Type, Transform } from "class-transformer";
import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  ValidateIf,
  Matches,
  MinLength,
} from "class-validator";
import { CreateAddressDto } from "../../address/dto/create-address.dto";
import { CreateContactDetailsDto } from "./contact-details.dto";
import { CreateProfessionalExperienceDto } from "./professional-experience.dto";
import { CreateQualificationExperienceDto } from "./qualification-experience.dto";
import { CreateContactDocMapDto } from "./contact-document.dto";
import { CreateContactCommunicationDetailsDto } from "./create-contact-communication-details.dto";
import { BadRequestException } from "@nestjs/common";
import { COMPANY_CONTACT_RECORD_TYPE } from "../../../../../../../libs/service-lib/src/lib/constants";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
export class CreateContactDto {
  @IsOptional()
  @IsInt({ message: "Salutation id must be a number." })
  salutationLid?: number;

  @IsNotEmpty({ message: "First name is required." })
  @IsString({ message: "First name must be a string." })
  @MaxLength(100, { message: "First name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  firstName!: string;

  @IsNotEmpty({ message: "Last name is required." })
  @IsString({ message: "Last name must be a string." })
  @MaxLength(100, { message: "Last name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  lastName!: string;

  @IsOptional()
  @IsString({ message: "Middle name must be a string." })
  @MaxLength(100, { message: "Middle name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  middleName?: string;

  @IsString({ message: "Display name must be a string." })
  @MinLength(1, {
    message: "Display name must be at least 1 character long.",
  })
  @MaxLength(100, { message: "Display name must not exceed 100 characters." })
  @IsNotEmpty({ message: "Display name cannot be empty or null if provided." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName!: string;

  @IsNotEmpty({ message: "Company id is required." })
  @IsInt({ message: "Company id must be a number." })
  companyId!: number;

  @IsNotEmpty({ message: "Company Location id is required." })
  @IsInt({ message: "Company Location id must be a number." })
  companyLocationId!: number;

  @IsOptional()
  @IsInt({ message: "Company Branch id must be a number." })
  companyBranchId?: number;

  @IsOptional()
  @IsNotEmpty({ message: "Tag id is required." })
  tagLid?: number;

  @ValidateIf(
    (contact) => contact.contactRecordTypeLid === COMPANY_CONTACT_RECORD_TYPE
  )
  @IsNotEmpty({ message: "Contact type id is required." })
  @IsInt({ message: "Contact type id must be a number." })
  contactTypeLid!: number;

  @IsOptional()
  @IsString({ message: "department must be a string." })
  @MaxLength(100, { message: "department should not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  department?: string;

  @IsOptional()
  @IsString({ message: "designation must be a string." })
  @MaxLength(100, { message: "designation should not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  designation?: string;

  //commented the below code as per the requirement changes -veda - 09/05/2025
  // @IsOptional()
  // @IsInt({ message: "department id must be a number." })
  // departmentId!: string;

  // @IsOptional()
  // @IsInt({ message: "designation id must be a number." })
  // designationId!: number;

  @IsOptional()
  @IsInt({ message: "reporting id must be a number." })
  reportingToId?: number;

  @IsOptional()
  @IsInt({ message: "relationship type id must be a number." })
  relationshipTypeLid?: number;

  @IsOptional()
  @IsString({ message: "Contact remarks must be a string." })
  // @Transform(({ value }: { value: string }) =>  value ? value.trim() : value)
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Contact remarks must not exceed 1000 characters"
      );
    }
    return value;
  })
  @IsString()
  remarks?: string;

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

  @IsOptional()
  @IsInt({ message: "Status ID must be an integer." })
  statusLid?: number;

  @IsOptional()
  @IsString({ message: "LinkedIn URL must be a string." })
  @Matches(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/, {
    message: "Invalid LinkedIn URL format.",
  })
  linkedInUrl?: string;

  @IsNotEmpty({ message: "Contact record type id is required." })
  @IsInt()
  contactRecordTypeLid!: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto[];

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  existingAddressIds?: number[];

  @ValidateNested({ each: false })
  @Type(() => CreateContactDetailsDto)
  @IsOptional()
  contactDetails?: CreateContactDetailsDto;

  @IsArray()
  @ValidateNested({ each: false })
  @Type(() => CreateProfessionalExperienceDto)
  @IsOptional()
  professionalExperiences?: CreateProfessionalExperienceDto[];

  @IsArray()
  @ValidateNested({ each: false })
  @Type(() => CreateQualificationExperienceDto)
  @IsOptional()
  qualificationExperiences?: CreateQualificationExperienceDto[];

  @IsArray()
  @ValidateNested({ each: false })
  @Type(() => CreateContactDocMapDto)
  @IsOptional()
  contactDocMaps?: CreateContactDocMapDto[];

  @IsArray()
  @ValidateNested({ each: false })
  @Type(() => CreateContactCommunicationDetailsDto)
  communicationDetails!: CreateContactCommunicationDetailsDto[];
}
