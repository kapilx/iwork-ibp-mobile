import { ApiProperty } from '@nestjs/swagger';

export class UploadClaimResponseDto {
  @ApiProperty({ example: 1 })
  fileId!: number;

  @ApiProperty({ example: 100 })
  processedCount!: number;

  constructor(data: { fileId: number; processedCount: number }) {
    Object.assign(this, data);
  }
}
