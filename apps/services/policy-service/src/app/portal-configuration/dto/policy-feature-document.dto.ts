import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyFeatureDocumentDto {
  @ApiProperty({
    description: 'Policy ID',
    example: 123,
  })
  @IsNumber()
  @IsNotEmpty()
  policyId!: number;

  @ApiProperty({
    description: 'Document ID from file uploads table',
    example: 456,
  })
  @IsNumber()
  @IsNotEmpty()
  documentId!: number;
}

export class PolicyFeatureDocumentRequestDto {
  @ApiProperty({
    description: 'Document ID from file uploads table',
    example: 456,
  })
  @IsNumber()
  @IsNotEmpty()
  documentId!: number;
}

export class PolicyFeatureDocumentResponseDto {
  @ApiProperty({ description: 'Policy feature document ID' })
  id!: number;

  @ApiProperty({ description: 'Policy ID' })
  policyId!: number;

  @ApiProperty({ description: 'Document ID' })
  documentId!: number;

  @ApiProperty({ description: 'Document status' })
  status!: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy!: number;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy!: number;
}