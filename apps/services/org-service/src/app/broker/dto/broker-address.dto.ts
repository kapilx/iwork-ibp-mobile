import { IsInt } from "class-validator";
export class BrokerAddressDto {
  @IsInt()
  brokerId!: number;

  @IsInt()
  addressId!: number;
}
