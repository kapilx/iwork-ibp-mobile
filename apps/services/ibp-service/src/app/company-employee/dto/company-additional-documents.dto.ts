import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CompanyAdditionalDocumentDto {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiPropertyOptional({ example: "Additional Document.pdf" })
  name?: string;

  @ApiPropertyOptional({ example: "Additional Document.pdf" })
  fileName?: string;

  @ApiPropertyOptional({ example: "uploads/e-cards/company/123/123.pdf" })
  filePath?: string;

  @ApiPropertyOptional({ example: "1 MB" })
  fileSize?: string;

  @ApiPropertyOptional({ example: "2026-04-20T07:28:25.000Z" })
  uploadedAt?: string;

  @ApiPropertyOptional({ example: "V Ramakrishna" })
  uploadedBy?: string;
}

export class CompanyAdditionalDocumentsResponseDto {
  @ApiProperty({ example: 101 })
  companyId!: number;

  @ApiProperty({ type: [CompanyAdditionalDocumentDto] })
  documentIds!: CompanyAdditionalDocumentDto[];
}
