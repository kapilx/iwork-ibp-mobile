import { IsNotEmpty, IsOptional, IsString, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class EmployeeLookupAttributeDto {
  @ApiPropertyOptional({ example: "GENDER_TYPE" })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ example: "male" })
  @IsOptional()
  @IsString()
  value?: string | null;
}

export class UpdateEmployeeDetails {

  @ApiPropertyOptional({ example: "Employee" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employeeName?: string;

  @ApiPropertyOptional({ example: "test@gmail.com" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ example: "9999999999" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: "9999999998" })
  @IsOptional()
  @IsString()
  alternatePhoneNumber?: string;

  @ApiPropertyOptional({ example: "alternate@example.com" })
  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @ApiPropertyOptional({ example: "manager" })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({
    example: {
      key: "GENDER_TYPE",
      value: "male",
    },
  })
  @IsOptional()
  @IsObject()
  gender?: EmployeeLookupAttributeDto;

  @ApiPropertyOptional({
    example: {
      key: "MARTIAL_STATUS",
      value: "single",
    },
  })
  @IsOptional()
  @IsObject()
  maritalStatus?: EmployeeLookupAttributeDto;

}
