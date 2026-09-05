export interface DependentRecord {
  id: number;
  name: string;
}

export interface ActivityRecord extends DependentRecord {
  opportunityId: number;
  opportunityLabel: string; // e.g. "Acme Corp — Opp #42"
}

export interface ReporteeRecord {
  userId: number;
  firstName: string;
  lastName: string;
}

export interface DeactivationRecords {
  companiesLeadCrm: DependentRecord[];
  companiesAccountManager: DependentRecord[];
  opportunities: DependentRecord[];
  policies: DependentRecord[];
  endorsements: DependentRecord[];
  activities: ActivityRecord[];
  reportees: ReporteeRecord[];
}

export interface AssignmentMap {
  [key: string]: number | undefined; // key = "<entityType>-<entityId>", value = newOwnerId
}

export interface EmployeeListValue {
  employeeId: number;
  userId: number;
  firstName: string;
  lastName?: string;
  emailId?: string;
}
