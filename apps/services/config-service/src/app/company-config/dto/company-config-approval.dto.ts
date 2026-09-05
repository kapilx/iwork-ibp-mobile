import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CompanyConfigApprovalDto {
  @ApiProperty({ description: "Company identifier whose configuration is being approved" })
  @IsNumber()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: "Decision for the company configuration",
    enum: ["APPROVED", "REJECTED"],
  })
  @IsString()
  @IsIn(["APPROVED", "REJECTED"])
  status: "APPROVED" | "REJECTED";

  @ApiPropertyOptional({ description: "Comments supporting the approval decision" })
  @IsOptional()
  @IsString()
  comments?: string;
}
