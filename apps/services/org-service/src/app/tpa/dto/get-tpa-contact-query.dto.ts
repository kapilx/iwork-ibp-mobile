import { IsOptional, IsEnum, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class GetTpaContactsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(
    [
      "id",
      "firstName",
      "displayName",
      "companyId",
      "department",
      "designation",
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy",
    ],
    { message: "sortBy must be a valid column name" }
  )
  sortBy:
    | "id"
    | "firstName"
    | "displayName"
    | "companyId"
    | "department"
    | "designation"
    | "createdAt"
    | "updatedAt"
    | "createdBy"
    | "updatedBy";

  @IsOptional()
  @IsEnum(["ASC", "DESC"], {
    message: "sortOrder must be either ASC or DESC",
  })
  sortOrder: "ASC" | "DESC" = "ASC";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  limit: number;

  @IsOptional()
  @IsString({ message: "search by must be a string" })
  searchBy?: string;
}
