import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateLookUpDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lookUpName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lookUpKey!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lookUpValueKey!: string;

  @IsNotEmpty()
  @IsString()
  lookUpValue!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsInt()
  lookUpOrder!: number;

  @IsOptional()
  @IsInt()
  status!: number;
}
