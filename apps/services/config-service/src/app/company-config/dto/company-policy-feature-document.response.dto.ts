import { ApiProperty } from "@nestjs/swagger";

export class CompanyPolicyFeatureDocumentResponseDto {
  @ApiProperty({ description: "Company ID", example: 343979 })
  companyId!: number;

  @ApiProperty({
    description: "Policy feature document ID",
    example: 12345,
    nullable: true,
  })
  documentId!: number | null;

  @ApiProperty({
    description: "Uploaded file name",
    example: "PolicyFeatures.pdf",
    nullable: true,
  })
  fileName!: string | null;

  @ApiProperty({
    description: "Document upload timestamp",
    example: "2026-03-31T10:30:00.000Z",
    nullable: true,
  })
  uploadedAt!: Date | null;

  @ApiProperty({
    description: "Uploaded by user name",
    example: "Abhilash Kumar",
    nullable: true,
  })
  uploadedBy!: string | null;
}
