import { ApiProperty } from "@nestjs/swagger";

export class BulkUploadFaqResponseDto {
  @ApiProperty({
    description: "Upload record ID",
    example: 123,
  })
  uploadId!: number;

  @ApiProperty({
    description: "Number of FAQs processed from the file",
    example: 25,
  })
  processedCount!: number;

  @ApiProperty({
    description: "Number of FAQs successfully created",
    example: 23,
  })
  successCount!: number;

  @ApiProperty({
    description: "Number of FAQs that failed to process",
    example: 2,
  })
  errorCount!: number;

  @ApiProperty({
    description: "List of errors encountered during processing",
    example: ["Row 3: Question field is required", "Row 5: Category field is too long"],
    type: [String],
  })
  errors!: string[];

  @ApiProperty({
    description: "Processing status",
    example: "COMPLETED",
  })
  status!: string;

  @ApiProperty({
    description: "Whether existing FAQs were replaced",
    example: false,
  })
  replacedExisting!: boolean;
}