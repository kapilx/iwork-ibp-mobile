import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsString, Min } from "class-validator";

export class GetServiceScoreChartQueryDto {
  @ApiProperty({
    description: "Company identifier to fetch the Service Score chart for.",
    example: 101,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId!: number;

  @ApiPropertyOptional({
    description:
      "Financial year to chart. Defaults to the current financial year when omitted (e.g. no financial year selected in Smart Search).",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  financialYear?: number;

  @ApiPropertyOptional({
    description:
      "Quarter to filter (Q1-Q4). Ignored when `month` is also provided.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Month name to filter (January-December).",
    example: "April",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description:
      "Explicit range start date. Takes effect only when financialYear/quarter/month are all omitted.",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description:
      "Explicit range end date. Takes effect only when financialYear/quarter/month are all omitted.",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
