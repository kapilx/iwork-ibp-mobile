# Cut-Off Management · PRD (Revision 3)

**Module:** IIRM-10585_Cut-Off-Mgmt
**Apps:** iWork
**Date:** 2026-07-20 (updated 2026-07-22: Flow 1 narrowed to Placement Slip Generation; Flow 3 unified with Flow 1's cutoff; endorsement field renamed)
**Status:** Draft — awaiting approval; no code changes until approved
**Replaces:** cut-off_PRD.md (Rev 2). This document is self-contained; Rev 2 is retained for history only.

---

## Overview

Cut-Off Management introduces controlled deadlines for two submission-sensitive flows on the IIRM platform: opportunity activity (narrowed to the Placement Slip Generation activity) and endorsement submissions. Brokerage Income Month booking, previously modeled as a third, independent flow, is now understood to be **the same cut-off as Flow 1, applied to a second output field** — not a separate mechanism (see §3 below).

The model is **per-record**: each gated record carries its own cut-off derived from its own dates and a single configurable **buffer** (default 5 days). There is no global monthly gate.

1. **Opportunity / Sales Cut-Off (Flow 1)** — **Phase 1 scopes this to the Placement Slip Generation activity only**, the one opportunity activity with direct financial impact (it drives premium and brokerage booking). Its cut-off is **planned date + buffer**; completions after that are blocked pending a manager override. Other opportunity activities (BD/ISG Planning, KDM Meeting, quote entry, etc.) are **not gated in Phase 1** — see Scope. Reporting always credits an accepted completion to the calendar month of its planned date.

2. **Endorsement Cut-Off (Flow 2)** — each endorsement carries its own window, anchored on its **Endorsement Request Received Date** (the existing `endorsementEntryDate` field, stamped at creation): **Endorsement Request End Date = Endorsement Request Received Date + window days (default 25, prefilled — an Admin can override it)**, and **cut-off = Endorsement Request End Date + buffer (default 5)** — 30 days total by default. Post-cut-off submissions are not blocked; they are accepted and tagged to the next month's insurer cycle. *(Whether this carries an actual premium/financial impact, as Rev 2 assumed, is not yet reconfirmed — see OQ-325. This document no longer asserts a financial-impact claim pending that confirmation.)*

3. **Brokerage Income Month Booking** — **resolved 2026-07-22: this is not a separate flow.** Income Month for a Placement Slip is determined by comparing its generation date against **the same cut-off already computed for Flow 1** (planned date + buffer) — there is no independent monthly accounting calendar, no separate admin screen, and no month-blanking table. If the Placement Slip completes on time (or under an active override), Income Month = Business Month; otherwise, Income Month = the slip's own month. Business Month (= Policy Start month) remains purely informational and is never altered. This collapses what Rev 2 modeled as "Flow 3" into an additional output of Flow 1's existing cut-off computation.

4. **Manager Override** — when a user misses a cut-off, their manager (or Super User) can reopen a submission window for that user: per user, once per cycle, raiser-set duration (default 1 day), auto-revert, fully audited. For a Placement Slip, one override now covers both effects — it unblocks completion (Flow 1) *and* preserves Business Month credit (the Flow 3 concern) in the same action. Overrides never move any date — they open a time-limited window beside the untouched deadline, so the original cut-off stays provable.

---

## Roles

| Role | System Identity | Cut-Off Action |
|---|---|---|
| BD / ISG Executive | iWork user with BD/ISG role | Completes the Placement Slip Generation activity before its cut-off (Phase 1 scope); sees its planned date and a countdown (not the raw cut-off date — see UI); requests overrides |
| Manager | Reporting manager (org hierarchy) | Raises/revokes overrides for direct reportees; receives digests and expiry notifications |
| Super User | `ROLE_SUPER_USER` | Raises/revokes overrides for anyone; configures buffer/window values |
| HR / Corporate Admin | Endorsement submitters | Sees endorsement windows and next-cycle tagging |

Override access is governed by the dedicated **Cut-Off Override** permission category (raise / revoke / view), assignable per role from the existing access-control administration. There is no Finance Administrator role in Phase 1 — the separate monthly income-booking administration this role would have owned no longer exists (see §3, BR-CUT-016).

---

## Scope

### In Scope (Phase 1)

- Cut-off for the **Placement Slip Generation activity only** (planned date + buffer) with block-on-late enforcement — the sole opportunity activity carrying direct financial impact
- **Income Month determination as an additional output of the same Placement Slip cut-off** — no separate monthly ledger or admin screen (resolved 2026-07-22)
- Per-endorsement window (Endorsement Request Received Date + window days) and cut-off (Endorsement Request End Date + buffer), stamp-and-warn
- Manager override (raise, revoke, auto-revert, notifications) for Placement Slip and Endorsement flows
- Reporting postmark: reports bucket by planned-month tag, not raw timestamps
- Single Cut-Off Management UI page (Overrides) + per-record countdowns
- Go-live grace and staged enforcement for existing data

### Out of Scope (Phase 1)

- **Cut-off gating for any opportunity activity other than Placement Slip Generation** — BD Planning, ISG Planning, KDM Meeting, quote entry, and all other activity types are ungated in Phase 1.
- **Derived planned dates for BD/ISG Planning** and the **RO opportunity-level expiry/cut-off chain** derived from policy expiry — both existed only to support gating planning-stage activities, now deferred.
- Sales vs. Renewal Opportunity distinctions for Flow 1 — moot: Placement Slip is gated the same way regardless of opportunity type.
- **A separate monthly income-booking admin screen (blank/reinstate a calendar month)** — removed. Income Month now follows the Placement Slip's own cut-off/override; there is nothing to administer at the calendar-month level (resolved 2026-07-22, was BR-CUT-016 in the original design).
- Placement Slip Date becoming system-generated/immutable — it is currently manually entered; Phase 1 accepts this and documents the gap rather than requiring a fix (see BR-CUT-015, OQ-324).
- IBP-side visibility or enforcement
- Weekend/holiday adjustment of cut-off dates (applies on the literal day)
- Non-email notification channels

---

## Configuration

All values are org-level settings, changeable by Super Admin only, prospective (in-flight records keep the deadline they were created with; recomputation is OQ-313).

| Setting | Default | Drives |
|---|---|---|
| **Cut-off buffer days** | 5 | Placement Slip Generation activity cut-off (planned + buffer) · the same cut-off's Income Month determination · Endorsement cut-off (Endorsement Request End Date + buffer) |
| **Endorsement window days** | 25 (prefilled) | Endorsement Request End Date (Endorsement Request Received Date + window) |
| **Override default duration** | 1 day | Pre-filled override window length; raiser can change per override |
| Flow enable toggles | off | Dark-ship switches per flow |

The buffer is **one shared value** driving both the Placement Slip cut-off (and its Income Month determination) and the endorsement cut-off. A per-flow split is deliberately not offered in Phase 1. There is no separate "income-booking month cut-off" setting — that concept is removed (§Overview, point 3).

---

## Lifecycle

### Flow 1 — Opportunity activity (Placement Slip Generation only, Phase 1)

```
Placement Slip Generation activity planned (plannedAt set)
        │
        ▼
plannedAt + buffer (EOD IST)  =  cut-off
        │
   ┌────┴─────────────────────────────┐
   │ completed ≤ cut-off              │ completed > cut-off
   │ (or under active override)       │
   ▼                                  ▼
Accepted                          BLOCKED → manager override
Credited to planned month             │ (window opens, user completes)
Income Month = Business Month         ▼
                                  Accepted, credited to planned month,
                                  Income Month = Business Month
                                  (window expires unused → stays locked)
```

No other opportunity activity type is gated in Phase 1, and there is no opportunity-level (RO/SO) cut-off chain — both deferred (see Scope). The effective gate is simply the activity's own cut-off, ANDed with the existing Lost freeze.

This same cut-off now also determines **Income Month** (formerly "Flow 3", see below) — one comparison, two outputs.

Note the population this actually governs: on the dev copy, only 939 of 42,474 open Placement Slip Generation activities carry a planned date at all (OQ-304a) — the majority are not yet gateable under this rule as it stands.

### Flow 2 — Endorsement

```
Endorsement Request Received Date (existing field, stamped at creation)
   + window days (25, prefilled)  →  Endorsement Request End Date
   + buffer (5)                   →  endorsement cut-off     (30 days total)

submitted ≤ cut-off  →  current insurer cycle
submitted > cut-off  →  ACCEPTED, tagged next month's cycle (financial impact: OQ-325, not yet reconfirmed)
```

An Admin with the privilege may move the Endorsement Request End Date (it is a prefill, not fixed); the cut-off follows. An active override (flow = ENDORSEMENT) keeps the submission in-cycle as if the cut-off had not passed.

### Income Month Determination (formerly "Flow 3" — resolved 2026-07-22)

At Placement Slip generation, compare the slip's generation date against **the same cut-off Flow 1 already computes** (planned date + buffer):

- Slip date ≤ cut-off, **or** an active override covers this Placement Slip → **Income Month = Business Month**
- Slip date > cut-off, no override → **Income Month = the slip's own month**

Business Month = Policy Start month, always, informational, never altered. There is no separate monthly cut-off table and no month-blanking administration — the escape hatch for a late slip that should still book to Business Month is the **same manager override** used to unblock the activity itself, not a finance-administered calendar exception.

Placement Slip Date is **currently manually entered** (not system-generated). This is accepted for Phase 1; it is a known gap (a user could theoretically enter a date that games the comparison) and is flagged rather than fixed (OQ-324).

### Manager Override

Raise (target user, flow, duration, mandatory reason) → window opens → target user submits within window (credited as if on time; for Placement Slip, this also secures Business Month credit) → window auto-expires and re-locks → raiser notified with submission count. Early close via revoke. Once per user per cycle (cycle anchor: OQ-303).

---

## User Stories

### Visibility

- As a BD/ISG Executive, I see the Placement Slip Generation activity's **planned date** (not the raw cut-off date) and a countdown on the activity itself, so I know when it's due without the system exposing the derived deadline as a separate field.
- As an HR/Admin, I see each endorsement's Endorsement Request End Date and cut-off with a days-remaining indicator.

### Enforcement

- As the system, I block Placement Slip Generation completions after the activity's cut-off with a message directing the user to their manager.
- As the system, I accept post-cut-off endorsement submissions but tag them to the next month's cycle.
- As the system, I credit every accepted Placement Slip completion to the calendar month of its planned date, and set its Income Month to Business Month.
- As the system, when a Placement Slip is generated after its cut-off with no override, I set its Income Month to the slip's own month instead of Business Month.

### Manager Override

- As a Manager, I raise an override for a direct reportee with a duration and reason; as a Super User, for anyone.
- As a Manager, I revoke an active override early.
- As the system, I re-lock automatically when the window expires and notify the raiser with how many submissions were recorded.

### Configuration & Administration

- As a Super Admin, I change the cut-off buffer days and endorsement window days, prospectively.

### Audit

- As a Compliance user, I can reconstruct for any override: who raised it, for whom, when, window, reason, who revoked it; and for any moved Endorsement Request End Date: old value → new value, actor, timestamp.

---

## Business Rules

**BR-CUT-001 — The buffer is configurable and shared**
The cut-off buffer (default **5 days**) is a single org-level value configurable by Super Admin only. It drives the Placement Slip Generation activity's cut-off (and the Income Month determination that reuses it) and the endorsement cut-off. Endorsement window days (default 25) is configured the same way. Changes are prospective.

**BR-CUT-002 — Cut-off is visible per record (as a countdown, not a raw date, for Placement Slip)**
The Placement Slip Generation activity shows its planned date and days remaining; the underlying cut-off date is not surfaced as a separate UI field. Each endorsement shows its Endorsement Request End Date and cut-off explicitly. All deadlines are IST end-of-day.

**BR-CUT-003 — Placement Slip Generation is blocked after cut-off**
After the Placement Slip Generation activity's cut-off passes, completion is blocked and the user sees:
> *"The cut-off date for this activity has passed. Contact your manager to request an extension."*
No partial saves are permitted once the gate is active. No other opportunity activity type is subject to this rule in Phase 1.

**BR-CUT-004 — Period bucketing follows the planned date**
An accepted completion (in time or under override) is credited to the calendar month of the activity's planned date. `completedAt` is preserved untouched; reporting reads the period tag, never the raw timestamp.

**BR-CUT-005 — Only managers or above may raise an override**
Override access is governed by the **Cut-Off Override** permission category. A manager may raise only for direct/indirect reportees (org hierarchy); Super Users for anyone. Unauthorized attempts return:
> *"You do not have permission to override the cut-off for this user."*

**BR-CUT-006 — Override window is time-limited**
Per user, at most once per cycle (anchor: OQ-303). Raiser sets the duration; default 1 day. Window start/end are visible to both manager and target user.

**BR-CUT-007 — Submissions within an override window count as on-time**
Placement Slip completions during the window credit the planned month and Business Month; endorsement submissions stay in the current cycle.

**BR-CUT-008 — Auto-revert**
The gate re-locks automatically when the window expires; no manual action. The raiser is notified with the count of submissions recorded.

**BR-CUT-009 — Notifications (email)**
Pre-cut-off reminders to owners of open Placement Slip activities approaching their cut-off; override-raised notice to the target user; override expiry warning and post-revert summary to the raiser.

**BR-CUT-010 — Full audit trail**
Every event is logged and immutable: override raised/revoked (actor, target, window, reason), date changes (old → new), blocked attempts (OQ-312 — resolved: yes, persist), month/config changes.

**BR-CUT-011 — No weekend/holiday adjustment**
Cut-offs apply on the literal day.

**BR-CUT-012 — Post-cut-off endorsements roll to the next month's cycle**
Accepted, tagged to next month's cycle. Included in the next month's insurer batch. Endorsements are never hard-blocked by the cut-off. *Whether this carries a financial/premium impact is not yet reconfirmed — this document no longer asserts that claim (OQ-325).*

**BR-CUT-013 — Business Month is fixed by Policy Start Date**
Informational, never altered by cut-off logic.

**BR-CUT-014 — Income Month determination (resolved 2026-07-22: same cut-off as Flow 1, not a separate calendar)**
Slip date ≤ the Placement Slip Generation activity's own cut-off (or covered by an active override) → Income Month = Business Month. Slip date after the cut-off, no override → Income Month = the slip's own month. There is no independent monthly cut-off row and no "blanked month" state — see BR-CUT-016.

**BR-CUT-015 — Placement Slip Date is currently manually entered (gap, accepted for Phase 1)**
Unlike the original design assumption (system-generated, immutable), the Placement Slip Date is user-entered today. This is a known limitation: it could in principle be entered to favor a particular Income Month outcome. Phase 1 accepts this without adding a lock or additional validation; revisit if abuse is observed (OQ-324).

**BR-CUT-016 — Deferred / removed (was: Monthly cut-off administration)**
*Originally: an admin screen listing accounting months with individually blankable/reinstatable cut-offs (default 5th of following month). Removed 2026-07-22 — Income Month determination now reuses the Placement Slip's own cut-off (BR-CUT-014); there is no monthly ledger to administer. Retained here, unnumbered-out, in case a future phase reintroduces a genuinely separate finance calendar.*

**BR-CUT-017 — Per-activity cut-off (Placement Slip Generation, Phase 1)**
The Placement Slip Generation activity's cut-off = planned date + buffer days, 23:59:59 IST. Instances without a planned date are not gated at all in Phase 1 (OQ-304a — currently the majority of open instances). No other activity type carries a cut-off in Phase 1. This is also the cut-off Income Month determination reuses (BR-CUT-014).

**BR-CUT-018 — Deferred (Out of Scope, Phase 1)**
*Originally: derived planning dates on ROs (BD/ISG Planning planned date = policy expiry − planning lead days). Deferred along with planning-activity gating generally — see Scope.*

**BR-CUT-019 — Deferred (Out of Scope, Phase 1)**
*Originally: RO opportunity-level expiry/cut-off chain, gating all activities on the opportunity. Deferred — Phase 1 gates only the Placement Slip Generation activity's own cut-off.*

**BR-CUT-020 — Backdated entry is always possible (creation floor)**
The effective cut-off of any gated record is `GREATEST(planned date, record creation date) + buffer`. A Placement Slip Generation activity entered today about past-month business therefore always gets at least one full buffer from the moment it enters the system — the cut-off governs *which period gets credit (and which Income Month)*, never *whether the data can be entered*. Which month a born-late completion credits is OQ-315. The go-live grace floor (§Go-Live) is this same rule with the go-live date acting as the creation date for pre-existing records.

---

## Acceptance Criteria

1. A Placement Slip Generation activity completed at or before `plannedAt + buffer` (EOD IST) is accepted, postmarked to the planned month, and its Income Month is set to Business Month.
2. A Placement Slip Generation completion attempted after its cut-off is rejected with the BR-CUT-003 message and a structured error code.
3. No other opportunity activity type (BD Planning, ISG Planning, KDM Meeting, etc.) is blocked or postmarked by this feature in Phase 1 — their completion behavior is unchanged from today.
4. A Placement Slip generated after its cut-off with no active override sets Income Month to the slip's own month, not Business Month. Business Month itself is never altered.
5. Changing the buffer days setting changes deadlines (and the Income Month comparison) only for records created after the change.
6. An endorsement's Endorsement Request Received Date defaults to today; Endorsement Request End Date prefills to received date + window days, editable by an Admin; cut-off = End Date + buffer; submission on cut-off day is in-cycle, the day after is tagged to next month's cycle.
7. An override raised by a non-manager for a non-reportee is rejected with the BR-CUT-005 message; by a manager for a reportee it succeeds, notifies the target, and appears in the overrides list.
8. A Placement Slip completion during an active override window is credited as on-time (planned month + Business Month); after expiry the gate blocks again without any manual action and the raiser receives the summary.
9. Revoking an override closes it immediately; the row remains listed with its revoked timestamp.
10. All reports bucket stamped Placement Slip and endorsement records by period tag; unstamped (pre-feature) records behave exactly as before.
11. Every acceptance path and blocked attempt is reconstructable from the audit trail per BR-CUT-010.

---

## Examples

**EX-OPP-01 — In-buffer completion (Placement Slip Generation)**

| Field | Value |
|---|---|
| Planned date | 28 Apr 2026 |
| Cut-off | 3 May 2026, 23:59:59 IST |
| Completed | 2 May 2026 |
| Result | Accepted; credited to **April**; Income Month = Business Month |

**EX-OPP-02 — Early-month Placement Slip locks early**

| Field | Value |
|---|---|
| Planned date | 3 Apr 2026 |
| Cut-off | 8 Apr 2026 EOD IST |
| Attempt | 10 Apr 2026 |
| Result | **Blocked** — override required, even though April is still running |

**EX-OPP-03 — Boundary precision**
Cut-off 8 Apr 23:59:59 IST. Completion at 23:58 IST → accepted. Completion at 00:01 IST on 9 Apr → blocked. To-the-minute enforcement.

**EX-OPP-04 — Deferred (Out of Scope, Phase 1)**
*Originally illustrated the RO opportunity-level expiry/cut-off chain. Deferred along with BR-CUT-018/019 — see Scope.*

**EX-OPP-05 — Override lifecycle (Placement Slip Generation)**
Cut-off passed 8 Apr. Manager raises override 10 Apr 10:00 with 2-hour window. User completes the Placement Slip 11:30 → accepted, credited April (planned month), Income Month = Business Month. 12:00 → auto-relock; manager notified "1 submission recorded". A second attempt at 12:30 is blocked.

**EX-OPP-06 — Override raised, unused**
Window expires with no submission. The activity stays locked; audit records the override with zero submissions; whether a second override is allowed depends on OQ-303.

**EX-END-01 — Endorsement window (window = 25, buffer = 5)**

| Field | Value |
|---|---|
| Endorsement Request Received Date | 1 May 2026 |
| Endorsement Request End Date | 26 May 2026 (prefilled) |
| Cut-off | 31 May 2026 |
| Submitted 29 May | Current cycle |
| Submitted 2 Jun | Accepted, tagged to **next month's** cycle |

**EX-END-02 — Admin moves the Endorsement Request End Date**
Admin overrides the 25-day prefill, moving End Date 26 May → 5 Jun: cut-off follows to 10 Jun. Old → new date captured in the audit trail with the actor.

**EX-INC-01 — Income Month determination (resolved 2026-07-22 logic)**

| Field | Value |
|---|---|
| Policy Start (Business Month) | 18 Apr 2026 → **April** |
| Placement Slip planned date | 20 Apr 2026 |
| Placement Slip cut-off | 25 Apr 2026 EOD IST |
| Slip generated 23 Apr | Within cut-off → **Income Month = April** (Business Month) |
| Slip generated 28 Apr, no override | Past cut-off → **Income Month = April** (the slip's own month — happens to coincide with Business Month here) |
| Same case, but Policy Start was in **March** | Slip generated 28 Apr past cut-off → **Income Month = April** (slip's own month), diverging from Business Month (March) |

There is no month-blanking step in this version — a late slip that should still credit Business Month requires a manager override on the Placement Slip itself (same mechanism as unblocking Flow 1), not a separate finance action.

---

## User Interface

### One page: Cut-Off Management

A single **Cut-Off Management** page (iWork sidebar), permission-gated:

| Tab | Content | Visible to |
|---|---|---|
| **Overrides** | Overrides listing (flow, user, cycle, window, reason, status), Raise Override action, Revoke action | Cut-Off Override: view (list), raise, revoke (actions) |

Phase 1 ships a single tab — the "Income Booking Cut-Offs" tab from the interim build is removed along with the separate monthly admin concept (§Overview). The page remains tab-structured for extensibility if a later phase adds content. Table settings and Save view apply to the Overrides tab.

### In-flow surfaces

- **Placement Slip Generation activity card**: planned date + days-remaining countdown (not the raw cut-off date); locked state renders the BR-CUT-003 message inline.
- **Endorsement page**: Endorsement Request End Date + cut-off + days remaining; next-cycle tagging banner on late submission.
- Blocked completion attempts surface the structured error as a toast with the BR-CUT-003 message.

---

## Backdated & Late Data Entry

Real business is often fed into the system after the fact — May's deals keyed in during July. The system must stay flexible for this, so the design separates two concerns: **data entry is never blocked; period credit (and Income Month) is what the cut-off controls.**

| Flow | Backdated entry | Period credit |
|---|---|---|
| Flow 1 — Placement Slip planned in a past month, created today | Allowed; BR-CUT-020 gives it a buffer from creation | Default: current month (closed MIS stays closed). Crediting the old planned month requires a manager override (OQ-315) |
| Flow 1 — Placement Slip completed after its cut-off (record predates the miss) | Completion blocked (BR-CUT-003) | Override reopens; credited to planned month + Business Month (BR-CUT-007) |
| Flow 2 — endorsement with a past effective date | Allowed; window anchored on Endorsement Request Received Date, not any effective date, so it is never born late | In-cycle if within its own window; else tagged to next month's cycle — never blocked |
| Income Month — placement slip generated today for old business | Always allowed (no lock on slip date — BR-CUT-015) | Books current month by default (past its own cut-off); booking back into the old Business Month requires an override on that Placement Slip |

The dividing line: routinely late data lands in the **current** period automatically; landing it in a **closed** period is always a deliberate, audited act (an override) by someone with the authority to change reported history.

---

## Go-Live & Legacy Data Strategy

Measured on the dev copy, scoped to Phase 1's actual gate — Placement Slip Generation only (2026-07-20): **42,474 open Placement Slip Generation activities**, of which only **939 carry a planned date** (OQ-304a — most aren't gateable yet at all), and **896 of those 939 (95%) are already past planned + 5 days**, across **7 owners**. This is a dramatically smaller and more tractable population than an all-activities gate would have produced (an earlier, wider measurement found 11,718 overdue across 48 owners). **21,647 of 21,744 endorsements still have no window at all** (Flow 2 is unaffected by the Flow 1 scope change).

Layered mitigation:

1. **Grace floor (no data mutation)** — for Placement Slip and endorsement records existing before go-live: `effective cut-off = GREATEST(derived cut-off, go-live + grace days)`. Grace length: OQ-309 (suggested **10–15 days** given the small 896/7-owner backlog).
2. **Postmark guard** — pre-go-live Placement Slips completed during grace are postmarked to their **completion month**, not the planned month, so old backlog cannot rewrite closed MIS months.
3. **Staged enforcement** — Phase A stamp-only (dark; the current build's state) → Phase B warn-only with countdowns and would-have-blocked notices → Phase C enforce, with the enforcement date announced during Phase B.
4. **Would-lock digest** — before Phase C, the 7 affected managers receive a digest of reportees' Placement Slip activities that will lock — small enough to be a direct, named conversation.
5. **Backlog disposition (OQ-310)** — with only ~896 items across 7 owners, a supervised bulk-close or short team-led review is realistic within Phase 1's timeline.
6. **Override cadence during transition** — at this scale, the once-per-cycle cap is unlikely to bind even without an exemption.

### Recommended rollout

| Phase | Duration | What happens | Override exposure |
|---|---|---|---|
| 0 — Dark | current state | Placement Slip and Endorsement flows deployed behind toggles; postmarks accumulate; zero user impact | None |
| 1 — Measure & clean | ~1 week | Sizing report for the 7 affected owners; supervised, audited close-out of the 896-item Placement Slip backlog. `plannedAt` is never mutated | None |
| 2 — Warn-only | 1–2 weeks | Countdowns + "would have been blocked" notices; would-lock digest to the 7 managers; remaining items closed or consciously left | None (no gate yet) |
| 3 — Enforce + grace | ongoing | Gate on, with `effective cut-off = GREATEST(own cut-off, go-live + 10–15 days)`. Nothing pre-existing locks at the flip | Only genuine new misses |

Endorsements require no phased enforcement: Flow 2 is stamp-and-warn and never blocks.

---

## Override & Change Tracking

| Event | Record | Old → new? |
|---|---|---|
| Override raised | `cut_off_override` row (raiser, role, target, cycle, window, reason, created_at); rows never deleted | n/a (creation) |
| Override revoked | `revoked_at` on the row + field-level audit log | Yes, with actor |
| Endorsement Request End Date moved | Field-level audit (entity already auditable) | Yes |
| Buffer/window config changed | Lookup change (audit: OQ-311 scope) | — |
| Blocked attempt | **Resolved — persist it** (OQ-312) | — |
| Placement Slip `plannedAt` edited | **No trail today** (activity table not auditable) — OQ-311 | — |
| Placement Slip Date entered/edited | **No trail today** — flagged gap, BR-CUT-015 | — |

Design note: overrides deliberately never move dates — they open a window beside the untouched deadline, keeping the original cut-off provable in any dispute.

---

## Data Contract (summary — full design in the Tech Spec revision after approval)

**Consumed:** Placement Slip Generation activity's `plannedAt`/`completedAt`/owner/slip generation date; policy start date (Business Month); endorsement `endorsementEntryDate` (Endorsement Request Received Date) / Endorsement Request End Date; org hierarchy (`users.reporting_user_id`); role/ACL assignments.

**Produced:** the Placement Slip's cut-off (computed, not stored); period tag (postmark) on Placement Slip and endorsement records; Income Month (derived from the same cut-off — no longer a separately configured value); `cut_off_override` rows; audit events; email notifications.

**Migrations expected (delta on the Rev 2 build):** endorsement window default 30 → 25 (backfill formula amended pre-run; OQ-308 for envs already backfilled at +30), config keys for buffer/window days, grace-floor go-live parameter, blocked-attempt log (OQ-312, resolved to build). The **monthly income-booking cut-off table and its admin screen (Rev 2's original Flow 3 plan) are removed from scope** — no migration needed for it.

**Deliberately no new deadline columns:** the Placement Slip cut-off is computed at read time from stored inputs (`plannedAt`, creation date) + the current buffer config.

---

## Gap Analysis — What Else Is Needed

Everything above answers "what should the system do." This section is the product-owner pass: what has to exist *around* the system for the feature to actually work in production.

### 1. No success metric is defined

*Needed:* a small metrics set — % of Placement Slips completed within their own cut-off (pre- vs post-launch), override-raise rate per manager per month, average time-to-override-resolution, and the backlog burn-down curve during Phases 1–2 (OQ-316).

### 2. Day-one permission assignment is undefined

The **Cut-Off Override** ACL category ships with actions seeded but **no role assigned to it**. On launch day, if nobody has explicitly assigned RAISE/REVOKE to the Manager role, **not one manager can raise an override**, even though users are already being blocked.

*Needed:* an explicit go-live checklist item — assign RAISE+REVOKE+VIEW to the Manager role and REVOKE+VIEW to Super User, verified in a lower environment, before Phase 3 begins (OQ-317).

### 3. Manager unavailable / org-hierarchy gaps have no escalation path

*Example:* a BD executive's manager is on a 2-week vacation; the executive's Placement Slip locks during that window. *Needed:* an escalation rule or SLA for unattended blocked activities (OQ-318).

### 4. Employee exit / deactivation with open, gated work

*Needed:* a rule for who inherits a departing employee's locked Placement Slips, and whether the gate still applies to them (OQ-319).

### 5. Cancelled/Lost opportunities and the gate

*Needed:* explicit rule — Lost/cancelled records are excluded from gating and from the would-lock digest (OQ-320).

### 6. The CRM integration path bypasses the gate entirely

`AclGuard` exempts `roleKey === "PORTAL_CRM"`. If Placement Slips can be completed through that integration, they skip the gate by construction.

*Needed:* confirm whether that's acceptable, or whether the integration needs its own check (OQ-321).

### 7. Downstream consumers beyond MIR/funnel reports aren't enumerated

*Needed:* an audit pass across commission/incentive services and any external export for both `reportingPeriod` and the now-shared Income Month logic (OQ-322).

### 8. No training, communication, or UAT plan

*Needed:* a UAT phase with named testers signing off before Phase 3; a user FAQ linked from the blocked-toast message; a support runbook.

### 9. Approval ownership is still blank

The Approval table at the end of this document has no names in Product. Nothing above can move to the tech-spec stage without an accountable owner per row.

---

## Open Questions

Each question below states why it matters and walks a concrete example.

### OQ-301, OQ-302, OQ-306, OQ-307 — Deferred (moot for Phase 1)

All four concerned gating BD/ISG Planning activities and deriving an RO/SO opportunity-level cut-off chain — machinery that existed only to support planning-stage gating, which is now out of scope. Retained here (not deleted) for a later phase.

### OQ-303 — Override cadence: once per user per *what*? *(Product)*

*Example:* Priya misses the cut-off on the Placement Slip for Opportunity A and also has a locked endorsement. Options: **(a) per user per calendar month** — one override covers everything open; **(b) per user per record** — a separate override per opportunity/endorsement; **(c) per activity instance**. (a) is closest to Rev 2's intent and the current unique index; at Placement-Slip-only scale, (b) is also workable.

### OQ-304 — Placement Slip activities with no planned date: gated or not? *(Product)*

Of **42,474 open Placement Slip Generation activities, only 939 (2%) carry a planned date.** Options: **(a)** ungated until a planned date is set (current assumption, BR-CUT-017); **(b)** default planned date derived from creation, which would newly gate the other 41,535 instances — a much bigger rollout than §Go-Live's 896-item backlog suggests.

### OQ-304a — Is the 98% missing-planned-date rate itself a data-quality gap? *(Product / Eng)*

Is planning simply not practiced for Placement Slip today, or is the field not surfaced/required in the current UI? If the latter, a UI fix might matter more than any cut-off decision.

### OQ-305 — Is the Placement Slip's planned date editable after it's set? *(Product)*

*Example:* Placement Slip planned 2 Jul, cut-off 7 Jul. On 6 Jul, the user edits the planned date to 20 Jul — unlocked, no manager involved. Options: **(a)** edits require a reason and are audited; **(b)** only managers/admins may move it; **(c)** freely editable, no audit.

### OQ-308 — Endorsement 30 → 25: what happens to in-flight endorsements? *(Product / Eng)*

*Example:* an endorsement with Request Received Date 1 Jul under the 30-day rule shows End Date 31 Jul (cut-off 5 Aug). Rev 3 ships 20 Jul with window = 25. Options: **(a)** grandfather — only endorsements received after the change get the 25-day prefill (the PRD's assumption); **(b)** re-window in-flight endorsements — deadline moves earlier mid-flight, felt as a rug-pull.

### OQ-309 — Go-live grace length? *(Product)*

Measured backlog, scoped to Placement Slip Generation only: **896 overdue open activities across 7 owners**. Suggested: **10–15 days**, confirmed against the Phase 1 sizing report.

### OQ-310 — Backlog disposition before enforcement? *(Product / Ops)*

At 896 items across 7 owners, the 7 managers can plausibly review their own lists directly — no bulk tooling needed, though a light supervised bulk-close remains an option. Bulk-editing `plannedAt` is **rejected** — the postmark follows it, so it would rewrite MIS history. Note: this sizing changes materially depending on OQ-304's answer.

### OQ-311 — Tracking `plannedAt` and Placement Slip Date changes (old → new, who, when)? *(Product / Eng)*

`opportunity_activity_map` is not auditable; making the whole table auditable would flood the log. *Needed:* a targeted audit at the specific edit endpoints (planned date, and now also Placement Slip Date given BR-CUT-015's accepted gap).

### OQ-312 — RESOLVED — Persist blocked attempts

**Resolution:** yes, persist (user, activity, attempted-at, the cut-off that blocked). This also supports the requested second stat: alongside the raw per-instance log, expose a **derived aggregate** — "N blocked attempts this cycle" per user — computed from that log and surfaced in the override-raise dialog, so a manager sees both the evidence (the list) and the headline number at a glance. *(Flagging: I inferred "one more stat" as this aggregate count — confirm if you meant something else, e.g. days-overdue-at-block instead of/in addition to it.)*

### OQ-313 — Config change: prospective or recomputed? *(Product — decides a schema question)*

BR-CUT-001 says config changes are prospective, but a read-time-computed cut-off is inherently retroactive if the config changes. *Example:* buffer 5→7 on 15 Jul; an activity planned 12 Jul had cut-off 17 Jul. Recompute → silently becomes 19 Jul. Strictly prospective → needs a snapshot column per gated table.

### OQ-314 — RESOLVED — Endorsement window anchor date

**Resolution:** the anchor is the **Endorsement Request Received Date** (existing `endorsementEntryDate` field, stamped at creation). Field label: **Endorsement Request End Date**. Logic: +25 days prefill, +5 days buffer to cut-off. Chosen over an effective-date anchor because Received Date is the only one the submitter controls — an effective-date anchor could produce endorsements born with their window already partially or fully elapsed.

### OQ-315 — Born-late completions: which month gets credit? *(Product / Finance)*

*Example:* Placement Slip for May business created 15 Jul, completed 18 Jul. **(a)** Current month (July) — the PRD's default; **(b)** planned month (May) via override, consciously reopening already-reported numbers; **(c)** automatic planned-month credit — rejected, would silently rewrite closed months.

### OQ-316 — What are the success metrics and where do they live? *(Product)*

See Gap Analysis §1.

### OQ-317 — Who is assigned the Cut-Off Override permission on day one? *(Product / Eng)*

See Gap Analysis §2.

### OQ-318 — Escalation when a manager is unavailable? *(Product / Ops)*

See Gap Analysis §3.

### OQ-319 — Deactivated employee with open, gated activities? *(Product)*

See Gap Analysis §4.

### OQ-320 — Are Lost/cancelled records excluded from gating? *(Product)*

See Gap Analysis §5.

### OQ-321 — Does the CRM integration path need its own gate? *(Product / Eng)*

See Gap Analysis §6.

### OQ-322 — Which downstream consumers need the postmark/Income-Month switch-over? *(Product / Eng)*

See Gap Analysis §7. Now includes anything reading Income Month, not just `reportingPeriod`.

### OQ-323 — RESOLVED — Flow 3 cut-off basis

**Resolution (2026-07-22):** Income Month determination uses the Placement Slip's own cut-off (planned date + buffer) — the same one Flow 1 computes — not an independent monthly ledger. No separate admin screen. See §Overview point 3, BR-CUT-014/016.

### OQ-324 — RESOLVED — Placement Slip Date integrity

**Resolution (2026-07-22):** accept manual entry for Phase 1; flag the gap rather than requiring a system-generated/immutable field. See BR-CUT-015.

### OQ-325 — Does missing the endorsement cut-off actually carry a financial/premium impact? *(Product / Finance)*

Rev 2 assumed "the insurer charges/credits an extra month's premium." This document no longer asserts that claim pending reconfirmation — it's currently described only as "tagged to next month's cycle." *Needed:* Finance confirms whether real premium impact exists, so BR-CUT-012 and the endorsement warning banner's wording can be made accurate.

### OQ-013, OQ-014 (carried from Rev 2) — Deferred (moot)

Both concerned the now-removed monthly income-booking admin screen (which role administers it; how long a month may stay blanked). Moot per OQ-323's resolution.

---

## Approval

| Role | Name | Status |
|---|---|---|
| Product | | Pending |
| Engineering | Karan Agarwal | Pending |
| Finance (endorsement financial-impact confirmation, OQ-325) | | Pending |
