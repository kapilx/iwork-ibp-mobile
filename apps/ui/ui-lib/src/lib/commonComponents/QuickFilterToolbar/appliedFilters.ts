import { AppliedFilterGroup } from "./types";

export interface AppliedFilterFieldConfig {
  name: string;
  label: string;
}

const isEmptyValue = (value: any): boolean =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);


const chipLabelForValue = (value: any): string =>
  value && typeof value === "object" && "label" in value
    ? String(value.label)
    : String(value);

export const buildAppliedFilterGroups = (
  fields: AppliedFilterFieldConfig[],
  values: Record<string, any> | undefined,
  onRemove: (fieldName: string, itemValue?: any) => void
): AppliedFilterGroup[] => {
  const groups: AppliedFilterGroup[] = [];

  fields.forEach(({ name, label }) => {
    const raw = values?.[name];
    if (isEmptyValue(raw)) return;

    const chips = Array.isArray(raw)
      ? raw
          .filter((item) => !isEmptyValue(item))
          .map((item) => ({
            id: `${name}:${chipLabelForValue(item)}`,
            label: chipLabelForValue(item),
            onRemove: () => onRemove(name, item),
          }))
      : [
          {
            id: name,
            label: chipLabelForValue(raw),
            onRemove: () => onRemove(name),
          },
        ];

    if (chips.length) groups.push({ key: name, label, chips });
  });

  return groups;
};

// Flatten applied-filter groups into simple { filter, value } rows — one row per
// group, its chip labels joined. Used to build the export's "Applied Filters"
// payload so the sheet matches the on-screen chips exactly.
export const flattenAppliedFilterGroups = (
  groups: AppliedFilterGroup[]
): { filter: string; value: string }[] =>
  groups
    .map((g) => ({
      filter: g.label,
      value: g.chips
        .map((c) => c.label)
        .filter(Boolean)
        .join(", "),
    }))
    .filter((r) => r.value.trim() !== "");
