// Field config for the period popover. Everything renders through the shared
// FormComponent field set (SelectField, SegmentedControl, MultiSelect,
// DateField) via DynamicForm, using the same option sources as the listing
// pages so the two can't drift apart.

import dayjs from "dayjs";
import { FormFieldConfig } from "../FormComponent/types";
import { getAllMonths, getMonthsForQuarter } from "../../constants";
import { QUARTERS, fyLabel } from "./financialYear";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
type SelectOption = { value: string | number; label: string };

export interface PeriodFormConfigArgs {
  fyOptions: number[];
  // Omitted on pages that don't show the org select in the popover.
  orgFilter?: {
    options: { id: number; name: string }[];
    disabled?: boolean;
  };
  periodModes: boolean;
  businessMode: boolean;
  fromDate?: string;
  businessRange?: { from: string; to: string } | null;
  // Page-supplied line under each date label naming the date column the page
  // filters on (e.g. "Applied on RO expiry"). Omitted = no line.
  dateNote?: string;
}

const FULL_WIDTH = { gridColumn: "span 2" };

const ALL_OPTION: SelectOption = { value: "", label: "All" };

const monthOptions = (): SelectOption[] =>
  getAllMonths()
    .filter((m) => m.month > 0)
    .map((m) => ({ value: m.value, label: m.label }));

const dependentValue = (first: unknown, second?: unknown): string => {
  const raw = second ?? first;
  if (raw && typeof raw === "object" && "value" in raw) {
    return String((raw as { value?: unknown }).value ?? "");
  }
  return raw == null ? "" : String(raw);
};

const isQuarter = (value: string): value is Quarter =>
  QUARTERS.includes(value);

export const buildPeriodFormConfig = ({
  fyOptions,
  orgFilter,
  periodModes,
  businessMode,
  fromDate,
  businessRange,
  dateNote,
}: PeriodFormConfigArgs): FormFieldConfig[] => {
  const dateSuffix = businessMode ? " (business)" : "";
  const clamp = businessRange
    ? { minDate: dayjs(businessRange.from), maxDate: dayjs(businessRange.to) }
    : {};
  // To can never precede From. In business mode the span's own start already
  // sits at or after it, so whichever is later wins.
  const toMin = fromDate
    ? dayjs(fromDate)
    : businessRange
      ? dayjs(businessRange.from)
      : undefined;

  const dateProps = {
    fullWidth: true,
    minWidth: "0px",
    popperDetails: { disablePortal: false },
  };

  const orgField: FormFieldConfig[] = orgFilter
    ? [
        {
          key: "organisationId",
          name: "organisationId",
          label: "Organisation",
          type: "select",
          gridItemSx: FULL_WIDTH,
          placeholder: "Select organisation",
          componentProps: { fullWidth: true, disabled: orgFilter.disabled },
          options: orgFilter.options.map((o) => ({
            value: o.id,
            label: o.name,
          })),
        },
      ]
    : [];

  const modeToggle: FormFieldConfig[] = periodModes
    ? [
        {
          key: "periodMode",
          name: "periodMode",
          label: "Filter by",
          type: "segmentedcontrol",
          gridItemSx: FULL_WIDTH,
          options: [
            { value: "incomeMonth", label: "Income Month" },
            { value: "businessMonth", label: "Business Month" },
          ],
          componentProps: { fullWidth: true, variantType: "primary" },
        },
      ]
    : [];

  const periodFields: FormFieldConfig[] = businessMode
    ? [
        {
          key: "businessMonth",
          name: "businessMonth",
          label: "Business month",
          type: "multiselect",
          gridItemSx: FULL_WIDTH,
          placeholder: "Select months",
          componentProps: { fullWidth: true },
          // Same source as the classic page's businessMonthField, so the list,
          // its calendar order and the "All" row all match.
          apiDependencies: { utilityFunction: getAllMonths },
        },
      ]
    : [
        {
          key: "quarter",
          name: "quarter",
          label: "Period",
          type: "select",
          componentProps: { fullWidth: true },
          apiDependencies: {
            clearFieldsOnChange: ["month"],
            // SelectField reads options from apiDependencies whenever the key
            // is present, so a static `options` array here would be ignored.
            utilityFunction: () => [
              ALL_OPTION,
              ...QUARTERS.map((q) => ({ value: q, label: q })),
            ],
          },
        },
        {
          key: "month",
          name: "month",
          label: "Month",
          type: "select",
          componentProps: { fullWidth: true },
          apiDependencies: {
            // Deliberately no clearFieldsOnChange: the month lives INSIDE the
            // quarter, so nulling the quarter here made "Q2 + August" render as
            // "All + August". The quarter still clears the month (a month from
            // the old quarter is meaningless), not the other way round.
            // Narrow the list to the picked quarter, as the classic page's
            // getMonthsForQuarterInSmarSearch does.
            utilityDependent: "quarter",
            utilityFunction: (first: unknown, second?: unknown) => {
              const quarter = dependentValue(first, second);
              return [
                ALL_OPTION,
                ...(isQuarter(quarter)
                  ? getMonthsForQuarter(quarter)
                  : monthOptions()),
              ];
            },
          },
        },
      ];

  const dateFields: FormFieldConfig[] = [
    {
      key: "from",
      name: "from",
      label: `From date${dateSuffix}`,
      type: "date",
      subLabel: dateNote,
      componentProps: {
        ...dateProps,
        placeholder: "Select from date",
        ...clamp,
      },
    },
    {
      key: "to",
      name: "to",
      label: `To date${dateSuffix}`,
      type: "date",
      subLabel: dateNote,
      componentProps: {
        ...dateProps,
        placeholder: "Select to date",
        ...clamp,
        ...(toMin ? { minDate: toMin } : {}),
      },
    },
  ];

  return [
    ...orgField,
    {
      key: "financialYear",
      name: "financialYear",
      label: "Financial Year",
      type: "select",
      gridItemSx: FULL_WIDTH,
      placeholder: "Select financial year",
      componentProps: { fullWidth: true },
      options: fyOptions.map((fy) => ({ value: fy, label: fyLabel(fy) })),
    },
    ...modeToggle,
    ...periodFields,
    ...dateFields,
  ];
};
