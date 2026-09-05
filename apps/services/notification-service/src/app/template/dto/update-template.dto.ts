import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";
import { ApprovalStatusEnum } from "../../../../../service-lib/src/lib/constants";

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: "Channel type ID for the template (Email, SMS, WhatsApp)",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  channelTypeId?: number;

  @ApiPropertyOptional({
    description:
      "Event type ID for the template (pass null to remove assignment)",
    example: 1,
    nullable: true,
  })
  @IsOptional()
  eventTypeId?: number | null;

  @ApiPropertyOptional({
    description: "Template subject (optional for most channels, recommended for email)",
    example: "Updated Insurance Policy Renewal Notice",
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  subject?: string;

  @ApiPropertyOptional({
    description: "Template body content with variable placeholders (required)",
    example: "Dear {{customerName}}, your updated policy {{policyNumber}} information.",
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({

    description: "Organization/Company ID",
    example: 101,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({
    description: "User ID who updated the template",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  updatedBy?: number;

  @ApiPropertyOptional({
    description: "Whether template is active and can be used",
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Template approval status",
    example: ApprovalStatusEnum.DRAFT,
    enum: ApprovalStatusEnum,
  })
  @IsEnum(ApprovalStatusEnum)
  @IsOptional()
  approvalStatus?: ApprovalStatusEnum;

  @ApiPropertyOptional({
    description: "User ID who submitted the template for approval",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  submittedBy?: number;

  @ApiPropertyOptional({
    description: "Date and time when the template was submitted for approval",
    example: "2024-05-20T10:00:00Z",
  })
  @IsOptional()
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: "User ID of the reviewer who approved or rejected the template",
    example: 2,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  reviewedBy?: number;

  @ApiPropertyOptional({
    description: "Date and time when the template was reviewed",
    example: "2024-05-21T10:00:00Z",
  })
  @IsOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional({
    description: "Comments provided by the reviewer upon approval",
    example: "Template is good and follows branding guidelines.",
  })
  @IsString()
  @IsOptional()
  approvalComments?: string;

  @ApiPropertyOptional({
    description: "Comments provided by the reviewer upon rejection",
    example: "Template content is missing required placeholders.",
  })
  @IsString()
  @IsOptional()
  rejectionComments?: string;
}