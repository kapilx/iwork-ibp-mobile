import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {
  POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH,
  POLICY_SECTION_APPROVAL_DECISION_STATUS,
  POLICY_SECTION_APPROVAL_SECTIONS,
  POLICY_SECTION_APPROVAL_STATUS_VALUE,
} from "../../../../../../../libs/service-lib/src/lib/constants";

export type PolicySectionIdentifier =
  (typeof POLICY_SECTION_APPROVAL_SECTIONS)[keyof typeof POLICY_SECTION_APPROVAL_SECTIONS];

export type PolicySectionStatusValue =
  (typeof POLICY_SECTION_APPROVAL_STATUS_VALUE)[keyof typeof POLICY_SECTION_APPROVAL_STATUS_VALUE];

export class PolicySectionSubmissionDto {
  @ApiProperty({
    description: "Policy section that is submitted for approval",
    enum: Object.values(POLICY_SECTION_APPROVAL_SECTIONS),
  })
  @IsEnum(POLICY_SECTION_APPROVAL_SECTIONS)
  section: PolicySectionIdentifier;

  @ApiPropertyOptional({
    description: "Optional comments to capture along with the submission",
    maxLength: POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH)
  comments?: string;
}

export class PolicySectionApprovalDto {
  @ApiProperty({
    description: "Policy section whose approval status is updated",
    enum: Object.values(POLICY_SECTION_APPROVAL_SECTIONS),
  })
  @IsEnum(POLICY_SECTION_APPROVAL_SECTIONS)
  section: PolicySectionIdentifier;

  @ApiProperty({
    description: "Approval decision for the section",
    enum: Object.values(POLICY_SECTION_APPROVAL_DECISION_STATUS),
  })
  @IsEnum(POLICY_SECTION_APPROVAL_DECISION_STATUS)
  status: (typeof POLICY_SECTION_APPROVAL_DECISION_STATUS)[keyof typeof POLICY_SECTION_APPROVAL_DECISION_STATUS];

  @ApiPropertyOptional({
    description:
      "Approval or rejection comments. Required when the section is rejected.",
    maxLength: POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH)
  comments?: string;
}

export class PolicySectionStatusQueryDto {
  @ApiProperty({ description: "Policy identifier", type: Number })
  @IsNotEmpty()
  policyId!: number;
}
