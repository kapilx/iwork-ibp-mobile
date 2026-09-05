import { PartialType } from "@nestjs/mapped-types";
import { CreateTpaDto } from "./create-tpa.dto";

export class UpdateTpaDto extends PartialType(CreateTpaDto) {}
