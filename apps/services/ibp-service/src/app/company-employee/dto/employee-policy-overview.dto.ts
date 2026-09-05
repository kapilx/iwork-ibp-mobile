import { ApiProperty } from "@nestjs/swagger";

export class ClaimStatusCountsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  settled!: number;

  @ApiProperty()
  inProgress!: number;
}

export class CoverageDetailDto {
  @ApiProperty()
  sumInsured!: number;

  @ApiProperty()
  claimed!: number;

  @ApiProperty()
  settled!: number;

  @ApiProperty()
  available!: number;
}

export class ClaimSummaryDto {
  // Raw policy_claim.id — needed (alongside status === 'INTIMATED') to resume-navigate
  // straight into the Submit Claim step from the claim card itself.
  @ApiProperty()
  claimId!: number;

  @ApiProperty()
  memberName!: string;

  @ApiProperty()
  relation!: string;

  @ApiProperty()
  claimNumber!: string;

  @ApiProperty()
  claimDate!: string | null;

  @ApiProperty({ required: false })
  updatedAt?: string | null;

  @ApiProperty()
  claimAmount!: number;

  @ApiProperty({ required: false })
  documentsLabel?: string | null;

  @ApiProperty()
  status!: string | null;

  @ApiProperty({ required: false })
  claimSettledAmount?: number;

  @ApiProperty({ required: false })
  claimDescription?: string | null;

  @ApiProperty({ required: false, description: "ISBS/TPA claim reference number (CCN)" })
  tpaClaimNo?: string | null;
}

export class FamilyMemberDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  relation!: string;
}

export class PolicySectionDto {
  @ApiProperty({ type: () => CoverageDetailDto })
  coverage!: CoverageDetailDto;

  @ApiProperty({ type: () => ClaimStatusCountsDto })
  claimsStatusCounts!: ClaimStatusCountsDto;

  @ApiProperty({ type: () => ClaimSummaryDto, isArray: true })
  claims!: ClaimSummaryDto[];

  @ApiProperty({ type: () => FamilyMemberDto, isArray: true })
  familyMembersCovered!: FamilyMemberDto[];
}

export class LifeEventCtaDto {
  @ApiProperty()
  show!: boolean;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  ctaPath?: string;
}

export class AddOnSummaryDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  totalCoverage!: number;

  @ApiProperty()
  claimed!: number;

  @ApiProperty()
  available!: number;

  @ApiProperty({ required: false })
  perDayLimit?: number;
}

export class AddOnsDto {
  @ApiProperty({ required: false, type: () => AddOnSummaryDto })
  parentalPolicy?: AddOnSummaryDto;

  @ApiProperty({ required: false, type: () => AddOnSummaryDto })
  roomRent?: AddOnSummaryDto;
}

export class PolicyOverviewItemDto {
  @ApiProperty()
  policyId!: number;

  @ApiProperty()
  policyType!: string | null;

  @ApiProperty({ required: false })
  policyTypeKey?: string | null;

  @ApiProperty()
  policyName!: string;

  @ApiProperty({ required: false })
  policyNumber?: string | null;

  @ApiProperty()
  policyExpiry!: string | null;

  @ApiProperty()
  sumInsured!: number;

  @ApiProperty({ type: () => PolicySectionDto })
  basePolicy!: PolicySectionDto;

  @ApiProperty({ type: () => PolicySectionDto, required: false })
  parentalPolicy?: PolicySectionDto;

  @ApiProperty()
  isParentalPolicy!: boolean;

  @ApiProperty({ type: () => LifeEventCtaDto })
  lifeEventCta!: LifeEventCtaDto;

  @ApiProperty({ required: false, type: () => AddOnsDto })
  addOns?: AddOnsDto | Record<string, never>;
}

export class PolicyTabDto {
  @ApiProperty()
  policyType!: string;

  @ApiProperty()
  label!: string;
}

export class EmployeePolicyOverviewResponseDto {
  @ApiProperty({ type: () => PolicyOverviewItemDto, isArray: true })
  policies!: PolicyOverviewItemDto[];

  @ApiProperty({ type: () => PolicyTabDto, isArray: true })
  policyTabs!: PolicyTabDto[];

  @ApiProperty({ nullable: true, description: "Last time TPA claim data was synced (or latest policy_claim created_at as fallback)" })
  lastSyncedAt?: Date | null;

  constructor(partial: Partial<EmployeePolicyOverviewResponseDto>) {
    Object.assign(this, partial);
  }
}
