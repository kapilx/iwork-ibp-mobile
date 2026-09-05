import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class CreateTemplateDto {
  @ApiProperty({
    description: "Channel type ID for the template (Email, SMS, WhatsApp)",
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  channelTypeId!: number;

  @ApiPropertyOptional({
    description: "Event type ID for the template",
    example: 1,
    nullable: true,
  })
  @IsOptional()
  eventTypeId?: number;

  @ApiPropertyOptional({
    description: "Template subject (optional for most channels, recommended for email)",
    example: "Your Insurance Policy Renewal Notice",
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  subject?: string;

  @ApiProperty({
    description: "Template body content with variable placeholders",
    example: "Dear {{customerName}}, your policy {{policyNumber}} is due for renewal on {{renewalDate}}.",
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    description: "Organization/Company ID (required for custom templates)",
    example: 101,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({
    description: "User ID who created the template",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  createdBy?: number;

  @ApiPropertyOptional({
    description: "Whether template is active and can be used",
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}