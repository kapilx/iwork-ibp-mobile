import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsDate, IsDateString } from "class-validator";

export class CreatePolicyInstallmentDto {
  @ApiProperty({ description: "Installment date", example: "2026-03-01" })
  @IsDateString()
  installmentDate!: string;

  @ApiProperty({ description: "Total installment amount (Net Premium + Other Amount)", example: 1000000 })
  @IsOptional()
  @IsNumber()
  totalInstallmentAmount?: number;

  @ApiProperty({ description: "Installment percentage", example: 25 })
  @IsOptional()
  @IsNumber()
  installmentPercentage?: number;

  @ApiProperty({ description: "Installment net amount", example: 250000 })
  @IsOptional()
  @IsNumber()
  installmentNetAmount?: number;

  @ApiProperty({ description: "Insurer endorsement number", example: "END-2026-001" })
  @IsOptional()
  @IsString()
  insurerEndorsementNumber?: string;

  @ApiProperty({ description: "Premium collection date", example: "2026-03-15" })
  @IsOptional()
  @IsDateString()
  premiumCollectionDate?: string;

  @ApiProperty({ description: "Premium collected amount", example: 250000 })
  @IsOptional()
  @IsNumber()
  premiumCollectedAmount?: number;

  @ApiProperty({ description: "Tax percentage", example: 18 })
  @IsOptional()
  @IsNumber()
  taxPercentage?: number;

  @ApiProperty({ description: "Tax amount", example: 45000 })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiProperty({ description: "Collected gross amount (Premium + Tax)", example: 295000 })
  @IsOptional()
  @IsNumber()
  collectedGrossAmount?: number;

  @ApiProperty({ description: "Transaction mode lookup ID (TRANSACTION_TYPE)", example: 123 })
  @IsOptional()
  @IsNumber()
  transactionModeLid?: number;

  @ApiProperty({ description: "Invoice number", example: "INV-2026-001" })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiProperty({ description: "Transaction/Cheque number", example: "TXN123456" })
  @IsOptional()
  @IsString()
  transactionChequeNumber?: string;

  @ApiProperty({ description: "Bank name", example: "HDFC Bank" })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: "Status lookup ID (INSTALMENT_STATUS)", example: 456 })
  @IsOptional()
  @IsNumber()
  statusLid?: number;

  @ApiProperty({ description: "Source file ID for installment attachment", example: 123 })
  @IsOptional()
  @IsNumber()
  sourceFileId?: number;

  // Optional fields for file upload handling (will be ignored during processing)
  @ApiProperty({ description: "File upload object (ignored, file handled via multipart)", required: false })
  @IsOptional()
  fileUpload?: any;

  @ApiProperty({ description: "Documents array (ignored, file handled via multipart)", required: false })
  @IsOptional()
  documents?: any[];
}
