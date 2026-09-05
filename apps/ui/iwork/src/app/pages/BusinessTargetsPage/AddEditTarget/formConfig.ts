import { FormFieldConfig } from "@ui/ui-lib";
import { hierarchyField } from "../../../components/BusinessPerformance/businessPerformanceConfig";

// Fixed dropdown enums — mirror libs/service-lib/src/lib/constants.ts
// (BUSINESS_TARGET_ENTITY_TYPE / POLICY_PERFORMANCE_FIELDS). Kept as plain
// option arrays because these are compile-time constants, not API lookups.
export const ENTITY_TYPE_OPTIONS = [
  { value: "SO_POLICY", label: "SO Policy" },
  { value: "RO_POLICY", label: "RO Policy" },
  { value: "TOTAL_POLICY", label: "Total Policy" },
];

export const KPI_OPTIONS = [
  { value: "BROKERAGE", label: "Brokerage" },
];

export const TYPE_OF_TARGET_OPTIONS = [
  { value: "AMOUNT", label: "Amount" },
  { value: "PERCENTAGE", label: "Percentage" },
];

// Report defaults surfaced from the enums, reused by the report screen.
export const DEFAULT_ENTITY_TYPE = "TOTAL_POLICY";
export const DEFAULT_KPI = "BROKERAGE";

// disabledInEditMode is honoured by DynamicForm (FormComponent) whenever
// isEditMode is set. On edit, the record is identified by Team member + Month +
// Entity type + KPI, so those stay read-only and only Type of target and Target
// value can change.
export const targetFormFields = (): FormFieldConfig[] => [
  {
    // Same reporting-hierarchy tree the dashboard's Owner filter uses — the
    // shared hierarchyField carries the employee-hierarchy endpoint and
    // convertToTreeData, so the expanders, child counts and search behave
    // identically.
    //
    // enableSmartSearch makes TreeSelect store {value,label} instead of the bare
    // node key. Required for the input to read the NAME: TreeSelect's
    // value-sync effect does setSearchTerm(currValue) for a plain string, which
    // overwrites the title it just set with the raw userId. componentProps is
    // spread after the form-wide prop in FormFieldRenderer, so this stays scoped
    // to this field — flipping it on the whole form would also switch
    // SelectField/SegmentedControl to object values and break the submit payload.
    key: "userId",
    name: "userId",
    label: "Team member",
    type: "treeSelect",
    gridColumn: 5,
    apiDependencies: hierarchyField.apiDependencies,
    componentProps: { ...hierarchyField.componentProps, enableSmartSearch: true },
    disabledInEditMode: true,
    rules: {
      required: { value: true, message: "Team member is required" },
    },
  },
  {
    key: "month",
    name: "month",
    label: "Month",
    type: "monthYear",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    disabledInEditMode: true,
    rules: {
      required: { value: true, message: "Month is required" },
    },
  },
  {
    key: "entityType",
    name: "entityType",
    label: "Entity type",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    options: ENTITY_TYPE_OPTIONS,
    disabledInEditMode: true,
    rules: {
      required: { value: true, message: "Entity type is required" },
    },
  },
  {
    key: "kpi",
    name: "kpi",
    label: "KPI",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    options: KPI_OPTIONS,
    disabledInEditMode: true,
    rules: {
      required: { value: true, message: "KPI is required" },
    },
  },
  {
    key: "typeOfTarget",
    name: "typeOfTarget",
    label: "Type of target",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    options: TYPE_OF_TARGET_OPTIONS,
    rules: {
      required: { value: true, message: "Type of target is required" },
    },
  },
  {
    key: "valueOfTarget",
    name: "valueOfTarget",
    label: "Target value",
    type: "number",
    gridColumn: 5,
    formatNumber: true,
    componentProps: { fullWidth: true, type: "number" },
    rules: {
      required: { value: true, message: "Target value is required" },
      min: { value: 0, message: "Target value cannot be negative" },
    },
  },
];

export const initialTargetValues = {
  userId: "",
  month: "",
  entityType: DEFAULT_ENTITY_TYPE,
  kpi: DEFAULT_KPI,
  typeOfTarget: "AMOUNT",
  valueOfTarget: "",
};

export const getTargetBreadcrumbs = (isEdit: boolean) => [
  { label: "Business Targets", path: "/business-targets-report" },
  { label: isEdit ? "Edit target" : "Add target" },
];
