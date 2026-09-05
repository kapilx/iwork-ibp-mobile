export class EmployeeDto {
  employeeId!: number;
  firstName!: string;
  lastName!: string;
  emailId!: string;
  mobile!: string;
  userId!: number;
  iirmEmpId!: string;
  userRoles!: Array<object>;
  designation!: object;
  organisation!: object;
  vertical!: object;
  department!: object;
  branch!: object;
  reportingTo!: object;
  reportees!: Array<object>;
  status!: string;
  salutation!: string;
  // Ordered reporting chain (root manager -> ... -> this employee), for the
  // Employee Listing grid's "Reporting Hierarchy" column. Only populated by
  // getEmployees (the listing endpoint) -- read from the precomputed
  // employee_hierarchy table, not a live recursive query.
  reportingChain?: { userId: number; firstName: string; lastName: string }[];


  constructor(employee: Partial<EmployeeDto>) {
    Object.assign(this, employee);
  }
}
