import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateKnowledgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  documentId?: bigint;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  docTypeId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string | string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;
}
