export const POLICY_EXPIRY_DRILLDOWN_FILTERS_TO_CLEAR = [
  "financialYear",
  "timeFilter",
  "quarter",
  "month",
  "period",
  "from",
  "to",
] as const;

export const OPEN_TAT_LABEL = "Open TAT";

export const POLICY_EXPIRY_BUCKET_LABELS = {
  NEXT_30_DAYS: "Next 30 Days",
  NEXT_60_DAYS: "Next 60 Days",
  NEXT_90_DAYS: "Next 90 Days",
  BEYOND_90_DAYS: "Beyond 90 Days",
} as const;

export const POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS = 365;
export const POLICY_EXPIRY_BEYOND_90_OFFSET_DAYS = 91;

export const POLICY_EXPIRY_BUCKET_DAY_RANGES: Record<
  string,
  { from: number; to: number | null }
> = {
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS]: { from: 0, to: 30 },
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS]: { from: 31, to: 60 },
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS]: { from: 61, to: 90 },
  [POLICY_EXPIRY_BUCKET_LABELS.BEYOND_90_DAYS]: {
    from: POLICY_EXPIRY_BEYOND_90_OFFSET_DAYS,
    to: null,
  },
};

// The SBU renewal/sales tables label their columns "30 Days"/"60 Days"/… while
// the day-range map above is keyed by the "Next N Days" labels. Bridge the two
// so a bucket click resolves its expiry window instead of falling through to the
// empty default (which made the drilldown query the whole future pipeline).
export const SBU_EXPIRY_BUCKET_TO_RANGE_KEY: Record<string, string> = {
  "30 Days": POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS,
  "60 Days": POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS,
  "90 Days": POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS,
  "Beyond 90 Days": POLICY_EXPIRY_BUCKET_LABELS.BEYOND_90_DAYS,
};

export const POLICY_EXPIRY_BUCKET_DAY_MAP: Record<string, number | null> = {
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS]:
    POLICY_EXPIRY_BUCKET_DAY_RANGES[POLICY_EXPIRY_BUCKET_LABELS.NEXT_30_DAYS]
      .to,
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS]:
    POLICY_EXPIRY_BUCKET_DAY_RANGES[POLICY_EXPIRY_BUCKET_LABELS.NEXT_60_DAYS]
      .to,
  [POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS]:
    POLICY_EXPIRY_BUCKET_DAY_RANGES[POLICY_EXPIRY_BUCKET_LABELS.NEXT_90_DAYS]
      .to,
  [POLICY_EXPIRY_BUCKET_LABELS.BEYOND_90_DAYS]: null,
};
