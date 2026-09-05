import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";
import { IsOptional, IsString } from "class-validator";

export class GetAllBrokersDto {
  @IsOptional()
  @ApiProperty({
    description: "Page number for pagination",
    example: 1,
    required: false,
  })
  page?: number = DEFAULT_VALUES.PAGE;

  @IsOptional()
  @ApiProperty({
    description: "Number of records per page(by default limit is 10 records)",
    example: 10,
    required: false,
  })
  limit?: number = DEFAULT_VALUES.LIMIT;

  @IsOptional()
  @ApiProperty({
    description: "Field to sort by",
    example: "id",
    required: false,
  })
  sort?: string = DEFAULT_VALUES.SORT_BY;

  @IsOptional()
  @ApiProperty({
    description: "Search term for filtering",
    example: "Test",
    required: false,
  })
  search?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., brokerName).",
    example: "test",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;
}
