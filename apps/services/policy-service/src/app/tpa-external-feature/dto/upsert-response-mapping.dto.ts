import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class UpsertResponseMappingDto {
  @IsInt()
  @Min(1)
  @Max(2)
  step: number;

  @IsString()
  @IsNotEmpty()
  responseKey: string;

  @IsString()
  @IsIn(["PLACEHOLDER", "STANDARD_KEY", "DB_COLUMN"])
  targetType: string;

  @IsString()
  @IsNotEmpty()
  outputKey: string;

  @IsString()
  @IsOptional()
  targetTable?: string | null;

  @IsBoolean()
  @IsOptional()
  isAuthToken?: boolean;

  @IsBoolean()
  @IsOptional()
  isPrimaryFk?: boolean;

  @IsObject()
  @IsOptional()
  transform?: Record<string, any> | null;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
