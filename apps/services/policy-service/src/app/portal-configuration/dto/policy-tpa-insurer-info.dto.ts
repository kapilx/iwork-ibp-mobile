export class PolicyTpaInsurerInfoDto {
  policyId!: number;
  tpa: {
    tpaId?: number;
    name?: string | null;
    displayName?: string | null;
  };
  insurer: {
    insurerId?: number;
    name?: string | null;
    displayName?: string | null;
  };
}
