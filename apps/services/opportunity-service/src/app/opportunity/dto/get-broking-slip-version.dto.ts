import { ApiProperty } from "@nestjs/swagger";

export class BrokingSlipVersionsListDto {
  @ApiProperty({ description: "Broking slip version Id", example: 1 })
  id: number;

  @ApiProperty({ description: "Broking slip version", example: 1 })
  version: number;

  @ApiProperty({
    description: "Broking slip version name",
    example: "class covers",
  })
  name: string;
}
export interface PreferredInsurerDetail {
  id: number;
  opportunityId: number;
  insurerId: number;
  locationId: number;
  branchId: number;
  contactId: number;
  insurerName?: string;
  locationName?: string;
  branchAddress?: string;
  contactName?: string;
}

export interface PreferredTpaDetail {
  id: number;
  opportunityId: number;
  tpaId: number;
  locationId: number;
  branchId: number;
  contactId: number | null;
  tpaName?: string;
  locationName?: string;
  branchAddress?: string;
  contactName?: string;
}

export interface AllPreferredDataMap {
  insurerNames: Record<number | string, string>;
  tpaNames: Record<number | string, string>;
  locationNames: Record<number | string, string>;
  branchAddresses: Record<number | string, string>;
  contactNames: Record<number | string, string>;
}
