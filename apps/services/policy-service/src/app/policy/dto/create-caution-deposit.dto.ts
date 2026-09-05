import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCautionDepositDto {
  @IsString()
  cdAccountNumber!: string;

  @IsOptional()
  @IsString()
  cdAccountName?: string;

  @IsOptional()
  @IsString()
  cdBankName?: string;

  @IsNumber()
  companyId!: number;

  @IsNumber()
  insurerId!: number;

  @IsOptional()
  @IsNumber()
  balanceAmount?: number;

  @Transform(({ value }) => {
    if (value === null) return null;
    if (value === undefined || (typeof value === "string" && value.trim() === ""))
      return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsOptional()
  @IsNumber()
  cdSafeLimit?: number;

  @IsOptional()
  @IsString()
  transactionReferenceId?: string;

  @IsOptional()
  @IsNumber()
  referenceType?: number;

  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @IsOptional()
  @IsString()
  chequeDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  action_lid?: number;

  @IsOptional()
  @IsNumber({}, { each: true })
  policyIds?: number[];

  @IsOptional()
  @IsNumber()
  cautionDepositId?: number;
}
