// Biz Done Enhanced's hierarchy shape wired into the shared OrgFinancialFilter:
// Organisation -> SBU -> (Vertical or Branch fork), aggregated against policy
// business-done data. This is the only page-specific config the shared
// component needs — everything else (accordion/cards/period popover) is generic.
import React from "react";
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

export const bizDoneScopeConfig: OrgFinancialFilterConfig = {
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
  // Column-header layout (labels once at the top, values-only rows).
  tabularMetrics: true,
  // Owner accordion: appears only once a Branch is selected. Cards are the
  // logged-in user + their reporting downline; aggregates come from the same
  // policy scope-summary endpoint with level=owner. defaultViewBy "team"
  // (Manager + Team) is the product default on every Enhanced page; the
  // owner-sync effect pushes it into the drawer's View-by on first apply, so
  // the listing follows the accordion instead of its own self-only default.
  ownerLevel: {
    key: "owner",
    label: "Owner",
    icon: <PersonOutlineOutlinedIcon />,
    masterUrl: () => endPoints.employeeHirarcy(),
    queryParam: "userId",
    afterForkKey: "branch",
    viewByParam: "owner",
    defaultViewBy: "team",
    mapMaster: mapEmployeeHierarchyMaster,
  },
  metrics: [
    {
      key: "policyCount",
      label: "Policies",
      format: (v, l) => formatNumberByLocalization(v ?? 0, l),
    },
    // {
    //   key: "premium",
    //   label: "Premium",
    //   format: (v, l) => formatLargeCurrency(v, l).trim(),
    // },
    // Total = SO + RO brokerage + fee + reward, computed server-side per node.
    {
      key: "total",
      label: "Total",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
    // Brokerage is split by the policy's source opportunity (SO = fresh sale,
    // RO = renewal); fees and rewards belong to neither bucket so they show
    // separately.
    {
      key: "soBrokerage",
      label: "SO Brokerage",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
    {
      key: "roBrokerage",
      label: "RO Brokerage",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
    {
      key: "feeAmount",
      label: "Fee",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
    {
      key: "rewardAmount",
      label: "Reward",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
  ],
  aggregateEndpoint: endPoints.policyScopeSummary,
  aggregateTypeParam: "POLICY",
};
