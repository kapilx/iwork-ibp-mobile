import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class SelectedLocationDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  address_1: string;
}

/** One Offers & Benefits item, scoped to whichever configId the portal PUT targets. */
export class OfferBenefitPayloadDto {
  /** Existing item id — omit when adding a new item. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty()
  @IsUrl({ require_protocol: true, require_tld: false })
  redirectionUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  imageFileId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

class BrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  companyLogoFileId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  loginWelcomeMessage?: Record<string, any>;
}

export class UpdateCompanyPortalConfigDto {
  @ApiProperty()
  @IsNotEmpty()
  companyId: number | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  companyDatabaseId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  companyPortalConfig?: {
    authentication?: Record<string, any>[];
    branding?: BrandingDto;
    [key: string]: any;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  companyPortalDashboardConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  companyPortalWellnessConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  companyPolicyConfig?: Record<string, any>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  dependentRelationConfig?: Record<string, any>;

  /**
   * Offers & Benefits items, scoped to this specific configId (or company-level
   * when configId is omitted). Optional/additive — when omitted, existing
   * items are left untouched.
   */
  @ApiPropertyOptional({ type: [OfferBenefitPayloadDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferBenefitPayloadDto)
  offersAndBenefits?: OfferBenefitPayloadDto[];

  /** Master enable/disable for the Offers & Benefits section, scoped to this configId (or company-level when omitted). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  offersAndBenefitsEnabled?: boolean;

  @ApiPropertyOptional({ type: [SelectedLocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedLocationDto)
  selectedLocationIds?: SelectedLocationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  inheritedCompanyIds?: number[];

  /** When provided, the PUT targets this specific portal config by id rather than upserting by companyId. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  configId?: number;

  /** Internal flag — prevents infinite recursion when syncing to domain group members. Never sent from the frontend. */
  _skipSync?: boolean;

  /** Internal flag — forces INSERT of a new portal config row even if one exists for companyId. Never sent from the frontend. */
  _forceCreate?: boolean;

  @ApiPropertyOptional({ enum: ["SES", "SENDGRID"], description: "Mail provider for IBP emails. Defaults to SES." })
  @IsOptional()
  @IsString()
  mailServiceType?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      "CC email addresses applied to eligible notification emails sent for this domain (e.g. Teamleasebackup@indiainsure.com for all TeamLease domains).",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmailAddresses?: string[];
}
