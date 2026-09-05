import { ApiProperty } from "@nestjs/swagger";
import {
  PolicyClaim,
  PolicyClaimSettlement,
} from "../../../../../service-lib/src/lib/entities";

export class ClaimSettlementDto {
  @ApiProperty({ required: false })
  settlementNo?: string | null;

  @ApiProperty({ required: false })
  settlementAmount?: number | null;

  @ApiProperty({ required: false })
  settlementDate?: Date | null;

  @ApiProperty({ required: false })
  settlementDetails?: string | null;

  @ApiProperty({ required: false })
  disallowedAmount?: number | null;

  @ApiProperty({ required: false })
  settlementChequeBank?: string | null;

  @ApiProperty({ required: false })
  settlementChequeDate?: Date | null;

  @ApiProperty({ required: false })
  settlementChequeNo?: string | null;

  @ApiProperty()
  sourceFileUploadId!: number;

  constructor(entity: PolicyClaimSettlement) {
    Object.assign(this, entity);
  }
}

export class ClaimDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  policyId!: number;

  @ApiProperty()
  employeeId!: number;

  @ApiProperty()
  employeeTpaId!: string;

  @ApiProperty({ required: false })
  claimInsuredId?: string | null;

  @ApiProperty({ required: false })
  dependentId?: number | null;

  @ApiProperty({ required: false })
  claimHospital?: string | null;

  @ApiProperty({ required: false })
  claimDateOfAdmission?: Date | null;

  @ApiProperty({ required: false })
  claimDateOfDischarge?: Date | null;

  @ApiProperty({ required: false })
  claimDate?: Date | null;

  @ApiProperty({ required: false })
  claimType?: string | null;

  @ApiProperty({ required: false })
  claimAmount?: number | null;

  @ApiProperty({ required: false })
  claimDescription?: string | null;

  @ApiProperty({ required: false })
  claimStatus?: string | null;

  @ApiProperty({ required: false })
  claimPreAuthId?: string | null;

  @ApiProperty({ required: false })
  claimChecklist?: string | null;

  @ApiProperty({ required: false })
  claimBillDetails?: string | null;

  @ApiProperty({ required: false })
  claimAllowedAmount?: number | null;

  @ApiProperty({ required: false })
  claimPreAuthDate?: Date | null;

  @ApiProperty({ required: false })
  claimPreAuthAmount?: number | null;

  @ApiProperty({ required: false })
  claimAllowedId?: string | null;

  @ApiProperty({ required: false })
  claimChecklistCount?: number | null;

  @ApiProperty({ required: false })
  userId?: number | null;

  @ApiProperty()
  sourceFileUploadId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: () => [ClaimSettlementDto], required: false })
  settlements?: ClaimSettlementDto[];

  constructor(entity: PolicyClaim) {
    Object.assign(this, entity);
    if (entity.settlements) {
      this.settlements = entity.settlements.map(
        (s) => new ClaimSettlementDto(s)
      );
    }
  }
}
