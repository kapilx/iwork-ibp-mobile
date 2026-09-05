import dayjs, { Dayjs } from "dayjs";
import { DATE_FORMATS } from "../constants";

export const formatDate = (
  date: string | null | undefined,
  format: string = DATE_FORMATS.DATE_MONTH_YEAR
) => {
  if (date === "" || date?.length === 0 || date === null || date === undefined)
    return null;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format(format) : null;
};

export const isValidDate = (val: any): boolean => {
  const date = new Date(val);
  return (
    val &&
    typeof val === "string" &&
    !isNaN(date.getTime()) &&
    /^\d{4}-\d{2}-\d{2}/.test(val)
  );
};

export const formatMonth = (value: string): string => {
  if (!value) return "--";
  // Expecting value in "YYYY-MM" format
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return `${year}-${date.toLocaleString("en-US", { month: "short" })}`;
};

export const formatDateToLocal = (dateStr: string) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format(DATE_FORMATS.DATE_MONTH_YEAR);
};

export const generateTimeOptions = (
  interval = 15,
  minTime: Dayjs | null = null,
  includeStartTime = false,
  cutoffTime: { hour: number; minute: number } = { hour: 23, minute: 30 }
): string[] => {
  const times: string[] = [];

  let time = minTime ?? dayjs().startOf("day");
  const roundedMinutes = time.minute() % interval;
  if (roundedMinutes !== 0) {
    const minutesToAdd = interval - roundedMinutes;
    time = time.add(minutesToAdd, "minute").second(0).millisecond(0);
  } else {
    time = time.second(0).millisecond(0);
  }

  const cutoff = dayjs()
    .hour(cutoffTime.hour)
    .minute(cutoffTime.minute)
    .second(0)
    .millisecond(0);
  if (includeStartTime && minTime) {
    times.push(minTime.format("hh:mm A"));
  }

  while (time.isBefore(cutoff) || time.isSame(cutoff, "minute")) {
    if (!(includeStartTime && minTime && time.isSame(minTime, "minute"))) {
      times.push(time.format("hh:mm A"));
    }
    time = time.add(interval, "minute");
  }

  return times;
};

export const getRoundedTime = (roundToMins: number = 15) => {
  const now = dayjs();
  const remainder = roundToMins - (now.minute() % roundToMins);
  return now.add(remainder, "minute").second(0).millisecond(0);
};

export const formatTimeToUtcOffset = (timeString: string): string => {
  if (!timeString?.trim()) {
    throw new Error("Time is required.");
  }
  return dayjs(timeString, ["HH:mm:ss", "HH:mm"]).format("HH:mm");
};

export const formatHumanDuration = (
  startTimeForLabel: Dayjs,
  target: Dayjs
): string => {
  if (!startTimeForLabel) return "";

  const diffInMinutes = target.diff(startTimeForLabel, "minute");
  if (diffInMinutes === 0) return "(0 min)";
  const absoluteDiff =
    diffInMinutes < 0 ? 24 * 60 + diffInMinutes : diffInMinutes;
  if (absoluteDiff < 60) return `(${absoluteDiff} min)`;
  const hours = Math.floor(absoluteDiff / 60);
  const minutes = absoluteDiff % 60;
  if (minutes === 0) return `(${hours} hr)`;
  if (minutes === 15) return `(${hours}.25 hr)`;
  if (minutes === 30) return `(${hours}.5 hr)`;
  if (minutes === 45) return `(${hours}.75 hr)`;
  return `(${(absoluteDiff / 60).toFixed(2).replace(/\.00$/, "")} hr)`;
};

export const parseBackendTime = (value?: string) => {
  if (!value) return null;
  const d = dayjs(value, ["HH:mm:ssZ", "HH:mm:ss", "HH:mm"], true);
  if (d.isValid()) {
    return d.format("HH:mm");
  }
  return value;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "--";
  const date = dayjs(dateStr);
  return date.format("DD/MM/YYYY  hh:mm:ss A");
};
export const formatIsoToHumanReadableDateRange = (dateRange: string) => {
  if (!dateRange || typeof dateRange !== "string") return "N/A";

  try {
    // Split the date range by " - "
    const [startDateStr, endDateStr] = dateRange.split(" - ");

    if (!startDateStr || !endDateStr) return dateRange; // Return original if can't split

    const formatSingleDate = (dateStr: string) => {
      return dayjs(dateStr).format(DATE_FORMATS.DATE_MONTH_YEAR);
    };

    const formattedStartDate = formatSingleDate(startDateStr);
    const formattedEndDate = formatSingleDate(endDateStr);

    return `${formattedStartDate} - ${formattedEndDate}`;
  } catch (error) {
    console.error("Error formatting policy period:", error);
    return dateRange; // Return original string if formatting fails
  }
};

export const formatDateTimeDDMMYYYY = (value: string | number | Date) => {
  const date = new Date(value);

  if (isNaN(date.getTime())) return "--";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0"); // ✅ 24-hour
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatDateRange = (
  value: string | null,
  startFormat: string = DATE_FORMATS.DATE_MONTH_YEAR,
  endFormat: string = DATE_FORMATS.DATE_MONTH_YEAR
): string | null => {
  if (!value || value.trim().length === 0) return null;

  const [start, end] = value.split(" - ");

  const startFormatted = dayjs(start).format(startFormat);
  const endFormatted = dayjs(end).format(endFormat);

  return `${startFormatted} - ${endFormatted}`;
};

export const formatDisplayDate = (dateString: string | null | undefined) => {
  return dateString ? dayjs(dateString).format("DD/MM/YYYY") : "--";
};

export const formatMeetingTimeRange = (startTime?: string, endTime?: string): string => {
  if (!startTime) return "--";
  const start = dayjs(startTime, ["HH:mm:ssZ", "HH:mm:ss", "HH:mm"]).format("HH:mm");
  if (endTime) {
    const end = dayjs(endTime, ["HH:mm:ssZ", "HH:mm:ss", "HH:mm"]).format("HH:mm");
    return `${start} - ${end}`;
  }
  return start;
};


/**
 * Number of payroll cycles a premium is deducted across: the inclusive count of
 * calendar months spanned by the employee's effective date and the policy end
 * date.
 *
 * `policyTo` (surfaced to the UI as `dueDate`) is the inclusive last day of
 * cover, so 01-Jan-2026 -> 31-Dec-2026 is 12 deductions, not 11. A mid-year
 * joiner effective 15-Jun-2026 on a policy ending 31-Mar-2027 gets 10.
 *
 * Returns 1 when either date is missing or unparseable — callers gate the
 * payment-schedule display on `> 1`, so an unknown span shows nothing rather
 * than a fabricated count.
 *
 * `configuredInstallments` is the policy configuration's
 * `constraints.payrollInstallments`. It acts as a ceiling, never a floor: the
 * company can deduct across fewer cycles than the period allows, but it can
 * never stretch deductions past the end of cover. So the displayed count is
 * min(date span, configured) — a 3-month span with 6 configured shows 3, and
 * the same span with 2 configured shows 2. An absent or non-positive
 * configured value means "no cap" and the date span stands.
 */
export const getPayrollInstallments = (
  effectiveDate?: string | Date | null,
  policyEndDate?: string | Date | null,
  configuredInstallments?: number | string | null
): number => {
  if (!effectiveDate || !policyEndDate) return 1;
  const start = dayjs(effectiveDate);
  const end = dayjs(policyEndDate);
  if (!start.isValid() || !end.isValid()) return 1;
  const months =
    (end.year() - start.year()) * 12 + (end.month() - start.month()) + 1;
  const derived = months > 0 ? months : 1;

  const configured = Number(configuredInstallments);
  if (!Number.isFinite(configured) || configured <= 0) return derived;

  return Math.min(derived, Math.floor(configured));
};
