import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt } from "class-validator";

export class UpdateCompanyOnboardingMailModeDto {
  @ApiProperty({ description: "Company ID", example: 101 })
  @IsInt()
  companyId!: number;

  @ApiProperty({
    description: "Initial onboarding mail trigger mode",
    example: "manual",
    enum: ["cron", "manual"],
  })
  @IsIn(["cron", "manual"])
  mode!: "cron" | "manual";
}

