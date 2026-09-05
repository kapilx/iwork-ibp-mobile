import { ApiProperty } from "@nestjs/swagger";
import { CreateAddressDto } from "../../address/dto/create-address.dto";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { BadRequestException } from "@nestjs/common";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";

export class CreateBrokerDto {
  @ApiProperty({
    description: "Name of the broker organization (e.g., IIRM India)",
    example: "ABC Brokers Pvt Ltd",
    maxLength: 200,
  })
  @IsNotEmpty({ message: "Broker Name is required." })
  @IsString()
  @MaxLength(200, { message: "Broker name must not exceed 200 characters" })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  brokerName!: string;

  @ApiProperty({
    description: "Display name for the broker organization",
    example: "ABC Brokers",
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Display name is required." })
  @IsString()
  @MaxLength(100, { message: "Display name must not exceed 100 characters" })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName!: string;

  @ApiProperty({
    description: "Type of the company (e.g., Private, Public)",
    example: 19,
  })
  @IsInt()
  @IsNotEmpty({ message: "company Type is required." })
  companyTypeLid!: number;

  @ApiProperty({
    description: "Website URL of the broker organization",
    example: "https://www.abcbrokers.com",
    required: false,
  })
  @IsUrl({}, { message: "Website must be a valid URL" })
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  @IsOptional()
  website?: string;

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
  statusLid!: number;

  @IsOptional()
  @IsInt({ message: "Country ID must be an integer." })
  countryId?: number;

  @IsOptional()
  @IsInt({ message: "Nature of broking business ID must be an integer." })
  natureOfBrokingBussinessLid?: number;

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

  @ApiProperty({
    description: "List of addresses associated with the broker",
    type: [CreateAddressDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto[];
}
