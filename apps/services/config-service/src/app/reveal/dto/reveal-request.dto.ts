import { IsNumber, IsString } from 'class-validator';

export class RevealRequestDto {
  @IsString()
  table: string;

  @IsString()
  field: string;

  @IsNumber()
  id: number;
}
