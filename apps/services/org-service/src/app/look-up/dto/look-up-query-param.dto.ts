import { IsOptional, IsEnum, IsNumber, IsString, Max } from "class-validator";
import { Transform } from "class-transformer";
import { DEFAULT_VALUES } from "../../../../../service-lib/src/lib/constants";

export class GetLookUpsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page: number = DEFAULT_VALUES.PAGE;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit: number = DEFAULT_VALUES.LIMIT;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  searchId?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"], {
    message: "sortOrder must be either ASC or DESC",
  })
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  searchBy?: string;

  @IsOptional()
  @IsString()
  lookUpName?: string;

  @IsOptional()
  @IsString()
  roleKey?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value
      ? String(value)
          .split(",")
          .map((v) => parseInt(v, 10))
      : undefined
  )
  entityIds?: number[];
}
