import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, ValidateNested } from "class-validator";
import { BrokingSlipVersionDetailsDto } from "./get-broking-slip-details-by-version.dto";

export class UpdateBrokingSlipVersionDto {
  @ApiProperty({
    description: "The ID of the opportunity activity.",
    example: 76,
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Opportunity id must be an integer." })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "Status id of the activity.",
    example: 76,
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Status id must be an integer." })
  statusLid!: number;

  @ApiProperty({
    description: "Broking slip version detail",
    type: BrokingSlipVersionDetailsDto,
  })
  @ValidateNested()
  @Type(() => BrokingSlipVersionDetailsDto)
  brokingSlipVersionDetails!: BrokingSlipVersionDetailsDto;
}
