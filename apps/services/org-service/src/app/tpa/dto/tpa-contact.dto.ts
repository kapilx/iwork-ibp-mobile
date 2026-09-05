import { IsInt } from "class-validator";
export class TpaContactDto {
  @IsInt()
  contactId!: number;

  @IsInt()
  id!: number;
}
