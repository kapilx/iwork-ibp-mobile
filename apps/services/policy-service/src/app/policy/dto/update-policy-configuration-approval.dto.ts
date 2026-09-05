import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePolicyConfigurationApprovalDto {
  @ApiProperty({
    description: 'Set true to approve, false to reject the configuration',
    example: true,
  })
  @IsBoolean()
  isApproved!: boolean;

  @ApiPropertyOptional({ description: 'Remarks for approval or rejection' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
