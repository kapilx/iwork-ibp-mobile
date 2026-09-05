import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSimpleAuthDto {
  @IsString()
  @IsNotEmpty()
  userName!: string; // Can be email, username, or phone number

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  loginMethod?: string;

  @IsOptional()
  @IsString()
  clientScopeId?: string;

  @IsString()
  @IsOptional()
  captchaToken!: string;

  @IsOptional()
  @IsBoolean()
  forceLogin?: boolean;
}
