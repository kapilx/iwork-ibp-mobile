export class CommunicationDetailDto {
  id!: number;
  communicationType!: string;
  communicationDetails!: string;
  isPrimary!: boolean;
}

export class CommunicationDto {
  communicationType!: string;
  communicationDetails!: string;
  isPrimary!: boolean;
}

export class LookUpDto {
  id!: number;
  lookUpValue!: string;
}

export class OwnerDto {
  userId!: number;
  firstName!: string;
  lastName!: string;
}

export class ContactListResponseDto {
  id!: number;
  companyId!: number;
  contactName!: string;
  companyName!: string;
  communicationDetails?: CommunicationDetailDto[];
  department?: string;
  designation?: string;
  // commented out the below code due to the requirement change - veda - 09/05/2025 
  // department?: LookUpDto;
  // designation?: LookUpDto;
  status?: LookUpDto;
  owner!: OwnerDto;
}
