import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, ValidateNested, IsArray, IsIn, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO for communication details within contact update
 */
export class CommunicationDetailDto {
  @ApiProperty({ 
    example: "email", 
    description: "Type of communication (email, phone, etc.)" 
  })
  @IsString()
  communicationType: string;

  @ApiProperty({ 
    example: "email@gmail.com", 
    description: "Communication details (email address, phone number, etc.)" 
  })
  @IsString()
  communicationDetails: string;

  @ApiProperty({ 
    example: true, 
    description: "Whether this communication method is primary" 
  })
  @IsBoolean()
  isPrimary: boolean;
}

/**
 * DTO for contact communication details in response
 */
export class ContactCommunicationDetailDto {
  @ApiProperty({ example: 1, description: "Contact ID" })
  contactId: number;

  @ApiProperty({
    example: "email",
    description: "Communication type (e.g., Mobile, Email)",
  })
  communicationType: string;

  @ApiProperty({
    example: "email@gmail.com",
    description: "Communication details (phone number, email, etc.)",
  })
  communicationDetails: string;

  @ApiProperty({ 
    example: true, 
    description: "Whether this communication method is primary" 
  })
  isPrimary: boolean;
}

/**
 * DTO for insurer contact information
 */
export class InsurerContactDto {
  @ApiProperty({ example: 1, description: "Contact ID" })
  contactId: number;

  @ApiProperty({ example: "John Doe", description: "Contact display name" })
  displayName: string;

  @ApiProperty({
    type: [ContactCommunicationDetailDto],
    description: "List of communication details",
  })
  communicationDetails: ContactCommunicationDetailDto[];
}

/**
 * DTO for policy insurer details response
 */
export class PolicyInsurerDetailsDto {
  @ApiProperty({ example: 1, description: "Policy ID" })
  policyId: number;

  @ApiProperty({ example: 1, description: "Insurer ID" })
  insurerId: number;

  @ApiProperty({
    example: "ABC Insurance Company",
    description: "Insurer name",
  })
  insurerName: string;

  @ApiProperty({
    example: "ABC Insurance",
    description: "Insurer display name",
  })
  insurerDisplayName: string;

  @ApiProperty({
    type: [InsurerContactDto],
    description: "List of insurer contacts",
  })
  contacts: InsurerContactDto[];
}

/**
 * DTO for policy insurer details list response
 */
export class PolicyInsurerDetailsResponseDto {
  @ApiProperty({
    type: [PolicyInsurerDetailsDto],
    description: "List of insurers for the policy",
  })
  data: PolicyInsurerDetailsDto[];

  @ApiProperty({ example: 1, description: "Total count of insurers" })
  count: number;
}

/**
 * DTO for policy company contact details response
 */
export class PolicyCompanyContactDto {
  @ApiProperty({ example: 1, description: "Policy ID" })
  policyId: number;

  @ApiProperty({ example: 1, description: "Company ID" })
  companyId: number;

  @ApiProperty({ example: 1, description: "Contact ID" })
  contactId: number;

  @ApiProperty({ example: "Jane", description: "Contact first name" })
  firstName: string;

  @ApiProperty({ example: "Smith", description: "Contact last name" })
  lastName: string;

  @ApiProperty({ example: "Jane Smith", description: "Contact display name" })
  displayName: string;

  @ApiProperty({ example: "Human Resources", description: "Department" })
  department: string;

  @ApiProperty({ example: "HR Manager", description: "Designation" })
  designation: string;

  @ApiProperty({
    type: [ContactCommunicationDetailDto],
    description: "List of communication details",
  })
  communicationDetails: ContactCommunicationDetailDto[];
}

/**
 * DTO for policy company contacts list response
 */
export class PolicyCompanyContactsResponseDto {
  @ApiProperty({
    type: [PolicyCompanyContactDto],
    description: "List of company contacts for the policy",
  })
  data: PolicyCompanyContactDto[];

  @ApiProperty({ example: 1, description: "Total count of company contacts" })
  count: number;
}

/**
 * DTO for contact data in PUT/POST requests
 */
export class UpdateContactDto {
  @IsOptional()
  @ApiProperty({ example: "contactId", description: "Contact existing Id" })
  @IsNumber()
  contactId?: number;

  @ApiProperty({ example: "John", description: "First name" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe", description: "Last name" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "John Doe", description: "Display name" })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 329192, description: "Company ID (or Insurer ID for insurer contacts)" })
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 441, description: "Company Location ID" })
  @IsNumber()
  companyLocationId: number;

  @ApiProperty({ example: null, description: "Company Branch ID", nullable: true })
  @IsOptional()
  @IsNumber()
  companyBranchId?: number;

  @ApiProperty({ example: 1501, description: "Contact Type LID" })
  @IsNumber()
  contactTypeLid: number;

  @ApiProperty({ example: "HR", description: "Department" })
  @IsString()
  department: string;

  @ApiProperty({ example: "Manager", description: "Designation" })
  @IsString()
  designation: string;

  @ApiProperty({ 
    type: [CommunicationDetailDto], 
    description: "Array of communication details" 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunicationDetailDto)
  communicationDetails: CommunicationDetailDto[];

  @ApiProperty({ example: 1202, description: "Contact Record Type LID" })
  @IsNumber()
  @IsOptional()
  contactRecordTypeLid?: number;

  @ApiProperty({ example: null, description: "Status LID", nullable: true })
  @IsOptional()
  @IsNumber()
  statusLid?: number;
}

/**
 * DTO for creating policy contacts
 */
export class CreatePolicyContactsDto {
  @ApiProperty({ 
    example: "insurers", 
    description: "Type of contacts to create",
    enum: ["insurers", "company"]
  })
  @IsString()
  @IsIn(["insurers", "company"])
  contactDetails: "insurers" | "company";

  @ApiProperty({ 
    type: [UpdateContactDto], 
    description: "Array of contacts to create" 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts: UpdateContactDto[];
}

/**
 * DTO for updating policy contacts
 */
export class UpdatePolicyContactsDto {
  @ApiProperty({ 
    example: "insurers", 
    description: "Type of contacts to update",
    enum: ["insurers", "company"]
  })
  @IsString()
  @IsIn(["insurers", "company"])
  contactDetails: "insurers" | "company";

  @ApiProperty({ 
    type: [UpdateContactDto], 
    description: "Array of contacts to create/update" 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts: UpdateContactDto[];
}