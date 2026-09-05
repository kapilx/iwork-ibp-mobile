import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNumber, IsOptional } from "class-validator";

export class ClaimUploadData {
  @IsNumber()
  fileId!: number;

  @IsNumber()
  @IsOptional()
  policyId?: number;

  @IsOptional()
  @IsNumber()
  tpaId?: number;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  claimsUploadDate!: Date;

  @IsOptional()
  @IsNumber()
  totalClaims?: number;
}
