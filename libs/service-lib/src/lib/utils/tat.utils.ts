export const ENDORSEMENT_TAT_FILTER_LABELS = [
  "< 3 Days",
  "< 7 Days",
  "< 14 Days",
  "> 14 Days",
] as const;

export type EndorsementTatFilterLabel =
  (typeof ENDORSEMENT_TAT_FILTER_LABELS)[number];

export const ENDORSEMENT_TAT_BUCKETS: Record<
  EndorsementTatFilterLabel,
  { min: number; max?: number }
> = {
  "< 3 Days": { min: 0, max: 2 },
  "< 7 Days": { min: 3, max: 6 },
  "< 14 Days": { min: 7, max: 13 },
  "> 14 Days": { min: 14 },
};

const canonicalise = (value: string): string =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const collapseWhitespace = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, "");

const LEGACY_TAT_LABEL_MAP: Record<string, EndorsementTatFilterLabel> = {
  "0-7": "< 7 Days",
  "07": "< 7 Days",
  "0to7": "< 7 Days",
  "7-15": "< 14 Days",
  "7to15": "< 14 Days",
  "15+": "> 14 Days",
  "15plus": "> 14 Days",
  // old 6-bucket labels mapped to nearest new bucket
  "< 10 days": "< 14 Days",
  "< 21 days": "< 14 Days",
  "< 30 days": "> 14 Days",
  "< 45 days": "> 14 Days",
  "> 45 days": "> 14 Days",
};

const tatLabelLookup = new Map<string, EndorsementTatFilterLabel>();

ENDORSEMENT_TAT_FILTER_LABELS.forEach((label) => {
  tatLabelLookup.set(canonicalise(label), label);
  tatLabelLookup.set(collapseWhitespace(label), label);
});

Object.entries(LEGACY_TAT_LABEL_MAP).forEach(([legacy, label]) => {
  tatLabelLookup.set(canonicalise(legacy), label);
  tatLabelLookup.set(collapseWhitespace(legacy), label);
});

export function normalizeEndorsementTatFilter(
  value?: string
): EndorsementTatFilterLabel | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const raw = String(value);
  const stripped = raw.replace(/["'\[\]]/g, "");
  const canonical = canonicalise(stripped);
  if (!canonical) {
    return undefined;
  }

  const direct = tatLabelLookup.get(canonical);
  if (direct) {
    return direct;
  }

  const collapsed = collapseWhitespace(stripped);
  return tatLabelLookup.get(collapsed);
}
