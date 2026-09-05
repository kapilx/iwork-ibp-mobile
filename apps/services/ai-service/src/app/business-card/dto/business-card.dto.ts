import { IsString, IsOptional } from 'class-validator';

export class UploadBusinessCardDto {
  @IsOptional()
  @IsString()
  options?: string;
}