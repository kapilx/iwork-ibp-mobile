import { IsNotEmptyObject, IsObject } from "class-validator";
import { errorMessages } from "../../../../../../../libs/service-lib/src/lib/messages";

export class UpdatePolicyCoverDto {
  @IsNotEmptyObject(
    {},
    { message: errorMessages.policyCoverUpdatesRequired }
  )
  @IsObject()
  covers!: Record<string, any>;
}
