// Drives the two-phase org-hierarchy scope flow. Holds a "draft" selection the
// user edits and an "applied" selection the report/table reflect (the View
// Report gate). Pure state — card data is fetched by the component via
// useScopeData and passed back through selectNode.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultTimeline } from "./financialYear";
import {
  OrgFinancialFilterConfig,
  ScopeSelection,
  TimelineValue,
  hasSelection,
  levelByKey,
  nodeList,
  pathLevels,
  selectedIds,
} from "./types";
import { ScopeDataNode } from "./useScopeData";

export type OwnerViewBy = "manager" | "team";

export interface RestoredScope {
  selection: ScopeSelection;
  selectedNodes: Record<string, ScopeDataNode | ScopeDataNode[]>;
  timeline: TimelineValue;
  grouping: string;
  ownerViewBy?: OwnerViewBy;
}

interface UseOrgScopeArgs {
  config: OrgFinancialFilterConfig;
  initial?: RestoredScope | null;
  // Selection every session starts from (e.g. the logged-in user's own
  // organisation). Applied immediately — the report loads pre-scoped without
  // a View Report click — and Reset returns here instead of to empty.
  baseSelection?: ScopeSelection;
  // Levels whose baseSelection value is role-locked: selectNode ignores them
  // and a restored scope cannot override them (e.g. the Organisation level
  // for non-leadership users).
  lockedLevels?: string[];
}

const sameSelection = (a: ScopeSelection, b: ScopeSelection | null) =>
  JSON.stringify(a) === JSON.stringify(b);

export const useOrgScope = ({
  config,
  initial,
  baseSelection,
  lockedLevels,
}: UseOrgScopeArgs) => {
  const baseTimeline = useMemo(() => defaultTimeline(new Date()), []);
  const defaultGrouping = config.defaultForkKey ?? config.fork[0].key;

  // `lock` ⊆ `base`. Both keyed by JSON identity so the seed/canReset
  // comparisons below don't churn when the caller re-creates the objects.
  const base = useMemo<ScopeSelection>(
    () => ({ ...(baseSelection ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(baseSelection ?? {})]
  );
  const lock = useMemo<ScopeSelection>(() => {
    const out: ScopeSelection = {};
    (lockedLevels ?? []).forEach((level) => {
      if (base[level] != null) out[level] = base[level];
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, JSON.stringify(lockedLevels ?? [])]);

  // What Reset returns to and what counts as an "untouched" scope.
  const baseSeed = useMemo<ScopeSelection>(
    () => ({ ...base, ...lock }),
    [base, lock]
  );

  // Initial-state snapshot only (deliberately not reactive) — a restored
  // scope wins over the base preselection, but locked levels always win over
  // both, so a view saved under a broader role can't unlock another org.
  const seedSelection = useMemo<ScopeSelection>(
    () => ({
      ...(initial?.selection && Object.keys(initial.selection).length > 0
        ? initial.selection
        : base),
      ...lock,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const hasSeed = Object.keys(seedSelection).length > 0;

  const [selection, setSelection] = useState<ScopeSelection>(seedSelection);
  // Metrics for selected nodes, kept so collapsed headers can show KPIs and the
  // applied scope can be summarised without a refetch.
  const [selectedNodes, setSelectedNodes] = useState<
    Record<string, ScopeDataNode | ScopeDataNode[]>
  >(initial?.selectedNodes ?? {});
  const [appliedSelection, setAppliedSelection] =
    useState<ScopeSelection | null>(hasSeed ? seedSelection : null);
  const [timeline, setTimeline] = useState<TimelineValue>(
    initial?.timeline ?? baseTimeline
  );
  const [appliedTimeline, setAppliedTimeline] = useState<TimelineValue>(
    initial?.timeline ?? baseTimeline
  );
  const [grouping, setGrouping] = useState<string>(
    initial?.grouping ?? defaultGrouping
  );
  // A pinned level forces that accordion open; "none" collapses the whole stack
  // (post View Report); null = automatic (first unselected level).
  const [manualActiveLevel, setManualActiveLevel] = useState<
    string | "none" | null
  >(initial?.selection ? "none" : null);
  // Deliberately NOT seeded from the base preselection: the report area
  // (tables + KPIs) must stay hidden until the user either completes the
  // drilldown to an owner (auto-applies) or clicks View Report on a partial
  // scope. A RESTORED scope (nav-back / saved view) still shows immediately —
  // the hydration effect below sets this true.
  const [reportApplied, setReportApplied] = useState<boolean>(false);
  // Manager = individual contribution, Team = subtree rollup — only meaningful
  // when config.ownerLevel is set; inert otherwise. Product default is team
  // (Manager + Team) everywhere (see OwnerLevelConfig.defaultViewBy).
  const defaultOwnerViewBy: OwnerViewBy =
    config.ownerLevel?.defaultViewBy ?? "team";
  const [ownerViewBy, setOwnerViewBy] = useState<OwnerViewBy>(
    initial?.ownerViewBy ?? defaultOwnerViewBy
  );
  const [appliedOwnerViewBy, setAppliedOwnerViewBy] = useState<OwnerViewBy>(
    initial?.ownerViewBy ?? defaultOwnerViewBy
  );

  const hydratedRestoredScope = useRef(false);
  useEffect(() => {
    if (hydratedRestoredScope.current) return;
    if (!initial?.selection || Object.keys(initial.selection).length === 0) return;
    // Only hydrate while the user hasn't diverged from the seed (the base/
    // locked preselection counts as untouched).
    const seedJson = JSON.stringify(seedSelection);
    if (JSON.stringify(selection) !== seedJson) return;
    if (appliedSelection !== null && JSON.stringify(appliedSelection) !== seedJson)
      return;
    hydratedRestoredScope.current = true;
    const merged = { ...initial.selection, ...lock };
    setSelection(merged);
    setSelectedNodes(initial.selectedNodes ?? {});
    setAppliedSelection(merged);
    setTimeline(initial.timeline ?? baseTimeline);
    setAppliedTimeline(initial.timeline ?? baseTimeline);
    setGrouping(initial.grouping ?? defaultGrouping);
    setOwnerViewBy(initial.ownerViewBy ?? defaultOwnerViewBy);
    setAppliedOwnerViewBy(initial.ownerViewBy ?? defaultOwnerViewBy);
    setManualActiveLevel("none");
    setReportApplied(true);
  }, [initial]);

  // Selection-aware: the optional owner level joins the path only once its
  // prerequisite fork level (e.g. Branch) is selected — see pathLevels.
  const path = useMemo(
    () => pathLevels(config, grouping, selection),
    [config, grouping, selection]
  );

  // pathLevels puts the UNCHOSEN fork alternate at index 3 (grouping picks
  // Branch, so Vertical rides along) and the UI never renders it. It must not
  // be eligible to become the active level: it is permanently unselected, so
  // the scan below would stop there the moment the chosen fork is picked and
  // leave the whole stack collapsed — the Owner accordion could never open.
  const unchosenForkKey = useMemo(() => {
    const [a, b] = config.fork;
    return grouping === b.key ? a.key : b.key;
  }, [config.fork, grouping]);

  const activeLevel: string = useMemo(() => {
    const selectable = path.filter((level) => level !== unchosenForkKey);
    // hasSelection, not a truthiness test — a multiselect level holds [] when
    // empty, and [] is truthy.
    for (const level of selectable)
      if (!hasSelection(selection[level])) return level;
    return selectable[selectable.length - 1];
  }, [selection, path, unchosenForkKey]);

  const effectiveActiveLevel =
    manualActiveLevel === "none" ? null : manualActiveLevel ?? activeLevel;

  // The owner level is picked by hand like every other level — no self-prefill
  // when it joins the path.

  // Select a card at a level. Changing a level clears its descendants along the
  // path. Re-clicking the selected card deselects it (and clears descendants).
  const selectNode = useCallback(
    (level: string, node: ScopeDataNode) => {
      if (lock[level] != null) return; // role-locked level

      // Multiselect level (e.g. Branch): clicking toggles membership. Deeper
      // levels are cleared because their node lists are derived from this
      // selection — the Owner list, for instance, widens to the union of the
      // chosen branches' downlines, so a previously picked owner may no longer
      // be meaningful.
      if (levelByKey(config, level)?.multiSelect) {
        const current = selectedIds(selection[level]);
        const nextIds = current.includes(node.id)
          ? current.filter((id) => id !== node.id)
          : [...current, node.id];
        const idx = path.indexOf(level);
        setSelection((prev) => {
          const next = { ...prev };
          for (let i = idx + 1; i < path.length; i++) delete next[path[i]];
          if (nextIds.length) next[level] = nextIds;
          else delete next[level];
          return next;
        });
        setSelectedNodes((prev) => {
          const next = { ...prev };
          for (let i = idx + 1; i < path.length; i++) delete next[path[i]];
          const known = [...nodeList(prev[level]), node];
          if (nextIds.length) {
            next[level] = nextIds
              .map((id) => known.find((n) => n.id === id))
              .filter(Boolean) as ScopeDataNode[];
          } else {
            delete next[level];
          }
          return next;
        });
        setManualActiveLevel(nextIds.length ? level : null);
        return;
      }

      const isReselect = selection[level] === node.id;
      setSelection((prev) => {
        const idx = path.indexOf(level);
        const next = { ...prev };
        const from = isReselect ? idx : idx + 1;
        for (let i = from; i < path.length; i++) delete next[path[i]];
        if (!isReselect) next[level] = node.id;
        return next;
      });
      setSelectedNodes((prev) => {
        const idx = path.indexOf(level);
        const next = { ...prev };
        const from = isReselect ? idx : idx + 1;
        for (let i = from; i < path.length; i++) delete next[path[i]];
        if (!isReselect) next[level] = node;
        return next;
      });
      if (isReselect) setManualActiveLevel(level);
      else setManualActiveLevel(null);
    },
    [path, selection, lock, config]
  );

  const toggleLevel = useCallback(
    (level: string) => {
      setManualActiveLevel(effectiveActiveLevel === level ? "none" : level);
    },
    [effectiveActiveLevel]
  );

  // Select a root-level node and apply it IMMEDIATELY (no View Report gate),
  // clearing every descendant pick — the period popover's org filter uses
  // this, since with the org accordion locked there is no other way to both
  // change and apply the org. Locked levels still can't be moved off their
  // pinned value.
  const applyRootSelection = useCallback(
    (level: string, node: ScopeDataNode) => {
      if (lock[level] != null && lock[level] !== node.id) return;
      const next: ScopeSelection = { [level]: node.id };
      setSelection(next);
      setSelectedNodes({ [level]: node });
      setAppliedSelection(next);
      setManualActiveLevel(null);
      setReportApplied(true);
    },
    [lock]
  );

  // Switching the fork drops both fork-level picks and returns the active
  // level to the fork.
  const changeGrouping = useCallback(
    (next: string) => {
      setGrouping(next);
      setSelection((prev) => {
        const cleared = { ...prev };
        delete cleared[config.fork[0].key];
        delete cleared[config.fork[1].key];
        if (config.ownerLevel) delete cleared[config.ownerLevel.key];
        return cleared;
      });
      setSelectedNodes((prev) => {
        const cleared = { ...prev };
        delete cleared[config.fork[0].key];
        delete cleared[config.fork[1].key];
        if (config.ownerLevel) delete cleared[config.ownerLevel.key];
        return cleared;
      });
      setManualActiveLevel(null);
    },
    [config.fork, config.ownerLevel]
  );

  const applyReport = useCallback(() => {
    setAppliedSelection(selection);
    setAppliedTimeline(timeline);
    setAppliedOwnerViewBy(ownerViewBy);
    setManualActiveLevel("none");
    setReportApplied(true);
  }, [selection, timeline, ownerViewBy]);

  const reset = useCallback(() => {
    // Reset returns to the base preselection (the user's own org), not to
    // empty — for locked roles empty would be an unreachable, unusable state.
    const hasBase = Object.keys(baseSeed).length > 0;
    setSelection(baseSeed);
    setSelectedNodes({});
    setTimeline(baseTimeline);
    setAppliedSelection(hasBase ? baseSeed : null);
    setAppliedTimeline(baseTimeline);
    setOwnerViewBy(defaultOwnerViewBy);
    setAppliedOwnerViewBy(defaultOwnerViewBy);
    setManualActiveLevel(null);
    setReportApplied(false);
  }, [baseTimeline, defaultOwnerViewBy]);

  // If a report is already showing (appliedSelection !== null — including a
  // partial scope applied via the manual View Report CTA), changing the
  // period should take effect immediately, same expectation as completing an
  // org drilldown auto-applying. Without this, the period popover's own
  // Apply only staged a draft (isStale went true) and the table/aggregate
  // stayed on the old period until the user noticed the "Scope changed —
  // View Report to update" hint and clicked View Report a second time.
  // Before any report exists yet, just stage the draft — the normal
  // View Report / auto-apply-on-complete flow picks it up once a scope is
  // chosen.
  const applyTimeline = useCallback((next: TimelineValue) => {
    setTimeline(next);
    if (appliedSelection !== null) {
      setAppliedTimeline(next);
    }
  }, [appliedSelection]);

  // Same immediate-apply expectation as applyTimeline: with a report already
  // showing, flipping Manager / Manager + Team retunes cards AND listing at
  // once; before any report it just stages the draft.
  const changeOwnerViewBy = useCallback(
    (next: OwnerViewBy) => {
      setOwnerViewBy(next);
      if (appliedSelection !== null) {
        setAppliedOwnerViewBy(next);
      }
    },
    [appliedSelection]
  );

  const isStale =
    appliedSelection !== null &&
    (!sameSelection(selection, appliedSelection) ||
      JSON.stringify(timeline) !== JSON.stringify(appliedTimeline) ||
      ownerViewBy !== appliedOwnerViewBy);

  // Nothing auto-applies: a report exists only after View Report is clicked,
  // however complete the drilldown is. So the CTA shows whenever there is
  // something left to apply — no report yet, or the scope has drifted from
  // the applied one.
  //
  // Keyed on reportApplied, NOT on appliedSelection: a base preselection seeds
  // appliedSelection at mount, so testing that would read as "already applied"
  // while the Organisation level is still the only thing chosen, and the CTA
  // would only surface once the user touched SBU. Requiring the root level to
  // be selected keeps the button off a scope with nothing to report on.
  const rootLevelKey = config.levels[0].key;
  const showViewReport =
    hasSelection(selection[rootLevelKey]) && (!reportApplied || isStale);

  // Reset baseline is the base preselection, not empty — with no base this
  // reduces to the original "anything selected/applied" check.
  const timelineChanged =
    JSON.stringify(timeline) !== JSON.stringify(baseTimeline);
  const baseSeedJson = JSON.stringify(baseSeed);
  const canReset =
    Object.keys(baseSeed).length === 0
      ? appliedSelection !== null ||
        Object.keys(selection).length > 0 ||
        timelineChanged
      : JSON.stringify(selection) !== baseSeedJson ||
        JSON.stringify(appliedSelection ?? baseSeed) !== baseSeedJson ||
        timelineChanged;

  return {
    selection,
    selectedNodes,
    appliedSelection,
    timeline,
    appliedTimeline,
    grouping,
    changeGrouping,
    ownerViewBy,
    appliedOwnerViewBy,
    changeOwnerViewBy,
    path,
    activeLevel: effectiveActiveLevel,
    selectNode,
    toggleLevel,
    applyReport,
    applyRootSelection,
    reset,
    applyTimeline,
    hasReport: reportApplied,
    isStale,
    canReset,
    showViewReport,
  };
};

export type OrgScopeApi = ReturnType<typeof useOrgScope>;
