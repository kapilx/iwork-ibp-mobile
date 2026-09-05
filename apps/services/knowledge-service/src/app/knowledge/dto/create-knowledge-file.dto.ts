import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKnowledgeFileDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @Type(() => Number) // Add this decorator
  @IsInt()
  docTypeId: number;

  @ApiProperty()
  @Type(() => Number) // Add this decorator
  @IsInt()
  categoryId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string | string[];
}
