import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class ClaimBatchQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiProperty({ required: false, example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiProperty({ required: false, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tpaId?: number;

  @ApiProperty({ required: false, example: 649930 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  policyId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sort?: string;
}
