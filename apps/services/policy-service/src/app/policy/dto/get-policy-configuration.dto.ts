import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetPolicyConfigurationListDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
