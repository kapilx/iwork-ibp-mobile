import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsBoolean, IsNotEmpty, Min } from "class-validator";

export class BulkUploadFaqDto {
  @ApiProperty({
    description: "Policy ID to associate FAQs with",
    example: 12345,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  policyId!: number;

  @ApiProperty({
    description: "File ID from file_uploads table containing the Excel file",
    example: 67890,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  fileId!: number;

  @ApiProperty({
    description: "Whether to replace all existing FAQs for the policy or append new ones",
    example: false,
    default: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  replaceAll!: boolean;
}