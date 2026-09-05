import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class GetPolicyFeatureDocumentsQueryDto {
  @ApiProperty({
    description: "Employee ID from policy_enrollment_employee_policy_map",
    example: 123,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  employeeId!: number;

  @ApiPropertyOptional({
    description:
      "Free-text search across document title, file name, policy name, and contextual subtitle",
    example: "policy certificate",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "High-level document category filter used by My Documents",
    enum: ["all", "policies", "claims", "life_events", "personal_documents", "support_tickets", "mail", "other"],
    example: "policies",
  })
  @IsOptional()
  @IsIn(["all", "policies", "claims", "life_events", "personal_documents", "support_tickets", "mail", "other"])
  category?: string;

  @ApiPropertyOptional({
    description: "Document type filter used by My Documents",
    enum: [
      "all",
      "policy_certificate",
      "claim_form",
      "life_event_proof",
      "personal_document",
      "support_ticket",
      "communication",
      "document",
    ],
    example: "policy_certificate",
  })
  @IsOptional()
  @IsIn([
    "all",
    "policy_certificate",
    "claim_form",
    "life_event_proof",
    "personal_document",
    "support_ticket",
    "communication",
    "document",
  ])
  documentType?: string;

  @ApiPropertyOptional({
    description: "Sort documents by latest or oldest document activity date",
    enum: ["latest", "oldest"],
    example: "latest",
  })
  @IsOptional()
  @IsIn(["latest", "oldest"])
  sortOrder?: "latest" | "oldest";
}
