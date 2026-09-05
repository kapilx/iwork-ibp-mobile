import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CompanyConfigSubmissionDto {
  @ApiProperty({ description: "Company identifier for which approval is requested" })
  @IsNumber()
  @IsNotEmpty()
  companyId: number;

  @ApiPropertyOptional({ description: "Additional comments for the approver" })
  @IsOptional()
  @IsString()
  comments?: string;
}
