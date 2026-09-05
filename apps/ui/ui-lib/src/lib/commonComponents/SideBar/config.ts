import { SidebarItem } from "./types";
import manageCompanyIcon from "../../assets/svgs/manage-company-deselected.svg";
import addCompanyDeselectedIcon from "../../assets/svgs/add-company-deselected.svg";
import addCompanySelectedIcon from "../../assets/svgs/add-company-selected.svg";
import opportunitySelectedIcon from "../../assets/svgs/opportunities-selected.svg";
import opportunityDisabledIcon from "../../assets/svgs/opportunity-disabled.svg";
import approvalsAndAssignmentDisabledIcon from "../../assets/svgs/approvals-and-assignment-disable.svg";
import teamAssignmentDeselectedIcon from "../../assets/svgs/assignment-deselected.svg";
import endorsementDeselectedIcon from "../../assets/svgs/endorsement-deselected.svg";
import meetingsDeselectedIcon from "../../assets/svgs/meetings-deselected.svg";
import opportunitiesDeselectedIcon from "../../assets/svgs/opportunities-deselected.svg";
import approvalsAndAssignmentDeselectedIcon from "../../assets/svgs/approvals-and-assignment-deselect.svg";
import approvalsAndAssignmentSelectedIcon from "../../assets/svgs/approvals-and-assignment-select.svg";
import myApprovalsDeselectedIcon from "../../assets/svgs/my-approval-deselect.svg";
import myApprovalsSelectedIcon from "../../assets/svgs/my-approval-select.svg";
import teamAssignmentSelected from "../../assets/svgs/team-assignment-select.svg";
import manageCompanySelectedIcon from "../../assets/svgs/manage-company-selected.svg";
import manageCompanyDeselectIcon from "../../assets/svgs/manage-company-deselect.svg";
import manageCompanySelectIcon from "../../assets/svgs/manage-company-select.svg";
import manageInsurerDeselectIcon from "../../assets/svgs/manage-insurer-deselect.svg";
import manageInsurerSelectIcon from "../../assets/svgs/manage-insurer-select.svg";
import manageContactDeselectIcon from "../../assets/svgs/manage-contact-deselect.svg";
import manageContactSelectIcon from "../../assets/svgs/manage-contact-select.svg";
import managePoliciesDeselectIcon from "../../assets/svgs/manage-policies-deselect.svg";
import managePoliciesSelectIcon from "../../assets/svgs/manage-policies-select.svg";
import managePlacementDeselectIcon from "../../assets/svgs/manage-placement-deselect.svg";
import managePlacementSelectIcon from "../../assets/svgs/manage-placement-selected.svg";
import manageServiceDeselectIcon from "../../assets/svgs/manage-service-deselect.svg";
import manageServiceSelectIcon from "../../assets/svgs/manage-service-selected.svg";
import endorsementSelected from "../../assets/svgs/endorsement-selected.svg";
import claimsSelectedIcon from "../../assets/svgs/claims-selected.svg";
import claimsDeselectedIcon from "../../assets/svgs/claims-deselected.svg";
import manageTPASelected from "../../assets/svgs/manage-tpa-selected.svg";
import managePlacementDisableIcon from "../../assets/svgs/manage-placement-disabled.svg";
import manageTPADeselected from "../../assets/svgs/manage-tpa-deselected.svg";
import myMeetingSelected from "../../assets/svgs/my-meeting-selected.svg";
import myMeetingDeselected from "../../assets/svgs/my-meeting-deselected.svg";
import myTaskSelected from "../../assets/svgs/my-task-selected.svg";
import myTaskDeselected from "../../assets/svgs/my-task-deselected.svg";
import reInsuranceHubSelected from "../../assets/svgs/reinsurance-hub-selected.svg";
import reInsuranceHubDeselected from "../../assets/svgs/reinsurance-hub-deselected.svg";
import dmSmartConnectSelected from "../../assets/svgs/dm-smart-connect-selected.svg";
import dmSmartConnectDeselected from "../../assets/svgs/dm-smart-connect-deselected.svg";
// LIA Consulting icons — kept commented alongside their disabled menu entries below.
// import liaConsultingDeselected from "../../assets/svgs/lia-consulting-deselected.svg";
// import liaConsultingSelected from "../../assets/svgs/lia-consulting-selected.svg";
import finOpsDeselected from "../../assets/svgs/fin-ops-deselected.svg";
import finOpsSelected from "../../assets/svgs/fin-ops-selected.svg";
import meetingsSelectedIcon from "../../assets/svgs/meetings-selected.svg";
import meetingDisabledIcon from "../../assets/svgs/meetings-disabled.svg";
import dashboardSelectedIcon from "../../assets/svgs/dashboard-selected.svg";
import dashboardDeSelectedIcon from "../../assets/svgs/dashboard-deselect.svg";
import reinsuranceDisabledIcon from "../../assets/svgs/reinsurance-disabled.svg";
import dmDisabledIcon from "../../assets/svgs/dm-disabled.svg";
// import liaDisabledIcon from "../../assets/svgs/lia-disabled.svg";
import dashboardDisabledIcon from "../../assets/svgs/dashboard-disabled.svg";
import finopsDisabledIcon from "../../assets/svgs/finops-disabled.svg";
import managePoliciesDisabledIcon from "../../assets/svgs/manage-policy-disabled.svg";
import myApprovalsDisabledIcon from "../../assets/svgs/approval-disabled.svg";
import teamDisabledIcon from "../../assets/svgs/team-disabled.svg";
import myTaskDisabledIcon from "../../assets/svgs/my-task-disabled.svg";
import myMeetingDisabledIcon from "../../assets/svgs/my-meeting-disabled.svg";
import manageEndoDisabledIcon from "../../assets/svgs/manage-endo-disabled.svg";
import manageClaimsDisabledIcon from "../../assets/svgs/manage-claims-disabled.svg";
import myRoDisabledIcon from "../../assets/svgs/my-ro-disabled.svg";
import manageCompanyDisabledIcon from "../../assets/svgs/manage-company-disabled.svg";
import manageContactDisabledIcon from "../../assets/svgs/manage-contact-disabled.svg";
import manageServiceDisabledIcon from "../../assets/svgs/manage-service-disabled.svg";
import addCompanyDisabledIcon from "../../assets/svgs/myso-disabled-icon.svg";
import manageInsurerDisabledIcon from "../../assets/svgs/manage-insurer-disabled-icon.svg";
import manageTPADisabled from "../../assets/svgs/manage-tpa-disabled-icon.svg";
// import { environment } from "../../../../../iwork/src/app/environment"; //Todo -- need to fix this import path
import { environment } from "@ui/ui-lib/environment";
import ReportsIcon from "../../assets/svgs/ReportsIcon.svg";
import ReportSelectIcon from "../../assets/svgs/Reports-select.svg";
import SODeselectIcon from "../../assets/svgs/so-deselected.svg";
import SOSelectedIcon from "../../assets/svgs/so-selected.svg";
import RODeselectIcon from "../../assets/svgs/ro-deselected.svg";
import ROSelectedIcon from "../../assets/svgs/ro-selected.svg";
// Biz Done icons used only by the Reports section, now moved to the Header. Restore with it.
import BizDoneSelectIcon from "../../assets/svgs/biz-done-report-select.svg";
import BizoneDeselectedIcon from "../../assets/svgs/biz-done-report-deselected.svg";
import BizDoneDisableIcon from "../../assets/svgs/biz-done-report-disable-icon.svg";
import cronJobsDeselectedIcon from "../../assets/svgs/cron-jobs-deselected.svg";
import cronJobsSelectedIcon from "../../assets/svgs/cron-jobs-selected.svg";
import cronJobsDisabledIcon from "../../assets/svgs/cron-jobs-disabled.svg";

const FF_IWORK_POLICY_LISTING = environment.featureFlag.FF_IWORK_POLICY_LISTING;
const FF_IWORK_HIDE_MASTER = environment.featureFlag.FF_IWORK_HIDE_MASTER;
const FIN_OPS_URL = "https://finops.isbsindia.in:8081/";
const RISK_WATCH_URL = "https://riskwatch.indiainsure.com/";

export const sidebarItems: SidebarItem[] = [
  {
    label: "My Dashboard",
    icon: dashboardDeSelectedIcon,
    activeIcon: dashboardSelectedIcon,
    disabledIcon: dashboardDisabledIcon,
    path: "/dashboard",
  },
  {
    label: "My Companies",
    path: "/companies",
    icon: manageCompanyDeselectIcon,
    activeIcon: manageCompanySelectIcon,
    disabledIcon: manageCompanyDisabledIcon,
    disabled: false,
    permissionKey: "viewCompanyManagement",
  },
  {
    label: "My Contacts",
    path: "/contact",
    icon: manageContactDeselectIcon,
    activeIcon: manageContactSelectIcon,
    disabledIcon: manageContactDisabledIcon,
    disabled: false,
    permissionKey: "viewContactManagement",
  },

  {
    label: "My Approvals",
    icon: approvalsAndAssignmentDeselectedIcon,
    activeIcon: approvalsAndAssignmentSelectedIcon,
    disabled: false,
    disabledIcon: approvalsAndAssignmentDisabledIcon,
    children: [
      {
        label: "My approvals",
        path: "/engagements/approvals",
        icon: myApprovalsDeselectedIcon,
        activeIcon: myApprovalsSelectedIcon,

        disabledIcon: myApprovalsDisabledIcon,
        disabled: false,
        permissionKeys: ["canGiveApprovalForBD", "canGiveApprovalForISG"],
        permissionLogic: "OR",
      },
      {
        label: "My assignments",
        path: "/engagements/assignments",
        icon: teamAssignmentDeselectedIcon,
        activeIcon: teamAssignmentSelected,
        disabledIcon: teamDisabledIcon,
        disabled: false,
        permissionKeys: ["canISGAssign", "canBDAssign"],
        permissionLogic: "OR",
      },
    ],
  },
  {
    label: "My Sales Portfolio",
    icon: opportunitiesDeselectedIcon,
    activeIcon: opportunitySelectedIcon,
    disabledIcon: opportunityDisabledIcon,
    disabled: false,
    excludeRolePatterns: ["ISG"],
    children: [
      {
        label: "Manage SO",
        path: "/opportunities",
        icon: SODeselectIcon,
        activeIcon: SOSelectedIcon,
        disabledIcon: addCompanyDisabledIcon,
        permissionKey: "viewBDActivity",
      },
      // Moved to Admin Module
      // {
      //   label: "Manage Broker",
      //   path: "/broker",
      //   icon: manageInsurerDeselectIcon,
      //   activeIcon: manageInsurerSelectIcon,
      //   disabledIcon: manageInsurerDisabledIcon,
      //   disabled: false,
      //   permissionKey: "viewBrokerManagement",
      // },
    ],
  },
  {
    label: "Manage Placements",
    icon: managePlacementDeselectIcon,
    activeIcon: managePlacementSelectIcon,
    disabledIcon: managePlacementDisableIcon,
    disabled: false,
    children: [
      {
        // Combined SO + RO listing for ISG users (spec). Replaces the former
        // "Manage Quote RO"/"Manage Quote SO" children; gated on the ISG
        // activities-read capability (visible to ISG-only and BD+ISG).
        label: "Manage Quotes",
        path: "/manage-quotes",
        icon: RODeselectIcon,
        activeIcon: ROSelectedIcon,
        disabledIcon: myRoDisabledIcon,
        permissionKey: "viewIsgActivity",
      },
      // Insurer Rewards - moved from Admin Module (Generic rewards, Phase 1)
      {
        label: "Insurer Rewards",
        path: "/insurer-rewards",
        icon: manageInsurerDeselectIcon,
        activeIcon: manageInsurerSelectIcon,
        disabledIcon: manageInsurerDisabledIcon,
        disabled: false,
        permissionKey: "viewRewardManagement",
      },
      // {
      //   label: "Manage Policies",
      //   path: FF_IWORK_POLICY_LISTING ? "/policies" : "/manage-policies",
      //   icon: managePoliciesDeselectIcon,
      //   activeIcon: managePoliciesSelectIcon,
      //   disabledIcon: managePoliciesDisabledIcon,
      //   disabled: !FF_IWORK_POLICY_LISTING,
      //   permissionKey: "viewPolicyManagement",
      // },
      // Moved to Admin Module
      // {
      //   label: "Manage Insurer",
      //   path: "/insurer",
      //   icon: manageInsurerDeselectIcon,
      //   activeIcon: manageInsurerSelectIcon,
      //   disabledIcon: manageInsurerDisabledIcon,
      //   disabled: false,
      //   permissionKey: "viewInsurerManagement",
      // },
    ],
  },
  {
    label: "My Service Portfolio",
    icon: manageServiceDeselectIcon,
    activeIcon: manageServiceSelectIcon,
    disabled: false,
    disabledIcon: manageServiceDisabledIcon,
    children: [
      {
        label: "My Client Portfolio",
        path: "/my-client-portfolio",
        icon: SODeselectIcon,
        activeIcon: SOSelectedIcon,
        disabledIcon: addCompanyDisabledIcon,
        permissionKey: "viewOpportunity",
      },
      {
        label: "My RO",
        path: "/renewal-opportunities",
        icon: RODeselectIcon,
        activeIcon: ROSelectedIcon,
        disabledIcon: myRoDisabledIcon,
        permissionKey: "viewOpportunity",
      },
      {
        label: "Manage policies",
        path: FF_IWORK_POLICY_LISTING ? "/policies" : "/manage-policies",
        icon: managePoliciesDeselectIcon,
        activeIcon: managePoliciesSelectIcon,
        disabledIcon: managePoliciesDisabledIcon,
        disabled: !FF_IWORK_POLICY_LISTING,
        permissionKey: "viewPolicyManagement",
      },
      // Moved to Admin Module
      // {
      //   label: "CD Management",
      //   path: "/cd-management",
      //   icon: claimsDeselectedIcon,
      //   activeIcon: claimsSelectedIcon,
      //   disabledIcon: manageClaimsDisabledIcon,
      // },
      {
        label: "Manage Endorsements",
        path: "/manage-endorsements",
        icon: endorsementDeselectedIcon,
        activeIcon: endorsementSelected,
        disabledIcon: manageEndoDisabledIcon,
        permissionKey: "viewEndorsementManagement",
      },
      {
        label: "Manage Claims",
        path: "/manage-claims",
        icon: claimsDeselectedIcon,
        activeIcon: claimsSelectedIcon,
        disabledIcon: manageClaimsDisabledIcon,
        permissionKey: "viewClaimsManagement",
      },
      // Moved to Admin Module
      // {
      //   label: "Manage TPA",
      //   path: "/tpa",
      //   icon: manageTPADeselected,
      //   activeIcon: manageTPASelected,
      //   disabledIcon: manageTPADisabled,
      //   disabled: false,
      //   permissionKey: "viewTpaManagement",
      // },
    ],
  },
  {
    label: "My Calendar",
    icon: meetingsDeselectedIcon,
    activeIcon: meetingsSelectedIcon,
    disabledIcon: meetingDisabledIcon,

    disabled: false,
    children: [
      {
        label: "My Meetings",
        path: "/engagements/meetings",
        icon: myMeetingDeselected,
        activeIcon: myMeetingSelected,
        disabledIcon: myMeetingDisabledIcon,
        disabled: false,
      },
      {
        label: "My Tasks",
        path: "/engagements/tasks",
        icon: myTaskDeselected,
        activeIcon: myTaskSelected,
        disabledIcon: myTaskDisabledIcon,
        disabled: false,
      },
    ],
  },
  // {
  //   label: "Reports",
  //   icon: BizoneDeselectedIcon,
  //   activeIcon: BizDoneSelectIcon,
  //   disabledIcon: BizDoneDisableIcon,
  //   disabled: false,
  //   children: [
  //     {
  //       label: "Biz Done Report",
  //       icon: BizoneDeselectedIcon,
  //       activeIcon: BizDoneSelectIcon,
  //       disabledIcon: BizDoneDisableIcon,
  //       path: "/biz-done-report",
  //       permissionKeys: ["canViewBizDoneReport"],
  //     },
  //     {
  //       label: "MIR",
  //       icon: BizoneDeselectedIcon,
  //       activeIcon: BizDoneSelectIcon,
  //       disabledIcon: BizDoneDisableIcon,
  //       path: "/mir-reports",
  //     },
  //     // Moved to Admin Module
  //     // {
  //     //   label: "Utilization Reports",
  //     //   path: "/report",
  //     //   icon: ReportsIcon,
  //     //   activeIcon: ReportSelectIcon,
  //     //   disabledIcon: ReportsIcon,
  //     //   disabled: false,
  //     //   permissionKeys: ["viewAdminReports"],
  //     // },
  //     ...(FF_IWORK_HIDE_MASTER
  //       ? [
  //           {
  //             label: "MasterData/LOVs",
  //             icon: BizoneDeselectedIcon,
  //             activeIcon: BizDoneSelectIcon,
  //             disabledIcon: BizDoneDisableIcon,
  //             path: "/manage-policies",
  //           },
  //         ]
  //       : []),
  //   ],
  // },
  {
    label: "Admin Module",
    icon: manageServiceDeselectIcon,
    activeIcon: manageServiceSelectIcon,
    disabled: false,
    disabledIcon: manageServiceDisabledIcon,
    children: [
      {
        label: "Employees",
        path: "/employee",
        icon: addCompanyDeselectedIcon,
        activeIcon: addCompanySelectedIcon,
        disabledIcon: addCompanyDisabledIcon,
        permissionKeys: ["viewEmployeeManagement", "createEmployeeManagement"],
      },
      {
        label: "My RO Enhanced",
        path: "/renewal-opportunities-enhanced",
        icon: RODeselectIcon,
        activeIcon: ROSelectedIcon,
        disabledIcon: myRoDisabledIcon,
        permissionKey: "viewOpportunity",
      },
      {
        label: "Manage SO Enhanced",
        path: "/opportunities-enhanced",
        icon: SODeselectIcon,
        activeIcon: SOSelectedIcon,
        disabledIcon: addCompanyDisabledIcon,
        permissionKey: "viewBDActivity",
      },
      {
        label: "Portfolio Enhanced",
        path: "/my-client-portfolio-enhanced",
        icon: SODeselectIcon,
        activeIcon: SOSelectedIcon,
        disabledIcon: addCompanyDisabledIcon,
        permissionKey: "viewOpportunity",
      },
      {
        label: "Biz Done Enhanced",
        icon: BizoneDeselectedIcon,
        activeIcon: BizDoneSelectIcon,
        disabledIcon: BizDoneDisableIcon,
        path: "/biz-done-report-enhanced",
        permissionKeys: ["canViewBizDoneReport"],
      },
      // MIR — moved here from the Header's Reports dropdown. No permission
      // gate, matching its previous Reports-menu behavior.
      {
        label: "MIR Reports",
        path: "/mir-reports",
        icon: manageServiceDeselectIcon,
        activeIcon: manageServiceSelectIcon,
        disabledIcon: manageServiceDisabledIcon,
        disabled: false,
      },
      ...(FF_IWORK_HIDE_MASTER
        ? [
            {
              label: "Masters",
              path: "/master",
              icon: manageCompanyIcon,
              activeIcon: manageCompanySelectedIcon,
              disabledIcon: myRoDisabledIcon,
            },
          ]
        : []),
      {
        label: "Roles",
        path: "/roles",
        icon: manageCompanyIcon,
        activeIcon: manageCompanySelectedIcon,
        disabledIcon: myRoDisabledIcon,
        permissionKeys: ["viewAdminRoles"],
      },
      {
        label: "Release Notes",
        path: "/release-notes",
        icon: manageCompanyDeselectIcon,
        activeIcon: manageCompanySelectIcon,
        disabledIcon: manageCompanyDisabledIcon,
        disabled: false,
        permissionKeys: ["viewReleaseNotes"],
      },
      {
        label: "Service Catalog",
        path: "/service-catalog",
        icon: manageServiceDeselectIcon,
        activeIcon: manageServiceSelectIcon,
        disabledIcon: manageServiceDisabledIcon,
        disabled: false,
        permissionKeys: ["viewServiceCatalog"],
      },
      {
        label: "Template Management",
        path: "/template-management",
        icon: managePoliciesDeselectIcon,
        activeIcon: managePoliciesSelectIcon,
        disabledIcon: managePlacementDisableIcon,
        disabled: false,
        permissionKeys: ["viewTemplateManagement"],
      },
      {
        label: "Business Targets",
        path: "/business-targets-report",
        icon: BizoneDeselectedIcon,
        activeIcon: BizDoneSelectIcon,
        disabledIcon: BizDoneDisableIcon,
        disabled: false,
        permissionKeys: ["viewBusinessTarget"],
      },
      {
        label: "Application Scheduler",
        path: "/application-scheduler",
        icon: cronJobsDeselectedIcon,
        activeIcon: cronJobsSelectedIcon,
        disabledIcon: cronJobsDisabledIcon,
        disabled: false,
        permissionKeys: ["editCronConfiguration"],
      },
      {
        label: "Migration Log",
        path: "/migration-log",
        icon: cronJobsDeselectedIcon,
        activeIcon: cronJobsSelectedIcon,
        disabledIcon: cronJobsDisabledIcon,
        disabled: false,
        permissionKeys: ["viewMigrationLog"],
      },
      {
        label: "File Password Configuration",
        path: "/file-password-config",
        icon: manageCompanyDeselectIcon,
        activeIcon: manageCompanySelectIcon,
        disabledIcon: manageCompanyDisabledIcon,
        disabled: false,
        permissionKey: "canConfigureFilePassword",
      },
      {
        label: "Document Management",
        path: "/document-management",
        icon: manageCompanyDeselectIcon,
        activeIcon: manageCompanySelectIcon,
        disabledIcon: manageCompanyDisabledIcon,
        disabled: false,
        permissionKey: "canManageDocuments",
      },
      // CD Management - moved from My Service Portfolio
      {
        label: "CD Management",
        path: "/cd-management",
        icon: claimsDeselectedIcon,
        activeIcon: claimsSelectedIcon,
        disabledIcon: manageClaimsDisabledIcon,
      },
      // Manage Insurer - moved from Manage Placements
      {
        label: "Manage Insurer",
        path: "/insurer",
        icon: manageInsurerDeselectIcon,
        activeIcon: manageInsurerSelectIcon,
        disabledIcon: manageInsurerDisabledIcon,
        disabled: false,
        permissionKey: "viewInsurerManagement",
      },
      // Insurer Rewards - moved to Manage Placements
      // Manage Broker - moved from My Sales Portfolio
      {
        label: "Manage Broker",
        path: "/broker",
        icon: manageInsurerDeselectIcon,
        activeIcon: manageInsurerSelectIcon,
        disabledIcon: manageInsurerDisabledIcon,
        disabled: false,
        permissionKey: "viewBrokerManagement",
      },
      // Manage TPA - moved from My Service Portfolio
      {
        label: "Manage TPA",
        path: "/tpa",
        icon: manageTPADeselected,
        activeIcon: manageTPASelected,
        disabledIcon: manageTPADisabled,
        disabled: false,
        permissionKey: "viewTpaManagement",
      },
      // Utilization Report - moved from Reports
      {
        label: "Utilization Reports",
        path: "/report",
        icon: ReportsIcon,
        activeIcon: ReportSelectIcon,
        disabledIcon: ReportsIcon,
        disabled: false,
        permissionKeys: ["viewAdminReports"],
      },
      // TPA External API Configs
      ...(environment.featureFlag.FF_EXTERNAL_API_CONFIGS
        ? [{
            label: "External API Configs",
            path: "/admin-settings",
            icon: manageServiceDeselectIcon,
            activeIcon: manageServiceSelectIcon,
            disabledIcon: manageServiceDisabledIcon,
            disabled: false,
          }]
        : []),
      // {
      //   label: "Biz Done Report",
      //   icon: managePoliciesDeselectIcon,
      //   activeIcon: managePoliciesSelectIcon,
      //   disabledIcon: managePoliciesDisabledIcon,
      //   disabled: false,
      //   path: "/biz-done-report",
      //   permissionKeys: ["canViewBizDoneReport"],
      // },
    ],
  },
  {
    label: "Fin Ops",
    icon: finOpsDeselected,
    activeIcon: finOpsSelected,
    disabledIcon: finopsDisabledIcon,
    externalUrl: FIN_OPS_URL,
  },
  {
    label: "iConnect",
    icon: dmSmartConnectDeselected,
    activeIcon: dmSmartConnectSelected,
    disabledIcon: dmDisabledIcon,
    magicAppKey: "iconnect",
  },
  {
    label: "RW",
    icon: reInsuranceHubDeselected,
    activeIcon: reInsuranceHubSelected,
    disabledIcon: reinsuranceDisabledIcon,
    externalUrl: RISK_WATCH_URL,
  },
  // {
  //   label: "Divider",
  //   type: "divider",
  // },
  // {
  //   label: "Reinsurance Hub",
  //   icon: reInsuranceHubDeselected,
  //   activeIcon: reInsuranceHubSelected,
  //   path: "/reinsurance-hub",
  //   disabledIcon: reinsuranceDisabledIcon,
  //   disabled: false,
  //   externalUrl: "http://192.168.100.178:8001/Login/Index.aspx",
  // },
  // {
  //   label: "Personal Lines",
  //   icon: dmSmartConnectDeselected,
  //   activeIcon: dmSmartConnectSelected,
  //   path: "/dm-smart-connect",
  //   disabledIcon: dmDisabledIcon,
  //   disabled: false,
  //   externalUrl: "https://insurace-portal.lovable.app/login",
  // },
  // {
  //   label: "LIA Consulting",
  //   icon: liaConsultingDeselected,
  //   activeIcon: liaConsultingSelected,
  //   path: "/lia-consulting",
  //   disabledIcon: liaDisabledIcon,
  //   disabled: true,
  // },
  // {
  //   label: "Manthan",
  //   icon: liaConsultingDeselected,
  //   activeIcon: liaConsultingSelected,
  //   path: "/fin-ops",
  //   disabledIcon: liaDisabledIcon,
  //   disabled: false,
  //   externalUrl: "https://isbsindia.teamlease.com/#/dashboard",
  // },
  // {
  //   label: "Poppins",
  //   icon: liaConsultingDeselected,
  //   activeIcon: liaConsultingSelected,
  //   path: "/fin-ops",
  //   disabledIcon: liaDisabledIcon,
  //   disabled: false,
  //   externalUrl: "https://www.evexia.in/poppins/user/",
  // },
];
