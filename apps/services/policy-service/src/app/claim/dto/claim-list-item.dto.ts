import { ApiProperty } from "@nestjs/swagger";
import { PolicyClaim } from "../../../../../service-lib/src/lib/entities";

type ClaimWithTat = PolicyClaim & {
  tatDays?: number | null;
  policyId?: number | null;
  branchId?: number | null;
  branchName?: string | null;
  insurer?: string | null;
  coInsurers?: string | null;
  tpaName?: string | null;
};

export class ClaimListItemDto {
  @ApiProperty()
  claimId!: number;

  @ApiProperty()
  companyName!: string;

  @ApiProperty()
  claimNumber!: string;

  @ApiProperty()
  policyType!: string;

  @ApiProperty({ required: false })
  policyNumber?: string | null;

  @ApiProperty({ required: false })
  policyId?: number | null;

  @ApiProperty()
  employeeName!: string;

  @ApiProperty({ required: false })
  companyPriority?: string | null;

  @ApiProperty({ required: false })
  claimDate?: Date | null;

  @ApiProperty({ required: false })
  status?: string | null;

  @ApiProperty({ required: false })
  claimType?: string | null;

  @ApiProperty({ required: false })
  claimActivity?: string | null;

  @ApiProperty({ required: false })
  tatDays?: number | null;

  @ApiProperty({ required: false })
  claimAmount?: number | null;

  @ApiProperty({ required: false })
  branchId?: number | null;

  @ApiProperty({ required: false })
  branchName?: string | null;

  @ApiProperty({ required: false })
  insurer?: string | null;

  @ApiProperty({ required: false })
  coInsurers?: string | null;

  @ApiProperty({ required: false })
  tpaName?: string | null;

  constructor(entity: ClaimWithTat) {
    this.claimId = entity.id;
    this.companyName = entity.policy?.company?.companyName ?? "";
    this.claimNumber =
      entity.claimInsuredId ?? entity.claimNumber ?? String(entity.id);
    this.policyType = entity.policy?.policyType?.lookUpValue ?? "";
    this.policyNumber = entity.policy?.insurerPolicyNumber ?? null;
    this.policyId = entity.policyId ?? entity.policy?.id ?? null;
    this.employeeName = entity.employee?.employeeName ?? "";
    this.companyPriority =
      entity.policy?.company?.priority?.lookUpValue ?? null;
    const claimDate =
      entity.claimDate instanceof Date
        ? entity.claimDate
        : entity.claimDate
        ? new Date(entity.claimDate)
        : null;
    this.claimDate = claimDate;
    this.status = entity.claimStatus ?? null;
    this.claimType = entity.claimType ?? null;
    this.claimAmount =
      entity.claimAmount !== undefined && entity.claimAmount !== null
        ? Number(entity.claimAmount)
        : null;
    this.claimActivity = entity.activeActivity ?? null;
    this.tatDays =
      entity.tatDays !== undefined && entity.tatDays !== null
        ? Number(entity.tatDays)
        : null;
    this.branchId = entity.branchId ?? null;
    this.branchName = entity.branchName ?? null;
    this.insurer = entity.insurer ?? null;
    this.coInsurers = entity.coInsurers ?? null;
    this.tpaName = entity.tpaName ?? null;
  }
}
