import { endPoints, FeatureKey, FormFieldConfig, theme } from "@ui/ui-lib";
import DocumentIconGreen from "../../../assets/svgs/document-con-green.svg";
import DocumentIconPurple from "../../../assets/svgs/document-icon-purple.svg";
import { StateEnum } from "../../../components/NestedStepper/RenderComponent.js";
import { Step } from "../../../components/NestedStepper/config.js";
import EyeIcon from "../../../assets/svgs/eye-icon-sm.svg";
import {
  EndorsementDocTitleContainer,
  SelectDocumentsToSendToClientContainer,
  SubTitleTypography,
  TitleAndSubTitleContainer,
  TitleContainer,
  TitleIconContainer,
  TitleTypography,
} from "./styles.js";
import { ENDORSEMENT_STEP_KEYS, UPLOAD_CATEGORY } from "../../../constants";
import dayjs from "dayjs";
import DocumentIconOrange from "../../../assets/svgs/document-icon-orange.svg";

export const transactionTypeKeyUtility = (
  data: any,
  excludeCdBalance = false,
) => {
  return data?.data
    ?.filter((item: any) =>
      excludeCdBalance
        ? item.lookUpKey !== "TRANSACTION_TYPE_CD_BALANCE"
        : true,
    )
    .map((item: any) => ({
      label: item.lookUpValue,
      value: item.lookUpKey,
    }));
};

export const lookUpKeyUtility = (data: any) => {
  return data?.data?.map((item: any) => ({
    label: item.lookUpValue,
    value: item.lookUpKey,
  }));
};

export const EndorsementRequestReceivedConfig: FormFieldConfig[] = [
  {
    key: "osTicketNumber",
    name: "osTicketNumber",
    label: "OS Ticket Number",
    type: "text",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Enter OS Ticket Number",
      fullWidth: true,
    },
  },
  {
    key: "endorsementRequestReceivedDate",
    name: "endorsementRequestReceivedDate",
    label: "Endorsement Request Received Date",
    type: "date",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "endorsementType",
    name: "endorsementType",
    label: "Endorsement Type",
    type: "select",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Select Endorsement Type",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ENDORSEMENT_TYPE"),
      utilityFunction: (data: any) => lookUpKeyUtility(data),
    },
  },
];
export const OpenEnrollmentPortalConfig: FormFieldConfig[] = [
  {
    key: "portalOpenDate",
    name: "portalOpenDate",
    label: "Portal Open Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "noOfDays",
    name: "noOfDays",
    type: "number",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter number of days",
      fullWidth: true,
    },
    label: "How Many Days",
  },
  {
    key: "portalClosedDate",
    name: "portalClosedDate",
    label: "Portal Closure Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "portalUrl",
    name: "portalUrl",
    label: "Portal URL",
    type: "text",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter Portal URL",
      fullWidth: true,
    },
  },
  {
    key: "portalInstructions",
    name: "portalInstructions",
    label: "Portal Instructions",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      placeholder: "Enter Instructions for enrollment portal",
      fullWidth: true,
      rows: 3,
      multiline: true,
    },
  },
];
export const CreateEndorsementConfig = (
  title?: string,
  Icon?: any,
  styling?: React.CSSProperties,
  cardData?: any,
  creationLabel?: string,
  isGroupPolicyType?: boolean,
  showPremiumCalculator?: boolean,
  endorsementType?: string,
  isPolicyExtension?: boolean
) => [
  {
    key: "createEndorsement",
    defaultValues: {
      endorsementCreatedDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "endorsementCreatedDate",
        name: "endorsementCreatedDate",
        label: "Endorsement Created Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "provisionalEndorsementNumber",
        name: "provisionalEndorsementNumber",
        label: "Provisional Endorsement Number",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter provisional endorsement number",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementSummary",
    config: [
      {
        key: "endorsementSummaryComponent",
        name: "endorsementSummaryComponent",
        label: "Endorsement Summary",
        type: "customcomponent",
        componentProps: {
          componentKey: "EndorsementSummary",
          title: title,
          Icon: Icon,
          styling: styling,
          cardData: cardData,
          creationLabel: creationLabel,
        },
      },
    ],
  },
  {
    key: "endorsementBrokerageDetails",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconOrange} />
        <TitleTypography>Brokerage Details</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #c57e1cff`,
      maxWidth: "860px",
    },
    config: [
      {
        key: "basicBrokeragePercentage",
        name: "basicBrokeragePercentage",
        label: "Basic Brokerage Percentage",
        type: "number",
        gridColumn: 5,
        isDecimal: true,
        disabled: "endorsementSummary?.basicBrokeragePercentage",
        componentProps: {
          fullWidth: true,
          inputMode: "numeric",
          placeholder: "Enter brokerage percentage",
        },
      },
      {
        key: "basicBrokerageAmount",
        name: "basicBrokerageAmount",
        label: "Basic Brokerage Amount",
        type: "number",
        gridColumn: 5,
        isDecimal: true,
        disabled: true,
        formatNumber: true,
        componentProps: {
          fullWidth: true,
          inputMode: "numeric",
          placeholder: "Enter brokerage amount",
        },
      },
    ],
  },
  {
    key: "premiumPaymentTerm",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconGreen} />
        <TitleTypography>Premium Payment Term</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #22c55e`,
      maxWidth: "860px",
    },
    defaultValues: {
      paymentMethod: isPolicyExtension
        ? "TRANSACTION_TYPE_NEFT"
        : "TRANSACTION_TYPE_CD_BALANCE",
    },
    config: [
      {
        key: "paymentMethod",
        name: "paymentMethod",
        label: "Transaction Mode",
        type: "select",
        gridColumn: 4.9,
        rules: {
              required: { value: true, message: "Field is required" },
            },
        componentProps: {
          fullWidth: true,
          placeholder: "Select Transaction Mode",
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("TRANSACTION_TYPE"),
          utilityFunction: (data: any) => transactionTypeKeyUtility(data),
        },
      },
      {
        key: "transactionOrChequeNumber",
        name: "transactionOrChequeNumber",
        label: "Transaction/Cheque No",
        type: "text",
        gridColumn: 4.9,
        // rules: {
        //   required: { value: true, message: "Field is required" },
        // },
        componentProps: {
          placeholder: "Enter transaction or cheque number",
          fullWidth: true,
        },
      },
      {
        key: "paymentDate",
        name: "paymentDate",
        label: "Transaction Date",
        type: "date",
        gridColumn: 4.9,
        // rules: {
        //   required: { value: true, message: "Field is required" },
        // },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "paymentAmount",
        name: "paymentAmount",
        label: "Transaction Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        // rules: {
        //   required: { value: true, message: "Field is required" },
        // },
        componentProps: {
          placeholder: "Enter transaction amount",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "createEndorsementRemarks",
    config: [
      {
        key: "endorsementDetails",
        name: "endorsementDetails",
        label: "Endorsement Details",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter endorsement details",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const SendEndorsementToInsurerConfig = (
  title?: string,
  subTitle?: string,
  endorsementFileDetails?: any,
  enableDownloadIcon?: boolean,
  creationLabel?: string,
  policyId?: number,
  endorsementId?: number,
  setDocumentFileStatus?: (status: string | null) => void,
  refetchEndorsementSteps?: () => void
) => [
  {
    key: "sendEndorsementToInsurer",
    defaultValues: {
      insurerCommunicationDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "insurerCommunicationDate",
        name: "insurerCommunicationDate",
        label: "Insurer Communication Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementDocumentContainer",
    config: [
      {
        key: "endorsementDocument",
        name: "endorsementDocument",
        label: "Endorsement Document",
        type: "customcomponent",
        componentProps: {
          componentKey: "EndorsementDocument",
          title: title,
          subTitle: subTitle,
          endorsementFileDetails: endorsementFileDetails,
          enableDownloadIcon: enableDownloadIcon,
          creationLabel: creationLabel,
          policyId: policyId,
          endorsementId: endorsementId,
          setDocumentFileStatus: setDocumentFileStatus,
          refetchEndorsementSteps: refetchEndorsementSteps,
        },
      },
    ],
  },
  {
    key: "communicationDetails",
    config: [
      {
        key: "communicationDetails",
        name: "communicationDetails",
        label: "Communication Details",
        type: "textarea",
        gridColumn: 9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter communication details with insurer",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];
export const ReceiveAcknowledgementFromInsurerConfig = (
  policyId?: number,
  companyType?: string,
  documentTypeLid?: number,
  endorsementId?: number
) => [
  {
    key: "acknowledgementFromInsurer",
    defaultValues: {
      acknowdgementDate: dayjs().format("YYYY-MM-DD"),
      endorsementEffectiveDate: dayjs().format("YYYY-MM-DD"),
      incomeEffectiveDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "acknowdgementDate",
        name: "acknowdgementDate",
        label: "Acknowledgement Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "insurerEndorsementNumber",
        name: "insurerEndorsementNumber",
        label: "Insurer Endorsement Number",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter insurer endorsement number",
          fullWidth: true,
        },
      },
      {
        key: "noOfEmployees",
        name: "noOfEmployees",
        label: "Number of Assets",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter number of assets",
          fullWidth: true,
        },
      },
      {
        key: "noOfDependents",
        name: "noOfDependents",
        label: "Number of Sub Assets",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter number of sub assets",
        },
      },
      {
        key: "endorsementEffectiveDate",
        name: "endorsementEffectiveDate",
        label: "Endorsement Effective Date",
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
        key: "incomeEffectiveDate",
        name: "incomeEffectiveDate",
        label: "Income Effective Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "premiumDetails",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconPurple} />
        <TitleTypography>Premium Details</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #a855f7`,
      maxWidth: "860px",
      gap: "16px",
    },
    config: [
      {
        key: "endorsementPremiumAmount",
        name: "endorsementPremiumAmount",
        label: "Endorsement Premium Amount",
        type: "number",
        formatNumber: true,

        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 4.9,
        componentProps: {
          placeholder: "Enter endorsement premium amount",
          fullWidth: true,
        },
      },
      {
        key: "terrorismPremiumAmount",
        name: "terrorismPremiumAmount",
        label: "Terrorism Premium Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter terrorism premium amount",
          fullWidth: true,
        },
      },
      {
        key: "gstAmount",
        name: "gstAmount",
        label: "GST Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter GST amount",
          fullWidth: true,
        },
      },
      {
        key: "totalPremiumAmount",
        name: "totalPremiumAmount",
        label: "Total Premium Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter total premium amount",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementPolicyDocument",
    title: (
      <EndorsementDocTitleContainer>
        <TitleTypography>Insurer Acknowledgement Document*</TitleTypography>
      </EndorsementDocTitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      rowGap: "8px",
    },
    config: [
      {
        key: "endorsementPolicyDocumentId",
        name: "endorsementPolicyDocumentId",
        type: "documentupload",
        gridColumn: 9,
        companyId: policyId,
        companyType: companyType,
        documentTypeLid: documentTypeLid,
        endorsementId: endorsementId,
        uploadCategory: UPLOAD_CATEGORY.INSURER_ACK,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".xlsx,.xls",
          requireDocumentType: false,
          maxLimit: 1,
          permissionFeatureKey: FeatureKey.EXPORT_ENDORSEMENTS,
        },
        hideDropdown: true,
        apiDependencies: {
          endPoint: endPoints.fileUpload,
        },
        rules: {
          required: { value: true, message: "Field is required" },
        },
      },
    ],
  },
];
export const InsurerPremiumAmountConfig: FormFieldConfig[] = [
  {
    label: "Endorsement Premium Amount",
    key: "endorsementPremiumAmount",
    name: "endorsementPremiumAmount",
    type: "number",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter endorsement premium amount",
      fullWidth: true,
    },
  },
  {
    label: "Terrorism Premium Amount",
    key: "terrorismPremiumAmount",
    name: "terrorismPremiumAmount",
    type: "number",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter terrorism premium amount",
      fullWidth: true,
    },
  },
  {
    label: "GST Amount",
    key: "gstAmount",
    name: "gstAmount",
    type: "number",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter terrorism premium amount",
      fullWidth: true,
    },
  },
  {
    label: "Total Premium Amount",
    key: "totalPremiumAmount",
    name: "totalPremiumAmount",
    type: "number",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter total premium amount",
      fullWidth: true,
    },
  },
];

export const ClientConfirmationConfig = (
  Icon?: any,
  endorsementDataDownloadId?: number | undefined,
  insurerDocumentDownloadId?: number | undefined,
  enableDownloadIconForClientConfirmation?: boolean
) => [
  {
    key: "clientConfirmation",
    defaultValues: {
      clientConfirmationDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "clientConfirmationDate",
        name: "clientConfirmationDate",
        label: "Client Confirmation Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "selectDocumentsToSendToClient",
    title: (
      <TitleAndSubTitleContainer>
        <SelectDocumentsToSendToClientContainer>
          <TitleIconContainer src={DocumentIconGreen} />
          <TitleTypography>Select documents to send to client</TitleTypography>
        </SelectDocumentsToSendToClientContainer>
        <SubTitleTypography>
          Choose which documents to include in the client communication
        </SubTitleTypography>
      </TitleAndSubTitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #22c55e`,
      maxWidth: "860px",
    },
    config: [
      {
        key: "endorsementData",
        name: "endorsementData",
        label: "Endorsement data",
        type: "checkbox",
        gridColumn: 4.9,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "endorsementDataDownload",
        name: "endorsementDataDownload",
        label: "Endorsement data download",
        type: "customcomponent",
        gridColumn: 4.9,
        componentProps: {
          componentKey: "EndorsementDataDownload",
          documentId: endorsementDataDownloadId,
          Icon: [
            {
              id: "downloadIcon",
              label: "Download Icon",
              icon: Icon,
            },
            {
              id: "previewIcon",
              label: "Preview Icon",
              icon: EyeIcon,
            }
          ],
          endPoint: {
            download: endPoints.fileUploadDownloadById(endorsementDataDownloadId),
            preview: endPoints.policyPreviewDocument(endorsementDataDownloadId),
          },
          enableDownloadIcon: enableDownloadIconForClientConfirmation,
          uniqueKey: "preview" // Pass a unique key to trigger useEffect when documentId changes
        },
      },
      {
        key: "insurerEndorsementPolicyDocument",
        name: "insurerEndorsementPolicyDocument",
        label: "Insurer acknowledgement document",
        type: "checkbox",
        gridColumn: 4.9,

        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "insurerEndorsementPolicyDocumentDownload",
        name: "insurerEndorsementPolicyDocumentDownload",
        label: "Insurer acknowledgement document download",
        type: "customcomponent",
        gridColumn: 4.9,
        componentProps: {
          componentKey: "EndorsementDataDownload",
          documentId: insurerDocumentDownloadId,
          Icon: Icon,
          endPoint: {
            download: endPoints.fileUploadDownloadById(insurerDocumentDownloadId),
          },
          enableDownloadIcon: enableDownloadIconForClientConfirmation,
        },
      },
    ],
  },
  {
    key: "messageDetails",
    config: [
      {
        key: "messageDetails",
        name: "messageDetails",
        label: "Message Details",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter message details",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const TpaIdUploadConfig = (
  policyId: number,
  companyType: string,
  documentTypeLid: number
) => [
  {
    key: "tpaIdUpload",
    defaultValues: {
      tpaIdUploadDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "tpaIdUploadDate",
        name: "tpaIdUploadDate",
        label: "TPA ID Upload Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "tpaUploadRemarks",
        name: "tpaUploadRemarks",
        label: "TPA Upload Remarks",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter TPA upload remarks",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];
export const GetEcardsConfig: FormFieldConfig[] = [
  {
    key: "ecardsGeneratedDate",
    name: "ecardsGeneratedDate",
    label: "E-cards Generated Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "deliveryMethod",
    name: "deliveryMethod",
    label: "Delivery Method",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Delivery Method",
    },
  },
  {
    key: "ecardsRemarks",
    name: "ecardsRemarks",
    label: "E-cards Remarks",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      placeholder: "Enter e-cards generation and delivery remarks",
      fullWidth: true,
      rows: 3,
      multiline: true,
    },
  },
];
export const DataRconAndClosureConfig: FormFieldConfig[] = [
  {
    key: "rconDate",
    name: "rconDate",
    label: "RCON Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "closureDate",
    name: "closureDate",
    label: "Closure Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "finalRemarks",
    name: "finalRemarks",
    label: "Final Remarks",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      placeholder: "Enter final remarks and closure notes",
      fullWidth: true,
      rows: 3,
      multiline: true,
    },
  },
];

export const endorsementProcessConfig: Step[] = [
  {
    key: ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED,
    title: "Endorsement Request Received",
    config: { EndorsementRequestReceivedConfig },
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT,
    title: "Create Endorsement",
    componentKey: "createEndorsementComponent",
    config: CreateEndorsementConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER,
    title: "Send Endorsement to Insurer",
    config: SendEndorsementToInsurerConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.RECEIVE_INSURER_ACKNOWLEDGEMENT,
    title: "Receive Acknowledgement from Insurer",
    config: ReceiveAcknowledgementFromInsurerConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION,
    title: "Client Confirmation",
    config: ClientConfirmationConfig,
    stepState: StateEnum.DRAFT,
  },
];

export const endorsementDetailsBreadcrumbConfig = (breadcrumbNavigationState: {
  navigationFrom: string;
  navigationLabel: string;
}) => [
  {
    label: breadcrumbNavigationState?.navigationLabel || "Manage endorsements",
    path: breadcrumbNavigationState?.navigationFrom || "/manage-endorsements",
  },
  { label: "Endorsement details" },
];

export const EndorsementRequestReceivedConfigDefaultValues = {
  osTicketNumber: "",
  endorsementRequestReceivedDate: dayjs().format("YYYY-MM-DD"),
  endorsementType: "",
};

export const INCEPTIONRequestReceivedConfigDefaultValues = {
  osTicketNumber: "",
  endorsementRequestReceivedDate: dayjs().format("YYYY-MM-DD"),
  endorsementType: "FINANCIAL_ENDORSEMENT",
};
export const INCEPTION_LABELS = {
  singular: "Inception",
  singularLower: "inception",
};

export const InceptionRequestReceivedConfig: FormFieldConfig[] = [
  {
    key: "osTicketNumber",
    name: "osTicketNumber",
    label: "OS Ticket Number",
    type: "text",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Enter OS Ticket Number",
      fullWidth: true,
    },
  },
  {
    key: "endorsementRequestReceivedDate",
    name: "endorsementRequestReceivedDate",
    label: "Inception Request Received Date",
    type: "date",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "endorsementType",
    name: "endorsementType",
    label: "Inception Type",
    type: "select",
    gridColumn: 5,
    disabled: true,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Select Inception Type",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ENDORSEMENT_TYPE"),
      utilityFunction: (data: any) => lookUpKeyUtility(data),
    },
  },
];

export const CreateInceptionConfig = (
  title?: string,
  Icon?: any,
  styling?: React.CSSProperties,
  cardData?: any,
  creationLabel?: string
) => [
  {
    key: "createEndorsement",
    defaultValues: {
      endorsementCreatedDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "endorsementCreatedDate",
        name: "endorsementCreatedDate",
        label: "Inception Created Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "provisionalEndorsementNumber",
        name: "provisionalEndorsementNumber",
        label: "Provisional Inception Number",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter provisional inception number",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementSummary",
    config: [
      {
        key: "endorsementSummaryComponent",
        name: "endorsementSummaryComponent",
        label: "Inception Summary",
        type: "customcomponent",
        componentProps: {
          componentKey: "EndorsementSummary",
          title: title,
          Icon: Icon,
          styling: styling,
          cardData: cardData,
          creationLabel: creationLabel,
        },
      },
    ],
  },
  {
    key: "inceptionBrokerageDetails",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconOrange} />
        <TitleTypography>Brokerage Details</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #c57e1cff`,
      maxWidth: "860px",
    },
    config: [
      {
        key: "basicBrokeragePercentage",
        name: "basicBrokeragePercentage",
        label: "Basic Brokerage Percentage",
        type: "number",
        gridColumn: 5,
        isDecimal: true,
        disabled: "endorsementSummary?.basicBrokeragePercentage",
        componentProps: {
          fullWidth: true,
          inputMode: "numeric",
          placeholder: "Enter brokerage percentage",
        },
      },
      {
        key: "basicBrokerageAmount",
        name: "basicBrokerageAmount",
        label: "Basic Brokerage Amount",
        type: "number",
        gridColumn: 5,
        isDecimal: true,
        disabled:true,
        formatNumber: true,
        componentProps: {
          fullWidth: true,
          inputMode: "numeric",
          placeholder: "Enter brokerage amount",
        },
      },
    ],
  },
  {
    key: "premiumPaymentTerm",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconGreen} />
        <TitleTypography>Premium Payment Term</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #22c55e`,
      maxWidth: "860px",
    },
    defaultValues: {
      paymentMethod: "TRANSACTION_TYPE_CD_BALANCE",
    },
    config: [
      {
        key: "paymentMethod",
        name: "paymentMethod",
        label: "Transaction Mode",
        type: "select",
        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
          placeholder: "Select Transaction Mode",
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("TRANSACTION_TYPE"),
          utilityFunction: (data: any) => transactionTypeKeyUtility(data),
        },
      },
      {
        key: "transactionOrChequeNumber",
        name: "transactionOrChequeNumber",
        label: "Transaction/Cheque No",
        type: "text",
        gridColumn: 4.9,
        componentProps: {
          placeholder: "Enter transaction or cheque number",
          fullWidth: true,
        },
      },
      {
        key: "paymentDate",
        name: "paymentDate",
        label: "Transaction Date",
        type: "date",
        gridColumn: 4.9,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "paymentAmount",
        name: "paymentAmount",
        label: "Transaction Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        componentProps: {
          placeholder: "Enter transaction amount",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "createEndorsementRemarks",
    config: [
      {
        key: "endorsementDetails",
        name: "endorsementDetails",
        label: "Inception Details",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter inception details",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const SendInceptionToInsurerConfig = (
  title?: string,
  subTitle?: string,
  endorsementFileDetails?: any,
  enableDownloadIcon?: boolean,
  creationLabel?: string,
  policyId?: number,
  endorsementId?: number,
  setDocumentFileStatus?: (status: string | null) => void,
  refetchEndorsementSteps?: () => void
) => [
  {
    key: "sendEndorsementToInsurer",
    defaultValues: {
      insurerCommunicationDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "insurerCommunicationDate",
        name: "insurerCommunicationDate",
        label: "Insurer Communication Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementDocumentContainer",
    config: [
      {
        key: "endorsementDocument",
        name: "endorsementDocument",
        label: "Inception Document",
        type: "customcomponent",
        componentProps: {
          componentKey: "EndorsementDocument",
          title: title,
          subTitle: subTitle,
          endorsementFileDetails: endorsementFileDetails,
          enableDownloadIcon: enableDownloadIcon,
          creationLabel: creationLabel,
          policyId: policyId,
          endorsementId: endorsementId,
          setDocumentFileStatus: setDocumentFileStatus,
          refetchEndorsementSteps: refetchEndorsementSteps,
          permissionFeatureKey: FeatureKey.EXPORT_INCEPTION,
        },
      },
    ],
  },
  {
    key: "communicationDetails",
    config: [
      {
        key: "communicationDetails",
        name: "communicationDetails",
        label: "Communication Details",
        type: "textarea",
        gridColumn: 9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter communication details with insurer",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const ReceiveAcknowledgementFromInsurerInceptionConfig = (
  policyId?: number,
  companyType?: string,
  documentTypeLid?: number,
  endorsementId?: number
) => [
  {
    key: "acknowledgementFromInsurer",
    defaultValues: {
      acknowdgementDate: dayjs().format("YYYY-MM-DD"),
      endorsementEffectiveDate: dayjs().format("YYYY-MM-DD"),
      incomeEffectiveDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "acknowdgementDate",
        name: "acknowdgementDate",
        label: "Acknowledgement Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "insurerEndorsementNumber",
        name: "insurerEndorsementNumber",
        label: "Insurer Inception Number",
        type: "text",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter insurer inception number",
          fullWidth: true,
        },
      },
      {
        key: "noOfEmployees",
        name: "noOfEmployees",
        label: "Number of Assets",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          placeholder: "Enter number of assets",
          fullWidth: true,
        },
      },
      {
        key: "noOfDependents",
        name: "noOfDependents",
        label: "Number of Sub Assets",
        type: "number",
        formatNumber: true,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter number of sub assets",
        },
      },
      {
        key: "endorsementEffectiveDate",
        name: "endorsementEffectiveDate",
        label: "Inception Effective Date",
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
        key: "incomeEffectiveDate",
        name: "incomeEffectiveDate",
        label: "Income Effective Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "premiumDetails",
    title: (
      <TitleContainer>
        <TitleIconContainer src={DocumentIconPurple} />
        <TitleTypography>Premium Details</TitleTypography>
      </TitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #a855f7`,
      maxWidth: "860px",
      gap: "16px",
    },
    config: [
      {
        key: "endorsementPremiumAmount",
        name: "endorsementPremiumAmount",
        label: "Inception Premium Amount",
        type: "number",
        formatNumber: true,

        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 4.9,
        componentProps: {
          placeholder: "Enter inception premium amount",
          fullWidth: true,
        },
      },
      {
        key: "terrorismPremiumAmount",
        name: "terrorismPremiumAmount",
        label: "Terrorism Premium Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter terrorism premium amount",
          fullWidth: true,
        },
      },
      {
        key: "gstAmount",
        name: "gstAmount",
        label: "GST Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter GST amount",
          fullWidth: true,
        },
      },
      {
        key: "totalPremiumAmount",
        name: "totalPremiumAmount",
        label: "Total Premium Amount",
        type: "number",
        formatNumber: true,

        gridColumn: 4.9,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          placeholder: "Enter total premium amount",
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "endorsementPolicyDocument",
    title: (
      <EndorsementDocTitleContainer>
        <TitleTypography>Insurer Acknowledgement Document*</TitleTypography>
      </EndorsementDocTitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      rowGap: "8px",
    },
    config: [
      {
        key: "endorsementPolicyDocumentId",
        name: "endorsementPolicyDocumentId",
        type: "documentupload",
        gridColumn: 9,
        companyId: policyId,
        companyType: companyType,
        documentTypeLid: documentTypeLid,
        endorsementId: endorsementId,
        uploadCategory: UPLOAD_CATEGORY.INSURER_ACK,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          accept: ".xlsx,.xls",
          requireDocumentType: false,
          maxLimit: 1,
          permissionFeatureKey: FeatureKey.EXPORT_INCEPTION,
        },
        hideDropdown: true,
        apiDependencies: {
          endPoint: endPoints.fileUpload,
        },
        rules: {
          required: { value: true, message: "Field is required" },
        },
      },
    ],
  },
];

export const InceptionClientConfirmationConfig = (
  Icon?: any,
  endorsementDataDownloadId?: number | undefined,
  insurerDocumentDownloadId?: number | undefined,
  enableDownloadIconForClientConfirmation?: boolean
) => [
  {
    key: "clientConfirmation",
    defaultValues: {
      clientConfirmationDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "clientConfirmationDate",
        name: "clientConfirmationDate",
        label: "Client Confirmation Date",
        type: "date",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
      },
    ],
  },
  {
    key: "selectDocumentsToSendToClient",
    title: (
      <TitleAndSubTitleContainer data-testid="select-documents">
        <SelectDocumentsToSendToClientContainer>
          <TitleIconContainer src={DocumentIconGreen} />
          <TitleTypography>Select documents to send to client</TitleTypography>
        </SelectDocumentsToSendToClientContainer>
        <SubTitleTypography>
          Choose which documents to include in the client communication
        </SubTitleTypography>
      </TitleAndSubTitleContainer>
    ),
    containerStyles: {
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: theme.shadows[7],
      borderLeft: `4px solid #22c55e`,
      maxWidth: "860px",
    },
    config: [
      {
        key: "endorsementData",
        name: "endorsementData",
        label: "Inception data",
        type: "checkbox",
        gridColumn: 4.9,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "endorsementDataDownload",
        name: "endorsementDataDownload",
        label: "Endorsement data download",
        type: "customcomponent",
        gridColumn: 4.9,
        componentProps: {
          componentKey: "EndorsementDataDownload",
          documentId: endorsementDataDownloadId,
          Icon: [
            {
              id: "downloadIcon",
              label: "Download Icon",
              icon: Icon,
            },
            {
              id: "previewIcon",
              label: "Preview Icon",
              icon: EyeIcon,
            }
          ],   
          endPoint: {
            download: endPoints.fileUploadDownloadById(endorsementDataDownloadId),
            preview: endPoints.policyPreviewDocument(endorsementDataDownloadId),
          },
          enableDownloadIcon: enableDownloadIconForClientConfirmation,
          uniqueKey: "preview", // Pass a unique key to call preview api
          permissionFeatureKey: FeatureKey.EXPORT_INCEPTION,
        },
      },
      {
        key: "insurerEndorsementPolicyDocument",
        name: "insurerEndorsementPolicyDocument",
        label: "Insurer acknowledgement document",
        type: "checkbox",
        gridColumn: 4.9,

        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "insurerEndorsementPolicyDocumentDownload",
        name: "insurerEndorsementPolicyDocumentDownload",
        label: "Insurer acknowledgement document download",
        type: "customcomponent",
        gridColumn: 4.9,
        componentProps: {
          componentKey: "EndorsementDataDownload",
          documentId: insurerDocumentDownloadId,
          Icon: Icon,
          endPoint: {
            download: endPoints.fileUploadDownloadById(insurerDocumentDownloadId),
          },
          enableDownloadIcon: enableDownloadIconForClientConfirmation,
          permissionFeatureKey: FeatureKey.EXPORT_INCEPTION,
        },
      },
    ],
  },
  {
    key: "messageDetails",
    config: [
      {
        key: "messageDetails",
        name: "messageDetails",
        label: "Message Details",
        type: "textarea",
        rules: {
          required: { value: true, message: "Field is required" },
        },
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter message details",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const TpaIdUploadInceptionConfig = (
  policyId: number,
  companyType: string,
  documentTypeLid: number
) => [
  {
    key: "tpaIdUpload",
    defaultValues: {
      tpaIdUploadDate: dayjs().format("YYYY-MM-DD"),
    },
    config: [
      {
        key: "tpaIdUploadDate",
        name: "tpaIdUploadDate",
        label: "TPA ID Upload Date",
        type: "date",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Field is required" },
        },
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "tpaUploadRemarks",
        name: "tpaUploadRemarks",
        label: "TPA Upload Remarks",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          placeholder: "Enter TPA upload remarks",
          fullWidth: true,
          rows: 3,
          multiline: true,
        },
      },
    ],
  },
];

export const inceptionProcessConfig: Step[] = [
  {
    key: ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED,
    title: "Inception Request Received",
    config: { InceptionRequestReceivedConfig },
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.CREATE_ENDORSEMENT,
    title: "Create Inception",
    componentKey: "createEndorsementComponent",
    config: CreateInceptionConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER,
    title: "Send Inception to Insurer",
    config: SendInceptionToInsurerConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.RECEIVE_INSURER_ACKNOWLEDGEMENT,
    title: "Receive Acknowledgement from Insurer",
    config: ReceiveAcknowledgementFromInsurerInceptionConfig,
    stepState: StateEnum.DRAFT,
  },
  {
    key: ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION,
    title: "Client Confirmation",
    config: InceptionClientConfirmationConfig,
    stepState: StateEnum.DRAFT,
  },
];

export const inceptionDetailsBreadcrumbConfig = (breadcrumbNavigationState: {
  navigationFrom: string;
  navigationLabel: string;
}) => [
  {
    label: breadcrumbNavigationState?.navigationLabel || "Manage inceptions",
    path: breadcrumbNavigationState?.navigationFrom || "/manage-endorsements",
  },
  { label: "Inception details" },
];
