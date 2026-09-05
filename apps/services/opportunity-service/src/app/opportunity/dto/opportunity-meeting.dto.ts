import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from "class-validator";

export class ParticipantsDto {
  @ApiPropertyOptional({
    description: "Company Contact Person IDs",
    type: [Number],
  })
  @IsArray({ message: "Company Contact Person must be an array." })
  @IsOptional()
  @IsInt({
    each: true,
    message: "Each Company Contact Person ID must be a number.",
  })
  companyContactPerson?: number[] | null;

  @ApiPropertyOptional({ description: "Employee IDs", type: [Number] })
  @IsArray({ message: "Employees must be an array." })
  @IsOptional()
  @IsInt({ each: true, message: "Each Employee ID must be a number." })
  employees?: number[] | null;
}

export class TpaParticipantsDto {
  @ApiProperty({ description: "TPA ID", example: 211 })
  @IsInt({ message: "TPA ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "TPA ID must be a positive number.",
  })
  tpaId?: number;

  @ApiProperty({
    description: "TPA Contact Person IDs",
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "TPA Contact Person must be an array." })
  @ArrayNotEmpty({ message: "At least one TPA Contact Person is required." })
  @IsInt({
    each: true,
    message: "Each TPA Contact Person ID must be a number.",
  })
  tpaContactPerson?: number[];
}

export class InsurerParticipantsDto {
  @ApiProperty({ description: "Insurer ID", example: 357 })
  @IsInt({ message: "Insurer ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Insurer ID must be a positive number.",
  })
  insurerId?: number;

  @ApiProperty({
    description: "Insurer Contact Person IDs",
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "Insurer Contact Person must be an array." })
  @ArrayNotEmpty({
    message: "At least one Insurer Contact Person is required.",
  })
  @IsInt({
    each: true,
    message: "Each Insurer Contact Person ID must be a number.",
  })
  insurerContactPerson?: number[];
}
