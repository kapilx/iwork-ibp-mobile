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

export const clientPortfolioScopeConfig: OrgFinancialFilterConfig = {
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
  // Column-header layout (labels once at the top, values-only rows) — same as
  // Biz Done Enhanced, since this config also carries several money metrics.
  tabularMetrics: true,
  // Owner accordion: appears only once a Branch is selected. Cards are the
  // logged-in user + their reporting downline; aggregates come from the same
  // policy scope-summary endpoint with level=owner. defaultViewBy "team"
  // (Manager + Team) matches Biz Done Enhanced — the owner-sync effect pushes
  // the applied owner + view-by into the listing's ownerId/viewBy params, so
  // the table always follows the selected card.
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
    {
      key: "premium",
      label: "Premium",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
    {
      key: "brokerage",
      label: "Brokerage",
      format: (v, l) => formatLargeCurrency(v, l).trim(),
    },
  ],
  // Portfolio-specific scope aggregate: the cards use the "active book"
  // definition (Active + not-expired policies, premiumAtInception /
  // basicBrokerageAmount) so they reconcile with this page's KPI cards, rather
  // than the income engine that Biz Done Enhanced's policyScopeSummary uses.
  aggregateEndpoint: endPoints.policyPortfolioScopeSummary,
  aggregateTypeParam: "POLICY",
};
