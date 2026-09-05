import { IsString, IsBoolean, IsOptional, Matches } from "class-validator";

export class UpdateCronConfigDto {
  @IsOptional()
  @IsString()
  @Matches(/^(\S+\s){4}\S+$/, {
    message:
      "Invalid cron expression format. Expected format: minute hour day month dayOfWeek",
  })
  cronExpression?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
