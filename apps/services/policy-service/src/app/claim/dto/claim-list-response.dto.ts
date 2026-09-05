import { ApiProperty } from "@nestjs/swagger";
import { ClaimListItemDto } from "./claim-list-item.dto";

export class ClaimListResponseDto {
  @ApiProperty({ type: () => [ClaimListItemDto] })
  data!: ClaimListItemDto[];

  @ApiProperty()
  count!: number;

  constructor(data: ClaimListItemDto[], count: number) {
    this.data = data;
    this.count = count;
  }
}
