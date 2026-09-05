import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class PolicyScopeDto {
  @ApiProperty()
  @IsNumber()
  policyId: number;

  /** Empty or omitted = all locations for this policy */
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  addressIds?: number[];
}

export class ScopeEntryDto {
  @ApiProperty()
  @IsNumber()
  companyId: number;

  /** Empty or omitted = ALL_POLICIES mode (all enrolled policies visible for this company) */
  @ApiPropertyOptional({ type: [PolicyScopeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyScopeDto)
  policies?: PolicyScopeDto[];

  /** Location IDs visible for this company (independent of policy scope) */
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  locationIds?: number[];
}

export class UpsertConfigScopeDto {
  @ApiProperty({ type: [ScopeEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScopeEntryDto)
  scope: ScopeEntryDto[];
}
