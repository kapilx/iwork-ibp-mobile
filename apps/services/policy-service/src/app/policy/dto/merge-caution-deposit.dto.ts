import { Transform } from "class-transformer";
import { IsArray, IsNumber, ArrayMinSize } from "class-validator";

const toNumberOrValue = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

export class MergeCautionDepositDto {
  @IsArray()
  @ArrayMinSize(1, { message: "At least one source caution deposit ID is required" })
  @IsNumber({}, { each: true })
  sourceCdIds!: number[];

  @Transform(toNumberOrValue)
  @IsNumber()
  targetCDId!: number;
}
