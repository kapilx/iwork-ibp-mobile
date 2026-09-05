import {
  IsOptional,
  IsString,
  IsInt,
  IsDate,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
export class UpdateChildDetailsDto {
  @ApiProperty({ description: "ID of the child details", required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsInt()
  contactDetailsId?: number;

  @ApiProperty({ description: "Child Gender of the contact", required: false })
  @IsOptional()
  @IsInt({ message: "Child Gender should be a number" })
  childGender?: number;

  @ApiProperty({ description: "child Name", required: false })
  @IsOptional()
  @IsString({ message: "Child name should be a string" })
  @MaxLength(100, { message: "Child name must not exceed 100 characters" })
  childName?: string;

  @ApiProperty({ description: "Child Date of Birth", required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Child date of birth should be a date" })
  childDob?: Date;

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
}
