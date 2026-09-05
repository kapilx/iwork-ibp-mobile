import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Allow, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class EmployeePersonalDocumentDto {
  @Allow()
  @ApiProperty({ example: 123 })
  id!: number;

  @Allow()
  @ApiPropertyOptional({ example: "uploads/company/123/123.pdf" })
  fileKey?: string;

  @Allow()
  @ApiPropertyOptional({ example: "Aadhaar Card.pdf" })
  fileName?: string;

  @Allow()
  @ApiPropertyOptional({ example: "1 MB" })
  fileSize?: string;

  @Allow()
  @ApiPropertyOptional({ example: "company" })
  companyType?: string;

  @Allow()
  @ApiPropertyOptional({ example: -1 })
  documentTypeLid?: number;

  @Allow()
  @ApiPropertyOptional({ example: 204258 })
  companyId?: number;
}

export class UpsertEmployeePersonalDocumentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeePersonalDocumentDto)
  @ApiProperty({ type: [EmployeePersonalDocumentDto] })
  documentIds!: EmployeePersonalDocumentDto[];
}

export class EmployeePersonalDocumentsResponseDto {
  @ApiProperty({ example: 204258 })
  employeeId!: number;

  @ApiProperty({ type: [EmployeePersonalDocumentDto] })
  documentIds!: EmployeePersonalDocumentDto[];
}
