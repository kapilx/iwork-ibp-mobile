import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

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

export class UpdateCautionDepositDto {
  @Transform(toNumberOrValue)
  @IsNumber()
  transactionType!: number;

  @Transform(toNumberOrValue)
  @IsNumber()
  @IsPositive()
  transactionAmount!: number;

  @IsOptional()
  @Transform(toNumberOrValue)
  @IsNumber()
  endorsementId?: number;

  @IsOptional()
  @IsString()
  transactionReferenceId?: string;

  @IsOptional()
  @Transform(toNumberOrValue)
  @IsNumber()
  referenceType?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @IsOptional()
  @IsString()
  chequeDate?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @Transform(toNumberOrValue)
  @IsNumber()
  policyId?: number;
}
