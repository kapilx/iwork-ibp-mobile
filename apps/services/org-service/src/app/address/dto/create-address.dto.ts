import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";

/**
 * DTO for creating an address.
 * @class CreateAddressDto
 */
export class CreateAddressDto {
  @ApiProperty({
    description: "Address Type ID",
    type: Number,
    required: false,
    example: 25,
  })
  @IsOptional()
  @IsInt({ message: "Address Type id must be a number." })
  addressTypeLid?: number;

  @ApiProperty({
    description: "Address",
    type: String,
    required: true,
    example: "123 Main St",
  })
  @IsNotEmpty({ message: "Address is required." })
  @IsString({ message: "Address must be a string." })
  @MaxLength(255, { message: "Address must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address1!: string;

  @ApiProperty({
    description: "Country ID",
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: "Country id is required." })
  @IsInt({ message: "Country id must be a number." })
  countryId!: number;

  @ApiProperty({
    description: "State ID",
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: "State id is required." })
  @IsInt({ message: "State id must be a number." })
  stateId!: number;

  @ApiProperty({
    description: "City ID",
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: "City id is required." })
  @IsInt({ message: "City id must be a number." })
  cityId!: number;

  @ApiProperty({
    description: "Address 2",
    type: String,
    example: "Address v23",
  })
  @IsOptional()
  @IsString({ message: "Address 2 must be a string." })
  @MaxLength(255, { message: "Address 2 must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  address2?: string;

  @ApiProperty({
    description: "Area",
    type: String,
    example: "Downtown",
  })
  @IsOptional()
  @IsString({ message: "Area must be a string." })
  @MaxLength(100, { message: "Area must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  area?: string;

  @ApiProperty({
    description: "Postal Code",
    type: String,
    example: "12345",
  })
  // @IsNotEmpty({ message: "Postal code is required." }) // Kept pincode as optional as it is not required in assistance quick creation
  @IsOptional()
  @IsString({ message: "Postal code must be a string." })
  @Matches(/^[A-Za-z0-9\s\-]{3,10}$/, {
    message:
      "Postal code must be 3-10 characters long and can only contain letters, numbers, spaces, and hyphens.",
  })
  pinCode?: string;

  @ApiProperty({
    description: "Phone Number",
    type: String,
    required: true,
    example: "1234567890",
  })
  // @IsNotEmpty({ message: "Phone number is required." }) // Kept phoneNumber as optional as it is not required in assistance quick creation
  @IsOptional()
  @IsString({ message: "Phone number must be a string." })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "Alternate Phone Number",
    type: String,
    example: "0987654321",
  })
  @IsOptional()
  @IsString({ message: "Alternate Phone number must be a string." })
  alternatePhoneNumber?: string;

  @ApiPropertyOptional({
    description: "Email",
    type: String,
    example: "email@1811.com",
  })
  @IsOptional()
  @IsString({ message: "Email must be a string." })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: "Invalid email format.",
  })
  email?: string;

  @ApiProperty({
    description: "Support Number",
    type: String,
    example: "1234567890",
  })
  @IsOptional()
  @IsString({ message: "Support number must be a string." })
  supportNumber?: string;

  @IsOptional()
  @IsInt({ message: "Branch type LID must be a number." })
  branchTypeLid?: number;

  @IsOptional()
  @IsString({ message: "Branch code must be a string." })
  @MaxLength(100, { message: "Branch code must not exceed 100 characters." })
  branchCode?: string;

  @ApiPropertyOptional({
    description:
      "Location Code (mandatory when addressType = Associated Location)",
    type: String,
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

  // GST fields — used to create/update state_gst_detail; not stored directly on address
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
  @IsString()
  cityLabel?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : Number(value)))
  @IsInt({ message: "Parent branch ID must be a number." })
  parentBranchId?: number;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsString()
  createdAt?: Date;

  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @ApiHideProperty()
  @IsOptional()
  @IsInt()
  id?: number;
}
