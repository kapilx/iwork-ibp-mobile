import {
  formatCurrencyByLocalization,
  formatNumberInputByLocalization,
  type LocalizationConfig,
} from "@ui/ui-lib/utils";
import { formatDate } from "@ui/ui-lib/utils/DateFormat";
import RevealCellRenderer from "../../EmployeePage/EmployeeListing/RevealCellRenderer";

// Columns for Group Policy Type (Employee Insured)
export const employeeInsuredColumns = (
  navigate?: any,
  policyId?: number,
  localization?: LocalizationConfig
) => [
  {
    headerName: "Employee Company ID",
    field: "employeeCompanyId",
    tooltipField: "employeeCompanyId",
    headerTooltip: "Employee Company ID",
    pinned: "left",
    valueFormatter: ({ value }: any) => value || "N/A",
    tooltipValueGetter: ({ value }: any) => value || "N/A",
  },
  {
    headerName: "Insured Name",
    field: "insuredName",
    tooltipField: "insuredName",
    headerTooltip: "Insured Name",
    pinned: "left",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Iwork Endorsement ID",
    field: "endorsementId",
    tooltipField: "endorsementId",
    headerTooltip: "Iwork Endorsement ID",
    cellClass: "clickable-cell",
    pinned: "left",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
    cellRenderer: (params: any) => {
      const endorsementId = params.value;
      if (!endorsementId || endorsementId === "--") {
        return endorsementId || "--";
      }
      return (
        <span
          onClick={() => {
            if (navigate && policyId) {
              navigate(`/${policyId}/create-endorsement/${endorsementId}`);
            }
          }}
        >
          {endorsementId}
        </span>
      );
    },
  },
  {
    headerName: "DOB",
    field: "dateOfBirth",
    headerTooltip: "Date of Birth",
    cellRenderer: RevealCellRenderer,
    cellRendererParams: { isDate: true },
  },
  {
    headerName: "Gender",
    field: "gender",
    tooltipField: "gender",
    headerTooltip: "Gender",
    valueFormatter: ({ value }: any) => value || "N/A",
    tooltipValueGetter: ({ value }: any) => value || "N/A",
  },
  {
    headerName: "Effective from",
    field: "effectiveFrom",
    tooltipField: "effectiveFrom",
    headerTooltip: "Effective From",
    sortable: false,
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "N/A"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "N/A"),
  },
  {
    headerName: "Effective to",
    field: "effectiveTo",
    tooltipField: "effectiveTo",
    headerTooltip: "Effective To",
    sortable: false,
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "N/A"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "N/A"),
  },
  {
    headerName: "Enrolment Start Date",
    field: "enrollmentStartDate",
    tooltipField: "enrollmentStartDate",
    headerTooltip: "Enrolment Start Date",
    sortable: false,
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Enrolment End Date",
    field: "enrollmentEndDate",
    tooltipField: "enrollmentEndDate",
    headerTooltip: "Enrolment End Date",
    sortable: false,
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Enrolment Confirmation No.",
    field: "enrollmentConfirmationNumber",
    tooltipField: "enrollmentConfirmationNumber",
    headerTooltip: "Enrolment Confirmation No.",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Enrolment Status",
    field: "enrollmentStatus",
    tooltipField: "enrollmentStatus",
    headerTooltip: "Enrolment Status",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Endorsement Type",
    field: "endorsementType",
    tooltipField: "endorsementType",
    headerTooltip: "Endorsement Type",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Ingested Mode",
    field: "ingestedMode",
    tooltipField: "ingestedMode",
    headerTooltip: "Ingested Mode",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Relationship group",
    field: "relationshipGroup",
    tooltipField: "relationshipGroup",
    headerTooltip: "Relationship Group",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "N/A",
    tooltipValueGetter: ({ value }: any) => value || "N/A",
  },
  {
    headerName: "Relation",
    field: "relation",
    tooltipField: "relation",
    headerTooltip: "Relation",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "SI Total",
    field: "sumInsuredTotal",
    tooltipField: "sumInsuredTotal",
    headerTooltip: "Sum Insured Total",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
   valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
  },
  {
    headerName: "SI Utilized",
    field: "sumInsuredUtilized",
    tooltipField: "sumInsuredUtilized",
    headerTooltip: "Sum Insured Utilized",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
   valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
  },
  {
    headerName: "SI Balance",
    field: "sumInsuredBalance",
    tooltipField: "sumInsuredBalance",
    headerTooltip: "Sum Insured Balance",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
  },
  {
    headerName: "Claims Status",
    field: "claimStatus",
    tooltipField: "claimStatus",
    headerTooltip: "Claims Status",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "N/A",
    tooltipValueGetter: ({ value }: any) => value || "N/A",
  },
  {
    headerName: "IIRM Policy ID",
    field: "iirmPolicyId",
    tooltipField: "iirmPolicyId",
    headerTooltip: "IIRM Policy ID",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Insurer Policy Number",
    field: "insurerPolicyNumber",
    tooltipField: "insurerPolicyNumber",
    headerTooltip: "Insurer Policy Number",
    sortable: false,
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Insurer Endorsement Number",
    field: "insurerEndorsementNumber",
    tooltipField: "insurerEndorsementNumber",
    headerTooltip: "Insurer Endorsement Number",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Ack date from insurer",
    field: "insurerEndorsementDate",
    tooltipField: "insurerEndorsementDate",
    headerTooltip: "Ack date from insurer",
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "TPA ID",
    field: "tpaId",
    tooltipField: "tpaId",
    headerTooltip: "TPA ID",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Mobile Number",
    field: "mobileNumber",
    headerTooltip: "Mobile Number",
    cellRenderer: RevealCellRenderer,
  },
  {
    headerName: "Email",
    field: "email",
    headerTooltip: "Email",
    cellRenderer: RevealCellRenderer,
  },
  {
    headerName: "Endorsement Effective Date",
    field: "endorsementEffectiveDate",
    tooltipField: "endorsementEffectiveDate",
    headerTooltip: "Endorsement Effective Date",
    valueFormatter: ({ value }: any) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }: any) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Addition Prorata Days",
    field: "additionProrataDays",
    tooltipField: "additionProrataDays",
    headerTooltip: "Addition Prorata Days",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
    valueFormatter: ({ value }: any) => value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }: any) => value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Addition Premium (Excl. GST)",
    field: "additionPremiumExcludingGst",
    tooltipField: "additionPremiumExcludingGst",
    headerTooltip: "Addition Premium Excluding GST",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
  },
  {
    headerName: "Deletion Prorata Days",
    field: "deletionProrataDays",
    tooltipField: "deletionProrataDays",
    headerTooltip: "Deletion Prorata Days",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
    valueFormatter: ({ value }: any) => value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }: any) => value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Deletion Premium (Excl. GST)",
    field: "deletionPremiumExcludingGst",
    tooltipField: "deletionPremiumExcludingGst",
    headerTooltip: "Deletion Premium Excluding GST",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
  },
  {
    headerName: "Net Premium (Excl. GST)",
    field: "netPremiumExcludingGst",
    tooltipField: "netPremiumExcludingGst",
    headerTooltip: "Net Premium Excluding GST",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
   valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberInputByLocalization(value, localization,undefined,2)
        : "--",  
  },
  {
    headerName: "IIRM Emp ID",
    field: "iirmEmpId",
    tooltipField: "iirmEmpId",
    headerTooltip: "IIRM Employee ID",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Emp ID",
    field: "employeeId",
    tooltipField: "employeeId",
    headerTooltip: "Employee ID",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status (Active/Inactive based on current date)",
    valueFormatter: ({ value }: any) => value || "--",
    tooltipValueGetter: ({ value }: any) => value || "--",
    cellStyle: (params: any) => {
      if (params.value === 'Active') {
        return { color: '#10b981', fontWeight: '600' }; // Green
      } else if (params.value === 'Inactive') {
        return { color: '#ef4444', fontWeight: '600' }; // Red
      }
      return {};
    },
  },
];
