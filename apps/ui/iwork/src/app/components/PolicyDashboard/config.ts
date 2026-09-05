import { PolicyDashboardResponse, DrawerView, AttentionStats } from "./index";
import managePoliciesSelectIcon from "../../assets/svgs/manage-policies-select.svg";
import empDependentImg from "../../assets/svgs/employee-dependent.svg";
import tpaDataBgImg from "../../assets/svgs/tpa-data-bg.svg";
import employeeEndorsementIcon from "../../assets/svgs/employee-endorsement.svg";
import tpaIdIcon from "../../assets/svgs/tpa-id-icon.svg";
import employeeDataIconXl from "../../assets/svgs/employee-data-icon-xl.svg";
import tpaIdIconXl from "../../assets/svgs/tpa-id-icon-xl.svg";
import employeeStatsIcon from "../../assets/svgs/employee-endorsement.svg";
import endorsementManagementIcon from "../../assets/svgs/endorsement-management-icon.svg";
import claimsIcon from "../../assets/svgs/claims-icon.svg";
import emailIconSm from "../../assets/svgs/email-icon-sm.svg";
import uploadIconSm from "../../assets/svgs/upload-icon-sm.svg";
import eyeIconSm from "../../assets/svgs/eye-icon-sm.svg";
import addIconSm from "../../assets/svgs/add-icon-sm.svg";
import enrollmentProgressIcon from "../../assets/svgs/enrollment-progress-icon.svg";
import {
  formatCurrencyByLocalization,
  formatDate,
  formatNumberByLocalization,
  formatNumberShort,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { statusStyleMap } from "../ClaimsTable/tableConfig";

export const getEndorsementCardData = (
  data?: PolicyDashboardResponse,
  handleCreateEndorsementClick?: () => void,
  handleAcknowledgeClick?: () => void,
  handleViewEndorsementBatcheClick?: () => void
) => [
  // {
  //   title: "Enrolment status",
  //   titleIcon: employeeStatsIcon,
  //   topStats: [
  //     {
  //       value: String(data?.enrollmentStatus.registeredCount),
  //       label: "Registered ",
  //     },
  //     {
  //       value: String(data?.enrollmentStatus.submittedCount),
  //       label: "Submitted/Closed",
  //     },
  //     {
  //       value: String(data?.enrollmentStatus.inProgressCount),
  //       label: "In progress",
  //     },
  //     {
  //       value: String(data?.enrollmentStatus.notStartedCount),
  //       label: "Not started",
  //     },
  //   ],
  //   actions: [
  //     {
  //       icon: emailIconSm,
  //       label: "Send reminder for in progress ",
  //       badgeCount: 2,
  //       onClick: () => alert("Send reminder for in progress clicked"),
  //     },
  //     {
  //       icon: emailIconSm,
  //       label: "Send reminder for Not started ",
  //       badgeCount: 3,
  //       onClick: () => alert("Send reminder for Not started clicked"),
  //     },
  //     {
  //       icon: eyeIconSm,
  //       label: "View enrolment batches",
  //       onClick: handleViewEndorsementBatcheClick,
  //     },
  //   ],
  // },
  {
    title: "Endorsement management",
    titleIcon: employeeStatsIcon,
    topStats: [
      {
        value: String(data?.endorsementManagement.processedCount),
        label: "Processed",
      },
      {
        value: String(
          data?.endorsementManagement.insurerAcknowledgePendingCount
        ),
        label: "Insurer ack. pending",
      },
      {
        value: String(data?.endorsementManagement.readyForEndorsementCount),
        label: "Ready for endorsement",
      },
    ],
    actions: [
      {
        icon: addIconSm,
        label: "Create endorsement",
        badgeCount: 2,
        onClick: handleCreateEndorsementClick
          ? handleCreateEndorsementClick
          : () => alert("Create endorsement clicked"),
      },
      {
        icon: uploadIconSm,
        label: "Add Insurer acknowledgement",
        badgeCount: 3,
        onClick: handleAcknowledgeClick,
      },
      {
        icon: uploadIconSm,
        label: "Create non employee endorsement",
        onClick: () => alert("Create non-employee clicked"),
      },
      {
        icon: eyeIconSm,
        label: "View endorsement ",
        onClick: handleAcknowledgeClick,
      },
    ],
  },
  // {
  //   title: "Claims",
  //   titleIcon: claimsIcon,
  //   topStats: [
  //     {
  //       value: String(data?.claims.pendingClaims),
  //       label: "Pending claims",
  //     },
  //     {
  //       value: String(data?.claims.inProgressClaims),
  //       label: "In Progress claims",
  //     },
  //     {
  //       value: String(data?.claims.totalClaims),
  //       label: "Total claims",
  //     },
  //   ],
  //   actions: [
  //     {
  //       icon: uploadIconSm,
  //       label: "Add claim data",
  //       badgeCount: 2,
  //       onClick: () => alert("Add claim data clicked"),
  //     },
  //     {
  //       icon: eyeIconSm,
  //       label: "View claims",
  //       badgeCount: 3,
  //       onClick: () => alert("View claims clicked"),
  //     },
  //   ],
  // },
];

export const getEmployeeDependentCardsData = (
  onEmpClick: () => void,
  onTpaClick: () => void,
  onEmployeeDependentCardClick: () => void,
  onCDDetailsClick: () => void,
  data?: PolicyDashboardResponse,
  isGroupPolicyType: boolean = true
) => [
  {
    id: "emp",
    cardOnClick: onEmployeeDependentCardClick,
    bgGradient:
      "linear-gradient(351.53deg, rgba(237, 244, 255, 0.6) -65.73%, rgba(123, 191, 246, 0.6) 168.69%)",
    statGroups: [
      {
        groupTitle: isGroupPolicyType
          ? "Employee and Dependent Status"
          : "Asset & Sub Asset Status",
        icon: employeeDataIconXl,
        stats: [
          {
            value: formatNumberByLocalization(
              data?.employeeAndDependents.employeeCount
            ),
            label: isGroupPolicyType ? "Total employees" : "Total assets",
          },
          {
            value: formatNumberByLocalization(
              data?.employeeAndDependents.dependentsCount || 0
            ),
            label: isGroupPolicyType ? "Total dependents" : "Total sub assets",
          },
          {
            value: formatNumberByLocalization(
              data?.employeeAndDependents.totalLives || 0
            ),
            label: isGroupPolicyType
              ? "Total lives"
              : "Total assets & sub assets",
          },
        ],
      },
      {
        groupTitle: "Enrolment Progress",
        icon: enrollmentProgressIcon,
        height: 20,
        stats: [
          {
            value: formatNumberByLocalization(
              data?.enrollmentStatus.registeredCount || 0
            ),
            label: "Registered",
          },
          {
            value: formatNumberByLocalization(
              data?.enrollmentStatus.submittedCount || 0
            ),
            label: "Submit/Closed",
          },
          {
            value: formatNumberByLocalization(
              data?.enrollmentStatus.inProgressCount || 0
            ),
            label: "In progress",
          },
          {
            value: formatNumberByLocalization(
              data?.enrollmentStatus.notStartedCount || 0
            ),
            label: "Not started",
          },
        ],
      },
    ],
    backgroundImage: empDependentImg,
    onClick: onEmpClick,
  },

  {
    id: "cdBalance",
    // icon: tpaIdIconXl,
    // title: "CD balance",
    bgGradient: "linear-gradient(124.61deg, #81D4CC -45.84%, #D6FAE8 126.73%)",
    backgroundImage: tpaDataBgImg,
    viewDetails: true,
    statGroups: [
      {
        groupTitle: "CD Summary",
        icon: tpaIdIconXl,
        showViewDetails: true,
        viewDetailsText: "View CD details",
        onViewDetailsClick: onCDDetailsClick,
        stats: [
          {
            value: formatCurrencyByLocalization(
              data?.cdBalance?.netPolicyPremium || 0
            ),
            label: "Net premium",
            //
          },
          {
            value: formatCurrencyByLocalization(
              data?.cdBalance?.cdBalance || 0
            ),
            label: "CD Balance",
            warning: data?.cdBalance?.warningMessage,
          },
        ],
      },
      {
        groupTitle: "Claims Summary",
        icon: tpaIdIconXl,
        stats: [
          {
            value: formatNumberByLocalization(data?.claims?.totalClaims || 0),
            label: "Total claims",
          },
          {
            value: formatNumberByLocalization(data?.claims?.pendingClaims || 0),
            label: "Pending",
          },
          {
            value: formatNumberByLocalization(
              data?.claims?.settledClaims || 0
            ),
            label: "Settled",
          },
        ],
      },
    ],
  },
];

export const getAttentionData = (
  onAcknowledgeClick: () => void,
  handleEndorsementClick: () => void,
  data: AttentionStats
) => [
  {
    icon: employeeEndorsementIcon,
    count: data?.endorsementBatchesPending || 0,
    messageTemplate:
      "You have {count} endorsement batches pending acknowledgement,",
    actionText:
      "Please review and acknowledge these endorsements at the earliest",
    onClick: onAcknowledgeClick,
  },
  {
    icon: employeeEndorsementIcon,
    count: data?.endorsementReadyEmployeesCount || 0,
    messageTemplate:
      "You have {count} employees ready for endorsement process, ",
    actionText:
      "Please send the endorsement records to the insurer to initiate processing.",
    onClick: handleEndorsementClick,
  },
  {
    icon: tpaIdIcon,
    count: data?.yetToReceiveTpaIdsCount || 0,

    messageTemplate: "You are yet to receive {count} TPA IDs, ",
    actionText:
      "Please ensure the TPA data is added to avoid any delays in processing",
    // onClick: () => alert("Send records clicked"),
  },
];

export const drawerHeadingMap: Record<Exclude<DrawerView, null>, string> = {
  upload: "Upload employee data",
  employeeText: "Uploaded employee data",
  closedEndorsement: "Endorsements",
  employeeBatch: "Employee batch",
  insurerAcknowledgement: "Insurer Endorsement Acknowledgement",
  createEndorsement: "Create endorsement",
  tpaAcknowledgement: "TPA ID's Acknowledgement",
  cdBalance: "Add CD Balance for {cdAccountName}",
};

export const getTrackClaimsColumns = (
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Claim number",
    field: "claimNumber",
    tooltipField: "claimNumber",
    headerTooltip: "Claim number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
    // ENTITY_SORT_FIELDS.CLAIM.claimNumber -> "claimnumbersort", a computed
    // SELECT alias that only exists in findAllClaims's query (the main
    // Claims listing) — findClaimsByPolicyId (this table's backend) never
    // selects it, so the ORDER BY reference 400s (Postgres 42703). Stopgap
    // until this query gets its own equivalent computed alias.
    disableSort: true,
  },
  {
    headerName: "Employee name",
    field: "employeeName",
    tooltipField: "employeeName",
    headerTooltip: "Employee name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Claim type",
    field: "claimType",
    tooltipField: "claimType",
    headerTooltip: "Claim type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Claim amount",
    field: "claimAmount",
    headerTooltip: "Claim cmount",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
  },
  {
    headerName: "Claim date",
    field: "claimDate",
    headerTooltip: "Claim date",
    valueFormatter: ({ value }) =>
      value != null && value != undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value != null && value != undefined ? formatDate(value) : "--",
    hide: false,
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: statusStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) => value ?? "--",
    hide: false,
  },
  {
    headerName: "TAT (days)",
    field: "tatDays",
    tooltipField: "tatDays",
    headerTooltip: "TAT (days)",
    valueFormatter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    hide: false,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  // {
  //   headerName: "Actions",
  //   field: "",
  //   tooltipField: "",
  //   headerTooltip: "Actions",
  //   cellRenderer: "ActionButton",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  // },
];

export const getTrackClaimsColumnsForNonGroupCheck = (): ColDef[] => [
  {
    headerName: "Claim ID",
    field: "claimId",
    tooltipField: "claimId",
    headerTooltip: "Claim ID",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? String(value) : "--",
    pinned: "left",
    width: 120,
  },
  {
    headerName: "Claim number",
    field: "claimNumber",
    tooltipField: "claimNumber",
    headerTooltip: "Claim number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? String(value) : "--",
    flex: 1,
    minWidth: 160,
  },

  {
    headerName: "Claim date",
    field: "claimDate",
    headerTooltip: "Claim date",
    valueFormatter: ({ value }) =>
      value != null && value != undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value != null && value != undefined ? formatDate(value) : "--",
    minWidth: 160,
  },
  
   {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    valueFormatter: ({ value }) => (value ? String(value) : "--"),
    flex: 1,
    minWidth: 140,
  },

  {
    headerName: "Activity",
    field: "claimActivity",
    tooltipField: "claimActivity",
    headerTooltip: "Activity",
    valueFormatter: ({ value }) => (value ? String(value) : "--"),
    flex: 1,
    minWidth: 140,
  },

   {
    headerName: "Tat days",
    field: "tatDays",
    tooltipField: "tatDays",
    headerTooltip: "Tat days",
     valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? String(value) : "--",
    // pinned: "left",
    width: 120,
  },

  
  
 
  // {
  //   headerName: "Deleted at",
  //   field: "deletedAt",
  //   tooltipField: "deletedAt",
  //   headerTooltip: "Deleted at",
  //   valueFormatter: ({ value }) =>
  //     value != null && value !== "" ? formatDate(value) : "--",
  //   tooltipValueGetter: ({ value }) =>
  //     value != null && value !== "" ? formatDate(value) : "--",
  //   flex: 1,
  //   minWidth: 160,
  // },
];

