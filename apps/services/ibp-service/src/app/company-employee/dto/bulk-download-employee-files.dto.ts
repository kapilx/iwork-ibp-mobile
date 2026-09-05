import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class BulkDownloadEmployeeFilesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  documentIds: (string | number)[];

  @IsOptional()
  @IsString()
  zipFileName?: string;
}
