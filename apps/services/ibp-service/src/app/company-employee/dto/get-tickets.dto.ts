import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum TicketStatusDto {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriorityDto {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class GetTicketsQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by ticket status',
    enum: TicketStatusDto,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatusDto)
  status?: TicketStatusDto;

  @ApiProperty({
    description: 'Filter by ticket category',
    enum: ['billing', 'claims', 'policy', 'enrollment', 'other'],
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class TicketResponseDto {
  @ApiProperty({
    description: 'Ticket database ID',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Employee ID who raised the ticket',
    example: 456,
  })
  employeeId: number;

  @ApiProperty({
    description: 'Unique ticket identifier',
    example: 'TKT-20241117-001',
  })
  ticketId: string;

  @ApiProperty({
    description: 'Ticket category',
    example: 'claims',
  })
  category: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  mailId: string;

  @ApiProperty({
    description: 'Issue description',
    example: 'I am facing issues with claim reimbursement process.',
  })
  escalationDescription: string;

  @ApiProperty({
    description: 'Document IDs attached to the ticket',
    example: [123, 456, 789],
    type: [Number],
  })
  documentIds: number[] | null;

  @ApiProperty({
    description: 'Current status of the ticket',
    example: 'open',
  })
  status: string;

  @ApiProperty({
    description: 'Priority level of the ticket',
    example: 'medium',
  })
  priority: string;

  @ApiProperty({
    description: 'Timestamp when the ticket was created',
    example: '2024-11-17T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the ticket was last updated',
    example: '2024-11-17T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Employee details who raised the ticket',
    required: false,
  })
  employee?: {
    name: string;
    email: string;
    employeeId: string;
  };
}

export class GetTicketsResponseDto {
  @ApiProperty({
    description: 'Array of tickets',
    type: [TicketResponseDto],
  })
  data: TicketResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}