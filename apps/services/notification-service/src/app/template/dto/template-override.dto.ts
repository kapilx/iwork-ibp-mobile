import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

// "Customise Email Templates" tab (company Portal Configuration screen) —
// see docs/IBP-Email-Notification-Company-Templates/TRD.md.

export class SaveTemplateOverrideDto {
  @ApiProperty({
    description: "company_portal_configuration.id this override applies to",
    example: 12,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  configId!: number;

  @ApiProperty({
    description: "Overridden subject for this config",
    example: "Welcome to {{companyName}}'s Insurance Portal",
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    description: "Overridden body for this config",
    example: "Dear {{employeeName}}, welcome aboard...",
  })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

// Company-wide override — for iwork/internal-CRM event types with no domain
// concept at all (see company_id on the entity). Same idea as
// SaveTemplateOverrideDto, scoped by companyId instead of configId.
export class SaveCompanyTemplateOverrideDto {
  @ApiProperty({
    description: "company.id this override applies to",
    example: 190550,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  companyId!: number;

  @ApiProperty({
    description: "Overridden subject for this company",
    example: "New Opportunity Created for {{companyName}}",
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    description: "Overridden body for this company",
    example: "An opportunity has been created...",
  })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class EffectiveTemplateResponseDto {
  @ApiProperty({ description: "Event type ID", example: 5 })
  eventTypeId!: number;

  @ApiProperty({ description: "Event type name", example: "Enrollment_Confirmation_Email" })
  eventTypeName!: string;

  @ApiPropertyOptional({ description: "Event type description" })
  eventTypeDescription?: string;

  @ApiProperty({ description: "Channel type ID", example: 1 })
  channelTypeId!: number;

  @ApiProperty({ description: "The default (config_id IS NULL) template's ID — pass this to the override endpoints", example: 53 })
  defaultTemplateId!: number;

  @ApiProperty({ description: "True if the requested config has its own override for this event type", example: false })
  isOverride!: boolean;

  @ApiPropertyOptional({ description: "The override row's own ID, present only when isOverride is true" })
  overrideTemplateId?: number;

  @ApiProperty({ description: "Effective subject — override's if isOverride, else the default's" })
  subject!: string;

  @ApiProperty({ description: "Effective body — override's if isOverride, else the default's" })
  body!: string;

  @ApiProperty({ description: "Whether the effective row is active — false means recipients are not receiving this email" })
  isActive!: boolean;
}

export class TemplateOverrideSummaryResponseDto {
  @ApiProperty({ description: "company_portal_configuration.id this override belongs to", example: 12 })
  configId!: number;

  @ApiPropertyOptional({ description: "The company this configId belongs to", example: 190550 })
  companyId?: number | null;

  @ApiPropertyOptional({ description: "Company display name, resolved via ConfigCompany.company", example: "TEAMLEASE SERVICES LIMITED" })
  companyName?: string | null;

  @ApiPropertyOptional({ description: "The domain this override applies to", example: "teamleasesbi" })
  subDomain?: string | null;

  @ApiProperty({ description: "This override's own subject line" })
  subject!: string;

  @ApiProperty({ description: "When this override was last saved" })
  updatedAt!: Date;

  @ApiProperty({ description: "Whether this override is currently active — false means this company/domain isn't receiving this email" })
  isActive!: boolean;
}

export class TemplateCompanyOverrideSummaryResponseDto {
  @ApiProperty({ description: "company.id this override belongs to", example: 190550 })
  companyId!: number;

  @ApiPropertyOptional({ description: "Company display name", example: "TEAMLEASE SERVICES LIMITED" })
  companyName?: string | null;

  @ApiProperty({ description: "This override's own subject line" })
  subject!: string;

  @ApiProperty({ description: "When this override was last saved" })
  updatedAt!: Date;

  @ApiProperty({ description: "Whether this override is currently active — false means this company isn't receiving this email" })
  isActive!: boolean;
}

export class TemplateChangeLogEntryResponseDto {
  @ApiProperty({
    description: "What kind of change this is",
    enum: ["CREATED_OVERRIDE", "UPDATED_OVERRIDE", "UPDATED_DEFAULT", "DELETED_OVERRIDE"],
  })
  action!: string;

  @ApiPropertyOptional() oldSubject?: string | null;
  @ApiPropertyOptional() oldBody?: string | null;
  @ApiPropertyOptional() newSubject?: string | null;
  @ApiPropertyOptional() newBody?: string | null;

  @ApiProperty({ description: "User ID who made the change" })
  changedBy!: number;

  @ApiPropertyOptional({ description: "Resolved display name of changedBy, when available" })
  changedByName?: string;

  @ApiProperty({ description: "When the change was made" })
  changedAt!: Date;
}
