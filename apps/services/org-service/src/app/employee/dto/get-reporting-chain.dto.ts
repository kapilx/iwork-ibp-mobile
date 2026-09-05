import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt } from "class-validator";
import { Type } from "class-transformer";

export class GetReportingChainDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200) // a grid page is 25-50 rows; guards against abuse
  @IsInt({ each: true })
  @Type(() => Number)
  userIds: number[];
}
