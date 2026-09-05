import {
  endPoints,
  REGEX_PATTERNS,
  requiredErrorMessage,
  SUPPORTED_FORMATS_PDF_WORD,
  DATE_WITH_TIME_FORMATS,
  textErrorMessage,
  ValidationErrors,
  NO_DATA_FOUND,
} from "@ui/ui-lib";
import dayjs from "dayjs";
import { StateEnum } from "../../../components/NestedStepper/RenderComponent.js";
import { Step } from "../../../components/NestedStepper/config.js";

export const lookUpKeyUtility = (data: any) => {
  return data?.data?.map((item: any) => ({
    label: item.lookUpValue,
    value: item.lookUpKey,
  }));
};

export const locationsByIdUtility = (data: any) => {
  return (
    data?.data?.data?.map((location: any) => ({
      label: location.address1,
      value: location.id,
    })) ?? []
  );
};

// Utility for insurers by policy id
export const insurersByPolicyIdUtility = (data: any) => {
  return (
    data?.data?.data?.map((insurer: any) => ({
      label: insurer.displayName || insurer.insurerName,
      value: insurer.id,
    })) ?? []
  );
};

export const ClaimInformedConfig = (companyId?: number) => [
  {
    key: "claimInformed",
    defaultValues: {
      intimationDatetime: dayjs().format(
        DATE_WITH_TIME_FORMATS.ISO_WITH_MILLISECONDS
      ),
    },
    config: [
      {
        key: "intimationDatetime",
        name: "intimationDatetime",
        label: "Intimation Date & Time",
        type: "datetime",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },

      {
        key: "intimatedByKey",
        name: "intimatedByKey",
        label: "Intimated By",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("INTIMATOR"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "intimationChannelKey",
        name: "intimationChannelKey",
        label: "Intimation Channel",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("INTIMATION_CHANNEL"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "lossLocationId",
        name: "lossLocationId",
        label: "Loss Location",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter loss location",
        },
        apiDependencies: {
          endPoint: companyId
            ? endPoints.getLocationsByCompanyId(companyId)
            : undefined,
          utilityFunction: (data: any) => locationsByIdUtility(data),
        },
      },
      {
        key: "descriptionOfLoss",
        name: "descriptionOfLoss",
        label: "Description of Loss",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 500,
            message: textErrorMessage("Description of Loss", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Describe the loss incident in detail",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
    ],
  },
];

export const FonlSentToInsurerConfig = () => [
  {
    key: "fonlSentToInsurer",
    defaultValues: {
      fnolSentDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "fnolSentDate",
        name: "fnolSentDate",
        label: "FNOL Sent Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "insurerReferenceNo",
        name: "insurerReferenceNo",
        label: "Insurer Reference No.",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter reference number.",
        },
      },
      {
        key: "uploadFnolCopy",
        name: "uploadFnolCopy",
        label: "Upload FNOL Copy *",
        type: "documentupload",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          companyType: "claims",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
        },
        hideDropdown: true,
      },
    ],
  },
];

export const LossAdjusterAppointmentConfig = (numericPolicyId?: number) => [
  {
    key: "lossAdjusterAppointment",
    defaultValues: {
      adjusterAppointmentDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "adjusterAppointmentDate",
        name: "adjusterAppointmentDate",
        label: "Adjuster Appointment Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "adjusterName",
        name: "adjusterName",
        label: "Adjuster Name",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Adjuster Name", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter adjuster name",
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "adjusterPhone",
        name: "adjusterPhone",
        label: "Adjuster Phone",
        type: "text",
        gridColumn: 5,
        rules: {
          required: {
            value: true,
            message: requiredErrorMessage("Phone number"),
          },
          maxLength: {
            value: 20,
            message: textErrorMessage("Phone number", 20),
          },
          pattern: {
            value: REGEX_PATTERNS.PHONE,
            message: ValidationErrors.PHONE,
          },
        },
        componentProps: {
          fullWidth: true,
          type: "tel",
          inputProps: {
            maxLength: 20,
          },
        },
      },
      {
        key: "adjusterEmail",
        name: "adjusterEmail",
        label: "Adjuster Email",
        type: "text",
        gridColumn: 5,
        rules: {
          maxLength: {
            value: 100,
            message: textErrorMessage("Email", 100),
          },
          pattern: {
            value: REGEX_PATTERNS.EMAIL,
            message: ValidationErrors.EMAIL,
          },
        },
        componentProps: {
          fullWidth: true,
          type: "email",
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "adjusterAppointmentRefNo",
        name: "adjusterAppointmentRefNo",
        label: "Adjuster Appointment Ref No.",
        type: "text",
        rules: {
          maxLength: {
            value: 30,
            message: textErrorMessage("Adjuster Appointment Ref No.", 30),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter reference number",
          inputProps: {
            maxLength: 30,
          },
        },
      },
      {
        key: "adjusterAssignedBy",
        name: "adjusterAssignedBy",
        label: "Adjuster Assigned By",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.getInsurerByPolicyId(numericPolicyId), // Temporary hardcoded policyId, replace as needed
          utilityFunction: (data: any) => insurersByPolicyIdUtility(data),
        },
      },
    ],
  },
];

export const SurveyCompletedConfig = () => [
  {
    key: "surveyCompleted",
    defaultValues: {
      surveyDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "surveyDate",
        name: "surveyDate",
        label: "Survey Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "surveyorName",
        name: "surveyorName",
        label: "Surveyor Name",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Surveyor Name", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter surveyor name",
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "findingsSummary",
        name: "findingsSummary",
        label: "Findings Summary",
        type: "textarea",
        rules: {
          maxLength: {
            value: 500,
            message: textErrorMessage("Findings Summary", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter survey findings",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
      {
        key: "uploadSurveyCopy",
        name: "uploadSurveyCopy",
        label: "Upload Survey Copy *",
        type: "documentupload",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const DocumentsCollectedConfig = () => [
  {
    key: "documentsCollected",
    defaultValues: {},
    config: [
      {
        key: "claimDocuments",
        name: "claimDocuments",
        type: "customcomponent",
        gridColumn: 12,
        componentProps: {
          componentKey: "DocumentTableField",
          name: "claimDocuments",
          companyType: "policy",
          uploadLabel: "Upload document",
          addButtonLabel: "Add other document",
          accept: ".pdf,.doc,.docx",
          rows: [
            {
              documentName: "Policy Copy",
              receivedDate: dayjs().format("YYYY-MM-DD"),
            },
            {
              documentName: "FIR",
              receivedDate: dayjs().format("YYYY-MM-DD"),
            },
            {
              documentName: "Invoices",
              receivedDate: dayjs().format("YYYY-MM-DD"),
            },
            {
              documentName: "Photos",
              receivedDate: dayjs().format("YYYY-MM-DD"),
            },
            {
              documentName: "Estimate",
              receivedDate: dayjs().format("YYYY-MM-DD"),
            },
          ],
          // Optional: observe actions that the component already performs (upload, download, delete).
          onDownload: (row) => {
            // Example hook: capture analytics when a document is downloaded
            return row.documentName;
          },
          onDelete: (row) => {
            // Example hook: sync deletions to a separate data source
            return row.id;
          },
          onReplace: (row) => {
            // Example hook: trigger downstream processing when a document is replaced
            return row.documentupload;
          },
        },
      },
    ],
  },
];

export const JointInspectionReportConfig = () => [
  {
    key: "claimJointInspectionReport",
    defaultValues: {
      inspectionDate: dayjs().format("YYYY-MM-DD"),
      client: 0,
      insurer: 0,
      adjuster: 0,
      surveyor: 0,
    },
    config: [
      {
        key: "inspectionDate",
        name: "inspectionDate",
        label: "Joint Inspection Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        label: "Inspected By",
        key: "inspectedBy",
        name: "inspectedBy",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Inspected By", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter inspector name",
        },
      },
      {
        label: "Client",
        key: "client",
        name: "client",
        type: "checkbox",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },

      {
        label: "Insurer",
        key: "insurer",
        name: "insurer",
        type: "checkbox",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },

      {
        label: "Adjuster",
        key: "adjuster",
        name: "adjuster",
        type: "checkbox",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },

      {
        label: "Surveyor",
        key: "surveyor",
        name: "surveyor",
        type: "checkbox",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },

      {
        key: "inspectionFindings",
        name: "inspectionFindings",
        label: "Inspection Findings",
        type: "textarea",
        rules: {
          maxLength: {
            value: 500,
            message: textErrorMessage("Inspection Findings", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter inspection findings",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
      {
        key: "uploadInspectionReport",
        name: "uploadInspectionReport",
        label: "Upload Inspection Report *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const LetterOfRequirementsConfig = () => [
  {
    key: "letterOfRequirements",
    defaultValues: {
      lorIssuedDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "lorIssuedDate",
        name: "lorIssuedDate",
        label: "LOR Issued Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "issuedByKey",
        name: "issuedByKey",
        label: "Issued By",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("LOR_ISSUER"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "requiredDocuments",
        name: "requiredDocuments",
        label: "Required Documents",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 500,
            message: textErrorMessage("Required Documents", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "List all required documents",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
      {
        key: "uploadLorCopy",
        name: "uploadLorCopy",
        label: "Upload LOR Copy *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const TrackDocumentSubmissionConfig = () => [
  {
    key: "documentSubmissionTracker",
    defaultValues: {
      documents: [],
    },
    config: [
      {
        key: "claimDocuments",
        name: "claimDocuments",
        type: "customcomponent",
        gridColumn: 12,
        componentProps: {
          componentKey: "DocumentTableField",
          name: "claimDocuments",
          companyType: "policy",
          companyId: "12345",
          uploadLabel: "Upload document",
          addButtonLabel: "Add other document",
          accept: ".pdf,.doc,.docx",
          showAdditionalColumns: true, // Enable additional columns for status and upload date
          rows: [],
          onDownload: (row) => {
            return row.documentName;
          },
          onDelete: (row) => {
            return row.id;
          },
          onReplace: (row) => {
            return row.documentupload;
          },
        },
      },
    ],
  },
];

export const AssessmentReportConfig = () => [
  {
    key: "assessmentReport",
    defaultValues: {
      reportDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "reportDate",
        name: "reportDate",
        label: "Report Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "reportByKey",
        name: "reportByKey",
        label: "Report By",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Report By", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "assessedLossAmount",
        name: "assessedLossAmount",
        label: "Assessed Loss Amount",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter assessed amount",
        },
      },
      {
        key: "keyObservations",
        name: "keyObservations",
        label: "Key Observations",
        type: "textarea",
        rules: {
          maxLength: {
            value: 500,
            message: textErrorMessage("Key Observations", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter key observations",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
      {
        key: "uploadReport",
        name: "uploadReport",
        label: "Upload Report *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const ValidationOfReportConfig = () => [
  {
    key: "validationOfReport",
    defaultValues: {
      validationDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "validatorName",
        name: "validatorName",
        label: "Validator Name",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Validator Name", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter validator name",
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "validationStatusKey",
        name: "validationStatusKey",
        label: "Validation Status",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("CLAIM_VALIDATION_STATUS"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "validationDate",
        name: "validationDate",
        label: "Validation Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "remarks",
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        rules: {
          maxLength: {
            value: 500,
            message: textErrorMessage("Remarks", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter validation remarks",
          rows: 3,
          multiline: true,
          inputProps: {
            maxLength: 500,
          },
        },
      },
    ],
  },
];

export const ClaimSettlementConfig = () => [
  {
    key: "claimSettlement",
    defaultValues: {
      settlementDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "settlementDate",
        name: "settlementDate",
        label: "Settlement Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "settlementAmount",
        name: "settlementAmount",
        label: "Settlement Amount",
        formatNumber: true,
        type: "number",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter settlement amount",
        },
      },
      {
        key: "approvedBy",
        name: "approvedBy",
        label: "Approved By",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
          maxLength: {
            value: 100,
            message: textErrorMessage("Approved By", 100),
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter approver name (Insurer)",
          inputProps: {
            maxLength: 100,
          },
        },
      },
      {
        key: "modeOfSettlementKey",
        name: "modeOfSettlementKey",
        label: "Mode of Settlement",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("SETTLEMENT_MODE"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
];

export const DischargeVoucherGenerationConfig = () => [
  {
    key: "dischargeVoucherGeneration",
    defaultValues: {
      dischargeVoucherDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "dischargeVoucherNumber",
        name: "dischargeVoucherNumber",
        label: "Discharge Voucher Number",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter discharge voucher number",
        },
      },
      {
        key: "dischargeVoucherDate",
        name: "dischargeVoucherDate",
        label: "Discharge Voucher Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "dischargeVoucherAmount",
        name: "dischargeVoucherAmount",
        label: "Amount in Discharge Voucher",
        type: "number",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter amount",
        },
      },
      {
        key: "uploadDischargeVoucherCopy",
        name: "uploadDischargeVoucherCopy",
        label: "Upload Discharge Voucher Copy *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const CustomerAgreementConfig = () => [
  {
    key: "customerAgreement",
    defaultValues: {
      agreementDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "agreementDate",
        name: "agreementDate",
        label: "Date of Agreement",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "customerConfirmationKey",
        name: "customerConfirmationKey",
        label: "Customer Confirmation",
        type: "segmentedcontrol",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter customer name",
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("TOGGLE_TYPE"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "remarks",
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        rules: {
          maxLength: {
            value: 500,
            message: textErrorMessage("Remarks", 500),
          },
        },
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter any remarks or comments",
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const VoucherToInsurerConfig = () => [
  {
    key: "voucherToInsurer",
    defaultValues: {
      sentToInsurerDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "sentToInsurerDate ",
        name: "sentToInsurerDate",
        label: "Sent to Insurer Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "acknowledgementRefNo",
        name: "acknowledgementRefNo",
        label: "Acknowledgement Ref No.",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter acknowledgement reference",
        },
      },
      {
        key: "uploadAcknowledgedCopy",
        name: "uploadAcknowledgedCopy",
        label: "Upload Acknowledged Copy *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const ClaimPaymentConfig = () => [
  {
    key: "claimPayment",
    defaultValues: {
      paymentDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "paymentDate",
        name: "paymentDate",
        label: "Payment Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "paymentReferenceNo",
        name: "paymentReferenceNo",
        label: "Payment Reference No.",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter payment reference",
        },
      },
      {
        key: "paidAmount",
        name: "paidAmount",
        label: "Paid Amount",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter paid amount",
        },
      },
      {
        key: "modeOfPaymentKey",
        name: "modeOfPaymentKey",
        label: "Mode of Payment",
        type: "select",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("CLAIM_PAYMENT_MODE"),
          utilityFunction: (data: any) => lookUpKeyUtility(data),
        },
      },
      {
        key: "uploadPaymentProof",
        name: "uploadPaymentProof",
        label: "Upload Payment Proof Copy *",
        type: "documentupload",

        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".pdf,.doc,.docx",
          supportedFormatsMessage: SUPPORTED_FORMATS_PDF_WORD,
          emptyStateMessage: NO_DATA_FOUND,
          showLatestRequirementsTable: true,
          companyType: "claims",
        },
        hideDropdown: true,
      },
    ],
  },
];

export const tranformNonGroupClaimsStepperConfig = (
  stepConfig: Step[],
  stepperApiData: any,
  activityStatusKeys: any
) => {
  if (!Array.isArray(stepperApiData)) return stepConfig;

  // Build dictionary for status lookups
  const dictionary = activityStatusKeys.reduce((acc, item) => {
    acc[item.lookUpKey] = item.lookUpKey;
    return acc;
  }, {} as Record<string, string>);

  // Map stage data by stageKey
  const stageMap = new Map(
    stepperApiData.map((stage: any) => [stage.stageKey?.toLowerCase(), stage])
  );

  const transformedConfig = stepConfig.map((step) => {
    const stageFromApi = stageMap.get(step.key?.toLowerCase());
    if (!stageFromApi) return step; // no matching stage

    // Build activity map for this stage
    const activityMap = new Map(
      (stageFromApi.activities || []).map((a: any) => [
        a.activityKey?.toLowerCase(),
        a,
      ])
    );

    // Merge item with its corresponding activity
    const mergedItems = step.items.map((item) => {
      const apiActivity = activityMap.get(item.key?.toLowerCase());
      if (!apiActivity) return item;

      // Derive correct step state
      let stepState = StateEnum.DRAFT;
      if (
        apiActivity.activityStatusKey ===
        dictionary.NON_GROUP_CLAIM_ACTIVITY_SUBMIT
      ) {
        stepState = StateEnum.COMPLETED;
      } else if (
        apiActivity.activityStatusKey ===
          dictionary.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS ||
        apiActivity.activityStatusKey === "CLAIM_ACTIVITY_SAVE"
      ) {
        stepState = StateEnum.ACTIVE;
      }

      // Return merged object — push all activity fields inside item
      return {
        ...item,
        ...apiActivity,
        stepState,
      };
    });

    // Determine stage step state
    let stageStepState = StateEnum.DRAFT;
    if (
      stageFromApi.stageStatusKey === dictionary.NON_GROUP_CLAIM_ACTIVITY_SUBMIT
    ) {
      stageStepState = StateEnum.COMPLETED;
    } else if (
      stageFromApi.stageStatusKey ===
      dictionary.NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS
    ) {
      stageStepState = StateEnum.ACTIVE;
    }

    // Return stage without 'activities'
    const { activities, ...restStage } = stageFromApi;

    return {
      ...step,
      ...restStage,
      stepState: stageStepState,
      items: mergedItems,
    };
  });

  return transformedConfig;
};

export const ClaimsNestedStepperConfig = (
  companyId?: number,
  numericPolicyId?: number
): Step[] => [
  {
    key: "claim_intimation",
    title: "Claim Intimation",
    componentKey: "accordianComponent",
    stepState: StateEnum.ACTIVE,
    items: [
      {
        key: "claim_informed",
        label: "Claim Informed",
        componentKey: "primary",
        config: ClaimInformedConfig(companyId),
        stepState: StateEnum.DRAFT,
      },
      {
        key: "first_notice_of_loss",
        label: "FNOL Sent to Insurer",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: FonlSentToInsurerConfig(),
      },
    ],
  },
  {
    key: "survey_and_documentation",
    title: "Survey & Documentation",
    componentKey: "accordianComponent",
    stepState: StateEnum.DRAFT,
    items: [
      {
        key: "loss_adjuster_details",
        label: "Loss Adjuster Appointment",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: LossAdjusterAppointmentConfig(numericPolicyId),
      },
      {
        key: "survey_completed",
        label: "Survey Completed",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: SurveyCompletedConfig(),
      },
      {
        key: "documents_collected",
        label: "Documents Collected",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: DocumentsCollectedConfig(),
      },
      {
        key: "joint_inspection_report",
        label: "Joint Inspection Report",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: JointInspectionReportConfig(),
      },
      {
        key: "letter_of_requirements",
        label: "LOR (Letter of Req.)",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: LetterOfRequirementsConfig(),
      },
    ],
  },
  {
    key: "assessment_and_validation",
    title: "Assessment & Validation",
    componentKey: "accordianComponent",
    stepState: StateEnum.DRAFT,
    items: [
      {
        key: "track_document_submission",
        label: "Track Document Submission",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: TrackDocumentSubmissionConfig(),
      },
      {
        key: "assessment_report",
        label: "Assessment Report",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: AssessmentReportConfig(),
      },
      {
        key: "validation_of_report",
        label: "Validation of Report",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: ValidationOfReportConfig(),
      },
    ],
  },
  {
    key: "settlement",
    title: "Settlement",
    componentKey: "accordianComponent",
    stepState: StateEnum.DRAFT,
    items: [
      {
        key: "claim_settlement",
        label: "Claim Settlement",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: ClaimSettlementConfig(),
      },
      {
        key: "discharge_voucher_generation",
        label: "Discharge Voucher Gen.",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: DischargeVoucherGenerationConfig(),
      },
      {
        key: "customer_agreement",
        label: "Customer Agreement",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: CustomerAgreementConfig(),
      },
      {
        key: "voucher_to_insurer",
        label: "Voucher to Insurer",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: VoucherToInsurerConfig(),
      },
      {
        key: "claim_payment",
        label: "Claim Payment",
        componentKey: "primary",
        stepState: StateEnum.DRAFT,
        config: ClaimPaymentConfig(),
      },
    ],
  },
];
