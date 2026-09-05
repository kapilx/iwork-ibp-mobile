import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateAddressDto } from "../../address/dto/create-address.dto";
export class CreateTpaDto {
  @ApiProperty({
    description: "TPA Name",
    type: String,
    required: true,
    example: "ABC Insurance",
  })
  @IsString({ message: "TPA name must be a string" })
  @IsNotEmpty({ message: "TPA name should not be empty" })
  @MaxLength(200, { message: "TPA name must be at most 200 characters long" })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  tpaName!: string;

  @ApiProperty({
    description: "TPA Display Name",
    type: String,
    required: true,
    example: "ABC Insurance",
  })
  @IsString({ message: "Display name must be a string" })
  @IsNotEmpty({ message: "Display name should not be empty" })
  @MaxLength(100, {
    message: "Display name must be at most 100 characters long",
  })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  displayName!: string;

  @ApiProperty({
    description: "Company Type ID",
    type: Number,
    required: true,
    example: 19,
  })
  @IsNumber({}, { message: "Company Type ID must be a number" })
  @IsNotEmpty({ message: "Company Type ID should not be empty" })
  companyTypeLid!: number;

  @ApiProperty({
    description: "website",
    type: String,
    example: "https://www.example.com",
  })
  @IsOptional()
  @IsUrl({}, { message: "Website must be a valid URL" })
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  website?: string;

  @ApiProperty({
    description: "remarks",
    type: String,
    example: "This is a remark",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a string" })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 500) {
      throw new BadRequestException(
        "Tpa remarks must not exceed 500 characters "
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
  @IsInt({ message: "TPA Logo File ID must be an integer." })
  tpaLogoFileId?: number;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;

  @IsOptional()
  createdBy?: number;

  @IsOptional()
  updatedBy?: number;

  @ApiProperty({
    description: "List of addresses associated with the TPA",
    type: [CreateAddressDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto[];
}
