import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CompanyHierarchyResponseDto {
  @ApiProperty({ description: "Unique identifier of the company" })
  companyId: number;

  @ApiProperty({ description: "Display name of the company" })
  companyName: string;

  @ApiPropertyOptional({
    description: "Explicit display name of the company, if configured",
    nullable: true,
  })
  displayName?: string | null;
}

export class CompanyHierarchyListResponseDto {
  @ApiProperty({
    description: "List of companies that match the requested filters.",
    type: [CompanyHierarchyResponseDto],
  })
  data: CompanyHierarchyResponseDto[];

  @ApiProperty({
    description: "Total number of companies that match the requested filters.",
  })
  count: number;
}
