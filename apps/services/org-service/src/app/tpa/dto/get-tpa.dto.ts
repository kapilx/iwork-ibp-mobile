import { TpaAddressDto } from "./get-tpa-address.dto";

export class TpaDto {
  id!: number;
  tpaName!: string;
  displayName!: string;
  companyTypeLid!: number;
  website?: string;
  remarks?: string;
  address: TpaAddressDto[];
  statusLid!: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
  tpaLogoFileId?: number | null;
  status!: {
    id: number;
    lookUpValue: string;
  };
  policies?: {};

  constructor(tpa: Partial<TpaDto>) {
    Object.assign(this, tpa);
    this.address =
      tpa.address?.map((tpaAddress) => new TpaAddressDto(tpaAddress)) || [];
  }
}
