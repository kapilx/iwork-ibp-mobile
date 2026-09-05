import { ApiProperty } from '@nestjs/swagger';
import { TPAMapDto, InsurerMapDto, SharingDetailDto, CDDetailDto, CoverDetailDto, PolicyDetailsDto, OtherDeatilsDto, RemarksDto } from './create-placement-slip.dto';

export class GetPlacementSlipDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1234 })
  opportunityId: number;

  @ApiProperty({ type: PolicyDetailsDto })
  policyDetails: PolicyDetailsDto;

  @ApiProperty({ type: OtherDeatilsDto })
  otherDeatils: OtherDeatilsDto;

  @ApiProperty({ type: RemarksDto })
  remarks: RemarksDto;

  @ApiProperty({ example: 1 })
  statusLid: number;

  @ApiProperty({ example: 1 })
  createdBy: number;

  @ApiProperty({ example: 1 })
  updatedBy: number;

  @ApiProperty({ type: [TPAMapDto] })
  tpaDetails: TPAMapDto[];

  @ApiProperty({ type: [InsurerMapDto] })
  insurerDetails: InsurerMapDto[];

  @ApiProperty({ type: [SharingDetailDto] })
  insurerAndBrokeragePercentage: SharingDetailDto[];

  @ApiProperty({ type: [CDDetailDto] })
  cdAccountDetails: CDDetailDto[];

  @ApiProperty({ type: [CoverDetailDto] })
  coverDetails: CoverDetailDto[];
}
