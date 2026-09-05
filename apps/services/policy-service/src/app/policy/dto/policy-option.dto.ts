import { ApiProperty } from "@nestjs/swagger";

// Deliberately minimal — id/name/number only. Built for policy-picker
// dropdowns (e.g. the "Select Policy" field on ZohoEndorsementPage, used by
// both the Zoho and HCL enrollment flows) that were previously fetched via
// the "dashboard_policy_cards" report endpoint — a much heavier, dashboard-
// oriented query (premiums, sum insured, life counts, statuses) with no
// pagination, unsuited to "just give me a list to pick from."
export class PolicyOptionDto {
  @ApiProperty({ description: "Policy identifier" })
  policyId: number;

  @ApiProperty({ description: "Policy name" })
  policyName: string;

  @ApiProperty({ description: "Insurer policy number", nullable: true })
  policyNumber: string | null;
}

export class PaginatedPolicyOptionsDto {
  @ApiProperty({ type: [PolicyOptionDto] })
  items: PolicyOptionDto[];

  @ApiProperty({ description: "Total number of policies for this company (across all pages)" })
  total: number;

  @ApiProperty({ description: "Current page (1-based)" })
  page: number;

  @ApiProperty({ description: "Page size" })
  limit: number;
}
