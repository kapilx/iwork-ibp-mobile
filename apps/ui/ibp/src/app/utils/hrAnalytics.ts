import { formatAmountWithCurrency, getCurrencySymbolPrefix, type LocalizationConfig } from "@ui/ui-lib";

/**
 * Shared display utilities for all HR Analytics report integrations.
 * All functions are pure and safe to call with null / undefined — they
 * return a safe fallback rather than throwing.
 */

// ─── Currency formatting ──────────────────────────────────────────────────────

/**
 * Format an amount (in rupees) to an abbreviated Indian currency string.
 * Examples: 150000 → "₹1.50L",  95000 → "₹95,000",  0 → "₹0"
 */
export function formatINR(
  amount: number | null | undefined,
  localization?: LocalizationConfig
): string {
  if (amount == null || isNaN(amount)) return "—";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const symbol = getCurrencySymbolPrefix(localization);
  if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(2)}L`;
  return `${sign}${formatAmountWithCurrency(abs, localization)}`;
}

// ─── Percentage formatting ────────────────────────────────────────────────────

/**
 * Format a percentage value to a display string.
 * Returns "—" for null / undefined values (YoY suppression rule).
 */
export function formatPct(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null || isNaN(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

// ─── YoY helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true when the prior-year value is absent (null / undefined),
 * indicating the YoY badge must be suppressed entirely per PRD §4A.4.
 * Never show "0%" or "—" for suppressed badges — hide the badge element.
 */
export function isYoYSuppressed(prevYearValue: number | null | undefined): boolean {
  return prevYearValue == null;
}

/**
 * Returns the semantic colour for a YoY change badge.
 * - "green" = improvement, "red" = deterioration, null = badge hidden.
 * @param changePercent   The YoY % change value from the API.
 * @param decreaseIsGood  True for direction-inverted metrics: ICR, rejectionRate, avgSettlementTime.
 */
export function yoYBadgeColor(
  changePercent: number | null | undefined,
  decreaseIsGood = false
): "green" | "red" | null {
  if (changePercent == null) return null;
  const isIncrease = changePercent > 0;
  const isGood = decreaseIsGood ? !isIncrease : isIncrease;
  return isGood ? "green" : "red";
}

/**
 * Build a human-readable YoY delta string with directional arrow.
 * Examples:  -4.0 → "↓4.0%",  +26.0 → "↑26.0%",  null → null
 */
export function formatYoYDelta(
  changePercent: number | null | undefined,
  decimals = 1
): string | null {
  if (changePercent == null) return null;
  const arrow = changePercent <= 0 ? "↓" : "↑";
  return `${arrow}${Math.abs(changePercent).toFixed(decimals)}%`;
}

// ─── CD Balance helpers ───────────────────────────────────────────────────────

/**
 * Derive the safe limit for a CD account: 5% of the net premium.
 * This matches the tooltip shown on the CD balance bar.
 */
export function deriveSafeLimit(netPremium: number): number {
  return netPremium * 0.05;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a formatted date string returned by the policy_cards SQL
 * (TO_CHAR format "DD Mon YYYY", e.g. "01 Apr 2025") into an ISO date
 * string ("2025-04-01") suitable for passing back to other report APIs.
 * Returns "" on parse failure so callers can guard with !!value.
 */
export function parseDDMonYYYY(s: string | null | undefined): string {
  if (!s) return "";
  const MONTHS: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const parts = s.trim().split(" ");
  if (parts.length !== 3) return "";
  const [dd, mon, yyyy] = parts;
  const mm = MONTHS[mon];
  if (!mm) return "";
  return `${yyyy}-${mm}-${dd.padStart(2, "0")}`;
}

/**
 * Returns the default fiscal year date range (Apr 1 → Mar 31) for the
 * current year as ISO date strings. Used as the initial period value
 * while waiting for policy cards to load.
 */
export function currentFiscalYear(): { start: string; end: string } {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: `${fy}-04-01`,
    end: `${fy + 1}-03-31`,
  };
}
