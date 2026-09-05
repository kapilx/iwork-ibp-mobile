import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class GetPolicyLocationsByPoliciesDto {
  @ApiProperty({
    description: "List of policy IDs to get location data across",
    type: [Number],
    example: [699645, 699646, 699647],
  })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  policyIds!: number[];

  @ApiPropertyOptional({
    description: "Optional state name to filter cities",
    example: "Maharashtra",
  })
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
