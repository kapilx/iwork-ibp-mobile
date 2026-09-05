import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  MaxLength,
} from "class-validator";

export class UpsertAppRefDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  verificationTokenApiUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(["GET", "POST"])
  verificationTokenApiMethod?: string;

  @IsOptional()
  @IsObject()
  verificationTokenApiPayload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  verificationTokenApiHeaders?: Record<string, any> | null;

  @IsString()
  @IsNotEmpty()
  magicUrlApiUrl!: string;

  @IsOptional()
  @IsString()
  @IsIn(["GET", "POST"])
  magicUrlApiMethod?: string;

  @IsOptional()
  @IsObject()
  magicUrlApiPayload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  magicUrlApiHeaders?: Record<string, any> | null;

  @IsString()
  @IsIn(["DIRECT", "JWT", "SESSION", "BASIC_AUTH", "SESSION_BODY", "HEADER_CREDENTIALS"])
  authType!: string;

  @IsOptional()
  @IsString()
  iss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  expiresIn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  step1ResponseTokenKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  step2ResponseDataKey?: string;

  @IsOptional()
  @IsString()
  containerCategory?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  fieldHints?: Record<string, { type: "STATIC" | "DYNAMIC"; staticValue?: string }> | null;

  @IsOptional()
  @IsString()
  @IsIn(["JSON", "XML", "FORM"])
  payloadFormat?: string;

  @IsOptional()
  @IsString()
  @IsIn(["REDIRECT", "DISPLAY", "SYNC", "DIRECT_CALL"])
  flowType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  syncTargetTable?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  syncDedupColumn?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(["PER_POLICY", "PER_TPA", "GLOBAL"])
  syncScope?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  syncSchedule?: string | null;

  @IsOptional()
  @IsInt()
  syncTtlHours?: number | null;

  @IsOptional()
  syncTables?: string[] | null;

  @IsOptional()
  @IsInt()
  authAppRefId?: number | null;

  @IsOptional()
  @IsInt()
  individualEcardAppRefId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ecardArrayResponseKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ecardRelationMatchField?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ecardResponseMode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  basicAuthUser?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  basicAuthPassword?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tokenHeaderPrefix?: string | null;
}
