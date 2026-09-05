# BizDone Report — Applied Filters Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and sources.

**This is the first sheet in the workbook**, ahead of the three Summary sheets. It answers the question every downloaded report otherwise leaves unanswered: *what was this export actually filtered to?* Without it, a workbook sitting in someone's inbox three weeks later is a set of numbers with no stated scope — indistinguishable from a full-company export unless the sender remembered to say otherwise.

## A Real Example

From the production export of 8 Aug 2026 — the whole sheet, exactly as it appears:

| Filter | Value |
|---|---|
| Organisation | IIRM India |
| View by | Manager + Team |
| Income Type | All |
| Financial Year | 2026-2027 |
| Filter by | Income Month |

Five rows for five applied filters. Every other filter the report supports — SBU, Vertical, Department, Branch, Insurer, Policy Type, Broker Agent and the rest — is simply absent, because none was set. This matches the on-screen Smart Search bar one-for-one, which is the point of the sheet.

## Columns

Just two, and no Totals row (explicitly skipped — this sheet is a plain list, not a ledger).

| Field | What it means | Formula / Source |
|---|---|---|
| Filter | The filter's display label, exactly as the user saw it on screen. | The `label` from that field's entry in `bizDoneReportConfig`, or the raw config key if a field somehow has no label. |
| Value | What the user selected for that filter, as displayed. | The resolved display value. Multi-select filters are joined with `", "` into a single row — one row per filter, never one row per selected value. |

## What Gets Recorded, and What Doesn't

**Only filters that were actually applied appear.** A filter left untouched produces no row at all — there is no "No filter applied" placeholder. This is enforced twice: the frontend skips any field whose display value is empty or whitespace, and the backend re-filters on `value.trim() !== ""` when parsing the payload.

**If no filters were applied at all, the sheet is omitted entirely** — the workbook simply starts at Summary-Comp Classification. The sheet is only added to the stream when `appliedFiltersRows.length` is non-zero.

**The labels are resolved on the frontend, not the server.** The frontend sends already-resolved, human-readable labels (the same text shown in the on-screen Applied Filters chips), and the backend stores that JSON verbatim on the export job and replays it into the sheet. There is no server-side ID-to-name lookup, which is what guarantees the sheet matches the on-screen chips exactly rather than re-deriving names that might format differently.

> [!note]
> **"Filter by" (Income Month vs. Business Month) is deliberately included, even though it isn't a filter in the narrow sense.** It doesn't narrow the result set — it changes which date column the query reads (see the parent PRD's Business Rule 2 and Acceptance Criterion 3). It's recorded anyway because it's a real user choice that materially changes what the numbers mean, and its value is derived from the actual mode rather than the stored config value — older saved views can persist it as a bare `"incomeMonth"` string, which would otherwise render wrong.

> [!warning]
> **This sheet records what the user selected, not necessarily what the query used.** Where the two can diverge, the code deliberately errs toward *not* claiming a filter the query never sent: filters dropped by the export's own exclusion logic (for instance, whichever period keys lost a from/to date conflict) are excluded from this sheet too. But two known behaviours in the parent PRD are *not* reflected here — Rewards being silently dropped when certain dimension filters are active (Business Rule 11), and the Rewards sheet ignoring most filters entirely (Business Rule 12). A reader reconciling the Rewards sheet against this one should read those two rules first.

## How It Reaches the File

The export runs as a background job rather than a blocking download, so the filter state has to survive the round trip:

1. On Download Report, the frontend walks `bizDoneReportConfig`, collects each field with a non-empty display value as a `{ filter, value }` pair, and enqueues the export job with that list attached.
2. The backend stores it on the job record as `filtersApplied.appliedFilters` (a JSON string).
3. When the workbook is generated, `parseAppliedFilters()` reads that JSON back, discards any malformed or empty-valued entries, and streams the surviving rows as the `appliedFilters` sheet.

The same parsed rows also drive the one-line summary shown on the Downloads-panel card, truncated to the first six values joined by `·` — so the card and the sheet can never disagree about what was filtered.

## Change History

Added as part of the background-export rework (the same work that moved BizDone downloads off a blocking request and onto the Downloads tray). No changes recorded since introduction.
