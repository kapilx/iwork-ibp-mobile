import { IsInt } from "class-validator";

export class TpaAddressDto {
  @IsInt()
  id!: number;

  @IsInt()
  addressId!: number;
}
