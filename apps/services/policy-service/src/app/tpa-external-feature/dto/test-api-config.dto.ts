import {
  IsInt,
  IsIn,
  IsObject,
  Min,
} from "class-validator";

export class TestApiConfigDto {
  @IsInt()
  @Min(1)
  appRefId!: number;

  @IsObject()
  staticValues!: Record<string, string>;

  @IsIn([1, 2])
  step!: 1 | 2;
}
