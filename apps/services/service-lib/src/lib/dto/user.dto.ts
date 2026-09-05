export class UserDto {
  userId!: number;
  salutationLid!: number;
  firstName!: string;
  lastName!: string;
  emailId!: string;
  mobile!: string;
  loginName!: string;
  password!: string;
  roleId!: number;
  branchId!: number;
  verticalId!: number;
  departmentId!: number;
  designationId!: number;
  reportingUserId!: number;
  iworkRoleId!: number;
  userTypeKey!: string;

  constructor(user: Partial<UserDto>) {
    Object.assign(this, user);
  }
}
