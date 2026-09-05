import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import AnchoredPanel from "../AnchoredPanel";
import Button from "../Button";
import DynamicForm from "../FormComponent";
import { getAllMonths } from "../../constants";
import {
  TimelineButton,
  CalendarIcon,
  PopoverBody,
  PopoverFooter,
  ResetLink,
  PeriodFormWrap,
} from "./styles";
import {
  defaultTimeline,
  summarizeTimeline,
  timelineToRange,
  financialYearOptions,
  businessMonthRange,
  isBusinessMonthMode,
} from "./financialYear";
import { buildPeriodFormConfig } from "./periodFormConfig";
import { TimelineValue } from "./types";

// Organisation filter shown above the period fields. The org is picked HERE
// (not via the accordion, which stays locked) — disabled for everyone except
// leadership/superusers, whose pages pass disabled: false.
export interface PopoverOrgFilter {
  options: { id: number; name: string }[];
  selectedId?: number;
  disabled?: boolean;
}

interface PeriodPopoverProps {
  value: TimelineValue;
  // orgId rides with Apply only when an org filter is configured AND the
  // draft differs from the current selection; undefined = org untouched.
  onApply: (next: TimelineValue, orgId?: number) => void;
  orgFilter?: PopoverOrgFilter;
  // Biz Done Enhanced only: adds the Income Month / Business Month toggle and,
  // in business mode, swaps Period + Month for a business-month multiselect.
  // Every other Enhanced page leaves this off and renders exactly as before.
  periodModes?: boolean;
  // Caption rendered under the From/To pair naming the date column this page
  // actually filters on. Omitted = nothing rendered.
  dateNote?: string;
}

// Field names match the classic Biz Done / smart-search filters so the config
// can reuse their field definitions verbatim.
interface PeriodFormValues {
  organisationId: number | "";
  financialYear: number | "";
  quarter: string;
  month: string;
  periodMode: TimelineValue["periodMode"];
  businessMonth: string[];
  from: string;
  to: string;
}

type FormWrite = [keyof PeriodFormValues, unknown];
type PeriodForm = UseFormReturn<Record<string, unknown>>;

// ALL_VALUE itself lives in the iwork app, which ui-lib cannot import — take
// the sentinel straight off the option list so the two can never disagree.
const ALL_MONTH_SENTINEL =
  getAllMonths().find((m) => m.month === 0)?.value ?? "ALL";
const ALL_MONTH_VALUES = getAllMonths()
  .filter((m) => m.month > 0)
  .map((m) => m.value);

const isAll = (value: unknown) =>
  String(value).toUpperCase() === ALL_MONTH_SENTINEL;

const stripAll = (months: unknown): string[] =>
  Array.isArray(months) ? months.filter((m) => !isAll(m)).map(String) : [];

const currentFy = () => defaultTimeline(new Date()).financialYear;

// A month selection needs a calendar year to anchor to, so an empty FY resolves
// to the current one — the same thing SmartSearch's period watcher does.
const resolveFy = (financialYear: PeriodFormValues["financialYear"]) =>
  Number(financialYear) || currentFy();

// "All" is a control row, not a month: ticking it selects every month, unticking
// clears them, and unticking any single month drops it again.
const resolveAllRow = (current: string[], hadAll: boolean): string[] => {
  const hasAll = current.some(isAll);
  if (hasAll && !hadAll) return [ALL_MONTH_SENTINEL, ...ALL_MONTH_VALUES];
  if (!hasAll && hadAll) return [];
  if (hasAll && hadAll) {
    const real = stripAll(current);
    if (ALL_MONTH_VALUES.some((m) => !real.includes(m))) return real;
  }
  return current;
};

// The span a period selection stands for, ignoring any dates already on the
// timeline: month, else quarter, else the whole FY (Period All + Month All).
// Business mode has no FY-wide fallback — with no months ticked there is no
// span to show, exactly as before.
const impliedRange = (t: TimelineValue): { from: string; to: string } => {
  const range = isBusinessMonthMode(t)
    ? businessMonthRange(t.financialYear, t.businessMonths)
    : timelineToRange({ ...t, fromDate: "", toDate: "" });
  return { from: range?.from ?? "", to: range?.to ?? "" };
};

// Dates a timeline implies but doesn't carry. The seeded default holds no
// dates, so without this the popover opened showing a period over two empty
// pickers — the same selection, once applied by hand, fills them.
const seedRange = (t: TimelineValue): { from: string; to: string } =>
  t.fromDate || t.toDate
    ? { from: t.fromDate ?? "", to: t.toDate ?? "" }
    : impliedRange(t);

const toFormValues = (
  timeline: TimelineValue,
  orgId?: number
): PeriodFormValues => {
  const range = seedRange(timeline);
  return {
    organisationId: orgId ?? "",
    financialYear: timeline.financialYear || "",
    quarter: timeline.quarter ?? "",
    month: timeline.month ?? "",
    periodMode: timeline.periodMode ?? "incomeMonth",
    businessMonth: timeline.businessMonths ?? [],
    from: range.from,
    to: range.to,
  };
};

// FY / period selector. Prefilled from the current date via defaultTimeline;
// resolves to a date range in financialYear.ts. Fields render through
// DynamicForm so they are the same components the listing pages use.
const PeriodPopover: React.FC<PeriodPopoverProps> = ({
  value,
  onApply,
  orgFilter,
  periodModes = false,
  dateNote,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [form, setForm] = useState<PeriodForm | null>(null);
  // Mirrored from the form so the config — and therefore which fields exist
  // and how the date pickers are clamped — reacts to the values. The form
  // stays the source of truth for the values themselves.
  const [businessMode, setBusinessMode] = useState(
    value.periodMode === "businessMonth"
  );
  const [fromDate, setFromDate] = useState(seedRange(value).from);
  const [months, setMonths] = useState<string[]>(value.businessMonths ?? []);
  const [financialYear, setFinancialYear] = useState(value.financialYear);
  const open = Boolean(anchorEl);
  const fyOptions = useMemo(() => financialYearOptions(new Date()), []);

  const prevHadAll = useRef(false);
  const suppressMonthPrefill = useRef(false);
  // Writes below are the interlocks' own output; the watcher must ignore them
  // or a prefill re-enters the rule that triggered it.
  const programmatic = useRef(false);

  // The panel unmounts when closed, so DynamicForm remounts on every open with
  // these as its defaults — no reset plumbing needed.
  const defaultValues = useMemo(
    () => toFormValues(value, orgFilter?.selectedId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, value, orgFilter?.selectedId]
  );

  const formConfig = useMemo(
    () =>
      buildPeriodFormConfig({
        fyOptions,
        orgFilter: orgFilter
          ? { options: orgFilter.options, disabled: orgFilter.disabled }
          : undefined,
        periodModes,
        businessMode: periodModes && businessMode,
        fromDate,
        dateNote,
        businessRange:
          periodModes && businessMode
            ? businessMonthRange(resolveFy(financialYear), months)
            : null,
      }),
    [
      fyOptions,
      orgFilter,
      periodModes,
      businessMode,
      fromDate,
      months,
      financialYear,
      dateNote,
    ]
  );

  // react-hook-form drops a setValue issued synchronously inside a watch
  // callback — the subscription is already mid-notify. SmartSearch's own period
  // watcher defers with setTimeout(0) for the same reason.
  const setLater = (target: PeriodForm, updates: FormWrite[]) => {
    if (!updates.length) return;
    setTimeout(() => {
      programmatic.current = true;
      updates.forEach(([field, next]) => target.setValue(field, next));
      programmatic.current = false;
    }, 0);
  };

  // Interlocks the field config can't express. Every handler reads only the
  // watch payload and refs — never component state — so the subscription can
  // safely outlive a render without going stale.
  useEffect(() => {
    if (!form) return;

    const writeRange = (
      values: PeriodFormValues,
      range: { from?: string; to?: string } | null
    ) => {
      const fy = resolveFy(values.financialYear);
      setLater(form, [
        ...(values.financialYear
          ? []
          : ([["financialYear", fy]] as FormWrite[])),
        ["from", range?.from ?? ""],
        ["to", range?.to ?? ""],
      ]);
      setFromDate(range?.from ?? "");
    };

    const onPeriodMode = (values: PeriodFormValues) => {
      setBusinessMode(values.periodMode === "businessMonth");
      // Wipe the other mode's fields so a stale quarter can never ride into a
      // business-month query, or vice versa.
      setLater(form, [
        ["quarter", ""],
        ["month", ""],
        ["businessMonth", []],
        ["from", ""],
        ["to", ""],
      ]);
      setFromDate("");
      setMonths([]);
      prevHadAll.current = false;
    };

    // Explicit dates win, so the period selection they replace is cleared here
    // rather than by the field's own clearFieldsOnChange — DateField runs that
    // inside its onChange, where clearing `month` would re-enter the empty-month
    // branch below and wipe the date just picked. FY is left alone: unlike the
    // listing pages it is mandatory here, and timelineToRange ignores it once
    // explicit dates are set.
    const onDateEdit = (values: PeriodFormValues, name: string) => {
      setFromDate(String(values.from ?? ""));
      const writes: FormWrite[] = [];
      if (values.quarter) writes.push(["quarter", ""]);
      if (values.month) writes.push(["month", ""]);
      // A new From can post-date the existing To, whose minDate derives from
      // From — leaving it would show a value its own calendar disallows.
      if (name === "from" && values.to) writes.push(["to", ""]);
      if (values.businessMonth?.length) {
        suppressMonthPrefill.current = true;
        writes.push(["businessMonth", []]);
      }
      setLater(form, writes);
    };

    // A period selection owns From/To: the narrowest one wins (month inside
    // quarter), and "All" on both falls back to the whole FY.
    const periodRange = (values: PeriodFormValues, ignoreMonth = false) => {
      const month = ignoreMonth ? "" : String(values.month ?? "");
      return impliedRange({
        financialYear: resolveFy(values.financialYear),
        quarter: month ? "" : String(values.quarter ?? ""),
        month,
        fromDate: "",
        toDate: "",
      });
    };

    // Picking a quarter clears the month (config clearFieldsOnChange), but that
    // write lands after this one — so the range is derived from the quarter
    // alone rather than the month about to be discarded.
    const onQuarter = (values: PeriodFormValues) => {
      writeRange(values, periodRange(values, true));
    };

    const onMonthOrFy = (values: PeriodFormValues, name: string) => {
      // Business mode anchors its months to the FY too, so an FY change has to
      // recompute that span rather than fall through to the month logic.
      if (values.periodMode === "businessMonth") {
        if (name === "financialYear") onBusinessMonth(values);
        return;
      }
      // Clearing the month back to "All" hands From/To back to the quarter, if
      // one is still selected.
      writeRange(values, periodRange(values));
    };

    // Business months prefill From/To with their span, the same way a single
    // month does in income mode — the query sends only from/to, so the dates
    // have to be the visible truth rather than something derived later.
    const onBusinessMonth = (values: PeriodFormValues) => {
      // Cleared by a date edit: accept it without re-deriving dates from the
      // now-empty list.
      if (suppressMonthPrefill.current) {
        suppressMonthPrefill.current = false;
        prevHadAll.current = false;
        setMonths([]);
        return;
      }
      const current = Array.isArray(values.businessMonth)
        ? values.businessMonth
        : [];
      // Resolved in one pass: the programmatic guard means a rewrite of this
      // field won't re-enter to settle it across passes.
      const resolved = resolveAllRow(current, prevHadAll.current);
      const real = stripAll(resolved);
      prevHadAll.current = resolved.some(isAll);
      setMonths(real);

      const fy = resolveFy(values.financialYear);
      const range = real.length ? businessMonthRange(fy, real) : null;
      setLater(form, [
        ...(resolved === current
          ? []
          : ([["businessMonth", resolved]] as FormWrite[])),
        ...(values.financialYear ? [] : ([["financialYear", fy]] as FormWrite[])),
        ["from", range?.from ?? ""],
        ["to", range?.to ?? ""],
      ]);
      setFromDate(range?.from ?? "");
    };

    const sub = form.watch((raw, { name }) => {
      const values = raw as unknown as PeriodFormValues;
      // Mirrored ahead of the guard: the FY backfill below is a programmatic
      // write, and the business-month clamp still has to see it.
      setFinancialYear(resolveFy(values.financialYear));
      if (programmatic.current || !name) return;
      switch (name) {
        case "periodMode":
          return onPeriodMode(values);
        case "from":
        case "to":
          return onDateEdit(values, name);
        case "quarter":
          return onQuarter(values);
        case "month":
        case "financialYear":
          return onMonthOrFy(values, name);
        case "businessMonth":
          return onBusinessMonth(values);
        default:
          return;
      }
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Toggle rather than open: AnchoredPanel deliberately ignores clicks on its
  // own anchor, so the button owns the close-on-second-click.
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (anchorEl) {
      setAnchorEl(null);
      return;
    }
    setBusinessMode(value.periodMode === "businessMonth");
    setFromDate(seedRange(value).from);
    setMonths(value.businessMonths ?? []);
    setFinancialYear(value.financialYear);
    prevHadAll.current = false;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleApply = () => {
    const values = (form?.getValues() ?? defaultValues) as PeriodFormValues;
    const next: TimelineValue = {
      // Mandatory downstream — timelineToRange resolves against it — so an
      // empty one falls back to the current FY.
      financialYear: resolveFy(values.financialYear),
      quarter: String(values.quarter ?? ""),
      month: String(values.month ?? ""),
      fromDate: String(values.from ?? ""),
      toDate: String(values.to ?? ""),
      ...(periodModes
        ? {
            periodMode:
              values.periodMode === "businessMonth"
                ? ("businessMonth" as const)
                : ("incomeMonth" as const),
            // Only real months are stored, so businessMonthRange never sees
            // the "All" sentinel.
            businessMonths: stripAll(values.businessMonth),
          }
        : {}),
    };
    // Dates that still match what the period implies are a PREVIEW, not a
    // custom range: drop them so the applied timeline is exactly the one this
    // selection produced before the pickers were seeded. It matters for the
    // whole-FY case, where timelineToRange sends `financialYear` alongside the
    // range only while the timeline carries no explicit dates.
    const implied = impliedRange({ ...next, fromDate: "", toDate: "" });
    if (next.fromDate === implied.from && next.toDate === implied.to) {
      next.fromDate = "";
      next.toDate = "";
    }
    const orgDraft = values.organisationId;
    const orgChanged =
      Boolean(orgFilter) &&
      orgDraft !== "" &&
      orgDraft != null &&
      Number(orgDraft) !== orgFilter?.selectedId;
    onApply(next, orgChanged ? Number(orgDraft) : undefined);
    handleClose();
  };

  // Clear resets the period only — the org is a mandatory scope, so it snaps
  // back to the currently-applied org rather than emptying.
  const handleClear = () => {
    const cleared = defaultTimeline(new Date());
    setBusinessMode(false);
    setFromDate("");
    setMonths([]);
    setFinancialYear(cleared.financialYear);
    prevHadAll.current = false;
    form?.reset({ ...toFormValues(cleared, orgFilter?.selectedId) });
  };

  return (
    <>
      <TimelineButton onClick={handleOpen} data-testid="period-button">
        <CalendarIcon />
        {summarizeTimeline(value)}
      </TimelineButton>

      <AnchoredPanel
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        placement="bottom-end"
      >
        <PopoverBody>
          <PeriodFormWrap>
            <DynamicForm
              formConfig={formConfig}
              defaultValues={defaultValues}
              formMethods={setForm}
              renderOnlyFields
            />
          </PeriodFormWrap>

          <PopoverFooter>
            <ResetLink onClick={handleClear} data-testid="period-clear">
              Clear
            </ResetLink>
            <Button
              variantType="primary"
              sizeType="small"
              label="Apply"
              onClick={handleApply}
              data-testid="period-apply"
            />
          </PopoverFooter>
        </PopoverBody>
      </AnchoredPanel>
    </>
  );
};

export default PeriodPopover;
