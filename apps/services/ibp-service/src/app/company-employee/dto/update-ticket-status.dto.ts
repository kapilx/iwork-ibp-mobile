import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatusDto } from './get-tickets.dto';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: 'New status for the ticket',
    enum: TicketStatusDto,
    example: 'resolved',
  })
  @IsEnum(TicketStatusDto)
  status: TicketStatusDto;

  @ApiProperty({
    description: 'HR comment explaining the status change',
    example: 'Issue verified and resolved with the insurer.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
