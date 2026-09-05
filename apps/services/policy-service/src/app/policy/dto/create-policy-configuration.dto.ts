import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreatePolicyConfigurationDto {
  @ApiProperty({
    description: "ID of the company associated with the policy",
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  companyId!: number;

  @ApiProperty({
    description: "Lookup ID for the policy type (e.g., GMC, GPA, GTL)",
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  policyTypeLid!: number;

  @ApiProperty({
    description: "Identifier of the policy this configuration belongs to",
    example: 12,
  })
  @Type(() => Number)
  @IsNumber()
  policyId!: number;

  @ApiProperty({
    description: "Lookup ID for the policy configuration status",
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  policyConfiguartionStatusLid!: number;

  @ApiProperty({
    description: "Current step or stage of the policy configuration process",
    example: 3,
  })
  @Type(() => Number)
  @IsNumber()
  policyStep!: number;

  @ApiProperty({
    description: "Additional configuration details for the policy",
    example: {
      coverage: "Full",
      premium: 10000,
      deductible: 500,
    },
    required: false,
  })
  @IsOptional()
  policyConfiguration?: unknown;
}
