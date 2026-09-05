import { endPoints, FormFieldConfig, DynamicObject } from "@ui/ui-lib";
import { businessPerformanceFilterConfig } from "../../../components/BusinessPerformance/businessPerformanceConfig";
import {
  ENTITY_TYPE_OPTIONS,
  KPI_OPTIONS,
  DEFAULT_KPI,
} from "../AddEditTarget/formConfig";

// Reuse the exact org-hierarchy filter fields the Business Performance /
// BizDone screens use (organisation → SBU → vertical dependency chain), so the
// SBU + Vertical selects behave identically here. Organisation is kept as the
// parent of the sbuByOrg → verticalsBySbu dependency chain (SBU can't populate
// without it); it is not one of the 7 target filters but enables two of them.
// Lookup-backed selects get isSmartSearch so their labels resolve into chips,
// mirroring ContactListing / EndorsementListing.
const reusedOrgFields = businessPerformanceFilterConfig
  .filter((field) =>
    ["organisationId", "sbuId", "verticalId", "financialYear"].includes(
      field.key
    )
  )
  .map((field) => ({
    ...field,
    gridColumn: 2.9,
    ...(["organisationId", "sbuId"].includes(field.key) && field.apiDependencies
      ? { apiDependencies: { ...field.apiDependencies, isSmartSearch: true } }
      : {}),
  }));

const teamMemberUtilityFunc = (data: DynamicObject) => {
  const users = data?.data?.data || [];
  return users.map((user: DynamicObject) => ({
    value: user.userId,
    label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
  }));
};

export const businessTargetFilterConfig: FormFieldConfig[] = [
  ...reusedOrgFields,
  {
    key: "userId",
    name: "userId",
    label: "Team member",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee,
      utilityFunction: teamMemberUtilityFunc,
      customParams: {
        searchBy: "firstName",
        sortBy: "firstName",
        sortOrder: "ASC",
      },
    },
    placeholder: "Search team member",
  },
  {
    key: "month",
    name: "month",
    label: "Month",
    type: "monthYear",
    gridColumn: 2.9,
    componentProps: { fullWidth: true },
  },
  {
    key: "entityType",
    name: "entityType",
    label: "Entity type",
    type: "select",
    gridColumn: 2.9,
    componentProps: { fullWidth: true },
    options: ENTITY_TYPE_OPTIONS,
  },
  {
    key: "kpi",
    name: "kpi",
    label: "KPI",
    type: "select",
    gridColumn: 2.9,
    componentProps: { fullWidth: true },
    options: KPI_OPTIONS,
  },
];

export const businessTargetFilterDefaults = {
  organisationId: "",
  sbuId: "",
  verticalId: [] as any[],
  financialYear: "",
  userId: "",
  month: "",
  // Smart-search selects store the {value,label} option, not a raw string, so
  // the field + chip show the label ("Brokerage") not the value. buildFilterParams
  // unwraps .value for the backend.
  //
  // Entity type is intentionally unset: buildFilterParams then omits it, and the
  // report spans every entity_type with Entity Type as its own column.
  // Preselecting Total Policy here hid SO/RO/MINED targets behind a filter the
  // user never chose.
  entityType: "",
  kpi: KPI_OPTIONS.find((o) => o.value === DEFAULT_KPI),
};
