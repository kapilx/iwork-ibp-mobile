import { formatDateTimeDDMMYYYY, LocalizationConfig } from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import cronstrue from "cronstrue";

const DEFAULT_CRON = "0 0 * * *";

export const SCHEDULE_UNITS = {
  YEAR: "year",
  MONTH: "month",
  WEEK: "week",
  DAY: "day",
  HOUR: "hour",
  MINUTE: "minute",
} as const;

/**
 * Checks if a cron expression represents an interval pattern
 */
export const isIntervalCron = (cronExpression: string): boolean => {
  if (!cronExpression) return false;
  const parts = cronExpression.trim().split(" ");
  if (parts.length < 2) return false;
  return parts[0].startsWith("*/");
};

/**
 * Parse interval cron expression to extract minutes
 */
export const parseCronInterval = (cronExpression: string): number | null => {
  if (!cronExpression) return null;

  const parts = cronExpression.trim().split(" ");
  if (parts.length < 2) return null;

  const minutePart = parts[0];
  if (minutePart.startsWith("*/")) {
    const interval = parseInt(minutePart.substring(2), 10);
    return isNaN(interval) ? null : interval;
  }

  return null;
};

/**
 * Helper to describe a cron expression in human readable form
 */

export const describeCronExpression = (cronExpression: string): string => {
  if (!cronExpression) return "--";

  try {
    return cronstrue.toString(cronExpression, {
      use24HourTimeFormat: false,
      verbose: false,
    });
  } catch (error) {
    // Fallback for invalid cron
    return cronExpression;
  }
};


export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Scheduler Name",
    field: "schedulerName",
    tooltipField: "schedulerName",
    headerTooltip: "Scheduler Name",
    pinned: "left",
    minWidth: 280,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Schedule",
    field: "schedulerExpression",
    headerTooltip: "Schedule",
    minWidth: 160,
    pinned: "left",
    disableSort: true,
    valueFormatter: ({ value }) => describeCronExpression(value),
    tooltipValueGetter: ({ value }) => describeCronExpression(value),
  },
  {
    headerName: "Status",
    field: "lastRunStatus",
    headerTooltip: "Last run status",
    cellRenderer: "ChipRenderer",
    disableSort: true,
    cellRendererParams: {
      variant: "withDot",
      styleMap: {
        idle: { color: "#9e9e9e" },
        running: { color: "#fb8c00" },
        success: { color: "#43a047" },
        failed: { color: "#e53935" },
      },
      bordercolor: "#2e2c2cff",
    },
    valueFormatter: ({ value }) => (value ? value.toUpperCase() : "--"),
    tooltipValueGetter: ({ value }) => (value ? value.toUpperCase() : "--"),
  },
  {
    headerName: "Last Success",
    field: "lastSuccessfulRunAt",
    headerTooltip: "Last successful execution",
    minWidth: 180,
    disableSort: true,
    valueFormatter: ({ value }) =>
      value ? formatDateTimeDDMMYYYY(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value ? formatDateTimeDDMMYYYY(value) : "--",
  },
  {
    headerName: "Last Failure",
    field: "lastFailedRunAt",
    disableSort: true,
    headerTooltip: "Last failed execution",
    minWidth: 180,
    valueFormatter: ({ value }) =>
      value ? formatDateTimeDDMMYYYY(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value ? formatDateTimeDDMMYYYY(value) : "--",
  },
  {
    headerName: "Enabled",
    field: "isEnabled",
    headerTooltip: "Job enabled status",
    minWidth: 120,
    disableSort: true,
    cellRenderer: ({ value }: { value: boolean }) => (value ? "Yes" : "No"),
    valueFormatter: ({ value }) => (value ? "Yes" : "No"),
    tooltipValueGetter: ({ value }) => (value ? "Yes" : "No"),
  },
  {
    headerName: "Description",
    field: "description",
    tooltipField: "description",
    headerTooltip: "Job description",
    minWidth: 320,
    disableSort: true,
    valueFormatter: ({ value }) => value ?? "--",
    hide: true,
  },
  {
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Available actions",
    cellRenderer: "ActionsCellRenderer",
    disableSort: true,
    tooltipValueGetter: () => "Edit Configuration",
  },
];

export const getSchedulerFormConfig = () => [
  {
    key: "scheduler",
    // title: "Scheduler",
    config: [
      {
        key: "schedulerName",
        name: "schedulerName",
        label: "Scheduler Name",
        gridColumn: 12,
        type: "text",
        rules: {
          required: { value: true, message: "Scheduler Name is required" },
        },
        componentProps: { fullWidth: true, disabled: true },
      },
      {
        key: "schedulerKey",
        name: "schedulerKey",
        label: "Scheduler Key",
        gridColumn: 12,
        type: "text",
        rules: {
          required: { value: true, message: "Scheduler Key is required" },
        },
        componentProps: { fullWidth: true, disabled: true },
      },
      {
        key: "isEnabled",
        name: "isEnabled",
        label: "Is Enabled",
        gridColumn: 12,
        type: "checkbox",
        componentProps: { color: "primary" },
      },
      {
        key: "scheduleUnit",
        name: "scheduleUnit",
        label: "Frequency",
        gridColumn: 12,
        type: "select",
        options: [
          { label: "Year", value: SCHEDULE_UNITS.YEAR },
          { label: "Month", value: SCHEDULE_UNITS.MONTH },
          { label: "Week", value: SCHEDULE_UNITS.WEEK },
          { label: "Day", value: SCHEDULE_UNITS.DAY },
          { label: "Hour", value: SCHEDULE_UNITS.HOUR },
          { label: "Minute", value: SCHEDULE_UNITS.MINUTE },
        ],
        rules: {
          required: { value: true, message: "Frequency is required" },
        },
        componentProps: { fullWidth: true },
      },
      {
        key: "intervalValue",
        name: "intervalValue",
        label: "Interval",
        gridColumn: 12,
        type: "number",
        showField: (watch) =>
          watch("scheduleUnit") === SCHEDULE_UNITS.HOUR ||
          watch("scheduleUnit") === SCHEDULE_UNITS.MINUTE,
        rules: {
          required: {
            value: true,
            message: "Interval is required",
          },
          min: { value: 1, message: "Interval must be at least 1" },
        },
        componentProps: { fullWidth: true, inputProps: { min: 1 } },
      },
      {
        key: "month",
        name: "month",
        label: "Month Selection",
        gridColumn: 12,
        type: "multiselect",
        options: [
          { label: "Every Month (*)", value: "*" },
          ...[
            { label: "January", value: "1" },
            { label: "February", value: "2" },
            { label: "March", value: "3" },
            { label: "April", value: "4" },
            { label: "May", value: "5" },
            { label: "June", value: "6" },
            { label: "July", value: "7" },
            { label: "August", value: "8" },
            { label: "September", value: "9" },
            { label: "October", value: "10" },
            { label: "November", value: "11" },
            { label: "December", value: "12" },
          ],
        ],
        showField: (watch) => watch("scheduleUnit") === SCHEDULE_UNITS.YEAR,
        componentProps: { fullWidth: true },
      },
      {
        key: "dayOfMonth",
        name: "dayOfMonth",
        label: "Day of Month",
        gridColumn: 12,
        type: "multiselect",
        options: [
          { label: "Every Day (*)", value: "*" },
          ...Array.from({ length: 31 }, (_, i) => ({
            label: (i + 1).toString(),
            value: (i + 1).toString(),
          })),
        ],
        showField: (watch) =>
          watch("scheduleUnit") === SCHEDULE_UNITS.YEAR ||
          watch("scheduleUnit") === SCHEDULE_UNITS.MONTH,
        componentProps: { fullWidth: true },
      },
      {
        key: "dayOfWeek",
        name: "dayOfWeek",
        label: "Days of Week",
        gridColumn: 12,
        type: "multiselect",
        options: [
          { label: "Every Day (*)", value: "*" },
          { label: "Sunday", value: "0" },
          { label: "Monday", value: "1" },
          { label: "Tuesday", value: "2" },
          { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" },
          { label: "Friday", value: "5" },
          { label: "Saturday", value: "6" },
        ],
        showField: (watch) =>
          [SCHEDULE_UNITS.WEEK, SCHEDULE_UNITS.MONTH, SCHEDULE_UNITS.YEAR].includes(
            watch("scheduleUnit")
          ),
        componentProps: { fullWidth: true },
      },
      {
        key: "hour",
        name: "hour",
        label: "Hour",
        gridColumn: 12,
        type: "select",
        options: Array.from({ length: 24 }, (_, i) => ({
          label: i.toString().padStart(2, "0"),
          value: i.toString().padStart(2, "0"),
        })),
        showField: (watch) =>
          [SCHEDULE_UNITS.YEAR, SCHEDULE_UNITS.MONTH, SCHEDULE_UNITS.WEEK, SCHEDULE_UNITS.DAY].includes(
            watch("scheduleUnit")
          ),
        componentProps: { fullWidth: true },
      },
      {
        key: "minute",
        name: "minute",
        label: "Minute",
        gridColumn: 12,
        type: "select",
        options: Array.from({ length: 60 }, (_, i) => ({
          label: i.toString().padStart(2, "0"),
          value: i.toString().padStart(2, "0"),
        })),
        showField: (watch) => watch("scheduleUnit") !== SCHEDULE_UNITS.MINUTE,
        componentProps: { fullWidth: true },
      },
    ],
    containerStyles: {
      gap: "16px",
      display: "flex",
      flexDirection: "column",
      padding: "8px 0",
    },
  },
];

export const parseCronExpressionToParts = (expression: string) => {
  const tokens = expression?.trim()?.split(" ") ?? [];
  const [minute = "0", hour = "0", dayOfMonth = "*", month = "*", dayOfWeek = "*"] =
    tokens;
  return { minute, hour, dayOfMonth, month, dayOfWeek };
};

// 🔐 Removes leading zeros only for numeric cron fields
export const normalizeCronNumber = (value: string): string => {
  // Keep wildcards, ranges, steps, lists untouched
  if (
    value === "*" ||
    value.includes("/") ||
    value.includes(",") ||
    value.includes("-")
  ) {
    return value;
  }

  const num = Number(value);
  return Number.isNaN(num) ? value : String(num);
};


export const buildCronExpressionFromParts = (parts: {
  minute?: string | string[];
  hour?: string | string[];
  dayOfMonth?: string | string[];
  month?: string | string[];
  dayOfWeek?: string | string[];
}) => {
  const normalize = (
    value: string | string[] | undefined,
    fallback: string
  ) => {
    if (!value) return fallback;

    if (Array.isArray(value)) {
      if (!value.length) return fallback;
      if (value.includes("*")) return "*";
      return value.map(normalizeCronNumber).join(",");
    }

    return normalizeCronNumber(value || fallback);
  };

  const minute = normalize(parts.minute, "0");
  const hour = normalize(parts.hour, "0");
  const dayOfMonth = normalize(parts.dayOfMonth, "*");
  const month = normalize(parts.month, "*");
  const dayOfWeek = normalize(parts.dayOfWeek, "*");

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
};


export const getSchedulerFormDefaults = (editableRowData?: any) => {
  const rawCron = editableRowData?.schedulerExpression || DEFAULT_CRON;
  const parsed = parseCronExpressionToParts(rawCron);

  const toArray = (value: string) =>
    value === "*"
      ? []
      : value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  const determineScheduleUnit = () => {
    const minutePart = parsed.minute || "";
    const hourPart = parsed.hour || "";
    const dayOfMonthPart = parsed.dayOfMonth || "*";
    const monthPart = parsed.month || "*";
    const dayOfWeekPart = parsed.dayOfWeek || "*";

    if (minutePart.startsWith("*/")) {
      return SCHEDULE_UNITS.MINUTE;
    }
    if (hourPart.startsWith("*/")) {
      return SCHEDULE_UNITS.HOUR;
    }
    if (
      hourPart === "*" &&
      dayOfMonthPart === "*" &&
      monthPart === "*" &&
      dayOfWeekPart === "*"
    ) {
      return SCHEDULE_UNITS.HOUR;
    }

    const hasMonth = monthPart !== "*" && monthPart.length > 0;
    const hasDayOfMonth = dayOfMonthPart !== "*" && dayOfMonthPart.length > 0;
    const hasDayOfWeek = dayOfWeekPart !== "*" && dayOfWeekPart.length > 0;

    if (hasDayOfWeek && !hasDayOfMonth) {
      return SCHEDULE_UNITS.WEEK;
    }
    if (hasMonth && hasDayOfMonth) {
      return SCHEDULE_UNITS.YEAR;
    }
    if (!hasMonth && hasDayOfMonth) {
      return SCHEDULE_UNITS.MONTH;
    }
    return SCHEDULE_UNITS.DAY;
  };

  const intervalValueFromPart = (value: string) => {
    if (!value || !value.startsWith("*/")) return 1;
    const parsedValue = Number(value.substring(2));
    return Number.isNaN(parsedValue) ? 1 : parsedValue;
  };

  return {
    schedulerName: editableRowData?.schedulerName ?? "",
    schedulerKey: editableRowData?.schedulerKey ?? "",
    isEnabled: editableRowData?.isEnabled ?? false,
    scheduleUnit: determineScheduleUnit(),
    intervalValue:
      parsed.minute.startsWith("*/") || parsed.hour.startsWith("*/")
        ? intervalValueFromPart(
            parsed.minute.startsWith("*/") ? parsed.minute : parsed.hour
          )
        : 1,
    minute: parsed.minute,
    hour: parsed.hour,
    dayOfMonth: toArray(parsed.dayOfMonth),
    month: toArray(parsed.month),
    dayOfWeek: toArray(parsed.dayOfWeek),
    cronExpression: rawCron,
  };
};