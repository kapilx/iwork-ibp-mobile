// Builds each level's cards from TWO sources, merged by id so EVERY node
// shows (0s when it has no aggregate data):
//   1. the node NAME list from config.levels[*].masterUrl, and
//   2. the aggregate KPI values from config.aggregateEndpoint, keyed by id.

import { useMemo } from "react";
import { useApiQuery } from "../../hooks";
import {
  OrgFinancialFilterConfig,
  ScopeSelection,
  levelByKey,
  selectedIds,
  selectionToQuery,
} from "./types";

interface UseScopeDataArgs {
  config: OrgFinancialFilterConfig;
  level: string | null;
  selection: ScopeSelection;
  // Levels above `level` on the active path — their ids scope the aggregate.
  ancestors: string[];
  range: { from?: string; to?: string; financialYear?: number };
  enabled?: boolean;
  // Page-specific query params appended to the aggregate call as-is (e.g. the
  // currently-selected Owner/View-by on Biz Done Enhanced) — optional, so
  // pages with no extra scoping dimension (RO Enhanced) are unaffected.
  extraAggregateParams?: Record<string, string | number | undefined | null>;
}

export interface ScopeDataNode {
  id: number;
  name: string;
  metrics: Record<string, number>;
}

export interface ScopeDataResult {
  nodes: ScopeDataNode[];
  loading: boolean;
  error: unknown;
  // Only populated for the root level (no ancestors): the grand total across
  // every node the caller can see, and the name of the unparented row that
  // was excluded from `nodes` (it IS the root, not a sibling of its children).
  total?: Record<string, number>;
  rootLabel?: string;
}

const extractList = (
  data: any
): Array<{ id: number; name: string; parentOrganisationId?: number | null }> => {
  const list =
    data?.data?.data ??
    data?.data ??
    data?.rows ??
    (Array.isArray(data) ? data : []);
  return Array.isArray(list) ? list : [];
};

export const useScopeData = ({
  config,
  level,
  selection,
  ancestors,
  range,
  enabled = true,
  extraAggregateParams,
}: UseScopeDataArgs): ScopeDataResult => {
  const masterUrl = useMemo(() => {
    if (!level) return "";
    const levelConfig = levelByKey(config, level);
    return levelConfig ? levelConfig.masterUrl(selection) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, level, selection]);

  const aggUrl = useMemo(() => {
    if (!level) return "";
    const params = new URLSearchParams({
      type: config.aggregateTypeParam,
      level,
    });
    ancestors.forEach((a) => {
      // A multiselect ancestor (e.g. several branches) goes out as CSV; the
      // aggregate endpoints filter with IN.
      const ids = selectedIds(selection[a]);
      if (ids.length) {
        params.append(selectionToQuery(config, a), ids.join(","));
      }
    });
    // Whole FY selected — send financialYear alone so the backend resolves the
    // range exactly like the listing does (getDateRange, no expiry buffer);
    // quarter/month/custom range keep the client-resolved from/to.
    if (range.financialYear !== undefined) {
      params.append("financialYear", String(range.financialYear));
    } else {
      if (range.from) params.append("from", range.from);
      if (range.to) params.append("to", range.to);
    }
    Object.entries(extraAggregateParams ?? {}).forEach(([key, value]) => {
      if (value != null && value !== "") params.append(key, String(value));
    });
    return `${config.aggregateEndpoint}?${params.toString()}`;
    // extraAggregateParams is an object literal from the caller — compare by
    // value (JSON) instead of reference so this doesn't rebuild every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, level, ancestors, selection, range.from, range.to, range.financialYear, JSON.stringify(extraAggregateParams ?? {})]);

  const master = useApiQuery({
    url: masterUrl,
    queryKey: ["scopeMaster", masterUrl],
    enabled: enabled && Boolean(masterUrl),
  });
  const agg = useApiQuery({
    url: aggUrl,
    queryKey: ["scopeSummary", aggUrl],
    enabled: enabled && Boolean(aggUrl),
  });

  // The root level (no ancestors, by construction only true for the first
  // path level — see FORK_IDX/pathLevels in ./types) has one unparented row
  // representing the whole tree (e.g. "IIRM Holdings"). It isn't a sibling of
  // its own children, so it's excluded from `nodes` and surfaced separately
  // as `rootLabel` for the summary header instead.
  const isRootLevel = ancestors.length === 0;

  const masterList = useMemo(() => {
    const raw = extractList(master.data);
    const mapMaster = level ? levelByKey(config, level)?.mapMaster : undefined;
    return mapMaster ? mapMaster(raw, selection) : raw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master.data, config, level, selection]);

  const rootLabel = useMemo(
    () =>
      isRootLevel
        ? masterList.find((m) => m.parentOrganisationId == null)?.name
        : undefined,
    [isRootLevel, masterList]
  );

  const nodes: ScopeDataNode[] = useMemo(() => {
    const aggList: any[] = agg.data?.data?.nodes ?? agg.data?.nodes ?? [];
    const byId = new Map<number, any>();
    aggList.forEach((a) => byId.set(Number(a.id), a));
    const scopedList = isRootLevel
      ? masterList.filter((m) => m.parentOrganisationId != null)
      : masterList;
    return scopedList.map((m) => {
      const a = byId.get(Number(m.id));
      const metrics: Record<string, number> = {};
      config.metrics.forEach((metric) => {
        metrics[metric.key] = a?.[metric.key] ?? 0;
      });
      return { id: Number(m.id), name: m.name, metrics };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterList, agg.data, config.metrics, isRootLevel]);

  const total = useMemo(() => {
    if (!isRootLevel) return undefined;
    const rawTotal = agg.data?.data?.total ?? agg.data?.total;
    if (!rawTotal) return undefined;
    const metrics: Record<string, number> = {};
    config.metrics.forEach((metric) => {
      metrics[metric.key] = rawTotal[metric.key] ?? 0;
    });
    return metrics;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRootLevel, agg.data, config.metrics]);

  return {
    nodes,
    loading:
      master.isLoading || master.isFetching || agg.isLoading || agg.isFetching,
    error: master.error || agg.error,
    total,
    rootLabel,
  };
};
