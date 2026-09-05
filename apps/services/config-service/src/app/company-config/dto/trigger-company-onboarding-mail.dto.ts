import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class TriggerCompanyOnboardingMailDto {
  @ApiProperty({ description: "Company ID", example: 101 })
  @IsInt()
  companyId!: number;

  @ApiPropertyOptional({
    description:
      "Subdomain of the portal being triggered. When provided, only employees enrolled in policies scoped to this domain are notified.",
    example: "teamleasegodigit",
  })
  @IsOptional()
  @IsString()
  subDomain?: string;
}
