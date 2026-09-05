export interface CompanyMinDto {
  companyName: string;
  companyTypeLid?: number;
  industrySegmentLid?: number;
  addressTypeLid: number;
  cityId: number;
  companyId?: number;
  phoneNumber?: string;
  pinCode?: string;
  address1?: string;
  area?: string;
  countryId?: number;
  currencyId?: number;
  createdBy?: number;
  updatedBy?: number;
}

export interface ContactMinDto {
  firstName: string;
  lastName: string;
  contactTypeLid: number;
  phoneNumber: string;
  email: string;
}

export interface OpportunityMinDto {
  policyTypeLid: number;
  policyStatusLid: number;
  expiryDate: string;
  premiumPaid: number;
  estimatedBrokerageAmount: number;
  estimatedBrokeragePercentage: number;
  sourceTypeLid: number;
  source?: string;
}

export interface MeetingMinDto {
  meetingDate: string;
  startTime: string;
  endTime: string;
  meetingAgenda: string;
}
// The Following interface takes company, contacts, opportunity, and meeting as input for quick creation.
export interface QuickCreatePayloadDto {
  company: CompanyMinDto;
  contacts: ContactMinDto[];
  opportunity?: OpportunityMinDto | null;
  meeting?: MeetingMinDto | null;
}
