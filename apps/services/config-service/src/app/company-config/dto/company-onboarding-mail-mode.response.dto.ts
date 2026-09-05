import { ApiProperty } from "@nestjs/swagger";

export class CompanyOnboardingMailModeResponseDto {
  @ApiProperty({ example: 101 })
  companyId!: number;

  @ApiProperty({ example: "manual", enum: ["cron", "manual"] })
  mode!: "cron" | "manual";
}
