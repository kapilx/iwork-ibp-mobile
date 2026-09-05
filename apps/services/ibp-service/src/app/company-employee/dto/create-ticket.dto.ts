import { IsString, IsEmail, IsEnum, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TicketCategoryDto {
  BILLING = 'billing',
  CLAIMS = 'claims',
  POLICY = 'policy',
  ENROLLMENT = 'enrollment',
  OTHER = 'other',
  ACCESS_ISSUES = 'access_issues'
}

export class CreateTicketDto {
  @ApiProperty({
    description: 'Category of the ticket',
    enum: TicketCategoryDto,
    example: 'claims',
  })
  @IsEnum(TicketCategoryDto)
  @IsNotEmpty()
  category: TicketCategoryDto;

  @ApiProperty({
    description: 'Email address of the ticket raiser',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  mailId: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'I am facing issues with claim reimbursement process.',
  })
  @IsString()
  @IsNotEmpty()
  escalationDescription: string;

  @ApiProperty({
    description: 'Array of document IDs attached to the ticket',
    example: [123, 456, 789],
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  documentIds?: number[];
}

export class CreateTicketResponseDto {
  @ApiProperty({
    description: 'Auto-generated unique ticket ID',
    example: 'TKT-20241117-001',
  })
  ticketId: string;

  @ApiProperty({
    description: 'System generated ticket database ID',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Employee ID if ticket is raised by logged-in user',
    example: 456,
    required: false,
    nullable: true,
  })
  employeeId?: number | null;

  @ApiProperty({
    description: 'True when ticket is raised before login (anonymous flow)',
    example: true,
  })
  isAnonymousUser: boolean;

  @ApiProperty({
    description: 'Status of the ticket',
    example: 'open',
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-11-17T10:30:00Z',
  })
  createdAt: Date;
}
