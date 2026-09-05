import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from "class-validator";

export class CreateFeatureTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  key!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
