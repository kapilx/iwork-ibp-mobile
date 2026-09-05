import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateExternalHrDto } from "./create-external-hr.dto";

export class UpdateExternalHrDto extends PartialType(
  OmitType(CreateExternalHrDto, ["email"] as const)
) {}
