import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  IsEnum,
} from "class-validator";
import { ApprovalStatusEnum, TemplateStatusEnum } from '../../../../../service-lib/src/lib/constants';

export class GetTemplatesDto {
  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of records per page",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Search term for template name and content",
    example: "welcome",
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by channel type ID",
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  channelTypeId?: number;

  @ApiPropertyOptional({
    description: "Filter by approval status",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.APPROVED,
  })
  @IsEnum(ApprovalStatusEnum)
  @IsOptional()
  approvalStatus?: ApprovalStatusEnum;

  @ApiPropertyOptional({
    description: "Filter by template status",
    enum: TemplateStatusEnum,
    example: TemplateStatusEnum.ACTIVE,
  })
  @IsEnum(TemplateStatusEnum)
  @IsOptional()
  status?: TemplateStatusEnum;

  @ApiPropertyOptional({
    description: "Filter by organization ID",
    example: 101,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  organizationId?: number;

  @ApiPropertyOptional({
    description: "Filter by creator user ID",
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  createdBy?: number;
}