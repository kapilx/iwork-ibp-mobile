export interface IContactFieldData {
  salutationLid: number | null;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  companyId: number | string;
  companyLocationId: number | string;
  companyBranchId: number | string | null;
  tagLid: number | string | null;
  contactTypeLid: number | string;
  departmentId: number | string | null;
  designationId: number | string | null;
  reportingToId: number | string | null;
  assistantId: number | string | null;
  emailId: string;
  phone: string;
  remarks: string;
  [key: string]: number | string | null; // Allow additional properties, including null
}

// Define interfaces for the data structures
export interface IAddress {
  id?: number;
  addressTypeLid: number | string;
  address1: string;
  address2?: string;
  area?: string;
  countryId: number | string;
  stateId: number | string;
  cityId: number | string;
  pinCode: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  supportNumber?: string;
  email?: string;
}

// Define the interface for contact details
export interface IContactDetailsFieldData {
  id?: number;
  gender: number | string;
  dateOfBirth: string | null;
  website: string;
  favouriteFood: string;
  favouriteRestaurant: string;
  personalHistory: string;
  majorAchievements: string;
  maritalStatus: number | null;
  dateOfWedding: string | null;
  spouseName: string;
  spouseDateOfBirth: string | null;
  spouseWorkingStatus: number | null;
  workingCompany: string;
  childName: string;
  childDob: string | null;
}

export interface Option {
  value: number;
  label: string;
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
  city: City;
}

export interface Company {
  companyName: string;
  displayName: string;
  id: number;
}

interface EntityData {
  insurerAddresses?: Address[];
  brokerAddresses?: Address[];
  tpaAddresses?: Address[];
}

interface Data {
  data: EntityData;
}
