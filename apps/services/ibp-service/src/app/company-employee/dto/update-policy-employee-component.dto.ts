import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePolicyEmployeeComponentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  policyId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId!: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  sumInsured!: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  premium!: number;

  @ApiProperty({ example: 800 })
  @IsNumber()
  companyPay!: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  employeePay!: number;

  @ApiProperty({ example: "base" })
  @IsString()
  policyComponentActionType!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  policyComponentActionTypeId?: number;

  @ApiPropertyOptional({ example: "Base label" })
  @IsOptional()
  @IsString()
  policyComponentActionLabel?: string;
}
