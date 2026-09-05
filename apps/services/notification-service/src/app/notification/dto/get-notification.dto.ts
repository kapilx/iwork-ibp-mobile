import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDate, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DEFAULT_VALUES } from "../../../../../service-lib/src/lib/constants";

export class GetNotificationDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Filter by Specific Status.",
    example: "status:NOTIFICATION_READ",
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GetNotificationInfoDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search string to filter notifications.",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort must be a string.",
    example: "id: ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Search by based on the property.",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., createdAt, updatedAt).",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({
    description: "End date for the filter.",
    example: "2023-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({
    description: "Financial year to filter.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Time filter on quarter.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;
}

export class NotificationInfoResponseDto {
  @ApiPropertyOptional({ description: "Notification info ID", example: 1 })
  id: number;

  @ApiPropertyOptional({
    description: "To recipients",
    type: [String],
    example: ["user1@example.com", "user2@example.com"],
  })
  toRecipients: string[];

  @ApiPropertyOptional({
    description: "CC recipients",
    type: [String],
    example: ["cc1@example.com", "cc2@example.com"],
  })
  ccRecipients: string[];

  @ApiPropertyOptional({
    description: "From sender",
    example: "noreply@insurance.com",
    nullable: true,
  })
  fromSender?: string;

  @ApiPropertyOptional({
    description: "Email subject",
    example: "Policy Renewal Reminder",
  })
  subject: string;

    @ApiPropertyOptional({
        description: 'Notification channel type',
        example: 'NOTIFICATION_CHANNEL_EMAIL',
        enum: ['NOTIFICATION_CHANNEL_EMAIL', 'NOTIFICATION_CHANNEL_SMS']
    })
    notificationType: string;

    @ApiPropertyOptional({ 
        description: 'Template ID used',
        example: 123,
        nullable: true
    })
    templateId?: number;

  @ApiPropertyOptional({
    description: "Template variables",
    example: { name: "John Doe", policyNumber: "POL123" },
    nullable: true,
  })
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Rendered HTML content",
    example: "<html><body>Hello John Doe...</body></html>",
    nullable: true,
  })
  renderedHtml?: string;

  @ApiPropertyOptional({
    description: "Email provider used",
    example: "sendgrid",
    nullable: true,
  })
  provider?: string;

  @ApiPropertyOptional({
    description: "Notification status",
    example: "sent",
    enum: ["pending", "sent", "failed", "delivered"],
  })
  status: string;

  @ApiPropertyOptional({
    description: "Provider message ID",
    example: "sg-msg-123456",
    nullable: true,
  })
  providerMessageId?: string;

  @ApiPropertyOptional({
    description: "Error message if failed",
    example: null,
    nullable: true,
  })
  error?: string;

  @ApiPropertyOptional({
    description: "Created at timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: "Created by user ID",
    example: 1,
  })
  createdBy: number;

  @ApiPropertyOptional({
    description: "Sent at timestamp",
    example: "2024-01-15T10:32:00Z",
    nullable: true,
  })
  sentAt?: Date;
}
