import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt } from "class-validator";
import { SearchHospitalDto } from "./search-hospital.dto";

export class SearchHospitalsByPoliciesDto extends SearchHospitalDto {
  @ApiProperty({
    description: "List of policy IDs to search hospitals across (can be empty when source=API_SYNC)",
    type: [Number],
    example: [699645, 699646, 699647],
  })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  policyIds!: number[];
}
