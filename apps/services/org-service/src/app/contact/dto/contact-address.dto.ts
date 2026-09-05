import { IsInt } from "class-validator";
export class ContactAddressDto {
  @IsInt()
  contactId!: number;

  @IsInt()
  addressId!: number;
}
