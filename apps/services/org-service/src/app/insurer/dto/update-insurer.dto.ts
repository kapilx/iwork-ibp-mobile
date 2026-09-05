import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from "class-validator";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { UpdateAddressDto } from "../../address/dto/update-address.dto";
import { UpdateGstDto } from "../../company/dto/update-company.dto";

export class UpdateInsurerDto {
  @IsOptional()
  @IsString({ message: "Insurer Name must be a string." })
  @MaxLength(200, { message: "Insurer Name must not exceed 200 characters." })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    if (value?.length === 0) {
      throw new BadRequestException(
        "Insurer Name should not be null or empty."
      );
    }
    return value;
  })
  insurerName?: string;

  @IsOptional()
  @IsString({ message: "Display Name must be a string." })
  @MaxLength(100, { message: "Display Name must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    if (value?.length === 0) {
      throw new BadRequestException(
        "Insurer Display Name should not be null or empty."
      );
    }
    return value;
  })
  displayName?: string;

  @IsOptional()
  @IsInt({ message: "Company Type ID must be an integer." })
  companyTypeLid?: number;

  @IsOptional()
  @IsUrl({}, { message: "Website must be a valid URL." })
  @MaxLength(255, { message: "Website must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  website?: string;

  @IsOptional()
  @IsInt({ message: "Business Type (Is Life ID) must be a integer" })
  isLifeLid!: number;

  @IsOptional()
  @IsInt({ message: "Company Tag ID must be an integer." })
  companyTagLid?: number;

  @IsOptional()
  @IsString({ message: "Insure Code must be a string." })
  @MaxLength(100, { message: "Insure Code must not exceed 100 characters." })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  insureCode?: string;

  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  // @MaxLength(500, { message: "Remarks must not exceed 500 characters." })
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

  @IsInt({ message: "Status ID must be an integer." })
  @IsOptional()
  statusLid?: number;

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
  @IsInt({ message: "Country ID must be an integer." })
  countryId?: number;

  @IsOptional()
  @IsInt({ message: "Updated By must be an integer." })
  updatedBy?: number;

  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @IsOptional()
  @ApiProperty({
    description: "List of addresses associated with the insurer",
    type: [Object],
    required: false,
  })
  address?: UpdateAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGstDto)
  gstDetails?: UpdateGstDto[];
}
