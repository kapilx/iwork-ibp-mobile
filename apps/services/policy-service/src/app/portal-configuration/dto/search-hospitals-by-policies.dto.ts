import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";
import { Type } from "class-transformer";
import { SearchHospitalDto } from "./search-hospital.dto";

export class SearchHospitalsByPoliciesDto extends SearchHospitalDto {
  @ApiProperty({
    description: "Policy IDs to search hospitals across",
    example: [699691, 699692, 699693, 699694],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  policyIds!: number[];
}
