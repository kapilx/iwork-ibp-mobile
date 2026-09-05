import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class SsoFieldMappingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalFieldName!: string;

  // STATIC | POLICY | EMPLOYEE (fast-path) | any real table name — resolved
  // generically at runtime (see generic-field-resolver.util.ts), so this isn't
  // restricted to a fixed enum.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceField?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  staticValue?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpsertTpaSsoConfigDto {
  @IsInt()
  @Min(1)
  tpaId!: number;

  @IsString()
  @IsNotEmpty()
  portalUrl!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ssoKeyEnvName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ssoIvEnvName?: string | null;

  @IsOptional()
  @IsIn(["utf8", "base64"])
  ssoKeyEncoding?: "utf8" | "base64";

  @IsOptional()
  @IsIn(["PKCS7", "ISO10126"])
  ssoPadding?: "PKCS7" | "ISO10126";

  @IsIn(["FIXED", "KEY_AS_IV", "RANDOM_EMBEDDED"])
  ssoIvMode!: "FIXED" | "KEY_AS_IV" | "RANDOM_EMBEDDED";

  @IsOptional()
  @IsIn(["utf8", "utf16le"])
  ssoTextEncoding?: "utf8" | "utf16le";

  @IsOptional()
  @IsIn(["SEPARATE_FIELDS", "COMBINED_JSON", "COMBINED_QUERYSTRING"])
  ssoTokenShape?: "SEPARATE_FIELDS" | "COMBINED_JSON" | "COMBINED_QUERYSTRING";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ssoTokenParamName?: string | null;

  @IsOptional()
  ssoOutputTransform?: Record<string, string> | null;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  ssoIvEnvelopeSeparator?: string;

  // false — append raw base64 to the URL instead of percent-encoding (HealthIndia HISSO.aspx,
  // whose server reads the raw query without URL-decoding). Defaults to true (percent-encode).
  @IsOptional()
  @IsBoolean()
  ssoUrlEncode?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // LOCAL_REDIRECT (default) — we build the redirect URL ourselves.
  // REMOTE_API_REDIRECT — we encrypt the payload, POST it to the TPA's own SSO API,
  // decrypt what they send back, and use the redirectUrl found inside that instead.
  @IsOptional()
  @IsIn(["LOCAL_REDIRECT", "REMOTE_API_REDIRECT"])
  ssoDeliveryMode?: "LOCAL_REDIRECT" | "REMOTE_API_REDIRECT";

  @IsOptional()
  @IsString()
  remoteApiUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  remoteApiMethod?: string;

  // e.g. { "Ocp-Apim-Subscription-Key": "{{env:VIDAL_API_KEY}}" } — values wrapped in
  // {{env:KEY}} are resolved from process.env at call time, never stored as-is.
  @IsOptional()
  remoteApiHeaders?: Record<string, string> | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  remoteRequestPayloadKey?: string;

  @IsOptional()
  remoteRequestExtraFields?: Record<string, string> | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  remoteResponseDataPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remoteResponseDecryptKeyEnvName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  remoteResponseRedirectUrlPath?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SsoFieldMappingDto)
  fieldMappings!: SsoFieldMappingDto[];
}
