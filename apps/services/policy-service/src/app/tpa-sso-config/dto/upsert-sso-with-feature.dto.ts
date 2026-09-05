import { IsInt, IsNotEmpty, IsOptional, IsString, Min, MaxLength } from "class-validator";
import { UpsertTpaSsoConfigDto } from "./upsert-tpa-sso-config.dto";

// Combines the tpa_external_feature_config fields (the IBP button) with the SSO
// crypto config fields, so both are written in a single DB transaction — either
// both rows land, or neither does. Fixes a real bug: saving these as two separate
// requests could leave a feature-config row with no matching SSO config (or vice
// versa) if the second request failed after the first had already committed.
export class UpsertSsoWithFeatureDto extends UpsertTpaSsoConfigDto {
  @IsInt()
  @Min(1)
  featureTypeId!: number;

  // Existing tpa_external_feature_config row id, if editing one. Omit to create.
  @IsOptional()
  @IsInt()
  featureConfigId?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  buttonLabel!: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
