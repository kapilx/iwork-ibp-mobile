import { Address } from "cluster";
import { Company } from "../../../../../service-lib/src/lib/entities/company.entity";

export class CompanyAddressDto {
  company!: Company;
  address!: Address;
}
