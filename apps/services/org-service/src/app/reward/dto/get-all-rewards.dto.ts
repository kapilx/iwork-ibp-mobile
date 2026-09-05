import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetAllRewardsDto {
  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 10 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiPropertyOptional({ description: "Search by insurer name." })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "field:order, e.g. createdAt:DESC" })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: "Reward category lookup id." })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  rewardCategoryLid?: number;

  @ApiPropertyOptional({ description: "Insurer id." })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  insurerId?: number;

  @ApiPropertyOptional({ enum: ["BUSINESS_MONTH", "INCOME_MONTH"] })
  @IsOptional()
  @IsIn(["BUSINESS_MONTH", "INCOME_MONTH"])
  periodType?: "BUSINESS_MONTH" | "INCOME_MONTH";

  @ApiPropertyOptional({ description: "Range start (YYYY-MM-DD), applied on periodType." })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: "Range end (YYYY-MM-DD), applied on periodType." })
  @IsOptional()
  @IsString()
  to?: string;
}
