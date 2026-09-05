import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Admin" })
  name: string;
}

export class LocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "New York" })
  name: string;
}

export class DepartmentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Sales" })
  name: string;

  @ApiProperty({ example: "Sales Department" })
  description: string;
}

export class DesignationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Engineer" })
  name: string;

  @ApiProperty({ example: "Engineer Description" })
  description: string;
}

export class OrganizationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "IIRM Kenya" })
  name: string;

  @ApiProperty({
    example: "A leading provider of technology solutions and services.",
  })
  description: string;
}

export class SalutationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Mr." })
  lookUpValue: string;
}

export class BranchDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "IIRM Kenya" })
  name: string;

  @ApiProperty({
    example: "A leading provider of technology solutions and services.",
  })
  description: string;
}

export class IworkRoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Manager" })
  lookUpValue: string;
}

export class VerticalDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "IIRM Kenya" })
  name: string;

  @ApiProperty({
    example: "A leading provider of technology solutions and services.",
  })
  description: string;
}

export class StatusDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Active" })
  lookUpValue: string;
}

export class ReportingToDto {
  @ApiProperty({ example: 1 })
  employeeId: number;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "john.doe@example.com" })
  emailId: string;

  @ApiProperty({ example: "+1234567890" })
  mobile: string;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: "EMP_001" })
  iirmEmpId: string;


  @ApiPropertyOptional({ type: RoleDto })
  role: RoleDto | null;

  @ApiPropertyOptional({ type: LocationDto })
  location: LocationDto | null;

  @ApiPropertyOptional({ type: DepartmentDto })
  department: DepartmentDto | null;

  @ApiPropertyOptional({ type: DesignationDto })
  designation: DesignationDto | null;

  @ApiPropertyOptional({ type: OrganizationDto })
  organization: OrganizationDto | null;

  @ApiPropertyOptional({ type: SalutationDto })
  salutation: SalutationDto | null;

  @ApiPropertyOptional({ type: BranchDto })
  branch: BranchDto | null;

  @ApiPropertyOptional({ type: IworkRoleDto })
  iworkRole: IworkRoleDto | null;

  @ApiPropertyOptional({ type: VerticalDto })
  vertical: VerticalDto | null;

  @ApiPropertyOptional({ type: StatusDto })
  status: StatusDto | null;
}

export class EmployeeResponseDto {
  @ApiProperty({ example: 1 })
  employeeId: number;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "john.doe@example.com" })
  emailId: string;

  @ApiProperty({ example: "+1234567890" })
  mobile: string;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: "EMP_001" })
  iirmEmpId: string;

  @ApiPropertyOptional({ type: RoleDto })
  role: RoleDto | null;

  @ApiPropertyOptional({ type: LocationDto })
  location: LocationDto | null;

  @ApiPropertyOptional({ type: DepartmentDto })
  department: DepartmentDto | null;

  @ApiPropertyOptional({ type: DesignationDto })
  designation: DesignationDto | null;

  @ApiPropertyOptional({ type: OrganizationDto })
  organization: OrganizationDto | null;

  @ApiPropertyOptional({ type: ReportingToDto })
  reportingTo: ReportingToDto | null;

  @ApiPropertyOptional({ type: [ReportingToDto] })
  reportees: ReportingToDto[];

  @ApiPropertyOptional({ type: SalutationDto })
  salutation: SalutationDto | null;

  @ApiPropertyOptional({ type: BranchDto })
  branch: BranchDto | null;

  @ApiPropertyOptional({ type: IworkRoleDto })
  iworkRole: IworkRoleDto | null;

  @ApiPropertyOptional({ type: VerticalDto })
  vertical: VerticalDto | null;

  @ApiPropertyOptional({ type: StatusDto })
  status: StatusDto | null;
}
