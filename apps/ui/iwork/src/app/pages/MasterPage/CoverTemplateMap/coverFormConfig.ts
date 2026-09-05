import { FormFieldConfig, apiRequest, endPoints } from "@ui/ui-lib";
import { COVER_MASTER } from "../../../constants";

/**
 * Field configs for the master "Covers" flow, consumed by DynamicForm.
 * Kept in the same config-driven style as other forms (e.g. opportunityLostConfig).
 */

// Lookup endpoints return `{ data: [{ id, lookUpValue }] }`.
const mapLookupOptions = (res: any) =>
  (res?.data || []).map((o: any) => ({ value: o.id, label: o.lookUpValue }));

// Generic master options endpoints return `{ data: { data: [{ id, name }] } }`.
const mapIdNameOptions = (res: any) =>
  (res?.data?.data || []).map((o: any) => ({ value: o.id, label: o.name }));

// Cover catalogue search returns full rows; map name -> { value, label } so the
// free-text Cover Name field can both suggest existing covers and accept a new one.
const mapCoverNameOptions = (res: any) =>
  (res?.data?.data || []).map((o: any) => ({ value: o.name, label: o.name }));

/**
 * Step 1 - create a base cover (mstr_cover). All fields are mandatory.
 * Cover Name is a selectFieldByApi in free-text mode: it searches existing
 * covers as you type (so duplicates are visible) while still accepting a new
 * name; an exact match is rejected by the async uniqueness validator.
 */
export const createCoverFormConfig: FormFieldConfig[] = [
  {
    key: "name",
    name: "name",
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.COVER_NAME,
    gridColumn: 12,
    enableSearch: true,
    placeholder: COVER_MASTER.PLACEHOLDERS.COVER_NAME,
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.NAME_REQUIRED },
      validate: async (value: any) => {
        const trimmed = (value || "").trim();
        if (!trimmed) return true;
        try {
          const res = await apiRequest(endPoints.coverNameCheck(trimmed), {
            method: "GET",
          });
          const rows: Array<{ name: string }> = res?.data?.data || [];
          return rows.some((r) => r.name === trimmed)
            ? COVER_MASTER.MESSAGES.DUPLICATE_NAME(trimmed)
            : true;
        } catch {
          // Non-blocking: the server-side unique guard remains the final check.
          return true;
        }
      },
    },
    componentProps: { fullWidth: true, freeSolo: true },
    apiDependencies: {
      endPoint: endPoints.masterList(COVER_MASTER.ENTITY),
      customParams: { searchBy: "name" },
      utilityFunction: mapCoverNameOptions,
    },
  },
  {
    key: "description",
    name: "description",
    type: "textarea",
    label: COVER_MASTER.LABELS.DESCRIPTION,
    gridColumn: 12,
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.DESCRIPTION_REQUIRED },
    },
    componentProps: { rows: 3, multiline: true, fullWidth: true,  placeholder: COVER_MASTER.PLACEHOLDERS.DESCRIPTION},
  },
  {
    key: "coverTypeLid",
    name: "coverTypeLid",
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.COVER_TYPE,
    gridColumn: 12,
    placeholder: COVER_MASTER.PLACEHOLDERS.COVER_TYPE,
    enableSearch: true,
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.COVER_TYPE_REQUIRED },
    },
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName(COVER_MASTER.LOOKUPS.COVER_TYPE),
      utilityFunction: mapLookupOptions,
    },
  },
  {
    key: "inputType",
    name: "inputType",
    // selectFieldByApi with static options (no apiDependencies): the component
    // seeds its option list from `options`, so it renders like the API-backed
    // selects without needing an endpoint.
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.INPUT_TYPE,
    placeholder: COVER_MASTER.PLACEHOLDERS.INPUT_TYPE,
    gridColumn: 12,
    defaultValue: "text",
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.INPUT_TYPE_REQUIRED },
    },
    options: [...COVER_MASTER.INPUT_TYPE_OPTIONS],
    componentProps: { fullWidth: true },
  },
];

/**
 * Step 2 - selection fields for mapping a policy type + org to covers.
 * The Add button, mapped-covers panel and Submit are handled by the component.
 */
export const mapCoverSelectionConfig: FormFieldConfig[] = [
  {
    key: "organizationId",
    name: "organizationId",
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.ORGANISATION,
    gridColumn: 12,
    enableSearch: true,
    placeholder: COVER_MASTER.PLACEHOLDERS.ORGANISATION,
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.ORGANISATION_REQUIRED },
    },
    // Org options load fully and the endpoint ignores search → filter client-side.
    componentProps: { fullWidth: true, clientFilter: true },
    apiDependencies: {
      endPoint: endPoints.masterOptions("organisation"),
      utilityFunction: mapIdNameOptions,
      // Reset the dependent policy type when the organisation changes.
      clearFieldsOnChange: ["policyTypeId"],
    },
  },
  {
    key: "policyTypeId",
    name: "policyTypeId",
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.POLICY_TYPE,
    gridColumn: 12,
    enableSearch: true,
    placeholder: COVER_MASTER.PLACEHOLDERS.POLICY_TYPE,
    rules: {
      required: { value: true, message: COVER_MASTER.MESSAGES.POLICY_TYPE_REQUIRED },
    },
    // Org-scoped lookup loads fully and ignores search → filter client-side.
    componentProps: { fullWidth: true, clientFilter: true },
    // Policy types are organisation-scoped lookups, so fetch them for the
    // selected organisation (depends on organizationId).
    apiDependencies: {
      dependentField: "organizationId",
      endPoint: (organisationId: number) =>
        endPoints.lookUpByNameForOrg(
          COVER_MASTER.LOOKUPS.POLICY_TYPE,
          organisationId
        ),
      utilityFunction: mapLookupOptions,
    },
  },
  {
    key: "coverId",
    name: "coverId",
    type: "selectFieldByApi",
    label: COVER_MASTER.LABELS.COVER,
    gridColumn: 12,
    enableSearch: true,
    componentProps: { fullWidth: true },
    // Use the list endpoint with searchBy=name so typing filters server-side
    // (the options endpoint ignores the search term). Keep value=id, label=name.
    apiDependencies: {
      endPoint: endPoints.masterList(COVER_MASTER.ENTITY),
      customParams: { searchBy: "name" },
      utilityFunction: mapIdNameOptions,
      syncLabelTo: "coverName",
    },
  },
];

/**
 * "Show until activity" options for the per-cover visibility cutoff. A cover is
 * shown up to and including the chosen activity and hidden afterwards; the empty
 * value means no cutoff (visible in every activity).
 */
export const SHOW_UNTIL_ACTIVITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All activities" },
  { value: "rfp_cover_detail_activity", label: "RFP Data Collection" },
  { value: "broking_slip_activity", label: "Broking Slip Generation" },
  { value: "quote_entry_activity", label: "Enter Quote" },
  { value: "quote_comparison_report_activity", label: "QCR Generation" },
  { value: "final_negotiation_activity", label: "Meeting for Final Negotiation" },
  { value: "placement_slip_generation_activity", label: "Placement Slip" },
  { value: "premium_calculation_activity", label: "Premium Calculation" },
];
