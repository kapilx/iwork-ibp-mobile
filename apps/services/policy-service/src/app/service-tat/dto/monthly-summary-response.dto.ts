import { ApiProperty } from "@nestjs/swagger";
import type { ApiResponse } from "../../../../service-lib/src/lib/utils/response.utils";
import type {
  MonthlySummaryData,
  MonthlySummaryMonth,
  MonthlySummaryTotals,
} from "../service-tat.types";

export class MonthlySummaryMonthDto implements MonthlySummaryMonth {
  @ApiProperty({ example: "2024-05" })
  month!: string;

  @ApiProperty({ example: 72.5, description: "Weighted marks scored in the month" })
  marksScored!: number;

  @ApiProperty({ example: 90.0, description: "Maximum attainable marks for the month" })
  totalMarks!: number;

  @ApiProperty({
    example: 80.55,
    description: "Percentage of marks scored versus maximum marks",
    format: "float",
  })
  percentage!: number;

  @ApiProperty({
    example: 185,
    description: "Total bucket score (sum of bucket weight * count) for the month",
  })
  totalBucketScore!: number;

  @ApiProperty({ example: 42, description: "Total number of service events in the month" })
  totalEvents!: number;

  @ApiProperty({
    example: "GREEN",
    description:
      "Performance indicator derived from the month percentage (GREEN > 90, YELLOW > 80, ORANGE > 70, RED otherwise)",
  })
  indicator!: MonthlySummaryMonth["indicator"];
}

export class MonthlySummaryTotalsDto implements MonthlySummaryTotals {
  @ApiProperty({ example: 860.5, description: "Cumulative marks scored across the year" })
  marksScored!: number;

  @ApiProperty({ example: 1024.0, description: "Cumulative attainable marks across the year" })
  totalMarks!: number;

  @ApiProperty({
    example: 84.06,
    description: "Overall percentage across the selected year",
    format: "float",
  })
  percentage!: number;

  @ApiProperty({
    example: "YELLOW",
    description:
      "Performance indicator derived from the overall percentage (GREEN > 90, YELLOW > 80, ORANGE > 70, RED otherwise)",
  })
  indicator!: MonthlySummaryTotals["indicator"];
}

export class MonthlySummaryResponseDataDto implements MonthlySummaryData {
  @ApiProperty({ example: 42, description: "Organisation identifier" })
  orgId!: number;

  @ApiProperty({ example: 2024, description: "Calendar year under consideration" })
  year!: number;

  @ApiProperty({
    example: 101,
    nullable: true,
    description: "Optional company identifier when the data is filtered for a company",
  })
  companyId!: number | null;

  @ApiProperty({
    type: () => [MonthlySummaryMonthDto],
    description: "Month-wise Service TAT performance summary",
  })
  months!: MonthlySummaryMonthDto[];

  @ApiProperty({
    type: () => MonthlySummaryTotalsDto,
    description: "Aggregate totals for the requested period",
  })
  totals!: MonthlySummaryTotalsDto;
}

export class MonthlySummaryResponseDto
  implements ApiResponse<MonthlySummaryData>
{
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    example: "Service TAT monthly summary retrieved successfully.",
  })
  message!: string;

  @ApiProperty({ type: () => MonthlySummaryResponseDataDto })
  data!: MonthlySummaryResponseDataDto;
}
