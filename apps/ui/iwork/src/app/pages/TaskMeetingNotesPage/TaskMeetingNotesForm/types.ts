export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  displayName: string;
}
export interface Company {
  companyName: string;
  displayName: string;
  id: number;
}