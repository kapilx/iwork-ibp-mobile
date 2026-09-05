import { IsInt } from "class-validator";
export class InsurerContactDto {
  @IsInt()
  contactId!: number;

  @IsInt()
  insurerId!: number;
}
