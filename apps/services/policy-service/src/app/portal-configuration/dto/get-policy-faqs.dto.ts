import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { IsOptional, IsString, IsArray, IsInt, Min, Max, IsNumberString, IsNotEmpty } from "class-validator";

export class GetPolicyFaqsDto {
  @ApiProperty({
    description: "Policy ID to fetch FAQs for",
    example: "67890",
    type: String,
  })
  @IsNotEmpty()
  @IsNumberString({}, { message: "Policy ID must be a valid numeric string" })
  policyId!: string;

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