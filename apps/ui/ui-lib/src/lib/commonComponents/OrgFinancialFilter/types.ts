// Generic types for the Org + Financial-period drilldown filter. A consuming
// page supplies an OrgFinancialFilterConfig describing its own hierarchy
// levels, aggregate endpoint, and KPI metrics — nothing here is domain-specific.

import React from "react";

// A selected node id per level key. Missing key = "All" (not yet drilled). A
// level with multiSelect holds a list of ids instead of a single one.
export type ScopeSelection = Record<string, number | number[] | undefined>;

// Selection value -> id list, so single and multi levels read the same way.
export const selectedIds = (
  value: number | number[] | undefined
): number[] =>
  value === undefined || value === null
    ? []
    : Array.isArray(value)
    ? value
    : [value];

// First picked id — for single-select levels, and for master URLs that key off
// an ancestor which is single-select by construction (Organisation, SBU).
export const firstSelectedId = (
  value: number | number[] | undefined
): number | undefined => selectedIds(value)[0];

// "Has anything been picked at this level?" — [] is truthy, so callers must
// never test the raw value.
export const hasSelection = (
  value: number | number[] | undefined
): boolean => selectedIds(value).length > 0;

// Selected node(s) for a level -> list, so single and multi read the same way.
export const nodeList = <T,>(picked: T | T[] | undefined): T[] =>
  picked === undefined || picked === null
    ? []
    : Array.isArray(picked)
    ? picked
    : [picked];

// One selectable card's data: identity + whatever metrics the config defines.
export interface ScopeNode {
  id: number;
  name: string;
  metrics: Record<string, number>;
}

// Report period. financialYear is the FY start year (e.g. 2026 → "FY 2026-27").
export interface TimelineValue {
  financialYear: number;
  quarter: string; // "Q1".."Q4" or ""
  month: string; // "April".."March" or ""
  fromDate: string; // "YYYY-MM-DD" or ""
  toDate: string;
  periodMode?: "incomeMonth" | "businessMonth";
  businessMonths?: string[];
}

// One KPI shown on a card / collapsed accordion header.
export interface ScopeMetricConfig {
  key: string; // property name inside ScopeNode.metrics
  label: string; // e.g. "Total ROs"
  format: (value: number, localization?: any) => string;
}

// One hierarchy level: how to fetch its node list and which aggregate query
// param carries its selected id.
export interface ScopeLevelConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  // Node-name master list for this level, given the current selection
  // (ancestor ids). Return "" to skip fetching (e.g. missing prerequisite).
  masterUrl: (selection: ScopeSelection) => string;
  queryParam: string; // aggregate query param name for this level's id
  // Allow several nodes at this level. The listing filters on the union and
  // deeper levels are re-picked (their node lists widen to the union).
  multiSelect?: boolean;
  // Optional shaper for master responses whose rows aren't {id, name} —
  // e.g. the employee hierarchy's {userId, firstName, lastName}. Receives the
  // raw extracted list plus the current selection (so a mapper can e.g.
  // restrict the owner list to the selected branch), returns the normalized
  // list.
  mapMaster?: (
    rows: any[],
    selection?: ScopeSelection
  ) => Array<{ id: number; name: string }>;
}

// Optional trailing "Owner" level: the logged-in user + their reporting
// downline, shown only once the `afterForkKey` fork level (e.g. Branch) has a
// selection. `viewByParam` is the aggregate query param carrying the
// Manager / Manager + Team choice (existing listing "owner" view-by values).
export interface OwnerLevelConfig extends ScopeLevelConfig {
  afterForkKey: string;
  viewByParam: string; // e.g. "owner" → manager | team
  // Initial Manager/Team choice. Product default is "team" (Manager + Team)
  // on every Enhanced page; a page whose listing defaults differently must
  // push the accordion's choice into its own owner channel on first apply.
  defaultViewBy?: "manager" | "team"; // defaults to "team"
}

// Full shape config a consuming page passes in. `levels` are the two fixed
// levels before the fork; `fork` is the pair of alternate last levels (e.g.
// Vertical vs Branch) — whichever is picked becomes level 3, the other last.
// `ownerLevel` is opt-in; pages that omit it are entirely unaffected.
export interface OrgFinancialFilterConfig {
  levels: [ScopeLevelConfig, ScopeLevelConfig];
  fork: [ScopeLevelConfig, ScopeLevelConfig];
  defaultForkKey?: string; // defaults to fork[0].key
  ownerLevel?: OwnerLevelConfig;
  metrics: ScopeMetricConfig[];
  // Table-like layout: metric labels render ONCE as a column-header row above
  // the root summary, and every row shows values only, aligned under those
  // columns. Default (false) keeps the inline "label: value" pairs per row.
  tabularMetrics?: boolean;
  aggregateEndpoint: string;
  aggregateTypeParam: string; // e.g. "RO"
}

// Deliberately EXCLUDES ownerLevel — existing callers (page search-filter
// builders) iterate this for org-unit params only; owner is wired explicitly.
export const allLevels = (config: OrgFinancialFilterConfig): ScopeLevelConfig[] => [
  ...config.levels,
  ...config.fork,
];

export const levelByKey = (
  config: OrgFinancialFilterConfig,
  key: string
): ScopeLevelConfig | undefined =>
  config.ownerLevel?.key === key
    ? config.ownerLevel
    : allLevels(config).find((l) => l.key === key);

// Ordered level-key path for the current fork choice. The owner level joins
// the path only once its prerequisite fork level is the CHOSEN grouping and
// has a selection — before that the path is identical to the pre-owner shape,
// so pages without ownerLevel (or callers not passing `selection`) see the
// exact original 4-level path.
export const pathLevels = (
  config: OrgFinancialFilterConfig,
  grouping: string,
  selection?: ScopeSelection
): string[] => {
  const [a, b] = config.fork;
  const [first, second] = grouping === b.key ? [b, a] : [a, b];
  const base = [config.levels[0].key, config.levels[1].key, first.key, second.key];
  const owner = config.ownerLevel;
  if (
    owner &&
    grouping === owner.afterForkKey &&
    selection?.[owner.afterForkKey] != null
  ) {
    base.push(owner.key);
  }
  return base;
};

// The aggregate query param name for each level's own id.
export const selectionToQuery = (
  config: OrgFinancialFilterConfig,
  key: string
): string => levelByKey(config, key)?.queryParam ?? key;
