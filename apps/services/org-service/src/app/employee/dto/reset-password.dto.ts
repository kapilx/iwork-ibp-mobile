import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  companyId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  captchaToken?: string;
}
