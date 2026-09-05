import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

// Every property below is named EXACTLY as HCL's interface document (v1.4,
// 05-Feb-2024) specifies — including the document's own inconsistent
// casing/underscore conventions (Flag_operationType, E_EMP_HCL, DOM vs. DOB,
// etc.). This is intentional: HCL's HRMS is expected to swap the endpoint URL
// for ours and change nothing else, so the wire shape must match the
// document field-for-field, not a "cleaned up" camelCase version of it.
//
// See docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §4.

export const HCL_OPERATION_TYPES = [
  "AD", // Activate/Deactivate
  "BI", // Bulk Insert
  "DD", // Dependent Delete
  "ED", // Employee Demise
  "ES", // Employee Separation
  "ET", // Employee Transfer
  "NA", // Natural Addition
] as const;
export type HclOperationType = (typeof HCL_OPERATION_TYPES)[number];

export class EEmpHclDto {
  @IsOptional() @IsString() ENCRYPT_EIN?: string;

  // The document's own "Bulk Insert" sample sends EIN as a string for one
  // employee ("51854879") and a bare number for another (90089) in the same
  // request — tolerated here (coerced to string in the service layer)
  // rather than rejected, since HCL's real traffic is expected to be just as
  // inconsistent as their own reference sample.
  @IsNotEmpty() EIN!: string | number;

  @IsOptional() @IsString() Groupcode?: string;
  @IsOptional() @IsString() policyno?: string;

  @IsOptional() @IsNumber() CTC?: number;
  @IsOptional() @IsNumber() NO_OF_DEPENDENTS?: number;
  @IsOptional() @IsNumber() IS_ESI?: number;

  @IsOptional() @IsString() INSUREDNAME?: string;
  @IsOptional() @IsString() HCL_ENTITY?: string;

  @IsOptional() @IsNumber() TRIGGER_FLAG?: number;
  @IsOptional() @IsNumber() IS_SEZ?: number;

  // Present on AD/ET; drives which of the 4 AD sub-case response messages is
  // returned (see hcl-integration.constants.ts).
  @IsOptional() @IsNumber() IS_EMCP?: number;
  // Present on AD; 1 = activation/addition, 0 = deactivation.
  @IsOptional() @IsNumber() IS_EMPAD?: number;

  @IsOptional() @IsString() EMAIL?: string;
  @IsOptional() @IsString() MOBILE?: string;
  @IsOptional() @IsString() GRADE?: string;
  @IsOptional() @IsString() DOB?: string;
  @IsOptional() @IsString() DOJ?: string;
  // Present on NA's sample only (date of marriage) — not on any other
  // operation's sample. Kept optional, verbatim field name from the doc.
  @IsOptional() @IsString() DOM?: string;
  @IsOptional() @IsString() INDIANADDRESS?: string;
  @IsOptional() @IsString() MARITAL_STATUS?: string;
  @IsOptional() @IsString() GENDER?: string;
  @IsOptional() @IsNumber() OLDEMPID?: number;
  @IsOptional() @IsString() LOCATION?: string;

  @IsOptional() @IsString() CHECK_SUM?: string;
  @IsOptional() @IsNumber() BLOOD_GROUP?: number;
}

export class EDepHclDto {
  @IsOptional() @IsNumber() HCL_DEPID?: number;
  @IsOptional() @IsString() DEP_NAME?: string;
  @IsOptional() @IsString() HCL_DEPADDON?: string;
  @IsOptional() @IsNumber() HCL_DEPREL?: number;
  @IsOptional() @IsString() DEP_DOB?: string;
  @IsOptional() @IsString() DEP_GENDER?: string;
  @IsOptional() @IsString() MARITAL_STATUS?: string;
  @IsOptional() @IsString() CHECK_SUM?: string;
  @IsOptional() @IsNumber() TRIGGER_FLAG?: number;
  @IsOptional() @IsNumber() IS_DEP_EMCP?: number;
  @IsOptional() @IsNumber() BLOOD_GROUP?: number;
}

export class EmployeeDataEntryDto {
  @ValidateNested()
  @Type(() => EEmpHclDto)
  E_EMP_HCL!: EEmpHclDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EDepHclDto)
  E_DEP_HCL?: EDepHclDto[];
}

export class HclProcessEnrollDataDto {
  @IsNotEmpty() @IsString() UserName!: string;
  @IsNotEmpty() @IsString() Password!: string;

  @IsIn(HCL_OPERATION_TYPES)
  Flag_operationType!: HclOperationType;

  @IsOptional() @IsString() Groupcode?: string;
  @IsOptional() @IsString() policyno?: string;

  @IsOptional() @IsNumber() SelfCount?: number;
  // DD's operation target — the document sends this as a number in some
  // samples and a string in others ("Del_hcldepid": "0"); accept either and
  // coerce in the service layer rather than rejecting HCL's own sample shape.
  @IsOptional() Del_hcldepid?: number | string;

  @IsOptional() @IsString() wef?: string;
  @IsOptional() @IsString() Del_deletionremarks?: string;

  @IsOptional() @IsNumber() prom_ctc?: number;
  @IsOptional() @IsString() prom_grade?: string;
  @IsOptional() @IsNumber() prom_companyid?: number;
  @IsOptional() @IsNumber() prom_basesi?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDataEntryDto)
  objEMPLOYEE_DATA!: EmployeeDataEntryDto[];
}

// ─── Response shapes — exactly as documented ────────────────────────────────

export interface HclGetStatusDto {
  callStatus: boolean;
  procedureStatus: boolean;
  returnMessage: string;
  returnValue: number;
}

export interface HclGetEmpStatusEntryDto {
  callStatus: boolean;
  ein: string;
  procedureStatus: boolean;
  returnMessage: string;
  returnValue: number;
}

export interface HclProcessEnrollDataResponseDto {
  GetEmpDetails: null;
  GetEmpStatus: HclGetEmpStatusEntryDto[];
  GetStatus: HclGetStatusDto;
}
