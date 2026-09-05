import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO used to update an existing policy configuration. All fields are optional
 * but retain the same validation rules as {@link CreatePolicyConfigurationDto}
 * when provided.
 */
export class UpdatePolicyConfigurationDto {
  @ApiPropertyOptional({
    description: "ID of the company associated with the policy",
    example: 123,
  })
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Lookup ID for the policy type (e.g., GMC, GPA, GTL)",
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  policyTypeLid?: number;

  @ApiPropertyOptional({
    description: "Identifier of the policy this configuration belongs to",
    example: 12,
  })
  @IsNumber()
  @IsOptional()
  policyId?: number;

  @ApiPropertyOptional({
    description: "Lookup ID for the policy configuration status",
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  policyConfiguartionStatusLid?: number;

  @ApiPropertyOptional({
    description: "Current step or stage of the policy configuration process",
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  policyStep?: number;

  @ApiPropertyOptional({
    description: "Additional configuration details for the policy",
    example: {
      coverage: "Full",
      premium: 10000,
      deductible: 500,
    },
  })
  @IsOptional()
  policyConfiguration?: unknown;
}
