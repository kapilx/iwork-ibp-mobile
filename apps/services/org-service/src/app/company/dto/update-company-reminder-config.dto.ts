import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsInt, Max, Min } from "class-validator";

export class UpdateCompanyReminderConfigDto {
  @ApiProperty({
    description: "Days before an installment is due to send a reminder email",
    example: [0, 1, 3, 7],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(90, { each: true })
  installmentReminderDays!: number[];

  @ApiProperty({
    description: "Days before a policy expires to send a reminder email",
    example: [1, 3, 7, 15, 30],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(90, { each: true })
  policyExpiryReminderDays!: number[];

  @ApiProperty({
    description: "Days before an opportunity expires to notify the owner",
    example: [1, 3, 7],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(90, { each: true })
  opportunityCloseToExpiryReminderDays!: number[];
}
