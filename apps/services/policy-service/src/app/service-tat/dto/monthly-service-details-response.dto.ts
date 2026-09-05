import { ApiProperty } from "@nestjs/swagger";
import type { ApiResponse } from "../../../../service-lib/src/lib/utils/response.utils";
import type {
  MonthlyServiceDetailsData,
  MonthlyServiceDetailsMonth,
  MonthlyServiceDetailsTatBucket,
} from "../service-tat.types";

export class MonthlyServiceDetailsTatBucketDto
  implements MonthlyServiceDetailsTatBucket
{
  @ApiProperty({
    example: "tat1",
    description: "Identifier for the TAT bucket",
  })
  id!: string;

  @ApiProperty({
    example: "0–5 days",
    description: "Display name for the bucket",
  })
  label!: string;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: "Number of events recorded in the bucket",
  })
  count!: number | null;
}

export class MonthlyServiceDetailsMonthDto
  implements MonthlyServiceDetailsMonth
{
  @ApiProperty({ example: 101, description: "Service identifier" })
  id!: number;

  @ApiProperty({ example: "Motor Claims" })
  serviceName!: string;

  @ApiProperty({
    example: 280,
    nullable: true,
    description: "Total number of events recorded for the service",
  })
  totalNumberOfEvents!: number | null;

  @ApiProperty({
    example: 50,
    nullable: true,
    description:
      "Aggregate score computed from compliant events and their TAT weights",
  })
  scored!: number | null;

  @ApiProperty({
    example: 10,
    nullable: true,
    description: "Configured weightage for the service, if available",
  })
  wtg!: number | null;

  @ApiProperty({
    example: 1,
    nullable: true,
    description:
      "Weighted score derived from the service weightage configuration",
  })
  wtg_score!: number | null;

  @ApiProperty({
    type: () => [MonthlyServiceDetailsTatBucketDto],
    description: "Breakdown of TAT events by bucket",
  })
  tatBuckets!: MonthlyServiceDetailsTatBucketDto[];
}

export class MonthlyServiceDetailsResponseDataDto
  implements MonthlyServiceDetailsData
{
  @ApiProperty({ example: 42 })
  orgId!: number;

  @ApiProperty({ example: "2024-05" })
  month!: string;

  @ApiProperty({ example: 101, nullable: true })
  companyId!: number | null;

  @ApiProperty({ type: () => [MonthlyServiceDetailsMonthDto] })
  months!: MonthlyServiceDetailsMonthDto[];
}

export class MonthlyServiceDetailsResponseDto
  implements ApiResponse<MonthlyServiceDetailsData>
{
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    example: "Service TAT monthly service details retrieved successfully.",
  })
  message!: string;

  @ApiProperty({ type: () => MonthlyServiceDetailsResponseDataDto })
  data!: MonthlyServiceDetailsResponseDataDto;
}
