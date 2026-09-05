import { ColDef } from "ag-grid-community";
import {
  convertToTreeData,
  endPoints,
  FormFieldConfig,
} from "@ui/ui-lib";
import { CUT_OFF_UI } from "../../constants";

// All raise-override fields render through the common FormComponent Field set
// (label-above, shared theme). disablePortal keeps each dropdown above the
// modal. Duration is capped to the 1–7 day window via a fixed option list.
// Forward-only (2026-07-24): no Cycle field — a late slip books the current
// month regardless, so the override no longer reopens a specific month.

// Same treeSelect shape as the dashboard/company hierarchy filters.
export const teamMemberField: FormFieldConfig = {
  key: "targetUserId",
  name: "targetUserId",
  label: "Team member",
  type: "treeSelect",
  rules: { required: "Select a team member" },
  apiDependencies: {
    endPoint: endPoints.employeeHirarcy,
    utilityFunction: convertToTreeData,
  },
  componentProps: {
    fullWidth: true,
    disablePortal: true,
  },
} as const;

export const flowField: FormFieldConfig = {
  key: "flowType",
  name: "flowType",
  label: "Flow",
  type: "select",
  rules: { required: "Select a flow" },
  options: [
    { value: "OPPORTUNITY", label: "Opportunity" },
    { value: "ENDORSEMENT", label: "Endorsement" },
  ],
  componentProps: { fullWidth: true, disablePortal: true },
} as const;

// Opportunity flow only: the target user's blocked placement slips, loaded at
// runtime (options injected in the component). Multiselect with search so the
// dropdown renders inline (disablePortal) above the modal. Selecting slips just
// identifies what to unblock — no month scoping (forward-only).
export const blockedSlipsField: FormFieldConfig = {
  key: "blockedSlips",
  name: "blockedSlips",
  label: "Blocked placement slips",
  type: "multiselect",
  enableSearch: true,
  placeholder: "Select the stuck slip(s) — date shown per slip",
  helperText: "The selected slips will be unblocked for this window.",
  options: [],
  optionTextColor: "#000000",
  componentProps: { fullWidth: true, disablePortal: true },
} as const;

export const durationField: FormFieldConfig = {
  key: "durationDays",
  name: "durationDays",
  label: "Override duration",
  type: "select",
  rules: { required: "Select a duration" },
  options: [1, 2, 3, 4, 5, 6, 7].map((d) => ({
    value: d,
    label: d === 1 ? "1 day" : `${d} days`,
  })),
  componentProps: { fullWidth: true, disablePortal: true },
} as const;

export const reasonField: FormFieldConfig = {
  key: "reason",
  name: "reason",
  label: "Reason",
  type: "textarea",
  placeholder: "Why is this override needed?",
  rules: { required: "Reason is required" },
   componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
} as const;

export interface OverrideRow {
  id: number;
  flowType: string;
  targetUserId: number;
  targetUserName: string | null;
  entityId: number | null;
  windowStart: string;
  windowEnd: string;
  raisedBy: number;
  raisedByRole: string;
  reason: string;
  revokedAt: string | null;
}

export interface HierarchyUser {
  userId: number;
  firstName: string;
  lastName: string;
  level: number;
}

export const formatIst = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);
  return `${datePart}, ${timePart}`;
};

export const overrideState = (row: OverrideRow): string => {
  if (row.revokedAt) return CUT_OFF_UI.OVERRIDE_STATE.REVOKED;
  const now = Date.now();
  if (now < new Date(row.windowStart).getTime())
    return CUT_OFF_UI.OVERRIDE_STATE.SCHEDULED;
  if (now <= new Date(row.windowEnd).getTime())
    return CUT_OFF_UI.OVERRIDE_STATE.ACTIVE;
  return CUT_OFF_UI.OVERRIDE_STATE.EXPIRED;
};

export const isOverrideRevocable = (row: OverrideRow): boolean =>
  overrideState(row) === CUT_OFF_UI.OVERRIDE_STATE.ACTIVE ||
  overrideState(row) === CUT_OFF_UI.OVERRIDE_STATE.SCHEDULED;

export const getColumns = (canRevoke: boolean): ColDef[] => [
  {
    headerName: "Flow",
    field: "flowType",
    headerTooltip: "Flow the override applies to",
    minWidth: 140,
    valueFormatter: ({ value }) => value ?? "--",
    disableSort: true,
  },
  {
    headerName: "Team member",
    field: "targetUserName",
    headerTooltip: "User the override was raised for",
    minWidth: 160,
    disableSort: true,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Entity ID",
    field: "entityId",
    headerTooltip: "Opportunity / endorsement the override was raised against",
    minWidth: 110,
    disableSort: true,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Window",
    field: "windowStart",
    headerTooltip: "Override window (IST)",
    minWidth: 300,
    disableSort: true,
    valueGetter: ({ data }) =>
      data
        ? `${formatIst(data.windowStart)} — ${formatIst(data.windowEnd)}`
        : "--",
    tooltipValueGetter: ({ data }) =>
      data
        ? `${formatIst(data.windowStart)} — ${formatIst(data.windowEnd)}`
        : "--",
  },
  {
    headerName: "Reason",
    field: "reason",
    tooltipField: "reason",
    headerTooltip: "Reason the override was raised",
    minWidth: 260,
    disableSort: true,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Status",
    field: "revokedAt",
    headerTooltip: "Override window status",
    minWidth: 120,
    disableSort: true,
    valueGetter: ({ data }) => (data ? overrideState(data) : "--"),
    tooltipValueGetter: ({ data }) => (data ? overrideState(data) : "--"),
  },
  {
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Available actions",
    cellRenderer: "OverrideActionsRenderer",
    disableSort: true,
    minWidth: 130,
    hide: !canRevoke,
    tooltipValueGetter: () => "Revoke override",
  },
];
