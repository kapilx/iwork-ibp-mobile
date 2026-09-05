export interface HRTicketDocument {
  documentId: string;
  fileName: string;
}

export interface HRTicket {
  id: number;
  ticketId: string;
  employeeId: string;
  // Client-assigned employee code (policy_enrollment_employee.company_employee_id) --
  // shown to HR instead of employeeId (the internal DB id, still used for the
  // status-change API call). Optional/falls back to "--" for mock-data callers
  // that don't set it.
  companyEmployeeId?: string;
  employeeName: string;
  department: string;
  category: "billing" | "claims" | "policy" | "enrollment" | "other";
  status: "open" | "in_progress" | "resolved" | "closed";
  mailId: string;
  escalationDescription: string;
  createdAt: string;
  updatedAt: string;
  raisedBy: "employee" | "hr" | "crm";
  documents: HRTicketDocument[];
}

export interface HREmployee {
  id: string;
  name: string;
  email: string;
  department: string;
}

