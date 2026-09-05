import { IsInt, Min } from "class-validator";

export class ExportPolicyConfigurationDto {
  @IsInt()
  @Min(1)
  sourcePolicyConfigurationId!: number;
}
