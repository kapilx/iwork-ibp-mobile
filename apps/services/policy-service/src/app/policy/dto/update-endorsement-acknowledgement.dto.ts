import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateEndorsementAcknowledgementDto {
  @ApiProperty({ description: 'Insurer endorsement number', example: 'END123' })
  @IsString()
  insurerEndorsementNumber!: string;

  @ApiProperty({ description: 'ID of the uploaded acknowledgement file', example: 10 })
  @IsInt()
  uploadedFileId!: number;

  @ApiProperty({ description: 'Date of insurer acknowledgement', example: '2024-06-01' })
  @IsDateString()
  insurerEndorsementDate!: string;
}