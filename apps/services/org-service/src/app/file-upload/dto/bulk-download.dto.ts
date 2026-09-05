import { IsArray, ArrayNotEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * DTO for bulk document download as ZIP.
 * Uses (string|number)[] because request body cannot directly send bigint.
 */
export class BulkDownloadDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  documentIds: (string | number)[];

  @IsOptional()
  @IsString()
  moduleKey?: string;
}
