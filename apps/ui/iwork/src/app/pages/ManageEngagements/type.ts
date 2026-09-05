export interface Task {
  id: number;
  taskName: string;
  dueDate: string; // ISO string (e.g., "2025-05-29")
  taskIsEditable: string | boolean;
  description: string;
  taskOrigin?: string | null;
  policyId?: number | null;
  templateId?: number | null;
  /**
   * Optional tab identifier provided for policy-origin tasks. Used to
   * determine which tab should be active when navigating to policy details.
   */
  taskLabel?: string | null;
  /**
   * Some payloads may surface the raw tab key directly on the task object.
   * Retain it to support flexible backend contracts.
   */
  tabKey?: string | null;
  company: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  assignee: {
    userId: number;
    firstName: string;
    lastName: string;
  } | null;
  opportunity: {
    opportunityId: number;
    policyId?: number | null;
    policy: string;
  } | null;
  policy?: {
    id?: number | null;
    policyId?: number | null;
  } | null;
  activity: {
    id: number;
    activityName: string;
  } | null;
  priority: {
    id: number;
    lookUpValue: string;
  };
  taskStatus: {
    id: number;
    lookUpValue: string;
  };
  taskType:
    | {
        id: number;
        lookUpValue: string;
      }
    | string;
}

export interface Company {
  id: number;
  name: string;
  displayName: string;
}

export interface Opportunity {
  opportunityId: number;
  policy: string;
}

export interface Activity {
  id: number;
  activityName: string;
}

export interface Meeting {
  meetingDate: string; // Format: YYYY-MM-DD
  startTime: string; // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
  endTime: string; // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
  location: {
    id: number;
    lookUpValue: string;
  };
  meetingPurpose: string;
  meetingAgenda: string;
  id: number;
  company?: Company | null;
  contact: any | null; // You can replace `any` with a specific Contact interface if needed
  opportunity: Opportunity | null;
  activity: Activity | null;
  meetingType: {
    id: number;
    lookUpValue: string;
  };
  meetingSubType: string | null;
}
export interface Approval {
  id: number;
  approvalName: string;
  company: Company | null;
  opportunity: Opportunity | null;
  activity: Activity | null;
  status: "pending" | "approved" | "rejected"; // or string if flexible
}
export interface Note {
  id: number;
  name: string;
  description: string;
  company: Company | null;
  activity: Activity | null;
  opportunity: Opportunity | null;
}
