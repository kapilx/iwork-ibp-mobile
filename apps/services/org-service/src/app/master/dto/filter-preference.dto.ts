import { PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class TableSettingItemDto {
  @Type(() => Number)
  @IsInt({ message: "Index must be an integer." })
  index!: number;

  @IsString({ message: "Name must be a string." })
  name!: string;

  @IsBoolean({ message: "Hide must be a boolean." })
  hide!: boolean;
}
export class CreateFilterPreferenceDto {
  @IsNotEmpty({ message: "Entity name is required." })
  @IsString({ message: "Entity name must be a string." })
  @MaxLength(100, {
    message: "Entity name must not exceed 100 characters.",
  })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  entity!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "User ID must be a valid integer." })
  userId?: number;

  @IsOptional()
  @IsString({ message: "Filter name must be a string." })
  @MaxLength(255, { message: "Filter name must not exceed 255 characters." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  filterName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Filter type must be a valid integer." })
  filterTypeLid?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Default filter must be a valid integer." })
  defaultFilterLid?: number;

  @IsNotEmpty({ message: "Filter is required." })
  @IsObject({ message: "Filter must be a valid JSON object." })
  filterJson!: object;

  @IsArray({ message: "Table setting must be an array." })
  @ValidateNested({ each: true })
  @Type(() => TableSettingItemDto)
  tableSettingJson!: TableSettingItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusLid?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  updatedBy?: number;
}

export class UpdateFilterPreferenceDto extends PartialType(
  CreateFilterPreferenceDto
) {}
