export interface CompanySearchParams {
  query: string;
  subPrompt: string;
  keys: string[];
}

export interface CompanyResponse {
  [key: string]: any;
}

export interface PerplexityMessage {
  role: string;
  content: string;
}

export interface PerplexityPayload {
  model: string;
  messages: PerplexityMessage[];
  temperature: number;
  max_tokens: number;
}

export interface CompanyBasicInfo {
  companyName: string | null;
  displayName: string | null;
  industrySegment: string | null;
  companyType: string | null;
  noOfEmployees: number | null;
  dateOfIncorporation: string | null;
  registrationNumber: string | null;
  website: string | null;
  breifHistory: string | null;
}

export interface FinancialInfo {
  financialInfo: {
    pan?: string | null;
    tan?: string | null;
    currency?: string | null;
  } | null;
}

export interface CompanyLocation {
  addressType: { label: string; value: number } | null;
  address1: string | null;
  address2: string | null;
  area: string | null;
  city: { label: string | null; value: string | null } | null;
  state: { label: string | null; value: string | null } | null;
  country: { label: string | null; value: string | null } | null;
  pinCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  alternatePhoneNumber : string | null;
  supportNumber: string | null;
}

export interface ServicesAndProducts {
  services: string | null;
  products: string | null;
  keyCustomers: string | null;
}

export interface IndustryIntelligence {
  marketOverview: string | null;
  keyGrowthDrivers: string | null;
  competitiveLandscape: string | null;
  technologyTrends: string | null;
  insurableRisksHighPriority: string | null;
  insurableRisksEmerging: string | null;
  riskForecast1to2Years: string | null;
  riskForecast3to5Years: string | null;
  riskMitigationRecommendations: string | null;
  regulatoryEnvironment: string | null;
  riskFactors: string | null;
  futureOutlook: string | null;
}

export interface PotentialOpportunity {
  opportunityType: string | null;
  description: string | null;
  recommendedInsurances: string[];
  valueProposition: string[];
}

export interface CompanyResearchResponse {
  companyBasicInfo: CompanyBasicInfo | null;
  financialInfo: FinancialInfo | null;
  companyLocations: CompanyLocation[];
  servicesAndProducts: ServicesAndProducts | null;
  industryIntelligence: IndustryIntelligence | null;
  potentialOpportunities: PotentialOpportunity[];
}

export interface LookUpEntity {
  id: number;
  lookUpValue: string;
  lookUpKey: string;
  lookUpName: string;
}

export interface CountryEntity {
  id: number;
  name: string;
  isoCode: string | null;
}