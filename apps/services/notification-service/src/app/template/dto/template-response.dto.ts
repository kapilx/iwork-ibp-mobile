import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApprovalStatusEnum } from '../../../../../service-lib/src/lib/constants';

export class TemplateVariable {
  @ApiProperty({
    description: "Variable name",
    example: "firstName",
  })
  name!: string;

  @ApiProperty({
    description: "Variable description",
    example: "User's first name",
  })
  description!: string;

  @ApiProperty({
    description: "Variable data type",
    example: "string",
  })
  dataType!: string;

  @ApiProperty({
    description: "Example value for the variable",
    example: "John",
  })
  example!: string;
}

export class TemplateResponseDto {
  @ApiProperty({
    description: "Template ID",
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: "Event type ID",
    example: 1,
  })
  eventTypeId!: number;

  @ApiProperty({
    description: "Channel type ID",
    example: 1,
  })
  channelTypeId!: number;

  @ApiPropertyOptional({
    description: "Template subject",
    example: "Welcome to Insurance Wellness Hub",
  })
  subject?: string;

  @ApiProperty({
    description: "Template body content",
    example: "Hello {{firstName}}, welcome to our platform!",
  })
  body!: string;

  @ApiProperty({
    description: "Template variables",
    type: [TemplateVariable],
  })
  variables!: TemplateVariable[];

  @ApiProperty({
    description: "Approval status",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.APPROVED,
  })
  approvalStatus!: ApprovalStatusEnum;

  @ApiProperty({
    description: "Template status",
    example: "active",
  })
  status!: string;

  @ApiPropertyOptional({
    description: "Organization ID",
    example: 101,
  })
  organizationId?: number;

  @ApiProperty({
    description: "Created by user ID",
    example: 1,
  })
  createdBy!: number;

  @ApiProperty({
    description: "Updated by user ID",
    example: 1,
  })
  updatedBy!: number;

  @ApiPropertyOptional({
    description: "Created by user full name",
    example: "John Doe",
  })
  createdByName?: string;

  @ApiPropertyOptional({
    description: "Updated by user full name",
    example: "Jane Smith",
  })
  updatedByName?: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt!: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description:
      "True iff this template's event type is company/domain-facing (the IBP allow-list) — " +
      "drives whether Template Management's row-level 'Customise for a Company/Domain' action " +
      "is shown for it.",
    example: true,
  })
  isCompanyCustomizable?: boolean;

  @ApiPropertyOptional({
    description:
      "True iff this template's event type is NOT in the IBP allow-list (iwork/internal-CRM " +
      "event types, no domain concept) AND this is a genuine default row — drives whether " +
      "Template Management's 'Customise for a Company' (company-wide, not domain-scoped) " +
      "action is shown for it. Mutually exclusive with isCompanyCustomizable.",
    example: false,
  })
  isCompanyLevelCustomizable?: boolean;

  @ApiPropertyOptional({
    description:
      "company_portal_configuration.id this row is scoped to — null for the shared default, " +
      "set for a company/domain's own override. Template Management's flat list returns both " +
      "kinds of row with no other way to tell them apart.",
    example: null,
    nullable: true,
  })
  configId?: number | null;

  @ApiPropertyOptional({
    description:
      "Only present when this row IS an override (configId is set) — the TRUE default row's " +
      "own id for the same event type/channel, needed to link to it via routes keyed by the " +
      "default's id (e.g. the Customise screens) even when displaying this override's content.",
    example: 34,
  })
  canonicalDefaultTemplateId?: number;

  @ApiPropertyOptional({
    description: "Only present when this row IS an override — the company this configId belongs to.",
    example: 190550,
    nullable: true,
  })
  companyId?: number | null;

  @ApiPropertyOptional({
    description: "Only present when this row IS an override — the company's display name.",
    example: "TEAMLEASE SERVICES LIMITED",
    nullable: true,
  })
  companyName?: string | null;

  @ApiPropertyOptional({
    description: "Only present when this row IS an override — the domain this customization applies to.",
    example: "teamleasesbi",
    nullable: true,
  })
  overrideSubDomain?: string | null;

  @ApiPropertyOptional({
    description:
      "company.id this row is DIRECTLY scoped to (company-wide override, iwork/internal-CRM event " +
      "types) — null for the shared default and for config-scoped (domain) overrides. Distinct from " +
      "companyId above, which is the company a CONFIG belongs to, not this row's own scope.",
    example: 190550,
    nullable: true,
  })
  companyOverrideId?: number | null;

  @ApiPropertyOptional({
    description: "Only present when this row IS a company-wide override — the company's display name.",
    example: "ACME CORP",
    nullable: true,
  })
  companyOverrideCompanyName?: string | null;
}

export class PaginatedTemplateResponseDto {
  @ApiProperty({
    description: "List of templates",
    type: [TemplateResponseDto],
  })
  templates!: TemplateResponseDto[];

  @ApiProperty({
    description: "Total number of templates",
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "Number of records per page",
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 10,
  })
  totalPages!: number;
}