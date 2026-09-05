import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

// Disable/enable a template — default (configId omitted) or a specific
// company/domain override (configId given) — without touching its content
// or approval status. See findTemplateMapping in notification.repository.ts:
// a disabled row is now always excluded at send time.
export class UpdateTemplateStatusDto {
  @ApiProperty({
    description: "true to activate (recipients receive this email again), false to disable it",
    example: false,
  })
  @IsBoolean()
  active!: boolean;

  @ApiPropertyOptional({
    description:
      "company_portal_configuration.id whose override to toggle. Omit to toggle the shared default itself. " +
      "Mutually exclusive with companyId.",
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  configId?: number;

  @ApiPropertyOptional({
    description:
      "company.id whose company-wide override to toggle (iwork/internal-CRM event types, no domain " +
      "concept). Omit to toggle the shared default itself. Mutually exclusive with configId.",
    example: 190550,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;
}

export class TemplateStatusResponseDto {
  @ApiProperty({ description: "The default template's ID", example: 53 })
  defaultTemplateId!: number;

  @ApiPropertyOptional({ description: "Present when this toggled a specific config's override" })
  configId?: number;

  @ApiPropertyOptional({ description: "Present when this toggled a specific company's override" })
  companyId?: number;

  @ApiProperty({ description: "The row's active status after this call" })
  isActive!: boolean;
}
