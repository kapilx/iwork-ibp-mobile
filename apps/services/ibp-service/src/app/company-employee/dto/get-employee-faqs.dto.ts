import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsInt, Min, Max, IsNumberString, IsNotEmpty } from "class-validator";

export class GetEmployeeFaqsDto {
  @ApiProperty({
    description: "Employee ID to fetch FAQs for their mapped policies",
    example: "12345",
    type: String,
  })
  @IsNotEmpty()
  @IsNumberString({}, { message: "Employee ID must be a valid numeric string" })
  employeeId!: string;

  @ApiPropertyOptional({
    description: "Category filter for FAQs. Use 'ALL' or leave empty to fetch all categories",
    example: "Claims",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of FAQs per page",
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: "Search term to filter questions and answers",
    example: "claim process",
  })
  @IsOptional()
  @IsString()
  search?: string;
}