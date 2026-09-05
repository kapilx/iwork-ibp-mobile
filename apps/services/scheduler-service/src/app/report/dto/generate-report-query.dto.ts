import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DEFAULT_VALUES } from '../../../../../service-lib/src/lib/constants';

export class GenerateReportQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination.', example: DEFAULT_VALUES.PAGE })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({ description: 'Number of records per page.', example: DEFAULT_VALUES.LIMIT })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({ description: 'Sort format field:ORDER', example: `${DEFAULT_VALUES.SORT_BY}:${DEFAULT_VALUES.SORT_ORDER}` })
  @IsOptional()
  @IsString()
  sort?: string;
}
