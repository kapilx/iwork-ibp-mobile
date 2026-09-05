import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class MonthlySummaryQueryDto {
  @ApiProperty({ description: "Calendar year (YYYY)", example: 2024 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiProperty({
    description: "Optional company identifier to filter results",
    example: 101,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;
}
