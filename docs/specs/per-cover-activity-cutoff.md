# Spec: Per-Cover Activity Cutoff ("show until activity N")

## Problem

Covers (and assets) are configured once at the opportunity level
(`opportunity_cover_map`) and every cover-bearing surface renders the **same full
set** — activity forms, broking slip, placement slip, QCR, the final policy.

Business need: a cover is relevant only up to a point in the pipeline. The user
sets, per cover, **the last activity it should appear in**. It shows in every
activity up to and including that one, and is hidden in everything after.

## Model

A **single ordinal cutoff per cover**, not a per-activity set. Default = shown
everywhere (no cutoff). Set once in the master "Map Cover to Policy Type" screen.

Scope: **new opportunities only.** A cutoff set/changed in master applies to
opportunities created afterwards (it is snapshotted onto `opportunity_cover_map`
at Data Validation). Propagating a change to already-running opportunities is
**deferred** (see end). The column already lives on `opportunity_cover_map`, so
that is later an additive update path, not a redesign.

### Ordering: one named constant

Cover-bearing activities have a stable pipeline order. Defined once in
`libs/service-lib/src/lib/constants.ts` (the index in the array *is* the order):

```ts
// ponytail: hardcoded pipeline order; if cover-bearing activities change,
// update this list. Single source of truth for the cutoff comparison.
export const COVER_BEARING_ACTIVITY_ORDER: string[] = [
  ACTIVITY_KEY.RFP_COVER_DETAIL_ACTIVITY, // "RFP Data Collection" - covers first enter here
  ACTIVITY_KEY.BROKING_SLIP_ACTIVITY,
  ACTIVITY_KEY.QUOTE_ENTRY_ACTIVITY,
  ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY,
  ACTIVITY_KEY.FINAL_NEGOTIATION_ACTIVITY,
  ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY, // policy generated here
  ACTIVITY_KEY.PREMIUM_CALCULATION_ACTIVITY,       // after PSG
];
```

Notes on the order:

- **"RFP Data Collection" is `rfp_cover_detail_activity`** (the step backed by
  `opportunity_rfp_cover_detail`, where covers first appear). The separate
  `rfp_details_entry_activity` ("RFP Details Entry") is **not** cover-bearing and
  is deliberately excluded from the order and the master dropdown.
- **Premium Calculation runs after Placement Slip.**
- **Policy = the post-PSG mirror.** The policy is generated at Placement Slip, so
  the policy render sites filter at the **PSG position**, not the last index. A
  cover whose cutoff is PSG *or later* (e.g. Premium Calculation) appears on the
  policy; a cover cut off before PSG (Broking Slip, QCR, Final Negotiation) is a
  negotiation-only cover and correctly does not.

### The shared filter (the whole feature, mechanically)

An arrow util in `libs/service-lib/src/lib/utils/helper.utils.ts`, reused by
opportunity-service, document-service, and policy-service:

```ts
export const filterCoversByActivity = <
  T extends { visibleUntilActivityKey?: string | null }
>(
  covers: T[],
  currentActivityKey: string
): T[] => {
  const current = COVER_BEARING_ACTIVITY_ORDER.indexOf(currentActivityKey);
  if (current < 0) return covers; // unknown context -> don't filter (fail open)
  return covers.filter((cover) => {
    const cutoff = COVER_BEARING_ACTIVITY_ORDER.indexOf(
      cover.visibleUntilActivityKey ?? ""
    );
    return cutoff < 0 || current <= cutoff; // null cutoff or current within range
  });
};
```

Keep a cover when the current activity is at or before its cutoff. A
null/empty/unknown cutoff means "no limit" (always visible). An unknown current
key fails open (returns all) so a missing render context can never hide
everything.

## Data model

One nullable column, carried through the existing snapshot chain. Null = no
cutoff = visible everywhere (back-compat for all existing covers).

| table                   | column                        | notes                       |
| ----------------------- | ----------------------------- | --------------------------- |
| `mstr_cover_template`   | `visible_until_activity_key`  | varchar null; set in master |
| `opportunity_cover_map` | `visible_until_activity_key`  | varchar null; snapshot copy |

Applied via raw SQL (TypeORM `synchronize` is disabled and the team's convention
is `.sql` scripts, not TypeORM migration classes):
`database-migrations/sql/add-visible-until-activity-key-to-covers.sql`
(`ADD COLUMN IF NOT EXISTS`, idempotent). No backfill — existing rows stay null.

Carry-through (same pattern as every other cover field):

- entities `mstr-cover-template.entity.ts`, `opportunity-cover.entity.ts` (latter
  also takes a trailing constructor arg).
- `cover.repository.ts` `syncMappings` — written on both insert and update
  branches (master save is "desired final state", so it also allows clearing
  back to null).
- `opportunity.repository.ts` `storeCovers` — copied into the new
  `OpportunityCoverMap` rows at Data Validation completion.
- `OpportunityCoverDto` gains `visibleUntilActivityKey?: string | null`, and
  `getOpportunityCovers` / `getPremiumCalculationCovers` **must include it in the
  object they map** (see Gotchas).

## Master UI

`MapCoverStep` -> `MappedCoversPanel` already renders each mapped cover with a
Mandatory dropdown + drag-reorder. Added **one "Show until activity"
single-select per row**, beside Mandatory. No new step, no new master endpoint.

- `MappedCover` type gains `visibleUntilActivityKey?: string | null`.
- Options: `SHOW_UNTIL_ACTIVITY_OPTIONS` in `coverFormConfig.ts` — the
  cover-bearing activities in pipeline order with display labels (first option
  `{ value: "", label: "All activities" }` = null = default). Keep in sync with
  `COVER_BEARING_ACTIVITY_ORDER`.
- The select uses `displayEmpty` so the `""` value renders as "All activities"
  (MUI hides empty-valued selects otherwise).
- Grid gains one column (`MAPPED_GRID_COLUMNS` in `styles.ts`).
- `handleAdd` defaults to null; `handleSubmit` includes `visibleUntilActivityKey`
  in the existing `POST /master/cover-templates/sync` payload; `loadMappings`
  reads it back so edits round-trip. DTO `SyncCoverItemDto` gains the field.

## Render sites that filter (minimal set)

Site 1 (the activity form) is an **entry gate**: for a new opportunity, a cover
not shown in an activity's form never gets a response row in that activity's
detail table. So surfaces that read their *own* entered data (Broking Slip PDF,
Placement Slip PDF) need no filter — they're gated upstream. Only surfaces that
read covers from `opportunity_cover_map` directly, or from *upstream* activity
data, get an explicit filter:

| Surface | Where | Activity key passed |
| ------- | ----- | ------------------- |
| Activity forms (covers meta) | `opportunity.service.ts` `getOpportunityCoversMeta` | resolved per opportunity (see Gotchas) |
| QCR generate | `opportunity.service.ts` `generateQuoteComparisonReport`, at the `getOpportunityCoverDetailsById` resolve | `QUOTE_COMPARISON_REPORT_ACTIVITY` |
| Placement slip / policy excel | `document-service` `excel.service.ts` `findPolicyCovers` | `PLACEMENT_SLIP_GENERATION_ACTIVITY` |
| Policy covers meta | `policy-service` `getPolicyCoversMetaById` | PSG (via helper) |
| Policy covers data | `policy-service` `getPolicyCoversDataById` | PSG (via helper) |

- Site 1 keeps the existing Premium-Calculation special path; the filter runs on
  the resulting `covers` array.
- QCR's authoritative cover list is the `getOpportunityCoverDetailsById` result
  (`opportunity_cover_map` rows, which carry the cutoff); filtering it gates the
  whole report. That method's `select` was extended to include the column.
- The two policy methods share a private helper
  `getCoverTemplateIdsHiddenOnPolicy(templateIds)` that returns the set of
  `OpportunityCoverMap.id`s to hide at the PSG position (fail open for ids with
  no matching cover row).

## Gotchas discovered during implementation

1. **Current activity key must come from `opportunity_activity_map`, not
   `mstr_activity`.** `getOpportunityCoversMeta` receives `activityId`
   (= `mstr_activity.id`/`refActivityId`), but `mstr_activity.activity_key` is
   not reliably populated. Resolve the real key with
   `getActivityKeyForOpportunity(opportunityId, refActivityId)`, which reads
   `opportunity_activity_map.activity_key`. Otherwise the key is empty, `indexOf`
   returns -1, and the filter fails open (shows every cover everywhere).
2. **`getOpportunityCovers` (and `getPremiumCalculationCovers`) remap entities
   into a new object literal** — `visibleUntilActivityKey` must be added to that
   literal, or the filter never sees a cutoff and keeps all covers even though
   the DB column is populated.

## Value carry-forward (unchanged)

Out of scope and untouched. This changes only *which covers render*, not their
stored values or the existing prefill chain. A cover cut off before a later
activity simply isn't shown there; its stored value, if any, is unaffected.

## Deferred: existing in-flight opportunities

A cutoff change reaches **new** opportunities only; running opportunities keep
the value snapshotted at Data Validation. Per-opportunity override and/or
cascade-on-master-edit is deferred — additive later (an update path on
`opportunity_cover_map`), not a redesign.

## Verification

`filterCoversByActivity` logic was verified manually (null cutoff always visible;
visible at/before cutoff; hidden after; fail-open on unknown key). A standalone
unit test was intentionally not kept (minimal-footprint preference); re-add one
if the pipeline order or comparison grows non-trivial.
