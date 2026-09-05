import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import {
  BUSINESS_TARGET_ENTITY_TYPE,
  POLICY_PERFORMANCE_FIELDS,
} from "../../../../../../../libs/service-lib/src/lib/constants";

export class UpsertBusinessTargetDto {
  // Presence of id => update that row; absence => upsert by
  // (userId, month, entityType, kpi, typeOfTarget).
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  userId!: number;

  // 'YYYY-MM-01' — month is stored as a date pinned to the first of the month.
  @IsDateString()
  month!: string;

  @IsIn(Object.values(BUSINESS_TARGET_ENTITY_TYPE))
  entityType!: string;

  @IsIn(Object.values(POLICY_PERFORMANCE_FIELDS))
  kpi!: string;

  @IsIn([
    POLICY_PERFORMANCE_FIELDS.AMOUNT,
    POLICY_PERFORMANCE_FIELDS.PERCENTAGE,
  ])
  typeOfTarget!: string;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === "") return value;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @Min(0)
  valueOfTarget!: number;
}
