import { ApiProperty } from "@nestjs/swagger";

export class PolicySummaryDto {
  @ApiProperty({ description: "Policy identifier" })
  policyId: number;

  @ApiProperty({ description: "Type of the policy", nullable: true })
  policyType: string | null;

  @ApiProperty({ description: "Premium amount of the policy", nullable: true })
  policyPremium: number | null;

  @ApiProperty({ description: "Policy number", nullable: true })
  policyNumber: string | null;

  @ApiProperty({
    description: "Indicates if a caution deposit account exists for the policy",
  })
  hasCautionDeposit?: boolean;

  @ApiProperty({ description: "CD account balance amount", nullable: true })
  cdBalanceAmount?: number | null;

  @ApiProperty({ description: "CD account status", nullable: true })
  cdStatus?: string | null;

  @ApiProperty({ description: "CD safe limit", nullable: true })
  cdSafeLimit?: number | null;
}
