import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject } from 'class-validator';

export class CreateEndorsementFieldMappingDto {
  @ApiProperty({ example: 1, description: 'Insurer ID for this mapping' })
  @IsInt()
  insurerId!: number;

  @ApiProperty({
    description: 'Map of Excel column headers to enrollment fields',
    type: 'object',
  })
  @IsObject()
  fieldMap!: Record<string, string>;
}
