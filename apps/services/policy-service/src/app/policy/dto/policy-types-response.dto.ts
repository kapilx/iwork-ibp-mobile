import { ApiProperty } from "@nestjs/swagger";
import { PolicySummaryDto } from "../../policy/dto/policy-summary.dto";

export class PolicyTypesResponseDto {
  @ApiProperty({ type: [String] })
  policyTypes: string[];

  @ApiProperty({ type: [PolicySummaryDto] })
  policies: PolicySummaryDto[];
}
