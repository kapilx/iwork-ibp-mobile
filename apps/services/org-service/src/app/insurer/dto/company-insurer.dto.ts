import { ApiProperty } from "@nestjs/swagger";

export class CompanyInsurerDto {
  @ApiProperty({ description: "Identifier of the insurer" })
  insurerId: number;

  @ApiProperty({ description: "Display name of the insurer" })
  insurerName: string;
}

export class CompanyInsurerListResponseDto {
  @ApiProperty({
    description: "List of insurers associated with the company.",
    type: [CompanyInsurerDto],
  })
  data: CompanyInsurerDto[];

  @ApiProperty({
    description: "Total number of insurers found for the company.",
  })
  count: number;
}
