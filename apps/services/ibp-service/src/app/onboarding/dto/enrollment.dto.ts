import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SendInitialOnboardingDto {
    @ApiProperty({ description: 'Employee ID', example: 1 })
    @IsOptional()
    @IsNumber()
    employeeId: number;

    @ApiProperty({ description: 'Policy ID', example: 1 })
    @IsOptional()
    @IsNumber()
    policyId: number;

    @ApiProperty({
      description: "Policy IDs",
      example: [1, 2, 3],
      required: false,
      type: [Number],
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    policyIds?: number[];

    @ApiProperty({ description: 'Company authentication config ID', example: 1 })
    @IsOptional()
    @IsNumber()
    companyAuthConfigId: number;

    @ApiProperty({ description: 'Is this an endorsement update', example: false, required: false })
    @IsOptional()
    @IsBoolean()
    isEndorsement?: boolean;

    @ApiProperty({
      description: 'When true, forces the notification to go via email only, skipping SMS regardless of the company auth method routing. Used by the single-employee test-trigger.',
      example: false,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    emailOnly?: boolean;
}

export class SendEnrollmentStartDto {
  @ApiProperty({
    description: "Trigger date",
    example: "2024-07-01",
    required: false,
  })
  @IsOptional()
  triggerDate?: string;

  @ApiProperty({
    description: "Range in days",
    example: 10,
    required: false,
  })
  @IsOptional()
  range?: number;

  @ApiProperty({
    description: "List of company IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  companies?: number[];

  @ApiProperty({
    description: "List of policy IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  policies?: number[];

  @ApiProperty({
    description: "List of employee IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  employees?: number[];

  @ApiProperty({
    description: "Include all employees flag",
    example: true,
    required: false,
  })
  @IsOptional()
  includeAllEmployees?: boolean = true;
}

export class SendEnrollmentReminderDto {
  @ApiProperty({
    description: "Trigger date (current date if not provided)",
    example: "2026-01-31",
    required: false,
  })
  @IsOptional()
  triggerDate?: string;

  @ApiProperty({
    description: "Specific days before enrollment end date to trigger reminders (default: [7, 3, 2, 1])",
    example: [7, 3, 2, 1],
    required: false,
  })
  @IsOptional()
  reminderDays?: number[];

  @ApiProperty({
    description: "List of company IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  companies?: number[];

  @ApiProperty({
    description: "List of policy IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  policies?: number[];

  @ApiProperty({
    description: "List of employee IDs",
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  employees?: number[];

  @ApiProperty({
    description: "Include all employees flag",
    example: true,
    required: false,
  })
  @IsOptional()
  includeAllEmployees?: boolean = true;

  @ApiProperty({
    description: "Skip date-window check and send immediately to all non-enrolled employees (manual trigger)",
    example: true,
    required: false,
  })
  @IsOptional()
  forceImmediate?: boolean;
}

export class SendEnrollmentConfirmationDto {
    @ApiProperty({ description: 'Array of Policy IDs', example: [1, 2, 3], type: [Number] })
    @IsNotEmpty()
    @IsArray()
    @IsNumber({}, { each: true })
    policyIds: number[];

    @ApiProperty({ description: 'Employee ID', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    employeeId: number;

    @ApiProperty({
      description:
        "When true, uses the same template but allows subject to render an auto-submit variant.",
      example: false,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    isAutoSubmit?: boolean;
    @ApiProperty({ description: 'Submission reference number', required: false })
    @IsOptional()
    referenceNumber?: string;

    @ApiProperty({ description: 'Submission counter for the employee', required: false })
    @IsOptional()
    @IsNumber()
    submissionCount?: number;

    @ApiProperty({
      description:
        'Override the notification event type (e.g. for the bulk-send variant, which uses its own template). Defaults to the standard enrollment confirmation email event type.',
      required: false,
    })
    @IsOptional()
    @IsString()
    emailEventType?: string;
}

export class LifeEventChangedDependentDto {
    @ApiProperty({ description: 'Dependent name', example: 'Jane Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Dependent relation', example: 'Spouse', required: false })
    @IsOptional()
    @IsString()
    relation?: string;

    @ApiProperty({ description: 'Dependent gender', example: 'Female', required: false })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiProperty({ description: 'Dependent date of birth', example: '1994-01-01', required: false })
    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @ApiProperty({ description: 'Life event action', example: 'ADD', required: false })
    @IsOptional()
    @IsString()
    action?: 'ADD' | 'DELETE' | string;
}

export class SendLifeEventConfirmationDto {
    @ApiProperty({ description: 'Array of affected policy IDs', example: [1, 2], type: [Number] })
    @IsNotEmpty()
    @IsArray()
    @IsNumber({}, { each: true })
    policyIds: number[];

    @ApiProperty({ description: 'Employee ID', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    employeeId: number;

    @ApiProperty({ description: 'Company ID', example: 101, required: false })
    @IsOptional()
    @IsNumber()
    companyId?: number;

    @ApiProperty({ description: 'Life event flow type', example: 'addition' })
    @IsString()
    @IsNotEmpty()
    flowType: 'addition' | 'deletion' | string;

    @ApiProperty({ description: 'Life event type/key', example: 'marriage', required: false })
    @IsOptional()
    @IsString()
    lifeEventType?: string;

    @ApiProperty({ description: 'Life event display title', example: 'Marriage', required: false })
    @IsOptional()
    @IsString()
    lifeEventTitle?: string;

    @ApiProperty({ description: 'Dependents added or deleted in this request', type: [LifeEventChangedDependentDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LifeEventChangedDependentDto)
    changedDependents?: LifeEventChangedDependentDto[];

    @ApiProperty({ description: 'Submission reference number', required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty({ description: 'Submission counter for the employee', required: false })
    @IsOptional()
    @IsNumber()
    submissionCount?: number;
}

export class AddedDependentDetailDto {
    @ApiProperty({ description: 'Dependent name', example: 'Jane Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Dependent relation', example: 'Spouse', required: false })
    @IsOptional()
    @IsString()
    relation?: string;
}

export class SendAddedDependentsNotificationDto {
    @ApiProperty({ description: 'Employee ID', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    employeeId: number;

    @ApiProperty({ description: 'Company ID', example: 101, required: false })
    @IsOptional()
    @IsNumber()
    companyId?: number;

    @ApiProperty({ description: 'Dependents saved in this request', type: [AddedDependentDetailDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddedDependentDetailDto)
    dependents: AddedDependentDetailDto[];

    @ApiProperty({ description: 'Enrollment window start date, if known', required: false })
    @IsOptional()
    enrollmentStartDate?: string | Date;

    @ApiProperty({ description: 'Enrollment window end date, if known', required: false })
    @IsOptional()
    enrollmentEndDate?: string | Date;
}

export class OnboardingResponseDto {
    @ApiProperty({ description: 'Success message', example: 'Notification sent successfully' })
    message: string;

    @ApiProperty({ description: 'Success status', example: true })
    success: boolean;

    @ApiProperty({ description: 'Total policies processed', example: 3 })
    totalPolicies?: number;

    @ApiProperty({ description: 'Successful notifications sent', example: 2 })
    successCount?: number;

    @ApiProperty({ description: 'Failed notifications', example: 1 })
    failedCount?: number;

    @ApiProperty({ 
        description: 'Details of each policy notification',
        type: 'array',
        example: [
            { policyId: 1, status: 'success', message: 'Notification sent successfully' },
            { policyId: 2, status: 'failed', message: 'Email not found' }
        ]
    })
    details?: Array<{ policyId: number; status: string; message: string }>;
}

export class TriggerCompanyInitialOnboardingDto {
    @ApiProperty({ description: "Company ID", example: 101 })
    @IsNotEmpty()
    @IsNumber()
    companyId: number;

    @ApiPropertyOptional({
        description:
            "Subdomain of the portal being triggered. When provided, only employees enrolled in policies scoped to this domain are notified.",
        example: "teamleasegodigit",
    })
    @IsOptional()
    @IsString()
    subDomain?: string;
}


export class TriggerTestInitialOnboardingDto {
    @ApiProperty({ description: "Company ID", example: 101 })
    @IsNotEmpty()
    @IsNumber()
    companyId: number;

    @ApiProperty({ description: "Employee email to test-send the onboarding mail to", example: "employee@example.com" })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        description:
            "Subdomain of the portal being tested. When provided, the employee must be enrolled in a policy scoped to this domain.",
        example: "teamleasegodigit",
    })
    @IsOptional()
    @IsString()
    subDomain?: string;
}

export class SendBulkEnrollmentConfirmationDto {
    @ApiProperty({ description: 'Company ID', example: 101 })
    @IsNotEmpty()
    @IsNumber()
    companyId: number;

    @ApiProperty({
        description: 'Optional list of specific employee IDs to send emails to. If not provided, sends to all enrolled employees.',
        example: [203461, 203462],
        required: false,
        type: [Number]
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    employeeIds?: number[];

    @ApiPropertyOptional({
        description:
            "Subdomain of the portal being triggered. When provided, only employees enrolled in policies scoped to this domain are notified.",
        example: "teamleasegodigit",
    })
    @IsOptional()
    @IsString()
    subDomain?: string;
}

export class TriggerTestEnrollmentConfirmationDto {
    @ApiProperty({ description: "Company ID", example: 101 })
    @IsNotEmpty()
    @IsNumber()
    companyId: number;

    @ApiProperty({ description: "Employee email to test-send the enrollment confirmation mail to", example: "employee@example.com" })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        description:
            "Subdomain of the portal being tested. When provided, the employee must be enrolled in a policy scoped to this domain.",
        example: "teamleasegodigit",
    })
    @IsOptional()
    @IsString()
    subDomain?: string;
}

export class SendApologyWelcomeEmailDto {
    @ApiProperty({
        description: 'Employee IDs to send the apology email to',
        example: [203461, 203462],
        type: [Number],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    employeeIds: number[];
}
