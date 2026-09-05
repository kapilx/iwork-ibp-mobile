import { PartialType } from "@nestjs/mapped-types";
import { CreateOpportunityDto } from "./create-opportunity.dto";
import { BadRequestException } from "@nestjs/common";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

// DTO for updating LookUp entities. All fields from CreateLookUpDto are optional.
export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {}

export class ExtendOpportunityDto {
  @ApiProperty({
    description: "ExpiryDate in YYYY-MM-DD format",
    example: "2026-12-31",
  })
  @IsNotEmpty({ message: "ExpiryDate is required" })
  @IsString({ message: "ExpiryDate must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "ExpiryDate must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    if (date < new Date()) {
      throw new BadRequestException("ExpiryDate cannot be a past date.");
    }
    return value;
  })
  expiryDate!: string;
}
