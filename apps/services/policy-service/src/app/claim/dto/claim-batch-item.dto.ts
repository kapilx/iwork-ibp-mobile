import { ApiProperty } from "@nestjs/swagger";
import { DOCUMENT_PROCESS_STATUS } from "../../../../../service-lib/src/lib/constants";

export class ClaimBatchItemDto {
  @ApiProperty({ example: 101 })
  claimBatchId!: number;

  @ApiProperty({ type: String, format: "date-time" })
  claimCreatedDate!: Date;

  @ApiProperty({ example: 250 })
  totalClaimRecords!: number;

  @ApiProperty({ example: 200 })
  processedClaims!: number;

  @ApiProperty({ example: DOCUMENT_PROCESS_STATUS.CREATED })
  status!: string;

  @ApiProperty({ example: 12345 })
  sourceFileId!: number;

  @ApiProperty({ example: "claims-upload.xlsx" })
  fileName!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  processingCompletedAt!: Date | null;

  @ApiProperty({ example: 10 })
  totalSuccess!: number;

  @ApiProperty({ example: 2 })
  totalFail!: number;

  @ApiProperty({ example: 5 })
  totalPendingClaims!: number;

  @ApiProperty({ example: 5 })
  totalSettledClaims!: number;

  @ApiProperty({ example: 999 })
  errorFileId!: number | null;

  constructor(data: {
    claimBatchId: number;
    claimCreatedDate: Date;
    totalClaimRecords: number;
    processedClaims: number;
    status: string;
    sourceFileId: number;
    fileName: string | null;
    processingCompletedAt: Date | null;
    totalSuccess: number;
    totalFail: number;
    totalPendingClaims: number;
    totalSettledClaims: number;
    errorFileId: number | null;
  }) {
    this.claimBatchId = data.claimBatchId;
    this.claimCreatedDate = data.claimCreatedDate;
    this.totalClaimRecords = data.totalClaimRecords;
    this.processedClaims = data.processedClaims;
    this.status = data.status;
    this.sourceFileId = data.sourceFileId;
    this.fileName = data.fileName;
    this.processingCompletedAt = data.processingCompletedAt;
    this.totalSuccess = data.totalSuccess;
    this.totalFail = data.totalFail;
    this.totalPendingClaims = data.totalPendingClaims;
    this.totalSettledClaims = data.totalSettledClaims;
    this.errorFileId = data.errorFileId;
  }
}
