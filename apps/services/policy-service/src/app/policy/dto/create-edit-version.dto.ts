import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateEditVersionDto {
  @ApiProperty({
    description: "ID of the policy for which to create an edit version",
    example: 649739,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  policyId!: number;

  @ApiProperty({
    description: "Policy configuration data for the edit version",
    example: {
      coverage: "Full",
      premium: 10000,
      deductible: 500,
      benefits: ["Medical", "Dental", "Vision"],
    },
    required: true,
  })
  @IsNotEmpty()
  policyConfiguration!: unknown;

  @ApiProperty({
    description: "Optional remarks for the edit version creation",
    example: "Updated premium rates and added new benefits",
    required: false,
  })
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    description: "Current step or stage of the policy configuration process",
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  policyStep?: number;
}
