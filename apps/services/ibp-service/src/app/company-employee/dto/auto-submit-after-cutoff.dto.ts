import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsString } from "class-validator";

export class AutoSubmitAfterCutoffDto {
  @ApiProperty({
    example: "2026-04-02",
    description:
      "Enrollment end date (YYYY-MM-DD). Cron will auto-submit for mappings whose enrollmentEndDate equals this date.",
  })
  @IsString()
  @IsDateString()
  triggerDate!: string;
}

