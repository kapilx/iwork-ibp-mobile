import { IsOptional, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateDocumentDto {
  @ApiProperty({ description: "ID of the document map", required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: "Document ID associated with the contact",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Document ID must be a number." })
  documentId?: number;
}
