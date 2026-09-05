import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class OpportunityLost {
  @ApiProperty({
    example: 404,
    description: "Reason for loss ID",
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Reason for loss ID must be an integer" })
  @Min(1, { message: "Reason for loss ID must be a positive integer" })
  @IsOptional()
  reasonForLossLid?: number;

  @ApiProperty({
    example: 404,
    description: "The user who injected the lost opportunity",
  })
  @IsOptional()
  injectedBy?: string;

  @ApiProperty({
    example: "This opportunity was lost due to budget constraints",
    description: "A brief description of the reason for loss",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a string" })
  remarks?: string;
}

export class CreateOpportunityLostDto {
  @ApiProperty({
    example: 76,
    description: "The ID of the opportunity.",
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Opportunity ID must be an integer." })
  @IsNotEmpty({ message: "Opportunity ID is required." })
  opportunityId!: number;

  @ApiProperty({
    type: OpportunityLost,
    description: "The details of the opportunity lost",
  })
  @IsNotEmpty({ message: "Opportunity lost details are required" })
  @Type(() => OpportunityLost)
  opportunityLost!: OpportunityLost;

  @ApiProperty({
    example: 404,
    description: "The statusLid of the LookUp",
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "statusLid must be an integer" })
  @IsOptional()
  statusLid?: number;
}

export class UpdateOpportunityLostDto extends PartialType(
  CreateOpportunityLostDto
) {}
