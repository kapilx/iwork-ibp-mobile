import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class GetTatBucketsQueryDto {
  @ApiPropertyOptional({ description: "Filter by organisation identifier", type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orgId?: number;

  @ApiPropertyOptional({
    description: "Case-insensitive search on the bucket label",
    example: "Days",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
