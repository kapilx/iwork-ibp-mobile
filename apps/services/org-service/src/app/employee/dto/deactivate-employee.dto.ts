import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CompanyAssignmentDto {
  @IsNumber()
  companyId: number;

  @IsNumber()
  newOwnerId: number;
}

export class OpportunityAssignmentDto {
  @IsNumber()
  opportunityId: number;

  @IsNumber()
  newOwnerId: number;
}

export class PolicyAssignmentDto {
  @IsNumber()
  policyId: number;

  @IsNumber()
  newOwnerId: number;
}

export class EndorsementAssignmentDto {
  @IsNumber()
  endorsementId: number;

  @IsNumber()
  newCreatedById: number;
}

export class ActivityAssignmentDto {
  @IsNumber()
  activityId: number;

  @IsNumber()
  newOwnerId: number;
}

export class ManualDeactivateDto {
  @IsOptional()
  @IsNumber()
  reporteesNewManagerUserId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyAssignmentDto)
  companiesLeadCrmAssignments: CompanyAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyAssignmentDto)
  companiesAccountManagerAssignments: CompanyAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityAssignmentDto)
  opportunityAssignments: OpportunityAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyAssignmentDto)
  policyAssignments: PolicyAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EndorsementAssignmentDto)
  endorsementAssignments: EndorsementAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityAssignmentDto)
  activityAssignments: ActivityAssignmentDto[];
}
