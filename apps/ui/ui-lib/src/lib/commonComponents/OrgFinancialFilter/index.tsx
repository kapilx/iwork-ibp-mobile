import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import { CardBackground } from "../CardBackground/styles";
import Button from "../Button";
import { useLocalization } from "../../hooks";
import ScopeCard from "./ScopeCard";
import ScopeAccordion from "./ScopeAccordion";
import ScopeRootSummary from "./ScopeRootSummary";
import PeriodPopover from "./PeriodPopover";
import { OrgScopeApi } from "./useOrgScope";
import { useScopeData } from "./useScopeData";
import { timelineToRange, isBusinessMonthMode } from "./financialYear";
import {
  OrgFinancialFilterConfig,
  levelByKey,
  hasSelection,
  nodeList,
  selectedIds,
} from "./types";
import {
  ScopeSectionHeader,
  ScopeTitle,
  AccordionStack,
  CardsGrid,
  EmptyState,
  MetricsHeaderRow,
  MetricsHeaderSpacer,
  MetricsHeaderEndSpacer,
  MetricColumns,
  MetricColLabel,
  // ViewByRow, ViewByLabel, TabsRow, TabButton, // unused while the View-by toggle below is disabled
  ViewByRow,
  ViewByLabel,
  TabsRow,
  TabButton,
  ScopeFooter,
  StaleHint,
  ResetLink,
  ScopeTone,
  Breadcrumb,
  BreadcrumbPrefix,
  BreadcrumbChip,
} from "./styles";

export * from "./types";
export { useOrgScope } from "./useOrgScope";
export type { RestoredScope, OrgScopeApi, OwnerViewBy } from "./useOrgScope";
export type { ScopeDataNode } from "./useScopeData";
export {
  timelineToRange,
  defaultTimeline,
  fyLabel,
  summarizeTimeline,
  isBusinessMonthMode,
  businessMonthRange,
} from "./financialYear";

interface OrgFinancialFilterProps {
  config: OrgFinancialFilterConfig;
  api: OrgScopeApi;
  title?: string;
  // Page-specific query params appended to the aggregate call (e.g. the
  // currently-selected Owner/View-by on Biz Done Enhanced), so the widget's
  // metrics reflect the same scoping the table/KPIs already apply.
  extraAggregateParams?: Record<string, string | number | undefined | null>;
  // Hide the root-org grand-total summary header ("IIRM Holdings") — shown to
  // leadership/superusers only; the level accordions then render directly.
  hideRootSummary?: boolean;
  // Level keys the viewer cannot change (e.g. the Organisation level locked
  // to the user's own org for non-leadership roles). The accordion header
  // still shows the selected node + live KPIs but is non-interactive. Pass
  // the same levels to useOrgScope so state-side changes are blocked too.
  lockedLevels?: string[];
  // Show an Organisation select inside the period popover — the org is then
  // picked THERE (pages lock the org accordion for every role and route all
  // org changes through this filter). disabled: true renders it read-only
  // (non-leadership roles); an org change applies immediately on Apply,
  // clearing the SBU/Branch drilldown below it.
  popoverOrgFilter?: { disabled?: boolean };
  // Offer the Income Month / Business Month toggle in the period popover.
  // Biz Done Enhanced only — the aggregate flag rides the applied timeline, so
  // pages that leave this off never send filterByBusinessDate at all.
  periodModes?: boolean;
  // Caption under the popover's From/To pair naming the date column the page
  // filters on (e.g. "SO expiry"). Page-supplied — ui-lib has no page identity.
  periodDateNote?: string;
}

const STEP_TONES: ScopeTone[] = ["blue", "teal", "purple", "orange"];

// The fork is always path index 2 by construction (two fixed levels, then the
// fork pair) — see pathLevels in ./types.
const FORK_IDX = 2;

const OrgFinancialFilter: React.FC<OrgFinancialFilterProps> = ({
  config,
  api,
  title = "View by Org Hierarchy",
  extraAggregateParams,
  hideRootSummary = false,
  lockedLevels,
  popoverOrgFilter,
  periodModes = false,
  periodDateNote,
}) => {
  const {
    selection,
    selectedNodes,
    timeline,
    // grouping, changeGrouping, // unused while the View-by toggle below is disabled
    ownerViewBy,
    changeOwnerViewBy,
    path,
    activeLevel,
    selectNode,
    toggleLevel,
    applyReport,
    applyRootSelection,
    reset,
    applyTimeline,
    isStale,
    canReset,
    showViewReport,
    hasReport,
  } = api;

  const { localizationData } = useLocalization();
  const localization = localizationData?.data;

  // Show every selected level plus the first unselected one.
  const firstUnselectedIdx = path.findIndex((l) => !hasSelection(selection[l]));
  const baseVisibleLevels =
    (firstUnselectedIdx === -1 ? path : path.slice(0, firstUnselectedIdx + 1))
      // Vertical accordion disabled for now — Organisation/SBU/Branch only.
      // Revert by removing this .slice to restore the Vertical step.
      .slice(0, FORK_IDX + 1);
  // The owner level sits at path index 4 (after the hidden trailing fork
  // level), so the slice above would drop it — re-append it whenever it's on
  // the path (i.e. the branch fork is chosen AND a branch is selected).
  const ownerKey = config.ownerLevel?.key;
  const visibleLevels =
    ownerKey && path.includes(ownerKey)
      ? [...baseVisibleLevels, ownerKey]
      : baseVisibleLevels;

  const range = useMemo(() => timelineToRange(timeline), [timeline]);

  // Business-month mode has to reach the aggregate too, or the org cards would
  // keep counting income dates while the table counts business dates and the
  // two would silently disagree. Derived from the applied timeline — the same
  // object `range` comes from — so the flag and the dates can never describe
  // different modes. Absent for every page that never sets periodMode.
  const aggregateParams = useMemo<
    Record<string, string | number | undefined | null>
  >(
    () => ({
      ...extraAggregateParams,
      ...(isBusinessMonthMode(timeline) ? { filterByBusinessDate: "true" } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(extraAggregateParams ?? {}), timeline.periodMode]
  );

  // Aggregate params for the owner level only: the Manager / Manager + Team
  // choice rides the same query param the listing's view-by uses. The page's
  // selected-owner id (queryParam, e.g. userId) is stripped — the backend
  // re-scopes the whole summary AS that user (its downline, its visibility),
  // so keeping it after a card click made every other owner's card read 0
  // when the accordion was reopened. Owner cards always enumerate the
  // logged-in viewer's downline.
  const ownerAggregateParams = useMemo(() => {
    if (!config.ownerLevel) return aggregateParams;
    const {
      [config.ownerLevel.queryParam]: _selectedOwnerId,
      ...rest
    } = aggregateParams ?? {};
    return { ...rest, [config.ownerLevel.viewByParam]: ownerViewBy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.ownerLevel, ownerViewBy, JSON.stringify(aggregateParams ?? {})]);

  // Cards are fetched only for the currently expanded level; its ancestors
  // scope the query. react-query caches per (level + scope + range).
  const activeIdx = activeLevel ? path.indexOf(activeLevel) : -1;
  const ancestors = activeIdx > 0 ? path.slice(0, activeIdx) : [];
  const { loading } = useScopeData({
    config,
    level: activeLevel,
    selection,
    ancestors,
    range,
    enabled: Boolean(activeLevel),
    extraAggregateParams:
      activeLevel === ownerKey ? ownerAggregateParams : aggregateParams,
  });

  // Root summary header needs the grand total + root org name regardless of
  // which accordion is expanded. Same query shape as the call above when the
  // root level happens to be active, so react-query dedupes it for free.
  const rootLevel = path[0];
  const { nodes: level0Nodes, total: rootTotal, rootLabel } = useScopeData({
    config,
    level: rootLevel,
    selection,
    ancestors: [],
    range,
    enabled: true,
    extraAggregateParams: aggregateParams,
  });

  // Keep every SELECTED (collapsed) level's own displayed metrics live too —
  // not just the expanded one. Without these, a collapsed row's numbers were
  // frozen at whatever they were when the card was clicked, even after the
  // period changed and the report/table visibly refreshed elsewhere. `path`
  // is always exactly 4 entries by construction (pathLevels), so these are
  // fixed, unconditional hook calls — only `enabled` varies.
  const level1 = path[1];
  const level1Ancestors = useMemo(() => path.slice(0, 1), [path]);
  const { nodes: level1Nodes, loading: level1Loading } = useScopeData({
    config,
    level: level1,
    selection,
    ancestors: level1Ancestors,
    range,
    enabled: level1Ancestors.every((l) => hasSelection(selection[l])),
    extraAggregateParams: aggregateParams,
  });

  const level2 = path[2];
  const level2Ancestors = useMemo(() => path.slice(0, 2), [path]);
  const { nodes: level2Nodes, loading: level2Loading } = useScopeData({
    config,
    level: level2,
    selection,
    ancestors: level2Ancestors,
    range,
    enabled: level2Ancestors.every((l) => hasSelection(selection[l])),
    extraAggregateParams: aggregateParams,
  });

  const level3 = path[3];
  const level3Ancestors = useMemo(() => path.slice(0, 3), [path]);
  const { nodes: level3Nodes, loading: level3Loading } = useScopeData({
    config,
    level: level3,
    selection,
    ancestors: level3Ancestors,
    range,
    enabled: level3Ancestors.every((l) => hasSelection(selection[l])),
    extraAggregateParams: aggregateParams,
  });

  // Owner level (path[4], present only with config.ownerLevel + branch fork
  // selected). `path[4]` is undefined otherwise, which disables the query —
  // still a fixed, unconditional hook call.
  const level4 = path[4];
  const level4Ancestors = useMemo(() => path.slice(0, 4), [path]);
  const { nodes: level4Nodes, loading: level4Loading } = useScopeData({
    config,
    level: level4 ?? null,
    selection,
    ancestors: level4Ancestors,
    range,
    // Only the CHOSEN fork ancestor has a selection (the trailing alternate
    // fork level never does), so require the active-path ancestors only.
    enabled:
      Boolean(level4) &&
      path
        .slice(0, FORK_IDX + 1)
        .every((l) => hasSelection(selection[l])),
    extraAggregateParams: ownerAggregateParams,
  });

  const liveNodesByIdx = [
    level0Nodes,
    level1Nodes,
    level2Nodes,
    level3Nodes,
    level4Nodes,
  ];
  // Root level's own query is always live for the summary header, so a
  // collapsed root row never lacks values — index 0 stays false.
  const liveLoadingByIdx = [
    false,
    level1Loading,
    level2Loading,
    level3Loading,
    level4Loading,
  ];

  // No auto-drill: every card is picked by the user, even when a level renders
  // exactly one card or only one card carries non-zero metrics.

  // Root accordion open by default so the existing drilldown stack stays
  // visible on first load — collapsing it hides Organisation/SBU/Vertical/
  // Branch entirely, same as any other accordion.
  const [rootExpanded, setRootExpanded] = useState(true);

  // const [forkA, forkB] = config.fork; // unused while the View-by toggle below is disabled

  // Picking a card at a multiselect level (Branch) advances the drilldown, but
  // the level stays open so more nodes can be added without reopening it. It
  // closes as soon as the user touches a DEEPER level (clicks the Owner header
  // or an Owner card) — the owner auto-select that fires on a branch pick is
  // programmatic, so it doesn't count as touching it.
  const [stickyMultiLevel, setStickyMultiLevel] = useState<string | null>(null);
  useEffect(() => {
    if (stickyMultiLevel && !hasSelection(selection[stickyMultiLevel])) {
      setStickyMultiLevel(null);
    }
  }, [selection, stickyMultiLevel]);

  const renderSection = (level: string, idx: number) => {
    const tone = STEP_TONES[idx % STEP_TONES.length];
    const locked = lockedLevels?.includes(level) ?? false;
    const expanded =
      (level === activeLevel || level === stickyMultiLevel) && !locked;
    // Live queries are keyed by PATH position (the owner level renders right
    // after Branch but sits at path[4], past the hidden trailing fork level).
    const pathIdx = path.indexOf(level);
    // Prefer the live query's copy of the selected node (fresh metrics for
    // the current period) and fall back to the cached selection snapshot
    // only while that query is still loading, so the row doesn't flash empty.
    const pickedIds = selectedIds(selection[level]);
    const liveMatches =
      liveNodesByIdx[pathIdx]?.filter((n) => pickedIds.includes(n.id)) ?? [];
    const headerNodes = liveMatches.length
      ? liveMatches
      : nodeList(selectedNodes[level]);
    // Several picks fold into ONE header row: names joined, metrics summed.
    // Every metric on these pages is a count or an amount, so summing is the
    // right roll-up — a ratio metric would need its own aggregation.
    const selectedNode =
      headerNodes.length > 1
        ? {
            id: -1,
            name: headerNodes.map((n) => n.name).join(", "),
            metrics: Object.fromEntries(
              config.metrics.map((m) => [
                m.key,
                headerNodes.reduce((sum, n) => sum + (n.metrics?.[m.key] ?? 0), 0),
              ])
            ),
          }
        : headerNodes[0];
    // No fresh copy yet while its query is in flight (e.g. the auto-selected
    // self owner right after a branch pick) — show a spinner in the header
    // instead of the snapshot's blank/stale values.
    const metricsLoading =
      pickedIds.length > 0 &&
      liveMatches.length === 0 &&
      Boolean(liveLoadingByIdx[pathIdx]);
    const levelConfig = levelByKey(config, level);
    const label = levelConfig?.label ?? level;
    // Each section renders its OWN cards (a sticky multiselect level stays
    // expanded while a deeper level is active). Same URL as the active-level
    // query above, so react-query serves both from one request.
    const sectionNodes = liveNodesByIdx[pathIdx] ?? [];
    // liveLoadingByIdx[0] is hardcoded false (the root query is always live for
    // the summary header), so the active level still needs its own loading flag
    // or the root section would flash "no X available" during its first fetch.
    const sectionLoading =
      Boolean(liveLoadingByIdx[pathIdx]) || (level === activeLevel && loading);
    // const showTabs = idx === FORK_IDX && expanded; // unused while the View-by toggle below is disabled

    return (
      <ScopeAccordion
        key={level}
        tone={tone}
        icon={levelConfig?.icon}
        label={label}
        hint={`Select a ${label.toLowerCase()} to drill down`}
        selectedNode={expanded ? undefined : selectedNode}
        metricsLoading={metricsLoading}
        metrics={config.metrics}
        tabular={config.tabularMetrics}
        localization={localization}
        expanded={expanded}
        disabled={locked}
        onToggle={() => {
          if (locked) return;
          // Any header click ends stickiness: its own folds it, another means
          // the user has moved on.
          setStickyMultiLevel(null);
          toggleLevel(level);
        }}
      >
        {/* View-by toggle disabled along with the Vertical accordion — with
            Vertical hidden there's nothing left to switch to, and leaving the
            tab would let grouping flip to "vertical" and reintroduce it.
            Revert together with the visibleLevels slice above.
        {showTabs && (
          <ViewByRow>
            <ViewByLabel>View by</ViewByLabel>
            <TabsRow>
              <TabButton
                type="button"
                active={grouping === forkB.key}
                tone={tone}
                onClick={() => changeGrouping(forkB.key)}
                data-testid={`scope-tab-${forkB.key}`}
              >
                {forkB.label}
              </TabButton>
              <TabButton
                type="button"
                active={grouping === forkA.key}
                tone={tone}
                onClick={() => changeGrouping(forkA.key)}
                data-testid={`scope-tab-${forkA.key}`}
              >
                {forkA.label}
              </TabButton>
            </TabsRow>
          </ViewByRow>
        )} */}

        {level === ownerKey && (
          <ViewByRow>
            <ViewByLabel>View by</ViewByLabel>
            <TabsRow>
              <TabButton
                type="button"
                active={ownerViewBy === "manager"}
                tone={tone}
                onClick={() => changeOwnerViewBy("manager")}
                data-testid="scope-owner-viewby-manager"
              >
                Manager
              </TabButton>
              <TabButton
                type="button"
                active={ownerViewBy === "team"}
                tone={tone}
                onClick={() => changeOwnerViewBy("team")}
                data-testid="scope-owner-viewby-team"
              >
                Manager + Team
              </TabButton>
            </TabsRow>
          </ViewByRow>
        )}

        {sectionLoading ? (
          <EmptyState>
            <CircularProgress size={22} />
          </EmptyState>
        ) : sectionNodes.length === 0 ? (
          <EmptyState>
            No {label.toLowerCase()} available under this selection
          </EmptyState>
        ) : (
          <CardsGrid data-testid={`scope-cards-${level}`}>
            {sectionNodes.map((node) => (
              <ScopeCard
                key={node.id}
                node={node}
                metrics={config.metrics}
                tone={tone}
                selected={selectedIds(selection[level]).includes(node.id)}
                multiSelect={levelConfig?.multiSelect}
                localization={localization}
                onSelect={() => {
                  setStickyMultiLevel(
                    levelConfig?.multiSelect ? level : null
                  );
                  selectNode(level, node);
                }}
              />
            ))}
          </CardsGrid>
        )}
      </ScopeAccordion>
    );
  };

  // One crumb per level that's actually been selected, in path order — used
  // to jump back into any earlier level without walking the chain manually.
  // A multiselect level holds a LIST of nodes, so the crumb joins their names
  // instead of reading .name off the array (which yields an empty chip).
  const breadcrumbEntries = path
    .map((level) => ({
      level,
      label: levelByKey(config, level)?.label ?? level,
      // A multiselect level holds a LIST — join the names, since reading .name
      // off an array yields an empty chip.
      name: nodeList(selectedNodes[level])
        .map((n) => n.name)
        .join(", "),
    }))
    .filter((entry) => entry.name);

  return (
    <CardBackground>
      <ScopeSectionHeader>
        <ScopeTitle>{title}</ScopeTitle>
        <PeriodPopover
          periodModes={periodModes}
          dateNote={periodDateNote}
          value={timeline}
          onApply={(next, orgId) => {
            // Org first: applyRootSelection swaps the applied scope to the
            // new org alone, then the timeline lands on top in the same
            // render batch — one combined refresh, no interim stale hint.
            if (orgId != null) {
              const node = level0Nodes.find((n) => n.id === orgId);
              if (node) applyRootSelection(rootLevel, node);
            }
            applyTimeline(next);
          }}
          orgFilter={
            popoverOrgFilter
              ? {
                  options: level0Nodes.map((n) => ({ id: n.id, name: n.name })),
                  selectedId: selection[rootLevel] as number | undefined,
                  disabled: popoverOrgFilter.disabled,
                }
              : undefined
          }
        />
      </ScopeSectionHeader>

      {config.tabularMetrics && (
        <MetricsHeaderRow data-testid="scope-metrics-header">
          <MetricsHeaderSpacer />
          <MetricColumns count={config.metrics.length}>
            {config.metrics.map((metric) => (
              <MetricColLabel key={metric.key}>{metric.label}</MetricColLabel>
            ))}
          </MetricColumns>
          <MetricsHeaderEndSpacer />
        </MetricsHeaderRow>
      )}

      {rootLabel && !hideRootSummary ? (
        <ScopeRootSummary
          label={rootLabel}
          metrics={config.metrics}
          total={rootTotal}
          tabular={config.tabularMetrics}
          localization={localization}
          expanded={rootExpanded}
          onToggle={() => setRootExpanded((v) => !v)}
        >
          <AccordionStack>{visibleLevels.map(renderSection)}</AccordionStack>
        </ScopeRootSummary>
      ) : (
        <AccordionStack>{visibleLevels.map(renderSection)}</AccordionStack>
      )}

      {breadcrumbEntries.length > 0 && (
        <Breadcrumb data-testid="scope-breadcrumb">
          <BreadcrumbPrefix>Currently viewing:</BreadcrumbPrefix>
          {breadcrumbEntries.map((entry) => (
            <BreadcrumbChip
              key={entry.level}
              type="button"
              onClick={() => {
                // Locked levels stay inert — jumping back into them would
                // expand an accordion the viewer isn't allowed to change.
                if (!lockedLevels?.includes(entry.level)) toggleLevel(entry.level);
              }}
              data-testid={`scope-breadcrumb-${entry.level}`}
            >
              {entry.name}
            </BreadcrumbChip>
          ))}
        </Breadcrumb>
      )}

      <ScopeFooter>
        {/* Only meaningful once a report is actually showing — while still
            drilling toward the first report there's nothing to "update". */}
        {isStale && hasReport && (
          <StaleHint data-testid="scope-stale-hint">
            Scope changed. View Report to update.
          </StaleHint>
        )}
        {canReset && (
          <ResetLink
            onClick={reset}
            data-testid="scope-reset"
          >
            Reset
          </ResetLink>
        )}
        {showViewReport && (
          <Button
            variantType="primary"
            sizeType="small"
            label="View Report"
            onClick={applyReport}
            data-testid="view-report"
          />
        )}
      </ScopeFooter>
    </CardBackground>
  );
};

export default React.memo(OrgFinancialFilter);
