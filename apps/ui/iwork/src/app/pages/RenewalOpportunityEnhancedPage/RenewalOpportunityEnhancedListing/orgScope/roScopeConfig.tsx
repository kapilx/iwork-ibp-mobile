// RO Enhanced's hierarchy shape wired into the shared OrgFinancialFilter:
// Organisation -> SBU -> (Vertical or Branch fork), aggregated against RO
// opportunities. This is the only page-specific config the shared component
// needs — everything else (accordion/cards/period popover) is generic.
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
  ScopeSelection,
  selectedIds,
  firstSelectedId,
} from "@ui/ui-lib";

// The employee/hierarchy master returns {userId, firstName, lastName,
// reportingUserId, level, branchId, userStatusKey, ...} rows (the logged-in
// user + their whole reporting downline) — normalize to the {id, name} shape
// the scope cards expect. Cards = the logged-in user (level 0, ALWAYS shown —
// they're the auto-selected default owner even when they sit in another
// branch) + ACTIVE downline members BELONGING to the selected branch. A
// missing userStatusKey (org-service build without the field yet) is treated
// as active so a deploy skew can't blank the accordion. Inactive or
// out-of-branch members are dropped as cards, but their records still roll
// up into their in-branch manager's Manager + Team numbers — history must
// not vanish with the person.
export const mapEmployeeHierarchyMaster = (
  rows: any[],
  selection?: ScopeSelection
): Array<{ id: number; name: string }> => {
  // Branch is multiselect, so the owner cards are the UNION of the selected
  // branches' members. No branch picked = no branch restriction.
  const branchIds = selectedIds(selection?.branch).map(Number);
  return (rows ?? [])
    .filter(
      (row) =>
        row?.userId != null &&
        (Number(row.level) === 0 ||
          ((row.userStatusKey == null ||
            row.userStatusKey === "USER_STATUS_ACTIVE") &&
            (branchIds.length === 0 ||
              branchIds.includes(Number(row.branchId)))))
    )
    .map((row) => ({
      id: Number(row.userId),
      name:
        row.lastName && String(row.lastName).trim() !== ""
          ? `${row.firstName} ${row.lastName}`
          : row.firstName ?? String(row.userId),
    }));
};

export const roScopeConfig: OrgFinancialFilterConfig = {
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
  // Total ROs uses the same locale-aware, comma-grouped formatting KPICards
  // applies to its own count cards — a bare String(v) skipped localization
  // entirely. Premium/Brokerage use the same compact formatLargeCurrency
  // (e.g. "8.06 B", "227.93 M") the KPI cards render.
  metrics: [
    {
      key: "totalRos",
      label: "Total ROs",
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
  aggregateTypeParam: "RO",
};
