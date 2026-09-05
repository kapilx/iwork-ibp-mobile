import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateEnrollmentDependentDto {
  @ApiProperty({ description: "Name of the dependent", example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Relation of the dependent", example: "Spouse" })
  @IsString()
  @IsNotEmpty()
  relation!: string;

  @ApiProperty({
    description: "Date of birth of the dependent",
    example: "1990-01-01",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: "Gender of the dependent",
    example: "Male",
    required: false,
  })
  @IsOptional()
  @IsString()
  gender?: string;
}
