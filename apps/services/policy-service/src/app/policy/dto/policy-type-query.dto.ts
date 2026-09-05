import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsNumber, IsOptional } from "class-validator";

export class PolicyTypeQueryDto {
  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyId?: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  insurerId?: number;

  @ApiProperty({ required: false, enum: ["manager", "team"] })
  @IsOptional()
  @IsIn(["manager", "team"])
  viewBy?: "manager" | "team";

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showActive?: boolean;
}
