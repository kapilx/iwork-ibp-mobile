import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsInt,
  IsOptional,
  IsArray,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";

export class CreateRoleDto {
  @ApiProperty({ example: 5 })
  @IsInt({ message: "Role ID must be a number" })
  @IsNotEmpty({ message: "Role ID should not be empty" })
  roleId!: number;
}
export class CreateEmployeeDto {
  @ApiProperty({ example: 16 })
  @IsInt({ message: "Salutation must be a number" })
  @IsNotEmpty({ message: "Salutation should not be empty" })
  salutationLid!: number;

  @ApiProperty({ example: "John" })
  @IsString({ message: "First name must be a string" })
  @IsNotEmpty({ message: "First name should not be empty" })
  @MinLength(3, { message: "First name must be at least 3 characters long" })
  @MaxLength(100, { message: "First name must be at most 100 characters long" })
  @Matches(/^[A-Za-z\s]+$/, {
    message: "First name must contain only alphabets",
  })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString({ message: "Last name must be a string" })
  @IsNotEmpty({ message: "Last name should not be empty" })
  @MinLength(1, { message: "Last name must be at least 3 characters long" })
  @MaxLength(100, { message: "Last name must be at most 100 characters long" })
  @Matches(/^[A-Za-z\s]+$/, {
    message: "Last name must contain only alphabets",
  })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  lastName!: string;

  @ApiProperty({ example: "jogn@gmail.com" })
  @IsEmail({}, { message: "Invalid email ID" })
  @IsNotEmpty({ message: "Email ID should not be empty" })
  emailId!: string;

  @ApiProperty({ example: "9032150543" })
  @IsNotEmpty({ message: "Phone number is required." })
  @IsString({ message: "Phone number must be a string." })
  @Matches(/^[+]?[0-9]{10,12}$/, {
    message: "Phone number must be a valid number.",
  })
  mobile!: string;

  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @IsInt({ message: "Branch ID must be a number" })
  branchId?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt({ message: "Department ID must be a number" })
  departmentId?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt({ message: "SBU ID must be a number" })
  sbuId?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt({ message: "Vertical ID must be a number" })
  verticalId?: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: "Organisation ID must be a number" })
  @IsNotEmpty({ message: "Organisation ID should not be empty" })
  organisationId!: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: "Designation ID must be a number" })
  @IsNotEmpty({ message: "Designation ID should not be empty" })
  designationId!: number;

  @ApiPropertyOptional({ example: 27 })
  @IsOptional()
  @IsInt({ message: "Reporting Manager Employee ID must be a number" })
  reportingManagerEmployeeId?: number;

  @ApiProperty({ example: "IIRM_EMP12" })
  @IsString({ message: "IIRM Employee ID must be a string" })
  @IsNotEmpty({ message: "IIRM Employee ID should not be empty" })
  iirmEmpId!: string;

  @ApiProperty({ example: "johndoe" })
  @IsString({ message: "Login Name must be a string" })
  @IsNotEmpty({ message: "Login Name should not be empty" })
  loginName!: string;

  @ApiProperty({
    description: "Employee roles",
  })
  @IsNotEmpty({ message: "Employee roles are required." })
  @IsArray()
  @Type(() => Array<number>)
  roles!: number[];

  @ApiPropertyOptional({ example: [27, 28] })
  @IsOptional()
  @IsArray()
  @Type(() => Array<number>)
  reportees?: number[];

  @ApiPropertyOptional({ example: "2023-01-01" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of Birth must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    if (date > new Date()) {
      throw new BadRequestException("Date of Birth cannot be a future date.");
    }
    return value;
  })
  @IsOptional()
  @IsString({ message: "Date of Birth must be a valid date string" })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: "2023-01-01" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of Joining must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    if (date > new Date()) {
      throw new BadRequestException("Date of Joining cannot be a future date.");
    }
    return value;
  })
  @IsOptional()
  @IsString({ message: "Date of Joining must be a valid date string" })
  dateOfJoining?: string;

  @ApiPropertyOptional({ example: "https://example.com/profile.jpg" })
  @IsOptional()
  @IsString({ message: "Profile URL must be a string" })
  profileUrl?: string;
}
