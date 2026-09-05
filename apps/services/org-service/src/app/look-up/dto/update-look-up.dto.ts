import { PartialType } from "@nestjs/mapped-types";
import { CreateLookUpDto } from "./create-look-up.dto";

// DTO for updating LookUp entities. All fields from CreateLookUpDto are optional.
export class UpdateLookUpDto extends PartialType(CreateLookUpDto) {}
