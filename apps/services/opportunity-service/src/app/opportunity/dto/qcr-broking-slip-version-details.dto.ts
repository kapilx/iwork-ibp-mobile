import { IsNumber, IsString, IsArray, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class InsurerDto {
  @ApiProperty({
    example: 236,
    description: "Unique ID of the insurer",
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    example: "Navanitha test",
    description: "Name of the insurer",
  })
  @IsString()
  insurerName!: string;

  @ApiProperty({
    example: "Navanitha test",
    description: "Display name of the insurer",
  })
  @IsString()
  displayName!: string;
}

export class QuoteEntryDto {
  @ApiProperty({
    example: 19,
    description: "Unique ID of the quote entry",
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    example: 414,
    description: "Opportunity ID related to the quote entry",
  })
  @IsNumber()
  opportunityId!: number;

  @ApiProperty({
    example: 577,
    description: "Opportunity Activity ID",
  })
  @IsNumber()
  opportunityActivityId!: number;

  @ApiProperty({
    example: 6,
    description: "Broking Slip ID the quote is associated with",
  })
  @IsNumber()
  brokingSlipId!: number;

  @ApiProperty({
    example: 236,
    description: "Insurer ID selected in the quote",
  })
  @IsNumber()
  insurerId!: number;

  @ApiProperty({
    example: 1,
    description: "Status ID of the quote entry",
  })
  @IsNumber()
  statusId!: number;

  @ApiProperty({
    type: () => InsurerDto,
    description: "Details of the insurer",
  })
  @ValidateNested()
  @Type(() => InsurerDto)
  insurer!: InsurerDto;
}

export class BrokingSlipVersionDetailDto {
  @ApiProperty({
    example: 6,
    description: "Unique ID of the broking slip version",
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    example: 414,
    description: "Associated Opportunity ID",
  })
  @IsNumber()
  opportunityId!: number;

  @ApiProperty({
    example: 1,
    description: "Version number of the broking slip",
  })
  @IsNumber()
  brokingSlipVersion!: number;

  @ApiProperty({
    example: "sample version I",
    description: "Name of the broking slip version",
  })
  @IsString()
  brokingSlipName!: string;

  @ApiProperty({
    type: [QuoteEntryDto],
    description: "List of quote entries under this broking slip version",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteEntryDto)
  quoteEntry!: QuoteEntryDto[];
}
