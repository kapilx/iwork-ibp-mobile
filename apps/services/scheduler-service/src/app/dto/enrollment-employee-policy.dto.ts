import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class EnrollmentEmployeePolicyDto {
  @ApiProperty({ example: "policy name" })
  @IsString()
  policyLabel!: string;

  @ApiProperty({ example: "Base Policy" })
  @IsString()
  parentpolicyLabel?: string;

  @ApiProperty({ example: 100000 })
  @IsInt()
  sumInsuredValue!: number;
}
