export enum CurrencyDisplayMode {
  // Auto-tiered: picks Cr / L / K (INDIAN) or T / B / M / K (INTERNATIONAL)
  // based on the magnitude of each value.
  INDIAN = "INDIAN",
  INTERNATIONAL = "INTERNATIONAL",
  // Fixed-unit: Indian grouping, but auto-tiering is off and every compacted
  // value is expressed in the one unit — so a column stays comparable row to row.
  LAKHS = "LAKHS",
  CRORES = "CRORES",
}

