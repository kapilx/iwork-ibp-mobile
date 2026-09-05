import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";

export class OpportunityDocumentDto {
  @ApiProperty({
    description: "Unique identifier for the document",
    example: 102,
  })
  @IsNotEmpty({ message: "Document ID is required" })
  @IsNumber({}, { message: "Document ID must be a valid number" })
  documentId: number;

  constructor(documentId: number) {
    this.documentId = documentId;
  }
}

export class OpportunityActivityDocumentDto {
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: "Document ID",
    example: 1,
  })
  @IsInt({ message: "Document ID must be a number." })
  @IsNotEmpty({ message: "Document ID is required." })
  @Min(1, {
    message: "Document ID must be positive number.",
  })
  documentId!: number;

  @ApiProperty({
    example: 101,
    description: "The lookup ID for the document type.",
  })
  @IsInt({ message: "Document Type ID must be an integer." })
  @IsOptional()
  documentTypeLid?: number;
}
