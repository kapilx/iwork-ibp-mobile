import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { errorMessages } from "../../../../../../../libs/service-lib/src/lib/messages";

export class UpdateCautionDepositAccountNumberDto {
  @IsString({ message: errorMessages.cautionDepositAccountNumberRequired })
  @IsNotEmpty({ message: errorMessages.cautionDepositAccountNumberRequired })
  @MaxLength(50, {
    message: errorMessages.cautionDepositAccountNumberTooLong,
  })
  cdAccountNumber!: string;

  @IsString({ message: errorMessages.cautionDepositAccountNameRequired })
  @IsNotEmpty({ message: errorMessages.cautionDepositAccountNameRequired })
  @MaxLength(100, {
    message: errorMessages.cautionDepositAccountNameTooLong,
  })
  @IsOptional()
  cdAccountName?: string;
}
