import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiProperty,
  ApiBody,
} from "@nestjs/swagger";

// Response DTOs for Swagger documentation
class ClaimActivityDataDto {
  @ApiProperty({
    example: 1,
    description: "Unique identifier for the activity data",
  })
  id!: number;

  @ApiProperty({
    example: "Motor",
    description: "Type of claim",
    required: false,
  })
  claimType?: string;

  @ApiProperty({
    example: "2024-01-15T10:30:00Z",
    description: "Date of intimation",
    required: false,
  })
  intimationDate?: Date;

  @ApiProperty({
    example: "2024-01-14T14:20:00Z",
    description: "Date of incident",
    required: false,
  })
  incidentDate?: Date;

  @ApiProperty({
    example: "Bangalore",
    description: "Location of incident",
    required: false,
  })
  incidentLocation?: string;

  @ApiProperty({
    example: "KA01AB1234",
    description: "Vehicle registration number",
    required: false,
  })
  vehicleNumber?: string;

  @ApiProperty({ example: 1, description: "User who created the record" })
  createdBy!: number;

  @ApiProperty({ example: 1, description: "User who last updated the record" })
  updatedBy!: number;

  @ApiProperty({
    example: "2024-01-15T10:30:00Z",
    description: "Creation timestamp",
  })
  createdAt!: Date;

  @ApiProperty({
    example: "2024-01-15T10:35:00Z",
    description: "Last update timestamp",
  })
  updatedAt!: Date;
}

class ClaimActivityMetaItemDto {
  @ApiProperty({ example: 1, description: "Claim activity ID" })
  claimActivityId!: number;

  @ApiProperty({
    example: "claim_informed",
    description: "Status key indicating the activity table",
    enum: [
      "claim_informed",
      "claim_fnol_details",
      "claim_loss_adjuster_details",
      "claim_survey_completed",
      "claim_documents_collected",
      "claim_joint_inspection_report",
      "claim_lor_details",
      "claim_document_submission_tracker",
      "claim_assessment_report",
      "claim_validation_report",
      "claim_settlement",
      "claim_discharge_voucher",
      "claim_customer_agreement",
      "claim_voucher_to_insurer",
      "claim_payment",
    ],
    required: false,
  })
  statusKey?: string;

  @ApiProperty({
    description: "Activity specific data object",
    type: ClaimActivityDataDto,
    required: false,
  })
  data?: ClaimActivityDataDto;

  @ApiProperty({
    example: "Claim activity not found for id: 999",
    description: "Error message if activity not found",
    required: false,
  })
  error?: string;
}

class GetClaimActivityMetaResponseDto {
  @ApiProperty({ example: "Claim activity data retrieved successfully" })
  message!: string;

  @ApiProperty({
    type: [ClaimActivityMetaItemDto],
    description: "Array of claim activity data",
  })
  data!: ClaimActivityMetaItemDto[];
}

class ClaimActivityMetaSuccessResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: "success" })
  message!: string;

  @ApiProperty({ type: GetClaimActivityMetaResponseDto })
  data!: GetClaimActivityMetaResponseDto;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  timestamp!: string;
}

class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "Invalid claim activity ID parameter" })
  message!: string;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  timestamp!: string;
}

export const getClaimActivityMetaSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve claim activity meta data",
      description:
        "Get detailed claim activity data for single or multiple claim activity IDs. Supports comma-separated IDs for bulk retrieval.",
    }),
    ApiParam({
      name: "claimActivityId",
      description:
        "Single claim activity ID or comma-separated list of IDs (e.g., '1' or '1,2,3')",
      example: "1,2,3",
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: "Claim activity meta data retrieved successfully",
      type: ClaimActivityMetaSuccessResponseDto,
      examples: {
        singleActivity: {
          summary: "Single Activity Response",
          value: {
            statusCode: 200,
            message: "success",
            data: {
              message: "Claim activity data retrieved successfully",
              data: [
                {
                  claimActivityId: 1,
                  statusKey: "claim_informed",
                  data: {
                    id: 1,
                    claimType: "Motor",
                    intimationDate: "2024-01-15T10:30:00Z",
                    incidentDate: "2024-01-14T14:20:00Z",
                    incidentLocation: "Bangalore",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2024-01-15T10:30:00Z",
                    updatedAt: "2024-01-15T10:35:00Z",
                  },
                },
              ],
            },
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        },
        multipleActivities: {
          summary: "Multiple Activities Response",
          value: {
            statusCode: 200,
            message: "success",
            data: {
              message: "Claim activity data retrieved successfully",
              data: [
                {
                  claimActivityId: 1,
                  statusKey: "claim_informed",
                  data: {
                    id: 1,
                    claimType: "Motor",
                    intimationDate: "2024-01-15T10:30:00Z",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2024-01-15T10:30:00Z",
                    updatedAt: "2024-01-15T10:35:00Z",
                  },
                },
                {
                  claimActivityId: 2,
                  statusKey: "claim_fnol_details",
                  data: {
                    id: 2,
                    vehicleNumber: "KA01AB1234",
                    createdBy: 1,
                    updatedBy: 1,
                    createdAt: "2024-01-15T11:00:00Z",
                    updatedAt: "2024-01-15T11:05:00Z",
                  },
                },
                {
                  claimActivityId: 999,
                  statusKey: null,
                  data: null,
                  error: "Claim activity not found for id: 999",
                },
              ],
            },
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid claim activity ID parameter",
      type: ErrorResponseDto,
      examples: {
        invalidSingleId: {
          summary: "Invalid Single ID",
          value: {
            statusCode: 400,
            message: "Invalid claim activity ID parameter",
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        },
        invalidMultipleIds: {
          summary: "Invalid Multiple IDs",
          value: {
            statusCode: 400,
            message: "Invalid claim activity IDs in comma-separated parameter",
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      type: ErrorResponseDto,
      example: {
        statusCode: 500,
        message: "Failed to get claim activity meta: Database error",
        timestamp: "2024-01-15T10:30:00.000Z",
      },
    })
  );

export const createNonGroupClaimSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create a new non-group claim",
      description:
        "Creates a new non-group claim and associated activity templates",
    }),
    ApiResponse({
      status: 201,
      description: "Non-group claim created successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - validation failed",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );

export const getNonGroupClaimSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get non-group claim by ID",
      description:
        "Retrieve a specific non-group claim with its activity mappings",
    }),
    ApiParam({
      name: "claimId",
      type: Number,
      description: "Unique identifier of the claim",
    }),
    ApiResponse({
      status: 200,
      description: "Non-group claim retrieved successfully",
    }),
    ApiResponse({
      status: 404,
      description: "Claim not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );

export const getAllNonGroupClaimsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get all non-group claims",
      description:
        "Retrieve a paginated list of non-group claims with filtering options",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number (default: 1)",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Items per page (default: 10)",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Field to search by",
    }),
    ApiQuery({
      name: "searchValue",
      required: false,
      type: String,
      description: "Value to search for",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      type: String,
      description: "Field to sort by",
    }),
    ApiQuery({
      name: "sortOrder",
      required: false,
      enum: ["ASC", "DESC"],
      description: "Sort order",
    }),
    ApiResponse({
      status: 200,
      description: "Non-group claims retrieved successfully",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );

export const createClaimActivityMetaSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create claim activity meta data",
      description:
        "Create or update activity data for a specific claim activity. Supports various claim activity types across different stages of claim processing.",
    }),
    ApiBody({
      description:
        "Claim activity data request (choose type based on activity stage)",
      schema: { type: "object" },
      examples: {
        claimInformed: {
          summary: "Claim Informed Activity - Stage 1",
          value: {
            policyId: 1,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimInformed: {
                intimationDatetime: "2024-01-15T10:30:00Z",
                intimatedByKey: "CLIENT",
                intimationChannelKey: "Email",
                lossLocationId: 1,
                descriptionOfLoss: "test",
              },
            },
          },
        },
        claimFnolDetails: {
          summary: "FNOL Details Activity - Stage 1",
          value: {
            claimActivityId: 2,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              fonlSentToInsurer: {
                fnolSentDate: "2024-01-16",
                insurerReferenceNo: "INS-REF-2024-001",
                documents: [{ documentId: 103 }],
              },
            },
          },
        },
        claimLossAdjusterDetails: {
          summary: "Loss Adjuster Details Activity - Stage 2",
          value: {
            claimActivityId: 3,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              lossAdjusterAppointment: {
                adjusterAppointmentDate: "2024-01-19",
                adjusterName: "Professional Loss Adjusters Ltd",
                adjusterPhone: "+91-9876543212",
                adjusterEmail: "contact@lossadjusters.com",
                adjusterAppointmentRefNo: "REF-2024-001",
                adjusterAssignedBy: 1,
              },
            },
          },
        },
        claimSurveyCompleted: {
          summary: "Survey Completed Activity - Stage 2",
          value: {
            claimActivityId: 4,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              surveyCompleted: {
                surveyDate: "2024-01-22",
                surveyorName: "John Smith",
                findingsSummary: "Claim is genuine and within policy coverage",
                documents: [{ documentId: 107 }],
              },
            },
          },
        },
        claimDocumentsCollected: {
          summary: "Documents Collected Activity - Stage 2",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimDocumentsCollected: {
                documents: [
                  {
                    documentId: 342158,
                    documentLabel: "Policy copy 3",
                    receivedDate: "2025-11-30",
                    isCustom: 0,
                  },
                ],
              },
            },
          },
        },
        claimJointInspectionReport: {
          summary: "Joint Inspection Report Activity - Stage 2",
          value: {
            claimActivityId: 4,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimJointInspectionReport: {
                jointInspectionDate: "2025-10-07",
                inspectedBy: "Jane Doe",
                client: 0,
                insurer: 0,
                adjuster: 1,
                surveyor: 1,
                inspectionFindings: "No major discrepancies found",
                documents: [{ documentId: 107 }],
              },
            },
          },
        },
        letterOfRequirements: {
          summary: "Letter of Requirements Activity - Stage 2",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              letterOfRequirements: {
                lorIssuedDate: "2024-01-25",
                issuedByKey: "Insurer",
                requiredDocuments: "",
                documents: [{ documentId: 110 }],
              },
            },
          },
        },
        claimDocumentSubmissionTracker: {
          summary: "Claim Document Submission Tracker Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimDocumentSubmissionTracker: {
                documents: [
                  {
                    documentId: 342158,
                    documentLabel: "Policy copy 3",
                    receivedDate: "2025-11-30",
                    uploadedDate: "2024-01-30",
                    isCustom: 0,
                  },
                ],
              },
            },
          },
        },
        assessmentReport: {
          summary: "Assessment Report Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              assessmentReport: {
                reportDate: "2024-01-28",
                reportByKey: "Insurer",
                assessedLossAmount: 34567,
                keyObservations: "",
                documents: [{ documentId: 110 }],
              },
            },
          },
        },
        validationOfReport: {
          summary: "Validation of Report Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              validationOfReport: {
                validatorName: "Jane Doe",
                validationStatusKey: "Insurer",
                validationDate: "2024-01-28",
                remarks: "",
              },
            },
          },
        },
        claimSettlement: {
          summary: "Claim Settlement Activity - Stage 4",
          value: {
            claimActivityId: 6,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimSettlement: {
                settlementDate: "2024-02-05",
                settlementAmount: 40000,
                approvedBy: "Manager",
                modeOfSettlementKey: "NEFT",
              },
            },
          },
        },
        dischargeVoucherGeneration: {
          summary: "Discharge Voucher Generation Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              dischargeVoucherGeneration: {
                dischargeVoucherNumber: "DV-2024-001",
                dischargeVoucherDate: "2024-02-06",
                dischargeVoucherAmount: 234567,
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
        customerAgreement: {
          summary: "Customer Agreement Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              customerAgreement: {
                agreementDate: "2024-02-06",
                customerConfirmationKey: "AGREED",
                remarks: "Customer agreed to settlement terms",
              },
            },
          },
        },
        voucherToInsurer: {
          summary: "Voucher to Insurer Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              voucherToInsurer: {
                sentToInsurerDate: "2024-02-06",
                acknowledgementRefNo: "RF-2024-001",
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
        claimPayment: {
          summary: "Claim Payment Activity - Stage 4",
          value: {
            claimActivityId: 8,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimPayment: {
                paymentDate: "2024-02-05",
                paymentReferenceNo: "PAY-2024-001",
                paidAmount: 40000,
                modeOfPaymentKey: "Bank Transfer",
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Claim activity meta created successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: {
            type: "string",
            example: "Claim activity meta created successfully",
          },
          data: {
            type: "object",
            properties: {
              claimActivityId: { type: "number", example: 1 },
              statusKey: {
                type: "string",
                example: "NON_GROUP_CLAIM_ACTIVITY_COMPLETED",
              },
              data: {
                type: "object",
                example: {},
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - validation failed",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Validation failed for activity data",
          },
          errors: {
            type: "array",
            items: { type: "string" },
            example: [
              "claimType is required",
              "intimationDate must be a valid date",
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Claim activity not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "Claim activity with ID 999 not found",
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to create claim activity meta: Database error",
          },
        },
      },
    })
  );

export const updateClaimActivityMetaSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Update claim activity meta data",
      description:
        "Update existing activity data for a specific claim activity",
    }),
    ApiParam({
      name: "claimActivityId",
      type: Number,
      description: "Unique identifier of the claim activity",
    }),
    ApiBody({
      description:
        "Claim activity data request (choose type based on activity stage)",
      schema: { type: "object" },
      examples: {
        claimInformed: {
          summary: "Claim Informed Activity - Stage 1",
          value: {
            claimActivityId: 1,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimInformed: {
                intimationDatetime: "2024-01-15T10:30:00Z",
                intimatedByKey: "CLIENT",
                intimationChannelKey: "Email",
                lossLocationId: 2,
                descriptionOfLoss: "test",
              },
            },
          },
        },
        claimFnolDetails: {
          summary: "FNOL Details Activity - Stage 1",
          value: {
            claimActivityId: 2,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              fonlSentToInsurer: {
                fnolSentDate: "2024-01-16",
                insurerReferenceNo: "INS-REF-2024-001",
                documents: [{ documentId: 103 }],
              },
            },
          },
        },
        claimLossAdjusterDetails: {
          summary: "Loss Adjuster Details Activity - Stage 2",
          value: {
            claimActivityId: 3,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              lossAdjusterAppointment: {
                adjusterAppointmentDate: "2024-01-19",
                adjusterName: "Professional Loss Adjusters Ltd",
                adjusterPhone: "+91-9876543212",
                adjusterEmail: "contact@lossadjusters.com",
                adjusterAppointmentRefNo: "REF-2024-001",
                adjusterAssignedBy: 1,
              },
            },
          },
        },
        claimSurveyCompleted: {
          summary: "Survey Completed Activity - Stage 2",
          value: {
            claimActivityId: 4,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              surveyCompleted: {
                surveyDate: "2024-01-22",
                surveyorName: "John Smith",
                findingsSummary: "Claim is genuine and within policy coverage",
                documents: [{ documentId: 107 }],
              },
            },
          },
        },
        claimDocumentsCollected: {
          summary: "Documents Collected Activity - Stage 2",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimDocumentsCollected: {
                documents: [
                  {
                    documentId: 342158,
                    documentLabel: "Policy copy 3",
                    receivedDate: "2025-11-30",
                    isCustom: 0,
                  },
                ],
              },
            },
          },
        },
        claimJointInspectionReport: {
          summary: "Joint Inspection Report Activity - Stage 2",
          value: {
            claimActivityId: 4,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimJointInspectionReport: {
                jointInspectionDate: "2025-10-07",
                inspectedBy: "Jane Doe",
                client: 0,
                insurer: 0,
                adjuster: 1,
                surveyor: 1,
                inspectionFindings: "No major discrepancies found",
                documents: [{ documentId: 107 }],
              },
            },
          },
        },
        letterOfRequirements: {
          summary: "Letter of Requirements Activity - Stage 2",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              letterOfRequirements: {
                lorIssuedDate: "2024-01-25",
                issuedByKey: "Insurer",
                requiredDocuments: "",
                documents: [{ documentId: 110 }],
              },
            },
          },
        },
        claimDocumentSubmissionTracker: {
          summary: "Claim Document Submission Tracker Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimDocumentSubmissionTracker: {
                documents: [
                  {
                    documentId: 342158,
                    documentLabel: "Policy copy 3",
                    receivedDate: "2025-11-30",
                    uploadedDate: "2024-01-30",
                    isCustom: 0,
                  },
                ],
              },
            },
          },
        },
        assessmentReport: {
          summary: "Assessment Report Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              assessmentReport: {
                reportDate: "2024-01-28",
                reportByKey: "Insurer",
                assessedLossAmount: 34567,
                keyObservations: "",
                documents: [{ documentId: 110 }],
              },
            },
          },
        },
        validationOfReport: {
          summary: "Validation of Report Activity - Stage 3",
          value: {
            claimActivityId: 5,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              validationOfReport: {
                validatorName: "Jane Doe",
                validationStatusKey: "Insurer",
                validationDate: "2024-01-28",
                remarks: "",
              },
            },
          },
        },
        claimSettlement: {
          summary: "Claim Settlement Activity - Stage 4",
          value: {
            claimActivityId: 6,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimSettlement: {
                settlementDate: "2024-02-05",
                settlementAmount: 40000,
                approvedBy: "Manager",
                modeOfSettlementKey: "NEFT",
              },
            },
          },
        },
        dischargeVoucherGeneration: {
          summary: "Discharge Voucher Generation Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              dischargeVoucherGeneration: {
                dischargeVoucherNumber: "DV-2024-001",
                dischargeVoucherDate: "2024-02-06",
                dischargeVoucherAmount: 234567,
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
        customerAgreement: {
          summary: "Customer Agreement Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              customerAgreement: {
                agreementDate: "2024-02-06",
                customerConfirmationKey: "AGREED",
                remarks: "Customer agreed to settlement terms",
              },
            },
          },
        },
        voucherToInsurer: {
          summary: "Voucher to Insurer Activity - Stage 4",
          value: {
            claimActivityId: 7,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              voucherToInsurer: {
                sentToInsurerDate: "2024-02-06",
                acknowledgementRefNo: "RF-2024-001",
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
        claimPayment: {
          summary: "Claim Payment Activity - Stage 4",
          value: {
            claimActivityId: 8,
            statusKey: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
            data: {
              claimPayment: {
                paymentDate: "2024-02-05",
                paymentReferenceNo: "PAY-2024-001",
                paidAmount: 40000,
                modeOfPaymentKey: "Bank Transfer",
                documents: [{ documentId: 117 }],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Claim activity meta updated successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - validation failed",
    }),
    ApiResponse({
      status: 404,
      description: "Claim activity not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );

export const getClaimActivityStepperSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get claim activity stepper or template",
      description:
        "Retrieve the claim activity stepper (if claimId is provided) or the activity stepper template (if claimId is omitted).",
    }),
    ApiQuery({
      name: "claimId",
      required: false,
      type: Number,
      description:
        "Unique identifier of the claim (optional). If omitted, the endpoint returns the stepper template with null status values.",
    }),
    ApiResponse({
      status: 200,
      description: "Claim activity stepper or template retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example:
              "Claim activity stepper retrieved successfully or template retrieved successfully",
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stageId: { type: "number", example: 1 },
                stageName: { type: "string", example: "Claim Intimation" },
                stageKey: { type: "string", example: "claim_intimation" },
                stageStatusKey: {
                  type: "string",
                  nullable: true,
                  example: "NON_GROUP_CLAIM_ACTIVITY_DRAFT",
                },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      claimActivityId: {
                        type: "number",
                        nullable: true,
                        example: 17,
                      },
                      activityId: { type: "number", example: 1 },
                      activityOrder: { type: "number", example: 1 },
                      activityName: {
                        type: "string",
                        example: "Claim Informed",
                      },
                      activityKey: {
                        type: "string",
                        example: "claim_informed",
                      },
                      activityStatusKey: {
                        type: "string",
                        nullable: true,
                        example: "NON_GROUP_CLAIM_ACTIVITY_DRAFT",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Claim not found (if invalid claimId provided)",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
