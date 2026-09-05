export interface CommonContactFormProps {
  contactType: number;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  displayName: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Address {
  id: number;
  address1: string;
  cityId: City;
}

export interface Company {
  companyName: string;
  displayName: string;
  id: number;
}

export interface IContactFieldData {
  salutationLid: number | string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  companyId: number | string;
  companyLocationId: number | string;
  companyBranchId: number | string;
  tagLid: number;
  contactTypeLid: number;
  departmentId: number;
  designationId: number;
  reportingToId: number | string;
  assistantId: number | string;
  emailId: string;
  phone: string;
  remarks: string;
  [key: string]: number | string; // Allow additional properties
}
