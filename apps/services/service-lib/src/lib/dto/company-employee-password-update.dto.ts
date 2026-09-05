import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateCompanyEmployeePassword {
  @ApiProperty({ example: "test-updated" })
  @IsString()
  @IsNotEmpty()
  companyEmployeeName!: string;

  @ApiProperty({ example: "laxepak1552@iridales.com" })
  @IsString()
  @IsNotEmpty()
  companyEmployeeEmail!: string;

  @ApiProperty({ example: "9999888865" })
  @IsString()
  @IsNotEmpty()
  companyEmployeePhoneNumber!: string;

  @ApiProperty({ example: "Test@123" })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: "E-154" })
  @IsString()
  @IsOptional()
  companyEmployeeId?: string;
}
