import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class OpportunityPreviousMediatorDetailsDto {
  @ApiProperty({
    description: "Company Id of the previous mediator",
    example: 123,
  })
  @IsNotEmpty({ message: "Company Id is required" })
  @IsInt({ message: "Company Id must be a valid integer" })
  companyId!: number;

  @ApiProperty({
    description: "Location Id of the previous mediator",
    example: 456,
  })
  @IsOptional()
  @IsInt({ message: "Location Id must be a valid integer" })
  locationId?: number;

  @ApiProperty({
    description: "Branch Id of the previous mediator",
    example: 789,
  })
  @IsOptional()
  @IsInt({ message: "Branch Id must be a valid integer" })
  branchId?: number;

  @IsOptional()
  mediatorType: "TPA" | "BROKER" | "INSURER";
}
