import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateKnowledgeUrlDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsInt()
  docTypeId: number;

  @ApiProperty()
  @IsInt()
  categoryId: number;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string | string[];
}
