import { ApiProperty } from "@nestjs/swagger";

export class PolicyFaqDto {
  @ApiProperty({
    description: "FAQ ID",
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: "Policy ID",
    example: 12345,
  })
  policyId!: number;

  @ApiProperty({
    description: "Policy Name",
    example: "Health Insurance Premium",
  })
  policyName!: string;

  @ApiProperty({
    description: "FAQ Category",
    example: "Claims",
  })
  category!: string;

  @ApiProperty({
    description: "FAQ Question",
    example: "How do I file a claim?",
  })
  question!: string;

  @ApiProperty({
    description: "FAQ Answer",
    example: "To file a claim, you need to...",
  })
  answer!: string;

  @ApiProperty({
    description: "FAQ display order",
    example: 1,
  })
  displayOrder!: number;

  @ApiProperty({
    description: "FAQ creation date",
    example: "2024-01-15T10:30:00Z",
  })
  createdAt!: string;
}

export class EmployeeFaqsPaginationDto {
  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: "Total number of FAQs",
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 8,
  })
  totalPages!: number;
}

export class GetEmployeeFaqsResponseDto {
  @ApiProperty({
    description: "List of FAQs from employee's mapped policies",
    type: [PolicyFaqDto],
  })
  faqs!: PolicyFaqDto[];

  @ApiProperty({
    description: "Pagination information",
    type: EmployeeFaqsPaginationDto,
  })
  pagination!: EmployeeFaqsPaginationDto;

  @ApiProperty({
    description: "Available categories across all mapped policies",
    example: ["Claims", "Coverage", "Premium", "General"],
    type: [String],
  })
  availableCategories!: string[];

  @ApiProperty({
    description: "List of policy IDs that FAQs are sourced from",
    example: [12345, 67890, 11111],
    type: [Number],
  })
  sourcePolicyIds!: number[];

  @ApiProperty({
    description: "Total number of FAQs across all categories",
    example: 150,
  })
  total!: number;
}