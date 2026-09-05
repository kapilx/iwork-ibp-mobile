import { IsInt, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for hospital upload request
 */
export class HospitalUploadDto {
  /**
   * File ID from the file upload service
   */
  @ApiProperty({
    description: 'File ID from the file upload service',
    example: 123,
    type: 'integer'
  })
  @IsNotEmpty({ message: 'File ID is required' })
  @IsInt({ message: 'File ID must be a valid integer' })
  fileId!: number;

  /**
   * Replace all existing hospital mappings for this policy
   * If true: deletes all existing mappings and adds new ones
   * If false: adds to existing mappings (default behavior)
   */
  @ApiProperty({
    description: 'Replace all existing hospital mappings for this policy. If true, deletes all existing mappings and adds new ones. If false, adds to existing mappings.',
    example: false,
    default: false,
    required: false,
    type: 'boolean'
  })
  @IsOptional()
  @IsBoolean({ message: 'isReplaceAll must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isReplaceAll?: boolean = false;
}