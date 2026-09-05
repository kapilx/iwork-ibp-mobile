# Service Score — Client Portfolio · PRD

**Module:** Client Portfolio (iWork MFE) · **Jira:** IIRM-6282
**Route:** `/my-client-portfolio` → Company listing → "View details"
**Backend:** `policy-service`, `service-tat` module
**Created on:** 2026-07-15 · **Status:** Implemented (Phase 1) · **Last updated:** 2026-07-27
**Related:** [Service-Score-TRD.md](./Service-Score-TRD.md) — full technical decision log (D1–D28)

---

## 1. Overview

**Service Score** is a per-company KPI on the Client Portfolio listing that quantifies how well the CRM team is servicing a company across 11 operational services (Endorsement, Claims, MIR, Meetings, Renewals, QCR, VAS), based on how quickly each request is completed relative to a configured turnaround-time (TAT) target.

It appears in three places:

- **Client Portfolio listing** — a "Service score" column showing the company's overall score, computed for the page's companies and embedded directly in the listing API response (no separate call).
- **"View details"** — a 12-month (Apr–Mar) breakdown per company, each month showing its own score plus a per-service, per-TAT-bucket drill-down (`ServiceScoreDetails`).
- **Dashboard** — a "Service Score" scatter plot widget (per-company, per-month), added 2026-07-27 (§9).

The score is **not persisted** anywhere (no `company.service_score` column) — it's computed on the fly from source entities (endorsements, claims, MIR reports, meetings, QCR activity) each time it's requested, scoped to the company's own policies and — as of 2026-07-27 — whatever date range the caller's own filters resolve to (financial year, quarter/month, or an explicit `from`/`to`), not always the full financial year (§5.4).

---

## 2. Data model

| Table | Purpose |
|---|---|
| `mstr_service` | Master list of the 11 trackable services (`service_name`, `service_display_name`, `service_display_order`, `status`). |
| `mstr_org_service_weightage` | Per-organisation, per-service **weightage** — how much each service contributes to the overall score (§3). |
| `mstr_tat_bucket` | Per-organisation **TAT buckets** — day-range tiers used to bucket every completed request, each with its own weight (§4). |
| `service_tat_score_map` | Per-service TAT bucket override, used **only** by the older `/service-tat/monthly-summary` and `/service-tat/monthly-details` endpoints — **not** used by Service Score (see TRD D18). |

Today, only **organisation id 1** has weightage and TAT bucket rows configured (11 and 6 rows respectively) — the feature works for exactly that one org.

---

## 3. Service-level weightage

Each service has a **weightage** (0–100-ish scale, all services for one org sum to 100) representing its maximum possible contribution to that company's score for a given period. Configured in `mstr_org_service_weightage`, keyed by `(org_id, service_id)`.

Current values (org 1):

| Service | Weightage |
|---|--:|
| Endorsement | 4 |
| Health Claims | 10 |
| Non Health Claims | 10 |
| MIR | 10 |
| Quarterly Meeting | 10 |
| Monthly Meeting | 10 |
| Multilateral Meetings | 10 |
| Renewal Notice | 1 |
| Renewal Strategy Report | 15 |
| QCR Submission | 10 |
| Value Added Service | 10 |
| **Total** | **100** |

To change these, edit `mstr_org_service_weightage.weightage_score` — see [`scripts/service_tat_summary_details_schema.sql`](../../apps/services/policy-service/src/app/service-tat/scripts/service_tat_summary_details_schema.sql) for the canonical UPDATE statement (source of truth for these values going forward — keep this script's VALUES list in sync with any future change made directly in the DB).

---

## 4. TAT bucket-level weightage

Every completed request is bucketed by **days elapsed** (`completion date − created date`, see §5) against a shared set of TAT buckets, configured in `mstr_tat_bucket`. Current configuration (org 1):

| Bucket | Day range | TAT weight | Display order |
|---|---|--:|--:|
| TAT1 | 0–7 days | **1** | 1 |
| TAT2 | 8–10 days | 0 | 2 |
| TAT3 | 11–21 days | 0 | 3 |
| TAT4 | 22–30 days | 0 | 4 |
| TAT5 | 31–45 days | 0 | 5 |
| TAT6 | 46–1000 days | 0 | 6 |

**Only TAT1 (0–7 days) carries weight.** In practice this means: a request only "scores" if it's completed within 7 days of being created — everything landing in TAT2–TAT6 contributes 0 to the score, regardless of which bucket it lands in. Bucket labels and day ranges are the same across every service (no per-service override — see TRD D18).

> Note: `mstr_tat_bucket.is_compliant` (currently `true` for TAT1–TAT3, `false` for TAT4–TAT6) is **not** used by this scoring path — it's read by the older `/monthly-summary` endpoint only. Don't infer scoring behavior from it here; only `tat_weight` matters for Service Score.

---

## 5. How the score is calculated

### 5.1 Per service, per period

For a given company and period (a calendar month when viewed in the FY breakdown, or a financial year overall):

1. **Gather events** — every "completed" request for that service in the period (§6 has the exact source table/filter per service).
2. **Bucket each event** — `dayDiff = completionDate − createdDate` (falls back to `endorsement_entry_date` when `created_at` is null, e.g. for migrated endorsement rows), then find the TAT bucket whose `[start_day, end_day]` contains `dayDiff`.
3. **Total** = count of all events for that service in the period, across every bucket.
4. **Scored** = Σ over every bucket of `(bucket event count × that bucket's tat_weight)`. Since only TAT1 has weight 1, this collapses to: **count of events completed within 7 days**.
5. **Weighted Score** (per service) = `Total > 0 ? (Scored / Total) × service weightage : 0`.

Every per-service breakdown in the product — the Client Portfolio's `ServiceScoreDetails` drill-down table **and** the MIR report's §10 "Our Service Tracker" — presents the same 4 metrics per service, in this order:

| # | Column | Formula |
|--:|---|---|
| 1 | **Scored** | `TAT weight × event count`, summed across every bucket |
| 2 | **Total Marks** | Sum of event count across every TAT bucket |
| 3 | **Weighted Score** | `Scored / Total Marks × service weightage` |
| 4 | **Max Weightage** | The service's configured weightage (`mstr_org_service_weightage.weightage_score`) |

### 5.2 Worked example

Reproducing the reference worksheet for one company/period:

| Service | 0–7d | 8–10d | 11–21d | 22–30d | 31–45d | 46+d | Total | Scored | Weightage | Weighted Score |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Endorsement | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 4 | 0 |
| Health Claims | 72 | 5 | 3 | 0 | 0 | 0 | 80 | 72 | 10 | 9 |
| Non Health Claims | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 |
| MIR | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 10 | 10 |
| Quarterly Meeting | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 |
| Monthly Meeting | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 10 | 0 |
| Multilateral Meetings | 0 | 1 | 1 | 0 | 0 | 0 | 2 | 0 | 10 | 0 |
| Renewal Notice | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| Renewal Strategy Report | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 0 |
| QCR Submission | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 |
| Value Added Service | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 |

E.g. Health Claims: `Scored/Total × Weightage = 72/80 × 10 = 9`. MIR: `1/1 × 10 = 10`.

This per-service **Weighted Score** is exactly what the app computes and surfaces in `details[serviceName].weightage_score` (the "View details" drill-down table).

### 5.3 ⚠️ 2026-07-27 update — the month-level "Service score %" is now weightage-based, not a pooled raw-count ratio

Manually summing the Weighted Score column above gives 19 for this example. Per TRD **D26** (superseding D17, direct stakeholder feedback on Phase 1), the month-level `scorePercentage` is now:

```
scorePercentage = (Σ each service's Weighted Score, this month) / (Σ each service's Max Weightage, this month) × 100
                = weightedScoreSum / weightageSum × 100
```

i.e. it now reconciles directly with the per-service Weighted Score table in §5.2 — the headline % *is* the weighted-sum-over-max-weightage for that same table, not a separate pooled raw-event ratio. For the worked example above this gives `19 / 100 × 100 = 19%` (all 11 services' max weightage sums to 100, §3).

This replaces the original pooled formula (`Σ raw Scored / Σ raw Total × 100`, ~86% for the same example) that Phase 1 shipped with and that this section previously documented (see TRD D17/D18 for that formula's own history) — direct stakeholder feedback was that the headline % should agree with the per-service breakdown a user sees on hover/drill-down, not diverge from it.

**Why this matters:** with this formula, the per-row "Weighted Score" in "View details" and the headline "Service score" % **do** reconcile by simple addition (Weighted Score sum ÷ Max Weightage sum), unlike the pooled formula this superseded.

### 5.4 2026-07-27 update — the period-level "Service score" is now an average of its months, and always respects the caller's own filter range

Two related changes (TRD **D26**/**D27**):

- **Client Portfolio listing ("Service score" column)** — the score shown per company is now the **average of the `scorePercentage` of every month in the currently selected filter range**, not a fixed "current financial year" pooled figure. If the listing's Smart Search is filtered to, say, Q1 only, the column reflects the average of Q1's 3 months — not the whole FY. Previously the listing always computed and pooled across the full financial year's 12 months regardless of what the user had filtered to.
- **"View details" 12-month breakdown** — same underlying change: the months rendered, and the headline total, now come from whichever date range the listing's own filter (financial year / quarter / month / explicit from–to) resolves to, instead of unconditionally rendering all 12 FY months. Selecting a narrower filter now shows a narrower set of months, and the FY range picked *for that computation* is derived from the filter, not always defaulted to the current FY.

```
totalServiceScore = average(month.scorePercentage for month in <months in the resolved filter range>)
```

This is a straight arithmetic mean of the (already weightage-based, §5.3) per-month percentages — it is **not** a re-pooling of raw marks across months. A month with very few logged requests counts equally toward the average as a month with many.

**Why this matters:** previously, "Service score" on the listing always meant "this company's whole-FY score," even if the user had filtered the page to a specific quarter or month — visually confusing when every other column on the same row *was* respecting the filter. This was raised as direct user feedback and fixed so the Service Score column behaves consistently with the rest of the filtered listing.

---

## 6. Per-service source mapping

| Service | Scope | Source | Completion filter | Day-diff basis |
|---|---|---|---|---|
| Endorsement | Policy-scoped | `endorsement` (group policies) + `policy_asset_endorsement` (non-group) | `insurer_endorsement_date IS NOT NULL` (group); non-group includes `EXTENSION`-type rows when `endorsement_status != 'ENDORSEMENT_REQUEST_RECEIVED'`, others when `insurer_endorsement_date IS NOT NULL` — see §8 item 1 for the discrepancy vs. the MIR report's own Endorsement rule | `insurer_endorsement_date − created_at` (falls back to `endorsement_entry_date`); non-group `EXTENSION` uses `updated_at − created_at` |
| Health Claims | Policy-scoped | `policy_claim` → `policy` → `policy_type_segregation` → `lookup_data` (`irdai_policy_type_lid`), `value IN ('Health','Life')` | `UPPER(claim_status) = 'SETTLED'` | `updated_at − created_at` |
| Non Health Claims | Policy-scoped | same join, `value NOT IN ('Health','Life')` | `UPPER(claim_status) = 'SETTLED'` | `updated_at − created_at` |
| MIR | Company-scoped | `mir_report` | `status = 'published'` | `updated_at − created_at` |
| Quarterly / Monthly / Multilateral Meeting | Company-scoped | `meeting` → `lookup_data` (type + status) | `meeting_status` `ILIKE '%MEETING_STATUS_COMPLETED%'`, matching `meeting_type` | `completed_at − created_at` |
| QCR Submission | Company-scoped (via opportunity) | `opportunity_activity_map` | `activity_name ILIKE '%QCR Generation%'`, `completed_at IS NOT NULL` | `completed_at − created_at` |
| Renewal Notice, Renewal Strategy Report, Value Added Service | — | *(no source computation yet — Phase 1 scope, TRD D9)* | — | Always reports 0 events; contributes 0 to both Scored and Total. |

"Policy-scoped" services first resolve the company's policies whose period overlaps the requested financial year, then query that service's table by `policy_id IN (...)` — not by event date or `company_id` directly. "Company-scoped" services filter by `company_id` directly.

---

## 7. Where it's implemented

- **`ServiceTatService`** (`apps/services/policy-service/src/app/service-tat/service-tat.service.ts`) — owns the scoring math:
  - `computeSummaryDetailsForCompany` — one company, one period (§5), broken into months; accepts an optional explicit `{ from, to }` range (2026-07-27) that overrides the default full-financial-year month set (`buildMonthsInRange` vs. `buildFinancialYearMonths`).
  - `getSummaryDetailsForCompanies` — batches the above across several companies at once (shares the static service/bucket/weightage lookups), used by the Client Portfolio listing; now also forwards the resolved `{ from, to }` range (§5.4).
  - `getSummaryDetailsForMIRReport` — same formula for a single arbitrary window (used by the MIR report's §10 "Our Service Tracker", not the Client Portfolio listing).
  - `getServiceScoreChartData` (2026-07-27) — one company, resolves months in the requested range, returns `{ companyId, xAxis: label[], yAxis: scorePercentage[] }` for the Dashboard scatter plot (§9).
  - `buildServiceDetails` — the shared per-service calculation (§5.1–5.2), now also returns `weightedScoreSum`/`weightageSum` (used by §5.3's formula), reused by all entry points above.
- **`PolicyService.getPortfolioCompanies`** (`apps/services/policy-service/src/app/policy/policy.service.ts`) — after fetching the current listing page's companies, calls `getSummaryDetailsForCompanies` for just those company IDs and attaches the result as `serviceScoreSummary` on each row. As of 2026-07-27, also resolves the listing's own date-range filter (financial year / quarter / month / explicit from–to, via the shared `resolveSmartSearchDateRange` helper) and forwards it as `{ from, to }` so the embedded score respects whatever the user has filtered to (§5.4). Also supports an optional `serviceScore` threshold query param (`>90`/`>80`/`>70`/`<70`) that filters the already-computed page of rows by `totalServiceScore` server-side.
- **`PolicyService.getServiceScoreChart`** (2026-07-27) — resolves a date range from `{ financialYear, quarter, month, from, to }` (same `resolveSmartSearchDateRange` helper) and calls `getServiceScoreChartData` for one company; backs the Dashboard widget (§9).
- **`CompanyOverView`** (`apps/ui/iwork/src/app/pages/ClientPortfolio/CompanyOverView/`) — "Service score" column reads `row.serviceScoreSummary.totalServiceScore`, now the filter-scoped average per §5.4. Also carries the `serviceScore` threshold filter and a hover tooltip on the column explaining the calculation.
- **`CompanyServiceScore`** (`apps/ui/iwork/src/app/pages/ClientPortfolio/CompanyServiceScore/`) — "View details" renders directly from the embedded `serviceScoreSummary`, with no separate API call and no independent financial-year picker (it inherits whatever range the listing's smart search resolves to). The standalone "FY 2026-2027"-style label in the title was removed 2026-07-27 since the rendered months no longer always correspond to a single financial year.
- **`ServiceScoreDetails`** — per-service, per-TAT-bucket drill-down for a selected month, reading straight from `details[serviceName]`. Column order for the two static-weightage columns was swapped 2026-07-27 (Max. weightage before Weighted scored) and the "‘--’ = not applicable" footnote was removed.
- **`ServiceScoreWidget` / `ServiceScoreScatterChart`** (2026-07-27, new) — Dashboard scatter plot (§9).

---

## 8. Known gaps / open items

1. **EXTENSION-type endorsement handling is inconsistent across the two "Service Score" call sites.** `mir-report.service.ts`'s own §10 computation fully **excludes** non-group `EXTENSION`-type endorsements. `service-tat.repository.ts`'s `getEndorsementEvents` (used by the Client Portfolio path) still **includes** them with special-cased "processed" logic instead. Not yet reconciled — flagging for a follow-up decision on which behavior is correct for Client Portfolio.
2. **Renewal Notice, Renewal Strategy Report, Value Added Service** have no source-entity computation (TRD D9) — they always report 0 events and contribute nothing to the score, despite having non-zero weightage (1, 15, 10 respectively). This caps the maximum achievable score below 100 until these are implemented.
3. **Single-organisation limitation** — weightage and TAT bucket config only exist for `org_id = 1`. A second organisation onboarding this feature needs its own `mstr_org_service_weightage`/`mstr_tat_bucket` rows seeded first.
4. **`totalServiceScore` is response-only** (TRD D3) — not persisted to any `company` column, so it can't be sorted/filtered on server-side (the 2026-07-27 `serviceScore` threshold filter works around this by filtering the already-fetched page in memory, not at the DB layer — it cannot filter across pages), and every listing page load recomputes it live (~7 queries per company on that page — see TRD/PRD discussion during Client Portfolio wiring).
5. **Averaging months with sparse data weighs them equally (§5.4)** — a month with 1 logged request counts the same toward the period average as a month with 200. Flagged as a known property of the new average-of-months formula, not a bug; revisit if it produces counter-intuitive results for low-volume companies.

---

## 9. Dashboard — Service Score scatter plot (2026-07-27, new)

A "Service Score" widget on the main Dashboard (`ServiceScoreWidget`, next to Brokerage to Collect in `BusinessPerformance`), showing one company's monthly `scorePercentage` as a scatter plot (`ServiceScoreScatterChart`, x-axis = month label, y-axis = score %).

- **Company filter is local to the widget** — the Dashboard's global Smart Search has no company field, so the widget renders its own single-company `<select>` (`selectFieldByApi` against `companiesHierarchy`). Nothing renders until a company is picked.
- **Period comes from the shared dashboard filters** — `financialYear`/`quarter`/`month`/`from`/`to`, read from the same `appliedFilters` the rest of the dashboard's widgets already use; only the company selector is new UI.
- **Backend:** `GET /policy/service-score?companyId=&financialYear=&quarter=&month=&from=&to=` → `PolicyService.getServiceScoreChart` → `ServiceTatService.getServiceScoreChartData`, reusing the exact same per-month formula as §5.3/§5.4 (weightage-based `scorePercentage`, filter-scoped months) — no separate calculation path.
- **Empty states:** "Select a company…" (no company chosen), "Loading…", "No Service Score data available for this company" (company chosen, zero months in range).

---

## 10. Change log

- **2026-07-15** — Weightages corrected in `mstr_org_service_weightage` (org 1) to the canonical business values in §3 (previously several services were left at a flat default of 10, or had been set to 0 mid-investigation). Endorsement `created_at`-null fallback to `endorsement_entry_date` added in both `service-tat.repository.ts` and `mir-report.service.ts`. Client Portfolio listing wired to embed `serviceScoreSummary` per company, removing the separate `GET /service-tat/summary-details` endpoint (superseded by the batch `getSummaryDetailsForCompanies` path) — endpoint and its now-unused DTOs/swagger metadata deleted.
- **2026-07-15** — MIR report's §10 table was showing `Scored` mismapped to the weighted value and dropping the raw on-time count entirely; fixed to the standard 4-metric pattern (Scored → Total Marks → Weighted Score → Max Weightage, §5.1) matching the Client Portfolio's `ServiceScoreDetails` table exactly. Removed the unused "Remarks (CRM)" column from §10 in the process.
- **2026-07-27** — **Fix:** month-level `scorePercentage` formula changed from the pooled raw-marks ratio to `weightedScoreSum / weightageSum × 100` so it reconciles with the per-service Weighted Score table (§5.3, TRD D26).
- **2026-07-27** — **Fix:** Client Portfolio listing's "Service score" column now averages the `scorePercentage` of the months in the currently selected filter range, instead of always pooling the full financial year (§5.4, TRD D26).
- **2026-07-27** — **Fix:** "View details" month rows (and the listing's embedded summary) now resolve their month set from the caller's own filter (financial year / quarter / month / explicit from–to) instead of unconditionally rendering all 12 FY months (§5.4, TRD D27). Also added a `serviceScore` threshold filter (`>90`/`>80`/`>70`/`<70`) on the listing endpoint, removed the FY label from the "View details" title, swapped the "Max. weightage"/"Weighted scored" column order in `ServiceScoreDetails`, and dropped its "not applicable" footnote.
- **2026-07-27** — **Feature:** added a "Service Score" scatter-plot widget to the Dashboard (`ServiceScoreWidget`/`ServiceScoreScatterChart`), backed by a new `GET /policy/service-score?companyId=&financialYear=&quarter=&month=&from=&to=` endpoint — one point per month, y-axis = that month's `scorePercentage` (§9, TRD D28).
