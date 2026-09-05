import { IsNotEmpty, IsInt, IsOptional } from "class-validator";

export class CreateContactDocMapDto {
  @IsOptional({ message: "Contact ID is optional." })
  @IsInt({ message: "Contact ID should be a number" })
  contactId?: number;

  @IsNotEmpty({ message: "Document id is required." })
  @IsInt({ message: "Document id must be a number." })
  documentId!: number;
}
