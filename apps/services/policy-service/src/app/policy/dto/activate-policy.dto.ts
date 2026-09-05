import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class ActivatePolicyDto {
  @ApiPropertyOptional({
    description:
      "Flag indicating if the policy should be activated. Defaults to true when omitted.",
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActivate?: boolean;
}
