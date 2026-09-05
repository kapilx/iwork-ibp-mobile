import {
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class UpdateAddressDto {
  @ApiProperty({
    description: "ID of the address",
    required: false,
    example: 312,
  })
  @IsOptional()
  @IsInt({ message: "ID must be a number." })
  id?: number;

  @ApiProperty({
    description: "Type of the address",
    required: false,
    example: 25,
  })
  @IsOptional()
  @IsInt({ message: "Address Type ID must be a number." })
  addressTypeLid?: number;

  @ApiProperty({
    description: "Address line 1",
    required: false,
    example: "123 Main St",
  })
  @IsOptional()
  @IsString({ message: "Address must be a string." })
  @MaxLength(255, { message: "Address must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address1?: string;

  @ApiProperty({
    description: "Address line 2",
    required: false,
    example: "Suite 400",
  })
  @IsOptional()
  @IsString({ message: "Address 2 must be a string." })
  @MaxLength(255, { message: "Address 2 must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address2?: string;

  @ApiProperty({
    description: "Area of the address",
    required: false,
    example: "Downtown",
  })
  @IsOptional()
  @IsString({ message: "Area must be a string." })
  @MaxLength(100, { message: "Area must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  area?: string;

  @ApiProperty({
    description: "Pin code of the address",
    required: false,
    example: "12345",
  })
  @IsOptional()
  @IsString({ message: "Postal code must be a string." })
  @Matches(/^[A-Za-z0-9\s\-]{3,10}$/, {
    message:
      "Postal code must be 3-10 characters long and can only contain letters, numbers, spaces, and hyphens.",
  })
  pinCode?: string;

  @ApiProperty({
    description: "Phone number associated with the address",
    required: false,
    example: "1234567890",
  })
  @IsOptional()
  @IsString({ message: "Phone number must be a string." })
  phoneNumber?: string;

  @ApiProperty({
    description: "Alternate phone number",
    required: false,
    example: "0987654321",
  })
  @IsOptional()
  @IsString({ message: "Alternate Phone number must be a string." })
  alternatePhoneNumber?: string;

  @ApiProperty({
    description: "Email associated with the address",
    required: false,
    example: "email@example.com",
  })
  @IsOptional()
  // @IsEmail({}, { message: "Invalid email format." })
  email?: string;

  @ApiProperty({
    description: "Support number",
    required: false,
    example: "1234567890",
  })
  @IsOptional()
  @IsString({ message: "Support number must be a string." })
  supportNumber?: string;

  @ApiProperty({
    description: "Country ID",
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "Country ID must be a number." })
  countryId?: number;

  @ApiProperty({
    description: "State ID",
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: "State ID must be a number." })
  stateId?: number;

  @ApiProperty({
    description: "City ID",
    required: false,
    example: 3,
  })
  @IsOptional()
  @IsInt({ message: "City ID must be a number." })
  cityId?: number;

  @IsOptional()
  @IsInt({ message: "Branch type LID must be a number." })
  branchTypeLid?: number;

  @IsOptional()
  @IsString({ message: "Branch code must be a string." })
  @MaxLength(100, { message: "Branch code must not exceed 100 characters." })
  branchCode?: string;

  @ApiProperty({
    description:
      "Location Code (mandatory when addressType = Associated Location)",
    required: false,
    example: "MUM01",
  })
  @IsOptional()
  @IsString({ message: "Location code must be a string." })
  @MaxLength(100, { message: "Location code must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  locationCode?: string | null;

  @IsOptional()
  @IsString({ message: "Branch name must be a string." })
  @MaxLength(200, { message: "Branch name must not exceed 200 characters." })
  branchName?: string;

  @IsOptional()
  @IsString()
  branchDisplayName?: string;

  @IsOptional()
  @IsString()
  cityLabel?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : Number(value)))
  @IsInt({ message: "Parent branch ID must be a number." })
  parentBranchId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "PAN card number must not exceed 50 characters." })
  panCardNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Registration number must not exceed 50 characters." })
  registrationNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "TAN number must not exceed 50 characters." })
  tanNumber?: string;

  @IsOptional()
  @IsInt()
  stateGstDetailId?: number;

  @IsOptional()
  @IsInt()
  gstStateId?: number;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsInt()
  gstCategoryLid?: number;

  @IsOptional()
  @IsInt({ message: "Updated by must be a number." })
  updatedBy?: number;

  @IsOptional()
  @IsString({ message: "Updated at must be a string." })
  updatedAt?: Date;
}
