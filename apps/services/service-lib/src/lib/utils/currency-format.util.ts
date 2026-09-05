// Shared number/currency formatting for backend-generated content (notification
// emails, SMS, PDFs) that needs to respect a company's country — mirrors
// apps/ui/ui-lib/src/lib/utils/index.tsx's frontend formatters exactly (same
// locale-detection and symbol-fallback rules) so a value formatted here and one
// formatted in the UI never disagree. Node's Intl.NumberFormat has full ICU
// data built in, so this works identically to the browser implementation.

export interface CountryFormatConfig {
  currencyFormat?: string | null;
  numberFormat?: string | null;
  taxLabel?: string | null;
}

const NUMBER_FORMAT_PATTERNS = {
  indian: "#,##,###.##",
  international: "#,###,###.##",
} as const;

export function resolveLocale(numberFormat?: string | null): string {
  if (!numberFormat) return "en-IN";
  const format = numberFormat.toLowerCase();

  if (
    format === NUMBER_FORMAT_PATTERNS.international.toLowerCase() ||
    format.includes("international") ||
    format.includes("us")
  ) {
    return "en-US";
  }
  if (
    format === NUMBER_FORMAT_PATTERNS.indian.toLowerCase() ||
    format.includes("indian") ||
    format.includes("in")
  ) {
    return "en-IN";
  }

  const cleaned = format.replace(/[^#,]/g, "");
  if (cleaned.startsWith("#,##") || cleaned.includes(",##,")) {
    return "en-IN";
  }
  if (cleaned.startsWith("#,###") || cleaned.includes(",###")) {
    return "en-US";
  }

  return "en-IN";
}

// Returns the country's currency symbol (e.g. "Rs" for Sri Lanka, "₹" for
// India) with a trailing space when it's a word-based abbreviation rather
// than a single glyph symbol. Falls back to "₹" if config is missing.
export function getCurrencySymbolPrefix(config?: CountryFormatConfig | null): string {
  const symbol = config?.currencyFormat || "₹";
  return /[a-zA-Z]/.test(symbol) ? `${symbol} ` : symbol;
}

export function formatNumberByLocalization(
  value?: number | string | null,
  config?: CountryFormatConfig | null,
  maxFractionDigits = 0,
): string {
  if (value == null) return "--";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "--";

  const locale = resolveLocale(config?.numberFormat);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(numeric);
}

// Returns the country's tax label (e.g. "VAT" for Sri Lanka) instead of a
// hardcoded "GST" — use this anywhere a tax breakdown line is rendered into a
// template/notification. Falls back to "GST" if config/taxLabel is missing —
// mirrors apps/ui/ui-lib/src/lib/utils/index.tsx's getTaxLabel exactly.
export function getTaxLabel(config?: CountryFormatConfig | null): string {
  return config?.taxLabel || "GST";
}

// Prefixes the country's actual currency symbol instead of a hardcoded "₹" —
// use this anywhere a currency amount is rendered into a template/notification.
export function formatAmountWithCurrency(
  value?: number | string | null,
  config?: CountryFormatConfig | null,
  maxFractionDigits = 0,
): string {
  if (value == null) return "--";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "--";

  return `${getCurrencySymbolPrefix(config)}${formatNumberByLocalization(numeric, config, maxFractionDigits)}`;
}
