import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class AcceptTermsDto {
  @ApiProperty({
    description: "The user ID to accept terms for",
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    description: "The version of the terms and conditions being accepted",
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tcVersion?: number;
}

export class WithdrawTermsDto {
  @ApiProperty({
    description: "The user ID to withdraw terms acceptance for",
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  userId: number;
}