import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Min } from "class-validator";
import { SERVICE_TAT_ERRORS } from "../service-tat.constants";

export class MonthlyServiceDetailsQueryDto {
  @ApiProperty({
    description: "Month to report in YYYY-MM format",
    example: "2024-05",
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: SERVICE_TAT_ERRORS.INVALID_MONTH_FORMAT,
  })
  month!: string;

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
