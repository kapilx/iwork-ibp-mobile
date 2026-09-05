import { IsInt } from "class-validator";
export class CompanyContactMapDto {
  @IsInt()
  contactId!: number;
  
  @IsInt()
  companyId!: number;
}
