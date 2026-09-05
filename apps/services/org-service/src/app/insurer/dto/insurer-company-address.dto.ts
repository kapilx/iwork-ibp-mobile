import { IsInt, IsOptional } from "class-validator";

export class InsurerAddressDto {
  @IsInt()
  insurerId!: number;

  @IsInt()
  addressId!: number;

  @IsOptional()
  @IsInt()
  contactId?: number;
}
