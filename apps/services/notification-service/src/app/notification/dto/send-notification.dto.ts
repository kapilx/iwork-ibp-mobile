import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: "Event type used to identify notification template",
    example: "USER_CREATED",
  })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiPropertyOptional({
    description: "List of user IDs to whom notification should be sent",
    example: [101, 102, 103],
  })
  @IsArray()
  @IsOptional()
  userId?: number[];

  @ApiPropertyOptional({
    description: "List of email IDs to whom notification should be sent",
    example: ["user1@example.com", "user2@example.com"],
  })
  @IsArray()
  @IsOptional()
  emailId?: string[];

  @ApiPropertyOptional({
    description: "List of CC email IDs to whom notification should be sent",
    example: ["cc1@example.com", "cc2@example.com"],
  })
  @IsArray()
  @IsOptional()
  ccEmailId?: string[];

  @ApiPropertyOptional({
    description: "List of phone numbers to whom notification should be sent",
    example: ["9876543210", "9123456789"],
  })
  @IsArray()
  @IsOptional()
  phoneNumber?: string[];

  @ApiProperty({
    description: "Notification channel",
    example: "EMAIL",
  })
  @IsString()
  @IsNotEmpty()
  channel!: string;

  @ApiProperty({
    description: "Dynamic parameters required for notification template",
    example: {
      userName: "John Doe",
      policyNumber: "POL123456",
    },
  })
  @IsObject()
  parameters!: Record<string, any>;

  @ApiPropertyOptional({
    description: "Additional user IDs to include in notification",
    example: [201, 202],
  })
  @IsArray()
  @IsOptional()
  additionalUserId?: number[];

  @IsNumber()
  @IsOptional()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Attachment IDs associated with the notification",
    example: [11, 12, 13],
  })
  @IsArray()
  @IsOptional()
  attachments?: number[];

  @IsBoolean()
  @IsOptional()
  save?: boolean;

  @ApiPropertyOptional({
    description: "When true, attachments are sent as-is without password protection",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  skipPasswordProtection?: boolean;

  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    description:
      "Portal subdomain the notification originated from (e.g. \"teamleasegodigit\"). When provided, company-level CC is resolved from this exact domain's config instead of being unioned across all of the company's domains. Ignored when configId is also provided.",
    example: "teamleasegodigit",
  })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({
    description:
      "company_portal_configuration.id the notification originated from, when the caller already knows it exactly (e.g. decoded straight from the sender's own auth token, as with an authenticated employee-portal action) rather than needing to be guessed from companyId+domain. When provided, this is used directly for the template-override lookup instead of resolveConfigIdForTemplate's companyId+domain guess — the more reliable path whenever it's available.",
    example: 17,
  })
  @IsNumber()
  @IsOptional()
  configId?: number;
}