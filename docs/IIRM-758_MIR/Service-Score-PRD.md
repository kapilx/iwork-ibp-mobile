# Service Score — PRD

**Status:** Draft
**Owner:** Product (Nithin)
**Last updated:** 17-Jul-2026

## 1. Purpose

This document is the **single source of truth for every Service Score formula** in the product. Any screen that displays a service score (always read-only, system-calculated) must derive its numbers from the definitions here. Other PRDs (MIR, My Client Portfolio, future dashboards) reference this document and must not restate or fork the formulae.

Two distinct scoring engines exist today. They share the idea — "how quickly do we complete client-service items, weighted by service importance" — but differ in service list, weights, buckets, and math. This PRD names them and defines each:

| Score | Engine | Surfaces today |
|---|---|---|
| **Service TAT Score** (§3) | `policy-service` `service-tat` module | My Client Portfolio → Service score & Service score details drill-downs |
| **Service Tracker Score** (§4) | `MirReportService` §10 aggregation | MIR report §10 — Our Service Tracker |
| *(dead surface)* | none wired | My Client Portfolio → Companies overview "Service score" column and its smart-search filter — see §3.7 |

They are **not interchangeable**: the same company and month will produce different numbers on the two surfaces. §5 records the divergence; convergence is an open product decision (§7).

## 2. Shared concepts

- **Service item / event** — one unit of work for a client (an endorsement, a claim, a meeting, a report), with a created/requested date and a completed/processed date.
- **TAT (turnaround time)** — `completion date − created date`, in whole days.
- **TAT bucket** — a non-overlapping day range a TAT falls into. Bucket sets differ per score (see each section).
- **Weightage (WTG)** — a fixed per-service weight expressing relative importance. Each score has its own weight scale.
- **Read-only rule** — service scores are system-calculated everywhere; no user role can edit a score, bucket count, or weight from any screen. (MIR CRMs may add free-text Remarks alongside §10 rows — remarks only, per BR-MIR-015.)

## 3. Service TAT Score

**Engine:** `policy-service` `service-tat` module. A daily scheduler aggregates service events into `org_service_tat_summary` per (service, TAT bucket, company, month).

### 3.1 Services & weightages

Eleven services participate; org weightages sum to **1.00**:

| # | Service | Weightage | Event source → TAT measured |
|---|---|---|---|
| 1 | Endorsement | 0.10 | endorsement created → TPA acknowledged |
| 2 | Health Claims | 0.12 | claim date → settlement date (health policy types) |
| 3 | Non Health Claims | 0.12 | same, non-health policy types |
| 4 | MIR | 0.08 | MIR activity created → completed |
| 5 | Quarterly Meeting | 0.07 | meeting created → meeting date |
| 6 | Monthly Meeting | 0.07 | same |
| 7 | Multilateral Meetings | 0.07 | same |
| 8 | Renewal Notice | 0.10 | activity created → completed |
| 9 | Renewal Strategy Report | 0.10 | activity created → completed |
| 10 | QCR Submission | 0.10 | QCR generation activity (60-day expiry window) |
| 11 | Value Added Service | 0.07 | activity created → completed |

### 3.2 TAT buckets (org seed; shared by all 11 services)

| Bucket | Day range | Bucket weight | Compliant? |
|---|---|---|---|
| TAT 1 | 0–7 | 1.00 | Yes |
| TAT 2 | 8–10 | 0.85 | Yes |
| TAT 3 | 11–21 | 0.65 | Yes |
| TAT 4 | 22–30 | 0.40 | No |
| TAT 5 | 31–45 | 0.20 | No |
| TAT 6 | 46–1000 | 0.05 | No |

### 3.3 Monthly summary math

Per service with ≥ 1 event in the month:

```
marks        = (compliantEvents ÷ totalEvents) × weightage
marksScored  = Σ marks                       (across services with events)
totalMarks   = Σ weightage                   (only services that had events — dynamic denominator)
percentage   = marksScored ÷ totalMarks × 100
```

A month with no events at all scores **0**.

### 3.4 Monthly summary display (12 rows, Jan–Dec)

| Column | Formula | Display |
|---|---|---|
| Month | Month key `YYYY-MM` | Month name |
| Marks scored | `marksScored`, 2 dp | Right-aligned |
| Total marks | `totalMarks`, 2 dp (dynamic denominator) | Right-aligned |
| Scored % | `percentage` | `NN.NN%` |
| Indicator | >90 → GREEN, >80 → YELLOW, >70 → ORANGE, else RED (strict boundaries; no-event months ⇒ 0 ⇒ RED) | Colour chip |
| Actions | View details → per-month detail (§3.5) | Button |

### 3.5 Per-month detail math (one row per service, all 11, fixed order)

| Column | Formula | Null rule |
|---|---|---|
| Service name | Display name | — |
| No. of request | `Σ eventCount` across the service's buckets that month | `--` when zero events |
| TAT 1…N | One column per bucket (header shows day range); cell = event count in that bucket | `--` per-bucket when service has no events |
| Scored | `Σ over compliant buckets (eventCount × bucketWeight)`, 2 dp — non-compliant events add requests but zero score | `--` no events |
| Weighted scored | `(Scored ÷ No. of requests) × service weightage`, 2 dp; forced 0 when Scored = 0 | `--` no events / no weightage |
| Max. weightage | The service's org weightage, 2 dp | `--` no events |

Footnote under the table: `"--" indicates that the score is not applicable for this service.`

### 3.6 Access rule

**BR-SS-001 — Company access is CRM-lead-based, not policy-based.** Accessible companies = those whose `leadCrm` is the user or a reportee (or created by them when leadCrm is empty). An out-of-scope company returns all-zero months with HTTP 200 — 12 RED rows, not an error.

### 3.7 Known build gaps

- The Client Portfolio UI hardcodes `year=2025` in the monthly-summary call; the API accepts any year ≥ 2000.
- **Companies overview "Service score" column is dead.** The column reads a `ServiceScore` field the portfolio API never returns, so every row renders `--` (confirmed in production, 17-Jul-2026). Sorting on the column is a visual no-op (falls back to default order, BR-MCP-014).
- **"Service score" smart-search filter is display-only.** The static options (>90%, >80%, >70%, <70%) match the §3.4 indicator thresholds but the filter value is never sent to the backend (BR-MCP-011 in the Client Portfolio PRD).
- **Production drill-down shows an empty grid, not 12 rows.** Observed 17-Jul-2026: the Service score drill-down renders "No data to show" (0 entries), contradicting the specified always-12-rows behavior (§3.4). Root cause unconfirmed — candidates: the hardcoded `year=2025` request paired with the API's response for that year, or the request failing and the table falling back to empty. Needs a dev check of the actual `/service-tat/monthly-summary` response in production.

## 4. Service Tracker Score (MIR §10)

**Engine:** `MirReportService` aggregation inside `policy-service`; rendered as MIR report §10 — Our Service Tracker.

### 4.1 Services & weightages

Fixed list of ten services; weights sum to **100**:

| Service | WTG |
|---|---|
| Endorsement | 10 |
| Health Claims | 15 |
| Non-Health Claims | 15 |
| Held Cover Note | 15 |
| Policy Document | 10 |
| Policy Docket | 5 |
| MIR | 10 |
| Quarterly Meeting | 5 |
| Monthly Meeting | 5 |
| Renewal Notice | 10 |

### 4.2 TAT buckets

TAT = completion/processed date − created/requested date, in days, bucketed (non-overlapping):

| Column label | Actual range |
|---|---|
| <7 Days | ≤ 7 |
| <14 Days | 8–14 |
| <21 Days | 15–21 |
| <30 Days | 22–30 |
| >30 Days | > 30 |

Buckets are **counts only** — unlike §3.2, they carry no score weight.

### 4.3 Row & total math

```
No. of Policy       = "Processed / Total"  (items processed out of total for that service)
Scored (per row)    = (Processed ÷ Total) × WTG    ; 0 when Total = 0
Total Service Score = Σ Scored across all rows      (section footer)
```

Worked example: Endorsement processed 340 of 347, WTG 10 → Scored = (340 ÷ 347) × 10 = **9.80**.

Note the bucket counts do **not** enter the score — a service completed entirely in the >30-day bucket scores the same as one completed same-day. Timeliness is visible but unscored. (Contrast §3, where bucket weights drive the score.)

### 4.4 Known build gaps

- Only 6 services are computed (Endorsement, Health Claims, Non-Health Claims, Held Cover Note, Policy Document, Policy Docket). **MIR, Quarterly Meeting, Monthly Meeting, Renewal Notice** return empty rows (0 / 0, Scored 0), so the Total Service Score is understated until implemented.
- Column labels <14 / <21 / <30 actually mean the ranges 8–14 / 15–21 / 22–30.

## 5. Divergence between the two scores

| Dimension | Service TAT Score (§3) | Service Tracker Score (§4) |
|---|---|---|
| Services | 11 (incl. Multilateral Meetings, Renewal Strategy Report, QCR, VAS) | 10 (incl. Held Cover Note, Policy Document, Policy Docket) |
| Weight scale | Sums to 1.00 | Sums to 100 |
| What the score rewards | Timeliness — compliant-bucket share, bucket-weighted | Throughput — processed share; TAT buckets displayed but unscored |
| Denominator | Dynamic (only services with events that month) | Fixed rows; Scored = 0 when Total = 0 |
| Output | Monthly % with RAG indicator | Points out of ~100 footer total |
| Same service, shared weights? | No — e.g. Health Claims is 0.12 here vs 15 there; Endorsement 0.10 vs 10 |

Consequence: the same company-month will show different "service scores" on My Client Portfolio and in its MIR. Any client-facing communication must name which score it cites.

## 6. Business rules

- **BR-SS-001** — Company access for Service TAT Score is CRM-lead-based (§3.6).
- **BR-SS-002 — Single source of formulae.** All service-score formulae live in this PRD. Screen PRDs (MIR, My Client Portfolio, future surfaces) must link to the relevant section here instead of restating math. A change to any formula is made here first, then propagated.
- **BR-SS-003 — Read-only everywhere.** No screen offers editing of scores, weights, buckets, or counts. MIR §10 Remarks are the only user-entered field adjacent to a score (BR-MIR-015 in the MIR PRD).
- **BR-SS-004 — Two named scores.** UI copy and documents must use the names **Service TAT Score** and **Service Tracker Score** when disambiguation matters; the bare label "Service score" on a screen refers to whichever engine that screen is wired to (per the surface table in §1).

## 7. Open questions

1. Should the two engines converge on one canonical formula (and if so, which)? Today's answer: documented as two distinct scores by product decision (17-Jul-2026).
2. Should MIR §10 adopt bucket-weighted scoring so timeliness affects the score, or is throughput-only intentional?
3. Weightage governance: who owns changes to the two weight tables, and are they org-configurable or seed-fixed?
4. Should the Client Portfolio year filter (currently hardcoded 2025) become user-selectable?

## 8. Referencing PRDs

- **MIR Phase 1 PRD** — §10 Our Service Tracker → this doc §4.
- **My Client Portfolio PRD (IIRM-10749)** — §6.8 / §6.9 drill-downs → this doc §3.
