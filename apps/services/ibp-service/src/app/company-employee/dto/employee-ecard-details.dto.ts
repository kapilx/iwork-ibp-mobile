import { ApiProperty } from "@nestjs/swagger";

export class EmployeeECardItemDto {
  @ApiProperty()
  policyId!: number;

  @ApiProperty()
  policyNumber!: string | null;

  @ApiProperty()
  companyName!: string | null;

  @ApiProperty()
  insurerLogoFileId!: number | null;

  @ApiProperty()
  tpaId!: string | null;

  @ApiProperty()
  name!: string | null;

  @ApiProperty()
  gender!: string | null;

  @ApiProperty()
  policyFrom!: string | null;

  @ApiProperty()
  policyTo!: string | null;

  @ApiProperty()
  dateOfBirth!: string | null;

  @ApiProperty()
  relation!: string | null;

  @ApiProperty()
  companyEmployeeId!: string | null;
}

export class EmployeeECardResponseDto {
  @ApiProperty()
  employeeId!: number;

  @ApiProperty({ type: () => EmployeeECardItemDto, isArray: true })
  ecarddata!: EmployeeECardItemDto[];
}
