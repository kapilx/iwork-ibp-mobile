import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";

export class PolicyComponentUploadDto {
  @ApiProperty({
    description: "File ID from file_uploads table containing the Excel file",
    example: 12345,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  fileId!: number;

  @ApiProperty({
    description: "Optional policy_id to restrict processing to a single policy",
    example: 67890,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  onlyPolicyId?: number;
}
