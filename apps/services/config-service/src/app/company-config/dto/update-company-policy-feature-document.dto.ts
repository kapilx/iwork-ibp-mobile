import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateCompanyPolicyFeatureDocumentDto {
  @ApiProperty({ description: "Company ID", example: 343979 })
  @IsNumber()
  @IsNotEmpty()
  companyId!: number;

  @ApiProperty({ description: "Policy feature document ID", example: 12345 })
  @IsNumber()
  @IsNotEmpty()
  documentId!: number;
}
