# Vertical multiselect — page + API inventory

Every place a user can filter by Vertical, and what each one needs. Three groups, because
there are three different transports for the same filter.

## Group 1 — smart search listings (DONE, no API work)

Pages, all fed by `CommonFieldsconfig` in
[smartSearchConfig.ts](../apps/ui/iwork/src/app/Utils/smartSearchConfig.ts):

Manage Policies · Contacts · Endorsements · Claims (`ClaimsTable`) · Renewal Opportunities ·
Renewal Opportunities Enhanced · Manage Quotes · CD Management · Company Overview ·
Company Listing · Company Policy Details · Opportunities · Opportunities Enhanced ·
Client Portfolio Enhanced

Status: **working, including the APIs.** The filter travels as `search=verticalId:[…]`;
`mapSearchParams` parses the bracketed list into an array and
[entity-service.utils.ts:268](../libs/service-lib/src/lib/utils/entity-service.utils.ts#L268)
already emits `IN (...)` for arrays. This path never used `=` — a single vertical was already
sent as a one-item array — so widening the selection changes nothing server-side.

Done here: `type: "multiselect"`, default `[]`, `storeSelectedOption: true` (labels in the
applied-filters strip), plus the shared guards in `useTableController`, `MultiSelect`,
`SelectField` and `useApiSelectField`.

## Group 1b — Biz Done Report (DONE, API work was needed)

Page-level override in
[BizDownReportListing](../apps/ui/iwork/src/app/pages/BizDownReportPage/BizDownReportListing/index.tsx)
because it shares `businessPerformanceConfig` with the dashboard, which uses a different
transport (see Group 2).

APIs fixed: `policy-report-list` and `policy-report-excel` had their own search parser that
split on `,` before brackets (only the first id survived), and
[policy-report.ts](../apps/services/service-lib/src/lib/utils/policy-report.ts) compared with
`verticalId = :verticalId` in 12 places → now `IN (:...)`.

## Group 2 — Business Performance dashboard (NOT DONE)

One page, many widgets: [BusinessPerformance](../apps/ui/iwork/src/app/components/BusinessPerformance/index.tsx)
and the Dashboard. Filters go out as top-level query params via `buildQueryString`, not
`search=`, so `verticalId=3,7` hits DTOs that declare `@Type(() => Number) @IsInt()` →
`Number("3,7")` is `NaN` → 400.

FE
- `businessPerformanceConfig.ts:435` → `multiselect` + `storeSelectedOption`, default `[]`
- `buildQueryString` ([utils/index.tsx:555](../apps/ui/ui-lib/src/lib/utils/index.tsx#L555)) —
  drop empty arrays, unwrap `{value,label}` to CSV
- `stripAllValues` / `cleanedFilters` in `BusinessPerformance/index.tsx` — array-aware

DTOs to widen to a list (CSV → `number[]`, `@IsInt({each: true})`)
- `get-policy-kpi.dto.ts` (new-dashboard-business-performance, quarterly variants)
- `get-tat-summary-query.dto.ts`
- `opportunity-query-param.dto.ts`, `get-pending-activities-summary.dto.ts`
- `get-policy.dto.ts`, `get-endorsement-batches.dto.ts` if the dashboard reaches them

SQL still comparing with `=` (must become `IN`)
- opportunity.repository: `buildFunnelStageQuery`, `getActivityBrokerageSummary`,
  `getEstimatedBrokerageByQuarter`, `getRenewalScheduleBySbu`, `getSalesScheduleBySbu` (8 sites)
- policy.repository: `getTatSummarySnapshot`, `getTatSummarySnapshotBySbu` (2 sites)
- Already array-safe via their local `toArray` helper: the `performance_output` /
  `business_target` aggregates.

Estimate: ~1 day including a pass over every dashboard widget, since one bad DTO 400s a tile.

## Group 3 — org-scope drawer (NEEDS A DECISION, not a config flip)

Pages: Opportunities Enhanced, Renewal Enhanced, Client Portfolio Enhanced, Biz Done Enhanced
(`orgScope/*ScopeConfig.tsx`).

This is not a dropdown. It is a hierarchical card picker — Organisation → SBU → Vertical/Branch
→ Owner — where each level's aggregates are computed for the *one* selected node
(`getScopeSummaryByLevel`, `getPortfolioScopeSummaryByLevel`, `getPortfolioOwnerScopeSummary`).
Multi-select here means deciding what the cards below a multi-selection show and how their
totals combine. That is a UX change, not a type change, so it is excluded until specified.

Note: on these pages the smart search Vertical field is deliberately hidden — the drawer owns
org scope — so Group 1's change does not affect them.
