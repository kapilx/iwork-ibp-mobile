import { ApiProperty } from "@nestjs/swagger";

export class ClaimTemplateResponseDto {
  @ApiProperty({ example: 123 })
  documentId!: number;

  @ApiProperty({ example: "claims-corporate-TEMPLATE.xlsx" })
  fileName!: string;

  constructor(data?: { documentId: number; fileName: string }) {
    if (!data) return;
    this.documentId = data.documentId;
    this.fileName = data.fileName;
  }
}
