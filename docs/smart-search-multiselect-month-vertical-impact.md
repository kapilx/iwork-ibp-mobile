# Smart Search: multiselect Month + Vertical — what it takes, what it breaks

Scope: the shared smart search used by ~10 listings
([smartSearchConfig.ts](../apps/ui/iwork/src/app/Utils/smartSearchConfig.ts) is imported by Policy,
Contact, Endorsement, Claims, Renewal, Manage Quotes, CD Management, Company Overview, Company
Policies, Insured Details).

Headline: **Vertical is cheap (mostly already plumbed). Month is not.** They are two different
problems and should be two different tickets.

## Why they differ

`verticalId` travels inside the generic `search=` string. `month` travels as its own top-level
query param and is silently converted into a *single contiguous date range*.

- [useTableController.ts:164-187](../apps/ui/ui-lib/src/lib/hooks/useTableController.ts#L164-L187)
  already emits `verticalId:[1,2]` for array values.
- [parse.utils.ts:11](../apps/services/service-lib/src/lib/utils/parse.utils.ts#L11) already parses
  `field:[v1,v2]`.
- [entity-service.utils.ts:268-271](../libs/service-lib/src/lib/utils/entity-service.utils.ts#L268-L271)
  already turns array `searchValue` into `IN (:...)`.

So vertical multiselect is a UI type change plus edge-case cleanup.

`month` instead goes `&month=July` → repo `timeFilter` → `getDateRangeWithoutTimestamp()` → one
`{start, end}` → shared `period: {field, from, to}` → one `BETWEEN`
([policy.repository.ts:2397-2406](../apps/services/policy-service/src/app/policy/policy.repository.ts#L2397-L2406),
[entity-service.utils.ts:305](../libs/service-lib/src/lib/utils/entity-service.utils.ts#L305)).
Pick April and December and there is no single range that expresses it. Two months are not a range;
they are a set — that's the whole cost of this feature.

## Vertical — work items

FE
1. `verticalId` → `type: "multiselect"` and default `[]` (config lines 145-159, 223). `MultiSelect`
   already supports `apiDependencies` through the same `useApiSelectField` hook `select` uses, so
   the SBU dependency and options loading keep working unchanged.
2. `useTableController.getSearchQueryParam` drops falsy values with `value !== ""` only — an empty
   array survives and emits `verticalId:[]`. Add an `Array.isArray(v) && !v.length` guard.
3. The `val === "ALL"` short-circuit (line 111) is scalar-only; multiselect needs the "ALL" option
   removed or filtered from the array.
4. Saved defaults are stored as scalars: `systemDefaultConfig.smartSearchValues` /
   `userDefaultConfig.smartSearchValues` and
   [smartSearchPrefill.ts](../apps/ui/iwork/src/app/Utils/smartSearchPrefill.ts), plus dashboard
   drill-throughs that push `location.state.filters`. Feed a string into `MultiSelect` and it
   breaks. One normalizer (`scalar -> [scalar]`, `"" -> []`) applied where defaults are resolved
   covers all of these; no data migration needed.
5. Filter chips / applied-filter counts / breadcrumb filter persistence now carry arrays.

BE
6. Listing endpoints need no change. `mapSearchParams`
   ([helper.utils.ts:275-281](../libs/service-lib/src/lib/utils/helper.utils.ts#L275-L281)) already
   expands `verticalId:[3,7]` into a real array, and `entity-service.utils.ts` turns arrays into
   `IN (...)`. Verified end to end — **zero backend changes for vertical**.
7. The standalone `verticalId?: number` query param (`@IsInt`) on ~10 DTOs (`get-policy-kpi`,
   `get-tat-summary-query`, `get-policy-scope-summary`, `get-endorsement-batches`,
   `company-cd-query`, `claim-list-query`, `opportunity-query-param`, …) is a *different* entry
   point — smart search does not use it. Leave it single-valued until something actually needs to
   send a list there.
8. Business performance / dashboard aggregation already normalizes with a local `toArray` helper
   (e.g. [policy.repository.ts:11774](../apps/services/policy-service/src/app/policy/policy.repository.ts#L11774)),
   so those paths are already multi-ready.

## Month — work items

FE: same as vertical (type, default `[]`, empty-array guard, "ALL" handling, normalizer). The
`&month=` branch stringifies an array to CSV by accident, which is the wire format we want anyway.

BE — this is the real work:
9. `month?: string` with `@IsIn(MONTHS_WITH_QUARTERS_ENUM)` becomes a list in every DTO that has it
   (~10, same services as above), with `{each: true}`.
10. The range derivation must stop being a range. Recommended approach — **do not** generalize the
    shared `period` contract into an array of ranges; that contract sits in
    `libs/service-lib/utils/scope.utils.ts` + `entity-service.utils.ts` and is used by every listing
    in 5 services, so widening it puts every list page in the blast radius of one change. Instead:
    keep the existing financial-year range as `period`, and express the month set as
    `EXTRACT(MONTH FROM main.<dateField>) IN (:...months)` pushed through the `customWhereCondition`
    Brackets that the shared layer already `andWhere`s
    ([entity-service.utils.ts:249-251](../libs/service-lib/src/lib/utils/entity-service.utils.ts#L249-L251)).
    Touches ~5 repositories (policy, opportunity, contact, claim, non-group-claim) and no shared
    contract.
    Caveat: `EXTRACT` on the date column is not index-friendly. The FY range still bounds the scan,
    so this is acceptable for listing volumes; revisit if a page gets slow.
11. Backend also accepts quarter values (`Q1`..`Q4`, `FullYear`) on the same field for other
    surfaces. Multiselect must either reject mixing quarters with months or expand a quarter to its
    three months before building the `IN`. Expanding is less code and fewer error states.
12. Everything else that reads `month` scalar needs a decision, not just a type change: policy KPI,
    TAT summary, service score, pending-activities summary, and the Biz Done / report exports.
    Multi-month changes what a "month" column in those outputs even means.

## Blast radius / risk

- One shared config feeds ~10 listing pages. A regression here is not local — regression pass has
  to cover all of them plus the dashboard drill-throughs that prefill filters.
- Existing saved user/system smart search defaults hold scalars. Handle on read; do not migrate.
- `service-lib` exists twice (`apps/services/service-lib` and `libs/service-lib`) and the policy
  repository imports the `libs` copy by relative path. Any shared-layer edit must land in the copy
  actually imported, or it becomes a runtime no-op rather than a compile error.

## Suggested split

1. **Ticket A — Vertical multiselect.** FE type change + normalizer + empty-array guard + the ~10
   DTOs. Low risk, self-contained.
2. **Ticket B — Month multiselect.** Needs a product answer to item 12 first (what multi-month
   means in KPI tiles and exports) before any code.

Rough effort: A ≈ 1-1.5 days including regression. B ≈ 3 days, more if the KPI/export semantics
change.
