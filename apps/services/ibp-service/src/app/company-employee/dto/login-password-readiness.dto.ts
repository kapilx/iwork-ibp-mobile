import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginPasswordReadinessDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsOptional()
  @IsString()
  loginMethod?: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
