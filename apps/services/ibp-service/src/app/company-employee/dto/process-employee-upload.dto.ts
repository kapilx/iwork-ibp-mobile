import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class ProcessEmployeeUploadDto {
  @ApiProperty({ example: 123, required: true })
  @IsNumber()
  documentId!: number;
}
