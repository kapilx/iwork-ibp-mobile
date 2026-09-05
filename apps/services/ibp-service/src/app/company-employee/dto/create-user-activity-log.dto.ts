import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateUserActivityLogDto {
  @ApiProperty({
    description: "Activity key",
    example: "LOGGED_IN",
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  activityKey!: string;

  @ApiPropertyOptional({
    description: "Activity category",
    example: "AUTH",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  activityCategory?: string;

  @ApiPropertyOptional({
    description: "Reference identifier",
    example: 101,
  })
  @IsOptional()
  referenceId?: string | number;

  @ApiPropertyOptional({
    description: "Reference type",
    example: "USER",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({
    description: "Additional metadata payload",
    example: { loginMethod: "password" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
