import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class GetEmployeeECardSignedUrlDto {
  @ApiProperty({ example: 197052 })
  @IsInt()
  @Min(1)
  companyId!: number;

  @ApiProperty({ example: "E-111" })
  @IsString()
  @IsNotEmpty()
  companyEmployeeId!: string;
}

export class EmployeeECardSignedUrlResponseDto {
  @ApiProperty({ example: "uploads/e-cards/company/197052/ISBS5516.pdf" })
  key!: string;

  @ApiProperty({ example: "https://example.com/signed-url" })
  signedUrl!: string;

  @ApiProperty({ example: "https://example.com/signed-url" })
  downloadUrl!: string;
}
