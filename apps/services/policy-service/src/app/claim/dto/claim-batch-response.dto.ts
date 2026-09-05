import { ApiProperty } from "@nestjs/swagger";
import { ClaimBatchItemDto } from "./claim-batch-item.dto";

export class ClaimBatchListResponseDto {
  @ApiProperty({ type: () => [ClaimBatchItemDto] })
  data!: ClaimBatchItemDto[];

  @ApiProperty({ example: 25 })
  count!: number;

  @ApiProperty({ example: 250 })
  totalClaimRecords!: number;

  @ApiProperty({ example: 200 })
  totalSuccessRecords!: number;

  @ApiProperty({ example: 50 })
  totalFailedRecords!: number;

  @ApiProperty({ example: 125 })
  totalSettledClaimRecords!: number;

  @ApiProperty({ example: 230000 })
  settledClaimAmount!: number;

  @ApiProperty({ example: 120000 })
  claimAmountPendingForSettlement!: number;

  constructor(data: {
    data: ClaimBatchItemDto[];
    count: number;
    totalClaimRecords: number;
    totalSuccessRecords: number;
    totalFailedRecords: number;
    totalSettledClaimRecords: number;
    settledClaimAmount: number;
    claimAmountPendingForSettlement: number;
  }) {
    this.data = data.data;
    this.count = data.count;
    this.totalClaimRecords = data.totalClaimRecords;
    this.totalSuccessRecords = data.totalSuccessRecords;
    this.totalFailedRecords = data.totalFailedRecords;
    this.totalSettledClaimRecords = data.totalSettledClaimRecords;
    this.settledClaimAmount = data.settledClaimAmount;
    this.claimAmountPendingForSettlement = data.claimAmountPendingForSettlement;
  }
}
