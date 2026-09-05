import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";
import { Type } from "class-transformer";

export class GetEmployeeClaimParamsDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number) // Transform the input to a number
  @IsInt({ message: "fileId must be an integer" }) // Validate that it is an integer
  employeeId!: number;
}
