export interface EnrolmentKpi {
  id: string;
  label: string;
  value: string;
  tint: string;
}

export interface EnrolmentDependent {
  name: string;
  relationship: string;
  gender: string;
  dob: string;
}

export interface EnrolmentECard {
  insurer: string;
  policyName: string;
  employeeName: string;
  employeeId: string;
  dob: string;
  gender: string;
  policyNumber: string;
  plan: string;
  sumInsured: string;
  validity: string;
  networkHospitals: string;
  helpline: string;
}

export interface EnrolmentTab {
  id: string;
  label: string;
  active?: boolean;
}

export interface EnrolmentRow {
  id: string;
  employeeName: string;
  employeeCode: string;
  gender: string;
  dob: string;
  age: number;
  email: string;
  mobile: string;
  enrolStatus: string;
  additionType: string;
  sumInsured: string;
  dependents: number | string;
  eCard: string;
  status: string;
  lastLogin: string;
  dependentDetails: EnrolmentDependent[];
  eCardDetails: EnrolmentECard;
}
