export class PolicyContactMatrixLightContactDto {
  contactId!: number;
  displayName!: string;
  firstName!: string;
  lastName!: string;
  designation?: string;
  department?: string;
  phone!: string;
  email!: string;
}

export class PolicyContactMatrixPartyDto {
  companyId?: number;
  companyName?: string | null;
  companyDisplayName?: string | null;
  primary?: PolicyContactMatrixLightContactDto;
  secondary?: PolicyContactMatrixLightContactDto;
  logoFileId?: number | null;
}

export class PolicyContactMatrixResponseDto {
  policyId!: number;
  updatedAt?: Date;
  contacts!: {
    tpa: PolicyContactMatrixPartyDto;
    insurer: PolicyContactMatrixPartyDto;
  };
  policyName?: string | null;
  policyType?: string | null;
  policyTypeLid?: number | null;
}
