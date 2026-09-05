import { IsInt } from "class-validator";
export class BrokerContactDto {
  @IsInt()
  brokerId!: number;

  @IsInt()
  contactId!: number;
}
