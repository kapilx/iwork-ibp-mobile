import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";
import { DEFAULT_VALUES } from "../../../../../service-lib/src/lib/constants";

export class GetEmployeesDto {
  @IsOptional()
  @ApiProperty({
    description: "Field to sort by",
    example: "id",
    required: false,
  })
  sort?: string;

  @IsOptional()
  @ApiProperty({
    description: "Search term for filtering",
    example: "Test",
    required: false,
  })
  search?: string;

  @ApiProperty({
    description:
      "Field to search by (e.g., contactName, companyName, phone, status).",
    example: "companyName",
  })
  @IsOptional()
  searchBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  page?: number = DEFAULT_VALUES.PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  limit?: number = DEFAULT_VALUES.LIMIT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  employeeId?: number;

  @ApiPropertyOptional({
    description: "Comma separated employee ids to append in response list",
    example: "1,2",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? String(value)
          .split(",")
          .map((v) => parseInt(v, 10))
      : undefined
  )
  entityIds?: number[];
}
