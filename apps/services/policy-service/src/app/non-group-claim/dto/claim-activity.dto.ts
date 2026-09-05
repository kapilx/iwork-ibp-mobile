import { PartialType } from "@nestjs/mapped-types";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class ClaimDocumentDto {
  @Type(() => Number)
  @IsInt()
  documentId?: number;
}

// Claim Informed DTOs
export class ClaimInformedDataDto {
  @Type(() => Date)
  @IsDate()
  intimationDatetime: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, { message: "Intimated by must be 255 characters or less" })
  intimatedByKey: string;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Intimation channel must be 255 characters or less",
  })
  intimationChannelKey: string;

  @Type(() => Number)
  @IsInt()
  lossLocationId: number;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimInformedDataDto))
  @MaxLength(500, {
    message: "Description of loss must be 500 characters or less",
  })
  descriptionOfLoss: string;
}

export class SaveClaimInformedDataDto extends PartialType(
  ClaimInformedDataDto
) {}

export class SaveClaimInformedDto {
  @Type(() => SaveClaimInformedDataDto)
  @ValidateNested()
  @IsObject()
  claimInformed: SaveClaimInformedDataDto;
}

export class ValidateClaimInformedDto {
  @Type(() => ClaimInformedDataDto)
  @ValidateNested()
  @IsObject()
  claimInformed: ClaimInformedDataDto;
}

// FNOL Details DTOs
export class ClaimFnolDetailsDataDto {
  @Type(() => Date)
  @IsDate()
  fnolSentDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Insurer reference number must be 255 characters or less",
  })
  insurerReferenceNo: string;

  @IsOptional()
  @IsArray({ message: "FNOL documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimFnolDetailsDataDto extends PartialType(
  ClaimFnolDetailsDataDto
) {}

export class SaveClaimFnolDetailsDto {
  @Type(() => SaveClaimFnolDetailsDataDto)
  @ValidateNested()
  @IsObject()
  fonlSentToInsurer: SaveClaimFnolDetailsDataDto;
}

export class ValidateClaimFnolDetailsDto {
  @Type(() => ClaimFnolDetailsDataDto)
  @ValidateNested()
  @IsObject()
  fonlSentToInsurer: ClaimFnolDetailsDataDto;
}

// Loss Adjuster Details DTOs
export class ClaimLossAdjusterDetailsDataDto {
  @Type(() => Date)
  @IsDate()
  adjusterAppointmentDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimLossAdjusterDetailsDataDto))
  @MaxLength(100, {
    message: "Adjuster name must be 100 characters or less",
  })
  adjusterName: string;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(20, {
    message: "Adjuster contact must be 20 characters or less",
  })
  adjusterPhone: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Adjuster email must be 255 characters or less",
  })
  adjusterEmail: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimLossAdjusterDetailsDataDto))
  @MaxLength(30, {
    message:
      "Adjuster appointment reference number must be 30 characters or less",
  })
  adjusterAppointmentRefNo: string;

  @Type(() => Number)
  @IsInt()
  adjusterAssignedBy: number;
}

export class SaveClaimLossAdjusterDetailsDataDto extends PartialType(
  ClaimLossAdjusterDetailsDataDto
) {}
export class ValidateClaimLossAdjusterDetailsDto {
  @Type(() => ClaimLossAdjusterDetailsDataDto)
  @ValidateNested()
  @IsObject()
  lossAdjusterAppointment: ClaimLossAdjusterDetailsDataDto;
}

export class SaveClaimLossAdjusterDetailsDto {
  @Type(() => SaveClaimLossAdjusterDetailsDataDto)
  @ValidateNested()
  @IsObject()
  lossAdjusterAppointment: SaveClaimLossAdjusterDetailsDataDto;
}

// Survey Completion DTOs
export class ClaimSurveyCompletedDataDto {
  @Type(() => Date)
  @IsDate()
  surveyDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimSurveyCompletedDataDto))
  @MaxLength(100, {
    message: "Surveyor name must be 100 characters or less",
  })
  surveyorName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimSurveyCompletedDataDto))
  @MaxLength(500, {
    message: "Survey findings summary must be 500 characters or less",
  })
  findingsSummary: string;

  @IsOptional()
  @IsArray({ message: "Survey documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimSurveyCompletedDataDto extends PartialType(
  ClaimSurveyCompletedDataDto
) {}
export class ValidateClaimSurveyCompletedDto {
  @Type(() => ClaimSurveyCompletedDataDto)
  @ValidateNested()
  @IsObject()
  surveyCompleted: ClaimSurveyCompletedDataDto;
}

export class SaveClaimSurveyCompletedDto {
  @Type(() => SaveClaimSurveyCompletedDataDto)
  @ValidateNested()
  @IsObject()
  surveyCompleted: SaveClaimSurveyCompletedDataDto;
}

// Documents Collected DTOs
export class CollectedDocumentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  documentId: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  documentLabel: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  receivedDate: Date;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsInt()
  isCustom: number;
}
export class ClaimDocumentsCollectedDataDto {
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CollectedDocumentDto)
  documents?: CollectedDocumentDto[];
}

export class SaveClaimDocumentsCollectedDataDto extends PartialType(
  ClaimDocumentsCollectedDataDto
) {}

export class ValidateClaimDocumentsCollectedDto {
  @Type(() => ClaimDocumentsCollectedDataDto)
  @ValidateNested()
  @IsObject()
  claimDocumentsCollected: ClaimDocumentsCollectedDataDto;
}

export class SaveClaimDocumentsCollectedDto {
  @Type(() => SaveClaimDocumentsCollectedDataDto)
  @ValidateNested()
  @IsObject()
  claimDocumentsCollected: SaveClaimDocumentsCollectedDataDto;
}

// Joint Inspection Report DTOs
export class ClaimJointInspectionReportDataDto {
  @Type(() => Date)
  @IsDate()
  inspectionDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimJointInspectionReportDataDto))
  @MaxLength(100, { message: "Inspected by must be 100 characters or less" })
  inspectedBy: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  client: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  insurer: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  adjuster: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  surveyor: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimJointInspectionReportDataDto))
  @MaxLength(500, {
    message: "Inspection findings must be 500 characters or less",
  })
  inspectionFindings: string;

  @IsOptional()
  @IsArray({ message: "Joint inspection documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimJointInspectionReportDataDto extends PartialType(
  ClaimJointInspectionReportDataDto
) {}

export class ValidateClaimJointInspectionReportDto {
  @Type(() => ClaimJointInspectionReportDataDto)
  @ValidateNested()
  @IsObject()
  claimJointInspectionReport: ClaimJointInspectionReportDataDto;
}

export class SaveClaimJointInspectionReportDto {
  @Type(() => SaveClaimJointInspectionReportDataDto)
  @ValidateNested()
  @IsObject()
  claimJointInspectionReport: SaveClaimJointInspectionReportDataDto;
}

// LOR Details DTOs
export class ClaimLorDetailsDataDto {
  @Type(() => Date)
  @IsDate()
  lorIssuedDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, { message: "LOR issued by must be 255 characters or less" })
  issuedByKey: string;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimLorDetailsDataDto))
  @MaxLength(500, {
    message: "Required documents must be 500 characters or less",
  })
  requiredDocuments: string;

  @IsOptional()
  @IsArray({ message: "LOR documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimLorDetailsDataDto extends PartialType(
  ClaimLorDetailsDataDto
) {}

export class ValidateClaimLorDetailsDto {
  @Type(() => ClaimLorDetailsDataDto)
  @ValidateNested()
  @IsObject()
  letterOfRequirements: ClaimLorDetailsDataDto;
}

export class SaveClaimLorDetailsDto {
  @Type(() => SaveClaimLorDetailsDataDto)
  @ValidateNested()
  @IsObject()
  letterOfRequirements: SaveClaimLorDetailsDataDto;
}

// Document Submission Tracker DTOs
export class DocumentSubmissionTrackerDataDto extends CollectedDocumentDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  uploadedDate: Date;
}

export class ClaimDocumentSubmissionTrackerDataDto {
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => DocumentSubmissionTrackerDataDto)
  documents?: DocumentSubmissionTrackerDataDto[];
}

export class SaveClaimDocumentSubmissionTrackerDataDto extends PartialType(
  ClaimDocumentSubmissionTrackerDataDto
) {}
export class ValidateClaimDocumentSubmissionTrackerDto {
  @Type(() => ClaimDocumentSubmissionTrackerDataDto)
  @ValidateNested()
  @IsObject()
  claimDocumentSubmissionTracker: ClaimDocumentSubmissionTrackerDataDto;
}

export class SaveClaimDocumentSubmissionTrackerDto {
  @Type(() => SaveClaimDocumentSubmissionTrackerDataDto)
  @ValidateNested()
  @IsObject()
  claimDocumentSubmissionTracker: SaveClaimDocumentSubmissionTrackerDataDto;
}

// Assessment Report DTOs
export class ClaimAssessmentReportDataDto {
  @Type(() => Date)
  @IsDate()
  reportDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimAssessmentReportDataDto))
  @MaxLength(100, {
    message: "Report by must be 100 characters or less",
  })
  reportByKey: string;

  @Type(() => Number)
  @IsNumber()
  assessedLossAmount: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimAssessmentReportDataDto))
  @MaxLength(500, {
    message: "Key observations must be 500 characters or less",
  })
  keyObservations: string;

  @IsOptional()
  @IsArray({ message: "Assessment documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimAssessmentReportDataDto extends PartialType(
  ClaimAssessmentReportDataDto
) {}
export class ValidateClaimAssessmentReportDto {
  @Type(() => ClaimAssessmentReportDataDto)
  @ValidateNested()
  @IsObject()
  assessmentReport: ClaimAssessmentReportDataDto;
}

export class SaveClaimAssessmentReportDto {
  @Type(() => SaveClaimAssessmentReportDataDto)
  @ValidateNested()
  @IsObject()
  assessmentReport: SaveClaimAssessmentReportDataDto;
}

// Validation Report DTOs
export class ClaimValidationReportDataDto {
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimValidationReportDataDto))
  @MaxLength(100, { message: "Validator name must be 100 characters or less" })
  validatorName: string;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Validation status must be 255 characters or less",
  })
  validationStatusKey: string;

  @Type(() => Date)
  @IsDate()
  validationDate: Date;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimValidationReportDataDto))
  @MaxLength(500, { message: "Remarks must be 500 characters or less" })
  remarks: string;
}

export class SaveClaimValidationReportDataDto extends PartialType(
  ClaimValidationReportDataDto
) {}

export class ValidateClaimValidationReportDto {
  @Type(() => ClaimValidationReportDataDto)
  @ValidateNested()
  @IsObject()
  validationOfReport: ClaimValidationReportDataDto;
}

export class SaveClaimValidationReportDto {
  @Type(() => SaveClaimValidationReportDataDto)
  @ValidateNested()
  @IsObject()
  validationOfReport: SaveClaimValidationReportDataDto;
}

// Settlement DTOs
export class ClaimSettlementDataDto {
  @Type(() => Date)
  @IsDate()
  settlementDate: Date;

  @Type(() => Number)
  @IsNumber()
  settlementAmount: number;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimSettlementDataDto))
  @MaxLength(100, { message: "Approved by must be 100 characters or less" })
  approvedBy: string;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Mode of settlement must be 255 characters or less",
  })
  modeOfSettlementKey: string;
}

export class SaveClaimSettlementDataDto extends PartialType(
  ClaimSettlementDataDto
) {}

export class ValidateClaimSettlementDto {
  @Type(() => ClaimSettlementDataDto)
  @ValidateNested()
  @IsObject()
  claimSettlement: ClaimSettlementDataDto;
}

export class SaveClaimSettlementDto {
  @Type(() => SaveClaimSettlementDataDto)
  @ValidateNested()
  @IsObject()
  claimSettlement: SaveClaimSettlementDataDto;
}

// Discharge Voucher DTOs
export class ClaimDischargeVoucherDataDto {
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  dischargeVoucherNumber: string;

  @Type(() => Date)
  @IsDate()
  dischargeVoucherDate: Date;

  @Type(() => Number)
  @IsNumber()
  dischargeVoucherAmount: number;

  @IsOptional()
  @IsArray({ message: "Discharge voucher documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimDischargeVoucherDataDto extends PartialType(
  ClaimDischargeVoucherDataDto
) {}
export class ValidateClaimDischargeVoucherDto {
  @Type(() => ClaimDischargeVoucherDataDto)
  @ValidateNested()
  @IsObject()
  dischargeVoucherGeneration: ClaimDischargeVoucherDataDto;
}

export class SaveClaimDischargeVoucherDto {
  @Type(() => SaveClaimDischargeVoucherDataDto)
  @ValidateNested()
  @IsObject()
  dischargeVoucherGeneration: SaveClaimDischargeVoucherDataDto;
}

// Customer Agreement DTOs
export class ClaimCustomerAgreementDataDto {
  @Type(() => Date)
  @IsDate()
  agreementDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Customer confirmation must be 255 characters or less",
  })
  customerConfirmationKey: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((o) => !(o instanceof SaveClaimCustomerAgreementDataDto))
  @MaxLength(500, {
    message: "Remarks must be 500 characters or less",
  })
  remarks: string;
}

export class SaveClaimCustomerAgreementDataDto extends PartialType(
  ClaimCustomerAgreementDataDto
) {}

export class ValidateClaimCustomerAgreementDto {
  @Type(() => ClaimCustomerAgreementDataDto)
  @ValidateNested()
  @IsObject()
  customerAgreement: ClaimCustomerAgreementDataDto;
}

export class SaveClaimCustomerAgreementDto {
  @Type(() => SaveClaimCustomerAgreementDataDto)
  @ValidateNested()
  @IsObject()
  customerAgreement: SaveClaimCustomerAgreementDataDto;
}

// Voucher to Insurer DTOs
export class ClaimVoucherToInsurerDataDto {
  @Type(() => Date)
  @IsDate()
  sentToInsurerDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  acknowledgementRefNo: string;

  @IsOptional()
  @IsArray({ message: "Voucher documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimVoucherToInsurerDataDto extends PartialType(
  ClaimVoucherToInsurerDataDto
) {}

export class ValidateClaimVoucherToInsurerDto {
  @Type(() => ClaimVoucherToInsurerDataDto)
  @ValidateNested()
  @IsObject()
  voucherToInsurer: ClaimVoucherToInsurerDataDto;
}

export class SaveClaimVoucherToInsurerDto {
  @Type(() => SaveClaimVoucherToInsurerDataDto)
  @ValidateNested()
  @IsObject()
  voucherToInsurer: SaveClaimVoucherToInsurerDataDto;
}

// Payment DTOs
export class ClaimPaymentDataDto {
  @Type(() => Date)
  @IsDate()
  paymentDate: Date;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(100, {
    message: "Payment reference number must be 100 characters or less",
  })
  paymentReferenceNo: string;

  @Type(() => Number)
  @IsNumber()
  paidAmount: number;

  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "Mode of payment must be 255 characters or less",
  })
  modeOfPaymentKey: string;

  @IsOptional()
  @IsArray({ message: "Payment documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  documents?: ClaimDocumentDto[];
}

export class SaveClaimPaymentDataDto extends PartialType(ClaimPaymentDataDto) {}

export class ValidateClaimPaymentDto {
  @Type(() => ClaimPaymentDataDto)
  @ValidateNested()
  @IsObject()
  claimPayment: ClaimPaymentDataDto;
}
export class SaveClaimPaymentDto {
  @Type(() => SaveClaimPaymentDataDto)
  @ValidateNested()
  @IsObject()
  claimPayment: SaveClaimPaymentDataDto;
}
