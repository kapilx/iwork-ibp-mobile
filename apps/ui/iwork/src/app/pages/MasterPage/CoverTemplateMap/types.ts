/**
 * A cover row shown in the Step-2 mapped-covers panel. `id` is present only for
 * mappings already persisted in mstr_cover_template.
 */
export interface MappedCover {
  id?: number;
  refCoverId: number;
  coverName: string;
  mandatory: string;
  // Activity_key after which this cover is hidden (inclusive). "" / null = no cutoff.
  visibleUntilActivityKey?: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
}
