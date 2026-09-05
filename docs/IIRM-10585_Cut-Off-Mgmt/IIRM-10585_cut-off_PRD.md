# Cut-Off Management · PRD

**Module:** IIRM-10585_Cut-Off-Mgmt
**Apps:** iWork
**Date:** 2026-06-22
**Status:** Draft

---

## Overview

Cut-Off Management introduces a controlled deadline mechanism for two submission-sensitive flows on the IIRM platform: **Opportunity / Sales activities** and **Endorsement submissions**.

Without a cut-off boundary, BD and ISG teams can submit activity completions at any point in time, making it impossible for the system to correctly assign records to their reporting month. Similarly, endorsement submissions without a cut-off cannot be reliably bucketed into the correct insurer processing cycle, leading to premium miscalculations.

This feature addresses both problems through dual enforcement:

1. **Opportunity / Sales Cut-Off** — BD and ISG teams carry monthly targets for premium sourced and renewals closed. Their activity completions (BD Planning, ISG Planning) must be recorded against the correct reporting month. A configurable global cut-off date (default: 5th of the following month) acts as a buffer — any activity completed between the 1st and 5th of the new month is still credited to the previous month. After the 5th, the system locks submissions and any future completions count toward the current month, affecting team KPIs and commission calculations.

2. **Endorsement Cut-Off** — HR and corporate clients raise member addition/deletion requests throughout the month. Insurers operate on processing cycles with hard cut-off dates (typically the 10th or 15th of the month). Endorsements submitted before the cut-off are processed in the current insurer cycle; those submitted after roll into the next cycle. Missing a cycle has direct financial impact — the insurer charges or credits premium for an additional full month. IIRM mirrors this cut-off internally so that every endorsement is clearly tagged as in-cycle or rolled-over.

3. **Manager Override** — When a user misses the cut-off, their manager can temporarily reopen the submission window for a short duration (typically 2–4 hours). Any submission made during this override window is still bucketed into the previous reporting period. The system automatically reverts the cut-off at the end of the override window — no manual re-locking required. Every override is logged in the audit trail with the actor, timestamp, duration, and reason.

---

## Roles

| Role | System Identity | Cut-Off Action |
|---|---|---|
| BD Executive | iWork — `ROLE_BD_EXECUTIVE` | Completes BD Planning activities; views cut-off date and countdown; submits within override window if deadline was missed |
| ISG Executive | iWork — `ROLE_ISG_EXECUTIVE` | Completes ISG Planning activities; views cut-off date and countdown; submits within override window if deadline was missed |
| Manager | iWork — manager hierarchy role | Raises cut-off override for their direct reportees; views override audit log for their team |
| Super Admin | iWork — `ROLE_SUPER_ADMIN` | Configures global cut-off day; raises override for any user regardless of team; views all override logs |
| HR / Corporate Client | IBP Portal | Submits endorsement requests; views endorsement cycle cut-off date [TBD — confirm IBP visibility scope] |
| System / Scheduler | Background cron job | Enforces cut-off locks at the configured time; buckets records into correct reporting periods; auto-reverts override windows |

---

## Scope

### In Scope (Phase 1)

- Global cut-off day configuration for Opportunity activities (default: 5th of each month)
- Endorsement cut-off date configuration per batch / insurer [TBD — granularity to be confirmed]
- Process gate: system blocks new submissions after the cut-off date
- Period bucketing: each submission is tagged to the correct reporting month / insurer cycle based on when it was submitted relative to the cut-off
- Manager override: temporary reopening of the submission window with auto-revert
- Super Admin override: same capability, extended to any user across all teams
- Full audit trail for all cut-off events (triggered, overridden, reverted, submitted-during-override)
- Notifications to users before cut-off and to managers before override window expires [TBD — channels]

### Out of Scope (Phase 2)

- **Premium Collection Cut-Off** — Brokerage recognition bucketed by premium collection date (deferred: different financial system boundary)
- **Renewal Cut-Off** — Escalation trigger N days before policy expiry (deferred: separate workflow)
- **IBP employee-facing cut-off visibility** — Deferred pending stakeholder confirmation on whether employees need to see endorsement cut-off dates
- **Bulk override** — Overriding cut-off across multiple opportunities or endorsement batches in a single action (deferred: risk of mass-unlock without granular audit)
- **Retroactive period reassignment** — Changing which reporting period a past submission is bucketed into (deferred: requires separate data correction workflow)

---

## Lifecycle

### Opportunity Activity Lifecycle

```
Activities Planned
      │
      ▼
  Active Window
  (1st – 5th of month)  ──── User submits ──→  Bucketed: Previous Month MIS
      │
      │ Cut-off reached (5th, midnight)
      ▼
    Locked
      │
      ├── No override ──→  Submission blocked
      │
      └── Manager raises override
               │
               ▼
         Override Active (e.g., 2 hrs)
               │
               ├── User submits ──→  Bucketed: Previous Month MIS
               │
               └── Window expires (auto-revert)
                         │
                         ▼
                       Locked
                   (Submission blocked)
```

| State | Trigger | Behavior |
|---|---|---|
| Active Window | Month rollover (1st of month) | Users can submit; completions before cut-off bucketed to previous month |
| Cut-Off Reached | Scheduler fires at configured cut-off time | System locks submissions; users see blocked message |
| Locked | Post cut-off / post override expiry | No submissions accepted; user prompted to contact manager |
| Override Active | Manager raises override | Submission window reopens for the override duration; timer visible to user |
| Override Expired | Override duration elapses | System auto-reverts to Locked; no manual action needed |

### Endorsement Lifecycle

```
Endorsement Created
      │
      ▼
  Active (Submittable)
      │
      ├── Submitted before cut-off ──→  Bucketed: Current Insurer Cycle
      │
      └── Cut-off reached
               │
               ├── Submitted within override ──→  Bucketed: Current Insurer Cycle
               │
               └── Not submitted ──→  Rolled to Next Insurer Cycle
```

| State | Trigger | Behavior |
|---|---|---|
| Active | Endorsement batch created | HR/admin can submit endorsement requests |
| Cut-Off Reached | Configured cut-off date passes | Batch locked; in-progress drafts frozen [TBD — auto-move or lock] |
| In Current Cycle | Submitted before cut-off | Processed by insurer in current month cycle |
| Rolled to Next Cycle | Not submitted by cut-off | Flagged as next-cycle; premium impact shifts by one month |
| Override Active | Manager raises override | Submission window reopens briefly; submission still counts as current cycle |

---

## User Stories

### Configuration

**US-CUT-001**
As a Super Admin, I want to configure the global cut-off day of month for Opportunity activities so that the system consistently enforces the same buffer window across all BD and ISG teams.
- Traces to: BR-CUT-001

**US-CUT-002**
As an Admin, I want to configure the cut-off date for an endorsement batch so that the system enforces the correct insurer processing cycle deadline.
- Traces to: BR-CUT-001, BR-CUT-012

### Visibility

**US-CUT-003**
As a BD or ISG Executive, I want to see the cut-off date and a days-remaining countdown on my opportunity activity list so that I always know how much time I have left to submit.
- Traces to: BR-CUT-002

**US-CUT-004**
As an HR / Admin user, I want to see the endorsement batch cut-off date and cycle label (current / next) on the endorsement page so that I understand the processing impact before submitting.
- Traces to: BR-CUT-002, BR-CUT-012

### Enforcement

**US-CUT-005**
As the system, I want to block activity submissions on an opportunity after the cut-off date has passed so that late completions do not corrupt the closed reporting period.
- Traces to: BR-CUT-003

**US-CUT-006**
As the system, I want to tag each submitted activity with the correct reporting period (previous month if before cut-off, current month if after) so that MIS and KPI dashboards show accurate monthly performance.
- Traces to: BR-CUT-004

**US-CUT-007**
As the system, I want to tag each endorsement submission with the correct insurer cycle (current if before cut-off, next cycle if after) so that premium calculations align with the insurer's processing window.
- Traces to: BR-CUT-012

### Manager Override

**US-CUT-008**
As a Manager, I want to raise a temporary cut-off override for my team so that a user who missed the deadline has a short window to submit and still have their record counted in the previous period.
- Traces to: BR-CUT-005, BR-CUT-006, BR-CUT-007

**US-CUT-009**
As the system, I want to auto-revert the cut-off to the locked state after the override window expires so that managers do not need to manually re-lock it.
- Traces to: BR-CUT-008

**US-CUT-010**
As a Super Admin, I want to raise a cut-off override for any user regardless of team hierarchy so that exceptional cases can be handled without escalating to the line manager.
- Traces to: BR-CUT-005

### Notifications

**US-CUT-011**
As a BD or ISG Executive, I want to receive a reminder notification before the cut-off date so that I have time to complete and submit pending activities.
- Traces to: BR-CUT-009

**US-CUT-012**
As a Manager, I want to be notified when my active override window is about to expire so that I can follow up with the user before the system re-locks.
- Traces to: BR-CUT-009

### Audit

**US-CUT-013**
As an Admin or compliance reviewer, I want to see a full cut-off event log (overrides raised, submissions during override, auto-reverts) so that every exception is traceable for reporting and compliance purposes.
- Traces to: BR-CUT-010

---

## Business Rules

**BR-CUT-001 — Cut-off day is configurable by Super Admin**
The global cut-off day for Opportunity activities is set as a day-of-month value (e.g., 5 = 5th of every month). It is configurable by Super Admin only. Changes take effect from the next cycle — the current cycle is not affected.

**BR-CUT-002 — Cut-off date is always visible**
Once a cut-off date is active, it must be visible to all relevant users (BD/ISG Executives on the opportunity activity page; HR/Admin on the endorsement batch page) with a days-remaining indicator.

**BR-CUT-003 — Process gate: submissions are blocked after cut-off**
After the cut-off date passes, the system blocks all new activity submissions and endorsement submissions for the closed period. The user sees:
> *"The cut-off date for this [activity / endorsement] has passed. Contact your manager to request an extension."*

No partial saves are permitted once the gate is active.

**BR-CUT-004 — Period bucketing: pre-cut-off submissions → previous period**
Any submission made between the 1st of the month and the configured cut-off date (inclusive, up to EOD) is tagged to the previous reporting month. The actual `completedAt` timestamp is preserved; the reporting layer reads the `reportingPeriod` tag, not the raw timestamp.

**BR-CUT-005 — Only managers or above may raise an override**
A manager can raise an override only for their direct reportees (confirmed via the org hierarchy). Super Admins can override for any user. Non-managers cannot raise overrides. Attempting an unauthorized override returns:
> *"You do not have permission to override the cut-off for this user."*

**BR-CUT-006 — Override window is time-limited**
The override window has a maximum duration [TBD — fixed 2 hrs, or manager-specified up to a cap]. The window start and end times are displayed to both the manager and the affected user.

**BR-CUT-007 — Submissions within override window → previous period**
Any submission made during an active override window is bucketed into the previous reporting period / current insurer cycle, as if the cut-off had not yet passed.

**BR-CUT-008 — System auto-reverts after override window**
When the override window expires, the system automatically re-locks the submission gate. No manual action is required from the manager. A notification is sent to the manager confirming the revert.

**BR-CUT-009 — Notifications fire at defined intervals**
- **Pre-cut-off reminder**: sent to BD/ISG Executives [TBD: 1 day before and day-of cut-off]
- **Override expiry warning**: sent to the manager [TBD: 15–30 mins before window closes]
- **Override completed**: sent to the manager after auto-revert confirming how many submissions were recorded

**BR-CUT-010 — Full audit trail is mandatory**
Every cut-off event is logged: cut-off triggered, override raised (by whom, for whom, start time, duration, reason), submission during override, auto-revert. The audit log is read-only and cannot be deleted.

**BR-CUT-011 — Cut-off day falling on a weekend or public holiday**
[TBD — Business rule decision required: roll forward to the next business day, or roll backward to the previous business day.] Recommended: roll forward to the next business day so users always get the full buffer.

**BR-CUT-012 — Post-cut-off endorsements roll to the next insurer cycle**
Endorsements submitted after the cut-off date are not rejected — they are accepted and tagged as next-cycle. The HR/Admin user sees a warning explaining the premium impact. The endorsement is included in the next month's insurer submission batch.

---

## Acceptance Criteria

**AC-CUT-001** (US-CUT-001)
- Given a Super Admin is on the System Settings > Cut-Off Configuration page
- When they set the cut-off day to 7 and save
- Then the change is persisted; the current cycle is unaffected; the new cut-off (7th) applies from the next calendar month; a confirmation message displays the effective date

**AC-CUT-002** (US-CUT-003)
- Given a BD or ISG Executive opens an opportunity's activity list
- When a cut-off date is active for the current cycle
- Then the cut-off date is displayed with a countdown showing days remaining (e.g., "Cut-off: 5 Jun · 3 days remaining")

**AC-CUT-003** (US-CUT-004)
- Given an HR or Admin user opens an endorsement batch
- When a cut-off date is set
- Then the cut-off date, the cycle label (Current Cycle / Next Cycle), and the premium impact warning are visible before submission

**AC-CUT-004** (US-CUT-005)
- Given today's date is after the configured cut-off date
- When a BD/ISG Executive attempts to submit an activity completion
- Then the system blocks the action, no data is saved, and the message from BR-CUT-003 is shown

**AC-CUT-005** (US-CUT-006)
- Given a BD Executive submits an activity on 3 May and the cut-off is 5 May
- When the submission is saved
- Then the `reportingPeriod` on the record is tagged as April; the activity appears in the April MIS report

**AC-CUT-006** (US-CUT-006)
- Given a BD Executive submits an activity on 7 May and the cut-off was 5 May (no override active)
- When the submission is saved (e.g., after a new cut-off cycle opens)
- Then the `reportingPeriod` is tagged as May; the activity appears in the May MIS report

**AC-CUT-007** (US-CUT-007)
- Given an endorsement is submitted on 8 May and the endorsement cut-off is 10 May
- When the submission is saved
- Then the endorsement is tagged as Current Cycle (May); it is included in the May insurer batch

**AC-CUT-008** (US-CUT-007)
- Given an endorsement is submitted on 12 May and the cut-off was 10 May
- When the submission is saved
- Then the endorsement is tagged as Next Cycle (June); the HR user sees the premium impact warning; it is included in the June insurer batch

**AC-CUT-009** (US-CUT-008)
- Given a Manager opens the Cut-Off Override screen for their team member
- When they raise an override with a valid duration
- Then the override window activates immediately; the user is notified; the countdown timer is visible to both manager and user

**AC-CUT-010** (US-CUT-008)
- Given an override window is active
- When the user submits an activity
- Then the submission is accepted; `reportingPeriod` is tagged as the previous month; the audit log records the submission timestamp and override context

**AC-CUT-011** (US-CUT-009)
- Given an override window is active and the duration elapses
- When the system scheduler fires
- Then the submission gate is automatically re-locked; the manager receives a revert confirmation notification; no manual action is needed

**AC-CUT-012** (US-CUT-010)
- Given a Manager attempts to raise an override for a user outside their reporting hierarchy
- When they submit the override request
- Then the system blocks it and shows: *"You do not have permission to override the cut-off for this user."*; no override is created

**AC-CUT-013** (US-CUT-013)
- Given an Admin opens the Cut-Off Audit Log
- When they filter by a date range
- Then all cut-off events (triggers, overrides, submissions during override, reverts) are listed with actor, timestamp, duration, and reason; the log is read-only

---

## Examples

All Opportunity examples use: **Global cut-off = 5th of each month, EOD (11:59 PM)**. All Endorsement examples use: **Endorsement batch cut-off = 10th of each month, EOD**.

---

### Opportunity / Sales Cut-Off Examples

---

**EX-OPP-01 — User completes on time (happy path)**

| Field | Value |
|---|---|
| Planned date | 28 Apr 2026 |
| Completed | 27 Apr 2026 |
| Cut-off | 5 May 2026 |
| Reporting period tagged | **April 2026** |

User finishes before the planned date. Cut-off is not involved. Activity appears in April MIS with 1 day early.

---

**EX-OPP-02 — User completes late but within the cut-off buffer**

| Field | Value |
|---|---|
| Planned date | 28 Apr 2026 |
| Completed | 3 May 2026 |
| Cut-off | 5 May 2026 |
| Reporting period tagged | **April 2026** |

User missed the planned date but submitted within the buffer window. Activity is marked as late against the planned date but is still credited to April's MIS and KPI. No override needed.

---

**EX-OPP-03 — User submits at the exact cut-off boundary**

| Field | Value |
|---|---|
| Planned date | 28 Apr 2026 |
| Completed | 5 May 2026, 11:58 PM |
| Cut-off | 5 May 2026, 11:59 PM |
| Reporting period tagged | **April 2026** |

Submission at 11:58 PM — accepted, tagged April.
Submission at 12:00 AM (6 May) — blocked; gate is locked.
System enforces to-the-minute precision at the boundary.

---

**EX-OPP-04 — User misses cut-off, no override raised**

| Field | Value |
|---|---|
| Planned date | 28 Apr 2026 |
| Cut-off | 5 May 2026 |
| Attempt date | 7 May 2026 |
| Outcome | Blocked |

System shows: *"The cut-off date for this activity has passed. Contact your manager to request an extension."* Activity stays in its current state. If eventually submitted (after a new override or next cycle), it will be tagged May 2026.

---

**EX-OPP-05 — User misses cut-off, manager raises override, user submits in time**

| Field | Value |
|---|---|
| Cut-off | 5 May 2026 |
| Override raised by | Manager — 7 May 2026, 10:00 AM |
| Override window | 10:00 AM – 12:00 PM (2 hours) |
| User submits | 7 May 2026, 11:30 AM |
| Reporting period tagged | **April 2026** |

Manager opens the override at 10:00 AM. User submits at 11:30 AM — within the window. Activity is bucketed into April MIS despite the May submission date. At 12:00 PM, the system auto-reverts the gate to locked.

Audit log entry:
> Override raised by [Manager Name] · 7 May 10:00 AM · Duration: 2 hrs · User: [BD Executive] · Reason: [reason text]
> Submission recorded · 7 May 11:30 AM · Bucketed: April 2026

---

**EX-OPP-06 — User misses cut-off, manager raises override, user still does not submit**

| Field | Value |
|---|---|
| Cut-off | 5 May 2026 |
| Override window | 7 May 2026, 10:00 AM – 12:00 PM |
| User action | No submission during window |
| Outcome | Gate auto-reverts to Locked at 12:00 PM |

Override window expires. System auto-reverts. Activity remains incomplete. No auto-submission or auto-rejection occurs. Audit log records the override with no submission. If the manager raises a second override [TBD — policy on multiple overrides in one cycle], the user gets another window; otherwise the activity stays locked until the next cycle.

---

**EX-OPP-07 — Multiple users under same manager miss cut-off**

| Field | Value |
|---|---|
| Cut-off | 5 May 2026 |
| Manager override raised | 7 May 2026, 9:00 AM |
| User A submits | 7 May 2026, 9:45 AM → Bucketed: **April 2026** |
| User B submits | 7 May 2026, 10:30 AM → Bucketed: **April 2026** |
| User C does not submit | Still locked after window expires |
| Override window ends | 7 May 2026, 11:00 AM (auto-revert) |

Single override raised by manager applies to [TBD — all team members or selected users]. Each submission within the window is individually logged and bucketed to the previous period.

---

**EX-OPP-08 — Cut-off date falls on a weekend**

| Field | Value |
|---|---|
| Configured cut-off | 5th of month |
| 5 Jul 2026 | Saturday |
| Effective cut-off | [TBD] — 4 Jul (Fri, roll back) or 7 Jul (Mon, roll forward) |

Business rule decision required. Recommended: roll forward to Monday 7 Jul so users get the full intended buffer. Whichever rule is chosen, it must be consistent and visible in the UI.

---

**EX-OPP-09 — Super Admin changes global cut-off day mid-month**

| Field | Value |
|---|---|
| Current cut-off | 5th of each month |
| Admin changes to | 7th — on 3 May 2026 |
| May cycle cut-off | Still **5 May 2026** (unchanged) |
| June cycle onwards | **7 Jun 2026** (new rule applies) |

Changes are always prospective. Users already locked out before the config change are not retroactively unlocked.

---

**EX-OPP-10 — User submits after override window, before month end**

| Field | Value |
|---|---|
| Cut-off | 5 May 2026 |
| Override window (expired) | 7 May 10:00 AM – 12:00 PM |
| User attempts submission | 15 May 2026 |
| Outcome | Blocked — gate is locked |

No active override. User must contact their manager again. Whether a second override in the same cycle is permitted is [TBD].

---

### Endorsement Cut-Off Examples

---

**EX-END-01 — Endorsement submitted before cut-off (happy path)**

| Field | Value |
|---|---|
| Endorsement batch cut-off | 10 May 2026 |
| Submitted | 7 May 2026 |
| Insurer cycle | **May 2026** |
| Premium impact | From May 2026 |

Endorsement processed in the May insurer cycle. Insurer charges/credits premium from May. No cut-off interaction.

---

**EX-END-02 — Endorsement submitted after cut-off — rolls to next cycle**

| Field | Value |
|---|---|
| Endorsement batch cut-off | 10 May 2026 |
| Submitted | 12 May 2026 |
| Insurer cycle | **June 2026** |
| Premium impact | From June 2026 (one extra month charged) |

HR/Admin user sees warning on submission:
> *"This endorsement missed the May 2026 cut-off and will be processed in the June 2026 cycle. Premium impact applies from June 2026."*

---

**EX-END-03 — Endorsement in progress (Draft) when cut-off hits**

| Field | Value |
|---|---|
| Endorsement status at cut-off | Draft (partially filled) |
| Cut-off | 10 May 2026 |
| Outcome | [TBD] |

Options:
- (a) Draft locked — user cannot edit or submit; must wait for a manager override or next cycle to submit
- (b) Draft auto-moved to June cycle — submission window reopens under the next cycle label
- (c) Draft auto-discarded — user must re-raise the endorsement for June

Decision required before TRD.

---

**EX-END-04 — Manager overrides endorsement cut-off**

| Field | Value |
|---|---|
| Cut-off | 10 May 2026 |
| Override raised | 11 May 2026, 2:00 PM |
| Override window | 2:00 PM – 4:00 PM (2 hours) |
| HR submits | 11 May 2026, 3:15 PM |
| Insurer cycle | **May 2026** (override counts as in-cycle) |

System auto-reverts at 4:00 PM. Audit log records the override and submission.

---

**EX-END-05 — Endorsement submitted on cut-off day — boundary condition**

| Field | Value |
|---|---|
| Cut-off | 10 May 2026, 11:59 PM |
| Submitted at 11:58 PM | Accepted → **May 2026 cycle** |
| Submitted at 12:00 AM (11 May) | Blocked → **June 2026 cycle** |

System enforces to-the-minute precision. The UI should clearly communicate the exact cut-off time, not just the date.

---

**EX-END-06 — Retroactive endorsement: member join date in the past**

| Field | Value |
|---|---|
| Cut-off | 10 May 2026 |
| Submitted | 8 May 2026 (within cut-off) |
| Member join date | 1 Apr 2026 |
| System action | Accepted into May 2026 cycle |
| Premium backdating | [TBD — insurer SLA decision, not a system rule] |

Whether the insurer backdates premium to April is an insurer SLA question, not a system enforcement rule. The system records the submission as May-cycle and passes the member join date to the insurer for their own calculation.

---

### Manager Override Edge Cases

---

**EX-OVR-01 — Override raised outside business hours**

| Field | Value |
|---|---|
| Override raised | 7 May 2026, 11:30 PM |
| System behavior | Override accepted — no time-of-day restriction |

[TBD — confirm whether overrides should be restricted to business hours (e.g., 9 AM–7 PM). If restricted, system should show: *"Overrides can only be raised during business hours."*]

---

**EX-OVR-02 — Manager raises override for a user outside their team**

| Field | Value |
|---|---|
| Manager's team | [User A, User B] |
| Override target | User C (different team) |
| System behavior | Blocked |

Error message: *"You do not have permission to override the cut-off for this user."* Override is not created. Super Admin can perform this action.

---

**EX-OVR-03 — Super Admin raises override (bypassing manager)**

| Field | Value |
|---|---|
| Actor | Super Admin |
| Target | Any user |
| Audit log | Flagged as Super Admin override (distinguishable from manager override) |

Super Admin overrides are logged separately so compliance teams can distinguish operational exceptions from escalated exceptions.

---

**EX-OVR-04 — Second override requested in the same cycle**

| Field | Value |
|---|---|
| First override | 7 May 10:00 AM – 12:00 PM (expired, no submission) |
| Second override requested | 7 May 3:00 PM |
| Outcome | [TBD] |

Options:
- (a) Blocked — only one override per user per cycle; requires Super Admin to unlock
- (b) Allowed — manager can raise a second override with an additional reason logged
- Recommended: option (a); prevents abuse while keeping Super Admin as the escalation path

---

## Data Contract

### Consumed

| Source Module | Data Needed | Purpose |
|---|---|---|
| Opportunity Activities | `activityId`, `roleKey`, `dueDate`, `completedAt`, `statusKey` | Determine which activities fall within the cut-off window; apply period tag |
| Opportunity | `opportunityId`, assigned BD/ISG user, manager hierarchy | Scope which users and activities are subject to a given cut-off event |
| Endorsement | `endorsementId`, `submittedAt`, `endorsementStatus`, `enrollmentEndDate` | Determine which endorsements fall within the insurer cycle cut-off |
| Policy | `policyTo` (renewal date) | Reference for endorsement cycle alignment |
| User / Org Hierarchy | `userId`, `managerId`, `roleKey` | Override permission check — confirm manager-reportee relationship |
| System Configuration | `globalCutOffDay`, `overrideDurationHours` | Drive cut-off schedule and override window length |

### Produced

| Data | Who Consumes It |
|---|---|
| `reportingPeriod` tag on each activity (previous month / current month) | MIS dashboards, KPI reports, commission calculations |
| `insurerCycle` tag on each endorsement (current cycle / next cycle) | Endorsement batch processing, insurer submission reports |
| Cut-off override log entries (actor, target user, start, end, duration, reason, submissions during window) | Audit log, compliance reports, Admin UI |
| Notification events (pre-cut-off reminder, override expiry warning, revert confirmation) | Notification service (in-app + [TBD: email]) |

### Cross-Module Contracts to Raise

- **Opportunity module (TL alignment required)** — Add `reportingPeriod` field to `OpportunityActivityMap`; add submission gate hook that checks cut-off state before `completedAt` is written
- **Endorsement module (TL alignment required)** — Add `insurerCycle` field to Endorsement entity; add submission gate that checks endorsement cut-off state
- **Scheduler service** — New cron job: daily cut-off enforcement check + override expiry monitor
- **MIS / Reporting** — Reporting layer must read `reportingPeriod` and `insurerCycle` tags, not raw `completedAt` / `submittedAt` timestamps, for monthly bucketing

---

## Impact Areas (Existing Code)

This feature touches a large amount of already-developed code. The list below maps each impact point to a flow and the primary file, so the Tech Lead can scope effort during TRD. Items marked **[TL review]** introduce API / DB / enforcement changes that must go through Tech Lead review.

### Opportunity Flow

- **Activity completion** — `opportunity.repository.ts` — where `completedAt` is written; add cut-off gate before saving **[TL review]**
- **Activity submit/approve** — `opportunity.service.ts` / `opportunity.controller.ts` — submission endpoints need cut-off validation **[TL review]**
- **BD / ISG Planning dates** — `task.repository.ts` / `task.service.ts` — where `plannedAt` / `dueDate` are set via the planning form
- **Opportunity status scheduler** — `opportunity-status.scheduler.ts` — auto-close cron must respect locked cut-off cycle
- **Activity UI** — `OpportunityActivities/` pages + `CommonActivity.tsx` — disable/warn submission when cut-off active
- **Planning UI** — `ManageEngagements/` + `CalendarView` — surface cut-off date, lock past-cut-off entries

### Endorsement Flow

- **Endorsement submission** — `policy.repository.ts` (`updateEndorsementSteps`) — add cut-off gate + cycle tag **[TL review]**
- **Endorsement logic** — `policy.service.ts` / `policy.controller.ts` — enforce in-cycle vs next-cycle bucketing **[TL review]**
- **Endorsement auto-create scheduler** — `endorsement-creation.scheduler.ts` — align auto-creation timing with cut-off
- **Endorsement UI** — `EndorsementPage/` (Details, Listing, `endorsementButtons.ts`) — show cut-off/cycle, disable submit post-cut-off

### Reporting / MIS

- **MIR pages** — `MIRPage/` (index, OptionA/B, MIRListing) — must read `reportingPeriod` / `insurerCycle` tag, not raw timestamp **[TL review]**
- **Report aggregation** — `report-service/app.service.ts` + scheduler `report.service.ts` — partition monthly metrics by cut-off period **[TL review]**

### Cross-Cutting

- **New cut-off scheduler** — new file `cut-off-management.scheduler.ts` — daily lock enforcement + override-expiry auto-revert **[TL review]**
- **Notifications** — `notification.service.ts` + `template.service.ts` — new templates: pre-cut-off reminder, override-expiry warning, revert confirmation
- **Audit trail** — `audit-history.service.ts` + `audit-history-log.entity.ts` — new action types: cut-off enforced, override raised, revert **[TL review]**
- **Admin config screen** — new System Settings page — Super Admin sets global cut-off day + override duration **[TL review]**
- **Org hierarchy** — user/manager mapping — override permission check (manager → reportee) reads existing hierarchy

> Note: exact file list and DB migrations are finalized in the TRD (Stage 40b). This section is a scoping pointer, not the technical design.

---

## Open Questions

| ID | Question | Owner | Due |
|---|---|---|---|
| OQ-001 | Override window duration — fixed (e.g., 2 hrs) or does the manager specify a duration (up to a configured max)? | Product / Stakeholder | TBD |
| OQ-002 | Does a manager override apply to a specific user, or to all of their direct reportees at once? | Product / Stakeholder | TBD |
| OQ-003 | What happens to activities still not submitted when the override window expires — remain locked, auto-rejected, or remain in pending state? | Product | TBD |
| OQ-004 | Can a manager raise multiple overrides for the same user in the same cycle? If yes, is there a cap? | Product | TBD |
| OQ-005 | Is the endorsement cut-off date global, per insurer, or per endorsement batch? | Product / Stakeholder | TBD |
| OQ-006 | Who configures the endorsement cut-off — Admin manually, or auto-derived from insurer SLA / policy data? | Product / Stakeholder | TBD |
| OQ-007 | What happens to endorsements in Draft state when the cut-off hits — locked in place, auto-moved to next cycle, or auto-discarded? (see EX-END-03) | Product / Stakeholder | TBD |
| OQ-008 | Is the endorsement cut-off date visible on the IBP HR portal, or iWork only? | Product / Stakeholder | TBD |
| OQ-009 | Cut-off day falling on a weekend — roll forward to next business day or roll backward to previous? | Product | TBD |
| OQ-010 | Notification channels — in-app only, or email as well? | Product | TBD |
| OQ-011 | Should overrides be restricted to business hours? | Product | TBD |
| OQ-012 | Pre-cut-off reminder timing — how many days before cut-off should reminders fire (e.g., 2 days before and day-of)? | Product | TBD |

---

## Approval

*Requires 2 sign-offs per Daksh manifest rules (weight class: large).*

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

*Stage 40a — /daksh prd · IIRM-10585_Cut-Off-Mgmt. Resolve all Open Questions before TRD (Stage 40b) begins.*
