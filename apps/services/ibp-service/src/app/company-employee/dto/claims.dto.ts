import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ClaimDocumentMetaDto {
    @ApiProperty({ description: 'Uploaded file ID', example: 351306 })
    @Type(() => Number)
    @IsNumber()
    documentId: number;

    @ApiProperty({ description: 'Document type key', example: 'DISCHARGE_SUMMARY' })
    @IsString()
    documentType: string;
}

export class IntimateClaimDto {
    @ApiProperty({ description: 'Policy ID', example: 123 })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    policyId: number;

    @ApiProperty({ description: 'Employee ID', example: 456 })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    employeeId: number;

    @ApiProperty({ 
        description: 'Dependent ID (optional - if provided, claim is for dependent; if null, claim is for self)', 
        example: 789,
        required: false 
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    dependentId?: number;

    @ApiProperty({ description: 'Diagnosis or claim description', example: 'Fever and viral infection' })
    @IsString()
    @IsNotEmpty()
    diagnosis: string;

    @ApiProperty({ description: 'Estimated claim amount', example: 15000 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    estimatedClaimAmount: number;

    @ApiProperty({
        description: 'Date of admission (YYYY-MM-DD)',
        example: '2026-03-11',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    dateOfAdmission?: string;

    @ApiProperty({
        description: 'Proposed discharge date (YYYY-MM-DD)',
        example: '2026-03-15',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    proposedDischargeDate?: string;

    @ApiProperty({ 
        description: 'Claim type', 
        example: 'CASHLESS',
        enum: ['CASHLESS', 'REIMBURSEMENT'],
        required: false,
    })
    @IsOptional()
    @IsString()
    claimType?: string;

    @ApiProperty({
        description: 'Hospital location (accepted but not used in claim payload)',
        example: 'Hyderabad',
        required: false,
    })
    @IsOptional()
    @IsString()
    hospitalLocation?: string;

    @ApiProperty({
        description: 'Place of accident'
    })
    @IsOptional()
    @IsString()
    placeOfAccident?:string;

    @ApiProperty({
        description: 'Hospital name (accepted but not used in claim payload)',
        example: 'Apollo Hospital',
        required: false,
    })
    @IsOptional()
    @IsString()
    hospitalName?: string;

    @ApiProperty({
        description: 'Hospital ID (master hospital id). If provided, server will resolve hospital name/location from master.',
        example: 101,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    hospitalId?: number;

    @ApiProperty({
        description: 'Uploaded supporting documents with type metadata',
        required: false,
        type: [ClaimDocumentMetaDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ClaimDocumentMetaDto)
    documentIds?: ClaimDocumentMetaDto[];

    @ApiProperty({
        description: 'Benefit type (e.g. IPD/OPD) — required by some TPAs at intimation (e.g. Health India)',
        example: 'IPD',
        required: false,
    })
    @IsOptional()
    @IsString()
    benefitType?: string;

    @ApiProperty({
        description: 'TPA-specific fields not covered by the canonical fields above — populated from GET /claims/extra-fields/:policyId?apiType=INTIMATE_CLAIM, keyed by externalFieldName',
        required: false,
    })
    @IsOptional()
    extraFields?: Record<string, any>;
}

export class SubmitClaimDto {
    @ApiProperty({ description: 'Date of discharge (YYYY-MM-DD)', example: '2026-03-15', required: false })
    @IsOptional()
    @IsDateString()
    dateOfDischarge?: string;

    @ApiProperty({ description: 'Final claimed amount', example: 15000, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    finalClaimedAmount?: number;

    @ApiProperty({ description: 'Payee name for reimbursement (bank account holder)', required: false })
    @IsOptional()
    @IsString()
    payeeName?: string;

    @ApiProperty({ description: 'Bank account number for reimbursement', required: false })
    @IsOptional()
    @IsString()
    bankAccountNo?: string;

    @ApiProperty({ description: 'Bank account type (e.g. Savings, Current)', required: false })
    @IsOptional()
    @IsString()
    accountType?: string;

    @ApiProperty({ description: 'Bank IFSC code', required: false })
    @IsOptional()
    @IsString()
    ifscCode?: string;

    @ApiProperty({
        description: 'Uploaded bill/supporting documents with type metadata',
        type: [ClaimDocumentMetaDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ClaimDocumentMetaDto)
    documentIds!: ClaimDocumentMetaDto[];

    @ApiProperty({
        description: 'TPA-specific fields not covered by the canonical fields above — populated from GET /claims/extra-fields/:policyId?apiType=SUBMIT_CLAIM, keyed by externalFieldName',
        required: false,
    })
    @IsOptional()
    extraFields?: Record<string, any>;
}

export class SubmitClaimResponseDto {
    @ApiProperty({ description: 'Success status', example: true })
    success: boolean;

    @ApiProperty({ description: 'Claim ID', example: 1001 })
    claimId: number;

    @ApiProperty({ description: 'Claim status after submission', example: 'PENDING' })
    claimStatus: string;

    @ApiProperty({ description: 'Response message', example: 'Claim submitted successfully' })
    message: string;

    @ApiProperty({
        description: 'Per-document submission results (only populated for PER_DOCUMENT execution mode)',
        required: false,
    })
    documentResults?: { documentId: number; documentType: string; success: boolean; message?: string }[];
}

export class SendClaimIntimationConfirmationDto {
    @ApiProperty({ description: 'Employee ID', example: 456 })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    employeeId: number;

    @ApiProperty({ description: 'Policy ID', example: 123 })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    policyId: number;

    @ApiProperty({ description: 'Company ID', example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    companyId?: number;

    @ApiProperty({ description: 'Generated claim number', example: 'CLM-1740500000-8374' })
    @IsString()
    @IsNotEmpty()
    claimNumber: string;

    @ApiProperty({ description: 'Claim type', example: 'CASHLESS', required: false })
    @IsOptional()
    @IsString()
    claimType?: string;

    @ApiProperty({ description: 'Patient name', example: 'John' })
    @IsString()
    @IsNotEmpty()
    patientName: string;

    @ApiProperty({ description: 'Patient relation', example: 'SELF' })
    @IsString()
    @IsNotEmpty()
    patientRelation: string;

    @ApiProperty({ description: 'Diagnosis or accident details', example: 'Fever and viral infection' })
    @IsString()
    @IsNotEmpty()
    diagnosis: string;

    @ApiProperty({ description: 'Estimated claim amount', example: 15000 })
    @Type(() => Number)
    @IsNumber()
    estimatedClaimAmount: number;

    @ApiProperty({ description: 'Date of admission or accident (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsString()
    dateOfAdmission?: string;

    @ApiProperty({ description: 'Proposed discharge date (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsString()
    proposedDischargeDate?: string;

    @ApiProperty({ description: 'Place of accident (GPA only)', required: false })
    @IsOptional()
    @IsString()
    placeOfAccident?: string;

    @ApiProperty({ description: 'Hospital name', required: false })
    @IsOptional()
    @IsString()
    hospitalName?: string;

    @ApiProperty({ description: 'Hospital location', required: false })
    @IsOptional()
    @IsString()
    hospitalLocation?: string;

    @ApiProperty({ description: 'Policy type key e.g. GMC, GPA', required: false })
    @IsOptional()
    @IsString()
    policyTypeKey?: string;
}

export class SendSupportTicketConfirmationDto {
    @ApiProperty({ description: 'Employee ID (optional — omit for pre-login tickets)', example: 456, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;

    @ApiProperty({ description: 'Recipient email (required when employeeId is absent)', example: 'user@example.com', required: false })
    @IsOptional()
    @IsString()
    mailId?: string;

    @ApiProperty({ description: 'Generated ticket ID', example: 'TKT-20250512-1234' })
    @IsString()
    @IsNotEmpty()
    ticketId: string;

    @ApiProperty({ description: 'Ticket category', example: 'Claims' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ description: 'Short description / escalation text', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Uploaded document IDs to attach to the email', example: [351306], required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    documentIds?: number[];
}

export class SendSupportTicketStatusChangedDto {
    @ApiProperty({ description: 'Employee ID (optional — omit for anonymous tickets)', example: 456, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;

    @ApiProperty({ description: 'Recipient email (required when employeeId is absent)', example: 'user@example.com', required: false })
    @IsOptional()
    @IsString()
    mailId?: string;

    @ApiProperty({ description: 'Generated ticket ID', example: 'TKT-20250512-1234' })
    @IsString()
    @IsNotEmpty()
    ticketId: string;

    @ApiProperty({ description: 'Ticket category', example: 'Claims' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ description: 'New ticket status', example: 'resolved' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({ description: 'HR comment explaining the status change', example: 'Issue verified and resolved with the insurer.' })
    @IsString()
    @IsNotEmpty()
    comment: string;
}

export class IntimateClaimResponseDto {
    @ApiProperty({ description: 'Success status', example: true })
    success: boolean;

    @ApiProperty({ description: 'Claim ID', example: 1001 })
    claimId: number;

    @ApiProperty({ description: 'Generated claim number', example: 'CLM-1740500000-8374' })
    claimNumber: string;

    @ApiProperty({ description: 'Response message', example: 'Claim intimation submitted successfully' })
    message: string;

    @ApiProperty({
        description: 'SINGLE = claim is fully submitted already (legacy/ISBS behaviour). MULTI = claim is only INTIMATED — call /claims/:claimId/submit next with bills/bank details.',
        example: 'SINGLE',
        enum: ['SINGLE', 'MULTI'],
    })
    claimFormType: 'SINGLE' | 'MULTI';
}
