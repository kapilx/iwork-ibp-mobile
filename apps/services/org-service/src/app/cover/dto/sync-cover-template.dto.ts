import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class SyncCoverItemDto {
  @ApiProperty({ description: "Source mstr_cover.id to map", example: 5275 })
  @IsInt()
  refCoverId!: number;

  @ApiProperty({ required: false, example: "Yes" })
  @IsOptional()
  @IsString()
  mandatory?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  displaySequence?: number;

  @ApiProperty({
    required: false,
    description:
      "Activity_key after which this cover is hidden (inclusive cutoff). Null/omitted = visible in every activity.",
    example: "broking_slip_activity",
  })
  @IsOptional()
  @IsString()
  visibleUntilActivityKey?: string | null;
}

export class SyncCoverTemplateDto {
  @ApiProperty({ description: "POLICY_TYPE lookup id", example: 18543 })
  @IsInt()
  policyTypeId!: number;

  @ApiProperty({ description: "Organisation id", example: 1 })
  @IsInt()
  organizationId!: number;

  @ApiProperty({
    type: [SyncCoverItemDto],
    description: "Final desired set of covers mapped to this policy type + org",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCoverItemDto)
  covers!: SyncCoverItemDto[];
}
