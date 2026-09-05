// SO Enhanced's hierarchy shape wired into the shared OrgFinancialFilter:
// Organisation -> SBU -> (Vertical or Branch fork), aggregated against SO
// opportunities. This is the only page-specific config the shared component
// needs — everything else (accordion/cards/period popover) is generic.
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import {
  endPoints,
  formatLargeCurrency,
  formatNumberByLocalization,
  OrgFinancialFilterConfig,
  firstSelectedId,
} from "@ui/ui-lib";
import { mapEmployeeHierarchyMaster } from "../../../RenewalOpportunityEnhancedPage/RenewalOpportunityEnhancedListing/orgScope/roScopeConfig";

export const soScopeConfig: OrgFinancialFilterConfig = {
  levels: [
    {
      key: "organisation",
      label: "Organisation",
      icon: <CorporateFareOutlinedIcon />,
      masterUrl: () => endPoints.masterOrganisation,
      queryParam: "organisationId",
    },
    {
      key: "unit",
      label: "SBU",
      icon: <AccountTreeOutlinedIcon />,
      masterUrl: (selection) => {
        const orgId = firstSelectedId(selection.organisation);
        return orgId != null ? endPoints.sbuByOrg(orgId) : "";
      },
      queryParam: "sbuId",
    },
  ],
  fork: [
    {
      key: "vertical",
      label: "Vertical",
      icon: <CategoryOutlinedIcon />,
      masterUrl: (selection) => {
        const sbuId = firstSelectedId(selection.unit);
        return sbuId != null ? endPoints.verticalsBySbu(sbuId) : "";
      },
      queryParam: "verticalId",
    },
    {
      key: "branch",
      label: "Branch",
      icon: <PlaceOutlinedIcon />,
      masterUrl: (selection) => {
        const orgId = firstSelectedId(selection.organisation);
        return orgId != null ? endPoints.branchesByOrg(orgId) : "";
      },
      queryParam: "branchId",
      // Branch multi-select is parked (2026-08-06): uncomment to re-enable.
      // Every other part of the feature keys off this one flag, and the
      // array-shaped consumers all accept a scalar, so nothing else changes.
      // multiSelect: true,
    },
  ],
  defaultForkKey: "branch",
  // Owner accordion: appears only once a Branch is selected. Cards are the
  // logged-in user + their reporting downline; aggregates come from the same
  // scope-summary endpoint with level=owner, and the Manager / Manager + Team
  // toggle rides the endpoint's existing `owner` view-by param.
  ownerLevel: {
    key: "owner",
    label: "Owner",
    icon: <PersonOutlineOutlinedIcon />,
    masterUrl: () => endPoints.employeeHirarcy(),
    queryParam: "userId",
    afterForkKey: "branch",
    viewByParam: "owner",
    mapMaster: mapEmployeeHierarchyMaster,
  },
  // Total SOs uses the same locale-aware, comma-grouped formatting KPICards
  // applies to its own count cards — a bare String(v) skipped localization
  // entirely. Premium/Brokerage use the same compact formatLargeCurrency
  // (e.g. "8.06 B", "227.93 M") the KPI cards render.
  // Metric key is "totalRos" even for SO — the backend's getScopeSummary
  // returns that literal field name regardless of the `type` param (it was
  // built for RO first and never renamed); only the `type: "SO"` request
  // param actually switches which opportunities get aggregated.
  metrics: [
    {
      key: "totalRos",
      label: "Total SOs",
      format: (v, l) => formatNumberByLocalization(v ?? 0, l),
    },
    // {
    //   key: "premium",
    //   label: "Premium",
    //   format: (v, l) => formatLargeCurrency(v, l).trim(),
    // },
    {
      key: "brokerage",
      label: "Brokerage",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
  ],
  aggregateEndpoint: endPoints.opportunityScopeSummary,
  aggregateTypeParam: "SO",
};
