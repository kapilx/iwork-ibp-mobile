import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { UpdateAddressDto } from "../../address/dto/update-address.dto";
import { BadRequestException } from "@nestjs/common";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";

export class UpdateBrokerDto {
  @IsOptional()
  @ApiProperty({
    description: "Name of the broker organization (e.g., IIRM India)",
    example: "ABC Brokers Pvt Ltd",
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200, { message: "Broker name must not exceed 200 characters" })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    if (value?.length === 0) {
      throw new BadRequestException("Broker Name should not be null or empty.");
    }
    return value;
  })
  brokerName!: string;

  @IsOptional()
  @ApiProperty({
    description: "Display name for the broker organization",
    example: "ABC Brokers",
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100, { message: "Display name must not exceed 100 characters" })
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    if (value?.length === 0) {
      throw new BadRequestException(
        "Display name should not be null or empty."
      );
    }
    return value;
  })
  displayName!: string;

  @IsOptional()
  @ApiProperty({
    description: "Type of the company (e.g., Private, Public)",
    example: 19,
  })
  @IsInt()
  companyTypeLid?: number;

  @IsOptional()
  @ApiProperty({
    description: "Website URL of the broker organization",
    example: "https://www.abcbrokers.com",
    required: false,
  })
  @IsUrl({}, { message: "Website must be a valid URL" })
  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  website?: string;

  @IsOptional()
  @ApiProperty({
    description: "Additional comments or details about the broker",
    example: "Leading insurance broker in the region",
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  // @MaxLength(500, { message: "Remarks must not exceed 500 characters" })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 500) {
      throw new BadRequestException(
        "Broker remarks must not exceed 500 characters "
      );
    }
    return value?.length === 0 ? null : value;
  })
  remarks?: string;

  @IsOptional()
  @IsInt({ message: "Status ID must be an integer." })
  statusLid?: number;

  @IsOptional()
  @IsInt({ message: "Country ID must be an integer." })
  countryId?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @IsOptional()
  @ApiProperty({
    description: "List of addresses associated with the broker",
    type: [UpdateAddressDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto[];
}
