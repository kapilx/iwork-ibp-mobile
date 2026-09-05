export class PortalContactDto {
  contactId!: number;
  displayName!: string;
  firstName!: string;
  lastName!: string;
  department?: string;
  designation?: string;
  phone!: string;
  email!: string;
}

export class PortalContactsResponseDto {
  policyId?: number;
  party!: "TPA" | "INSURER";
  entityId!: number;
  contacts!: PortalContactDto[];
}
