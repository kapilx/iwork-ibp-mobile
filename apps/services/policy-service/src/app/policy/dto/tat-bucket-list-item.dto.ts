import { ApiProperty } from "@nestjs/swagger";

import { TatBucket } from "../../../../../service-lib/src/lib/entities/tat-bucket.entity";
import { normalizeEndorsementTatFilter } from "../../../../../../../libs/service-lib/src/lib/utils/tat.utils";

export class TatBucketListItemDto {
  @ApiProperty({ description: "Unique identifier", example: 1 })
  id!: number;

  @ApiProperty({
    description: "Normalized label mapped to dashboard filters",
    example: "< 7 Days",
  })
  label!: string;

  @ApiProperty({
    description: "Label as stored in master data",
    example: "TAT1",
  })
  originalLabel!: string;

  @ApiProperty({ description: "Start day for the bucket (inclusive)", example: 0 })
  startDay!: number;

  @ApiProperty({
    description: "End day for the bucket (inclusive)",
    example: 7,
    nullable: true,
  })
  endDay!: number | null;

  @ApiProperty({ description: "Display order", example: 1 })
  displayOrder!: number;

  @ApiProperty({ description: "Weight assigned to the bucket", example: 1.25 })
  weight!: number;

  @ApiProperty({ description: "Indicates whether the bucket is compliant", example: true })
  isCompliant!: boolean;

  @ApiProperty({
    description: "Range boundaries for convenience",
    example: { from: 0, to: 7 },
  })
  range!: { from: number; to: number | null };

  constructor(bucket: TatBucket) {
    this.id = bucket.id;
    this.originalLabel = bucket.tatLabel;
    this.label =
      normalizeEndorsementTatFilter(bucket.tatLabel) ?? bucket.tatLabel;
    this.startDay = bucket.startDay;
    this.endDay = bucket.endDay ?? null;
    this.displayOrder = bucket.tatDisplayOrder;
    this.weight = Number(bucket.tatWeight ?? 0);
    this.isCompliant = Boolean(bucket.isCompliant);
    this.range = { from: bucket.startDay, to: bucket.endDay ?? null };
  }
}
