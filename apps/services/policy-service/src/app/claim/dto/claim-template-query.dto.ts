import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ClaimTemplateQueryDto {
  @ApiPropertyOptional({
    description: "Claim type to filter the template fields.",
    example: "Corporate",
  })
  @IsOptional()
  @IsString()
  claimType?: string;

  @ApiPropertyOptional({
    description: "TPA ID to generate template based on active mappings.",
    example: 123,
  })
  @IsOptional()
  tpaId?: string;


  @ApiPropertyOptional({
    description: "Policy ID to generate template based on active mappings.",
    example: 123,
  })
  @IsOptional()
  policyId?: string;
}
