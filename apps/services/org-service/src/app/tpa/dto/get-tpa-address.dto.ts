export class TpaAddressDto {
  id!: number;
  addressId!: number;

  constructor(tpaAddress: Partial<TpaAddressDto>) {
    Object.assign(this, tpaAddress);
  }
}
