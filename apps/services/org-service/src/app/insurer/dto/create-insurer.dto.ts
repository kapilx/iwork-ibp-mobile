import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateAddressDto } from "../../address/dto/create-address.dto";
import { CreateGstDto } from "../../company/dto/create-company.dto";

export class CreateInsurerDto {
  @IsNotEmpty({ message: "Insurer Name is required." })
  @IsString({ message: "Insurer Name must be a string." })
  @MaxLength(200, { message: "Insurer Name must not exceed 200 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  insurerName!: string;

  @IsNotEmpty({ message: "Display Name is required." })
  @IsString({ message: "Display Name must be a string." })
  @MaxLength(100, { message: "Display Name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName!: string;

  @IsNotEmpty({ message: "Company Type ID is required." })
  @IsInt({ message: "Company Type ID must be an integer." })
  companyTypeLid!: number;

  @IsOptional()
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  @IsUrl({}, { message: "Website must be a valid URL." })
  @MaxLength(255, { message: "Website must not exceed 255 characters." })
  website?: string;

  @IsNotEmpty({ message: "Business Type (Is Life ID) is required." })
  @IsInt({ message: "Business Type (Is Life ID) must be a integer" })
  isLifeLid!: number;

  @IsNotEmpty({ message: "Company Tag ID is required." })
  @IsInt({ message: "Company Tag ID must be an integer." })
  companyTagLid!: number;

  @IsOptional()
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  @IsString({ message: "Insure Code must be a string." })
  @MaxLength(100, { message: "Insure Code must not exceed 100 characters." })
  insureCode?: string;

  @IsOptional()
  @IsInt({ message: "Status ID must be an integer." })
  statusLid!: number;

  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 500) {
      throw new BadRequestException(
        "Insurer remarks must not exceed 500 characters "
      );
    }
    return value?.length === 0 ? null : value;
  })
  remarks?: string;

  @IsOptional()
  @IsInt({ message: "Country ID must be an integer." })
  countryId?: number;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsInt({ message: "Insurer Logo File ID must be an integer." })
  insurerLogoFileId?: number;

  @IsOptional()
  @IsString({ message: "PAN card number must be a string." })
  @MaxLength(20, { message: "PAN card number must not exceed 20 characters." })
  panCardNumber?: string;

  @IsOptional()
  @IsString({ message: "Registration number must be a string." })
  @MaxLength(50, { message: "Registration number must not exceed 50 characters." })
  registrationNo?: string;

  @IsOptional()
  @IsString({ message: "TAN number must be a string." })
  @MaxLength(20, { message: "TAN number must not exceed 20 characters." })
  tanNumber?: string;

  @IsOptional()
  @IsString()
  createdAt?: Date;

  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @ApiProperty({
    description: "List of addresses associated with the insurer",
    type: [CreateAddressDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGstDto)
  gstDetails?: CreateGstDto[];
}
