# Cut-Off Management — Requirements

**Feature:** IIRM-10585 | **Date:** 2026-06-10 | **Status:** In Progress

---

## Scope

### In Scope (Phase 1)

1. **Opportunity / Sales Cut-Off** — BD and ISG team activity completion bucketed into the correct reporting month; system locks action after cut-off
2. **Endorsement Cut-Off** — Endorsement submissions bucketed into the correct insurer cycle; system locks submissions after cut-off
3. **Manager Override Pattern** — Manager can temporarily reopen the cut-off for a short window; system auto-reverts; full audit trail
4. **Dual enforcement** — Cut-off both locks the action (process gate) and buckets the record into the correct period (reporting/MIS)

### Future Scope (Phase 2)

3. **Premium Collection Cut-Off** — Brokerage recognition bucketed by premium collection date
4. **Renewal Cut-Off** — Escalation trigger when renewal not acted on within N days of policy expiry

---

## Context

Two flows require a cut-off mechanism in Phase 1:
1. **Opportunity** — BD Planning & ISG Planning stage activity completion
2. **Endorsement** — Endorsement submission deadlines and insurer cycle bucketing

---

## Flow 1: Opportunity / Sales Cut-Off

### Scenario 1 — Monthly Cut-Off for BD & ISG Planning

**Background:**
- The application has two planning stages per Opportunity: BD Planning and ISG Planning
- Each stage has activities with target/planned dates (e.g., Data Validation, KDM Meeting, Mandate Details Entry, RFP Data Collection, RFP Details Entry for BD; Broking Slip Generation, Enter Quote, QCR Generation, Meeting for Final Negotiation, Placement Slip Generation, Premium Calculation, Held Cover Note, Policy Hard Copy Receipt, Policy Docket, Hand over Meet, Policy Confirmation for ISG)
- Users (BD Executive / ISG Executive) are expected to complete their stage activities by the planned dates

**The Cut-Off Rule:**
- A global cut-off date is configured in the system: **5th of every month** (configurable)
- This acts as a buffer — if a user missed completing activities by the planned date, they still have until the 5th to submit
- Submissions completed before the 5th are **bucketed into the previous reporting month** for MIS/KPI purposes
- After the 5th, submissions are locked AND any new completions are bucketed into the current month

**Dual Enforcement:**
- **Process gate** — System blocks new activity submissions after the cut-off date
- **Period bucketing** — `completedAt` timestamp is preserved as-is; the reporting layer buckets it into the previous month if completed before cut-off, current month if after

**Manager Override:**
- If a user misses the 5th, their manager can temporarily extend the cut-off
- Extension duration: [TBD — confirm if fixed (e.g., 2 hrs) or manager-specified]
- Submissions made during the override window are still bucketed into the previous month
- After the extension window expires, the system automatically reverts the cut-off — no manual action needed
- Full audit trail: override raised by, timestamp, duration, reason (if required)

**Open Items — Scenario 1:**
- [ ] Extension duration — fixed (e.g., 2 hrs) or manager picks?
- [ ] Does the extension apply to one user, the manager's entire team, or the whole opportunity?
- [ ] What happens to tasks still not submitted after the extension expires — locked / auto-rejected / remain pending?
- [ ] Where is the global cut-off date (5th) configured — existing System Settings or a new Admin screen?
- [ ] Who can change the global cut-off day? (Super Admin only?)
- [ ] Are notifications sent to users as cut-off approaches (e.g., 1 day before, day-of)?
- [ ] Is the manager notified when their override window is about to expire?

---

## Flow 2: Endorsement Cut-Off

### Scenario — Monthly Endorsement Cycle Cut-Off

**Background:**
- HR/corporate clients send member addition/deletion (endorsement) requests throughout the month
- Insurer has a processing cycle with a hard cut-off date — endorsements received before this date are processed in the current insurer cycle; after this date they roll to the next cycle
- Missing a cycle has financial impact — insurer charges/credits premium for an extra month
- IIRM mirrors this cut-off internally so the system tracks what is "in cycle" vs "rolled over"

**The Cut-Off Rule:**
- Cut-off date is configured per endorsement batch or globally per insurer/policy [TBD — confirm granularity]
- Endorsements submitted before the cut-off → bucketed into the current insurer cycle
- Endorsements submitted after the cut-off → bucketed into the next insurer cycle
- After cut-off, system locks further submissions to the current batch

**Dual Enforcement:**
- **Process gate** — System blocks new endorsement submissions to the current batch after cut-off
- **Period bucketing** — Submission timestamp is preserved; reporting layer buckets into the correct insurer cycle

**Manager Override:**
- Same pattern as Opportunity — manager can temporarily reopen for a short window
- Override is logged in audit trail
- System auto-reverts after the window

**Open Items — Endorsement:**
- [ ] Is the cut-off date per endorsement batch, per insurer, per policy, or a single global date?
- [ ] Who configures it — Admin manually, or auto-derived from insurer SLA / policy data?
- [ ] What happens to endorsements in the system that are "in progress" when cut-off hits — locked in place, auto-submitted, or auto-moved to next cycle?
- [ ] Is cut-off visibility required on the IBP HR portal (employee/HR side), or iWork only?
- [ ] Same manager override pattern as Opportunity, or different rules?

---

## Examples

All examples use: **Cut-off = 5th of every month**, **Reporting month = previous calendar month**.

---

### Opportunity Examples

---

#### EX-OPP-01 — User completes on time (happy path)

> Planned date: 28 Apr | Completed: 27 Apr | Cut-off: 5 May

User finishes before the planned date. `completedAt = 27 Apr`.
System buckets into **April MIS**. No cut-off involvement.

---

#### EX-OPP-02 — User completes late but within cut-off buffer

> Planned date: 28 Apr | Completed: 3 May | Cut-off: 5 May

User missed the planned date but submitted before the 5th.
`completedAt = 3 May`. System buckets into **April MIS** (pre-cut-off).
Activity is marked late against the planned date but counts for the previous period.

---

#### EX-OPP-03 — User completes exactly on cut-off day

> Planned date: 28 Apr | Completed: 5 May 11:59 PM | Cut-off: 5 May EOD

User submits on the last valid moment.
`completedAt = 5 May 11:59 PM`. System buckets into **April MIS**.
Cut-off triggers at midnight — any submission at 12:00 AM 6 May is locked.

---

#### EX-OPP-04 — User misses cut-off, no override

> Planned date: 28 Apr | Cut-off: 5 May | User attempts submission: 7 May

System is locked. User sees: *"The cut-off date for this activity has passed. Contact your manager to request an extension."*
Submission is blocked. Activity remains in its current state.
Bucketed into **May MIS** if eventually submitted (current month).

---

#### EX-OPP-05 — User misses cut-off, manager raises override, user submits in time

> Cut-off: 5 May | Manager raises override: 7 May 10:00 AM | Extension: 2 hrs | User submits: 7 May 11:30 AM | Extension expires: 7 May 12:00 PM

Manager opens the override window at 10:00 AM.
User submits at 11:30 AM — within the window.
`completedAt = 7 May 11:30 AM`. System buckets into **April MIS** (override window counts as previous month).
At 12:00 PM, system auto-reverts — cut-off locked again.
Audit log: Override by [Manager], 10:00–12:00 AM, submission recorded.

---

#### EX-OPP-06 — User misses cut-off, manager raises override, user still does not submit

> Cut-off: 5 May | Override window: 7 May 10:00 AM – 12:00 PM | User does not submit

Override window expires. System auto-reverts to locked state.
Activity remains incomplete. No auto-submission or auto-rejection.
Bucketed into **May MIS** when eventually submitted (if ever).
Audit log: Override raised, no submission, window expired.

---

#### EX-OPP-07 — Multiple users under same manager miss cut-off

> Manager raises override for their team on 7 May

Override applies to all users in the manager's team [TBD — confirm scope].
Each user who submits within the window gets their activity bucketed into **April MIS**.
Users who don't submit by window expiry remain locked.
Single audit log entry for the override; individual submission entries per user.

---

#### EX-OPP-08 — Cut-off date falls on a weekend

> Configured cut-off: 5th | 5 May is a Saturday

[TBD — does the system move cut-off to Friday 4 May (before) or Monday 7 May (after)?]
This needs a business rule decision. Recommend: roll forward to next business day (7 May).

---

#### EX-OPP-09 — Super Admin changes the global cut-off day mid-month

> Current cut-off: 5th | Admin changes to 7th on 3 May

Change takes effect from the **next cycle** (June onwards).
May cycle still closes on the 5th.
Users already locked out before the change are not retroactively unlocked.

---

#### EX-OPP-10 — User submits after override window but before end of month

> Cut-off: 5 May | Override expired: 7 May 12:00 PM | User submits: 15 May

System is locked — submission blocked.
No second override has been raised.
User must contact manager again for a new override [TBD — can manager raise multiple overrides in the same cycle?].

---

### Endorsement Examples

---

#### EX-END-01 — Endorsement submitted before cut-off (happy path)

> Endorsement batch cut-off: 10 May | Submitted: 7 May

Endorsement is processed in the **May insurer cycle**.
Insurer charges/credits premium for May.
`submittedAt = 7 May`. Bucketed into May cycle.

---

#### EX-END-02 — Endorsement submitted after cut-off — rolls to next cycle

> Endorsement batch cut-off: 10 May | Submitted: 12 May

System accepts the submission but flags it as **next cycle**.
Bucketed into **June insurer cycle**.
HR/admin sees a warning: *"This endorsement missed the May cut-off and will be processed in the June cycle. Premium impact applies from June."*

---

#### EX-END-03 — Endorsement in progress when cut-off hits

> Endorsement partially filled | Cut-off: 10 May | Status at cut-off: Draft

[TBD — options:]
- (a) Draft is locked in place — user cannot edit or submit; remains as a draft for the next cycle
- (b) Draft is auto-moved to the next cycle — submission window reopens for June cycle
- (c) Draft is auto-discarded — user must re-raise for June

---

#### EX-END-04 — Manager overrides endorsement cut-off

> Cut-off: 10 May | Override raised: 11 May 2:00 PM | Extension: 2 hrs | HR submits: 11 May 3:00 PM

HR submits within the override window.
Submission bucketed into **May cycle** (override counts as in-cycle).
System auto-reverts at 4:00 PM.
Audit log: Override by [Manager], reason, duration, submission recorded.

---

#### EX-END-05 — Multiple endorsements across companies, different cut-off dates

> Company A cut-off: 10 May | Company B cut-off: 15 May

[TBD — if cut-off is per insurer/policy rather than global, each company operates on its own cycle.]
Company A locks on 10 May; Company B locks on 15 May.
MIS report shows each company's cycle separately.

---

#### EX-END-06 — Endorsement submitted on cut-off day — boundary condition

> Cut-off: 10 May EOD | Submitted: 10 May 11:58 PM

Accepted into **May cycle**.
Submitted at 12:00 AM 11 May → blocked, rolled to June cycle.
System must enforce to-the-minute precision at the boundary.

---

#### EX-END-07 — Retroactive endorsement request (member join date in past)

> Cut-off: 10 May | Submitted: 8 May | Member join date: 1 April

Submission is within cut-off — accepted into May cycle.
[TBD — does the insurer backdate premium to April, or start from May cycle date? This is a financial rule, not a system rule — flag for insurer SLA confirmation.]

---

### Manager Override — Edge Cases

---

#### EX-OVR-01 — Manager raises override outside business hours

> Override raised: 7 May 11:30 PM

Override is technically valid — system doesn't restrict by time of day.
[TBD — should there be a restriction? E.g., override only allowed between 9 AM–6 PM?]

---

#### EX-OVR-02 — Manager raises override for a user not in their team

System blocks the override. Only the direct manager (or above in hierarchy) can raise an override for their reportees.
Error: *"You do not have permission to override the cut-off for this user."*

---

#### EX-OVR-03 — Super Admin raises override directly (bypassing manager)

Super Admin can override for any user.
Audit log records the Super Admin action explicitly — flagged differently from a manager override for compliance visibility.

---

#### EX-OVR-04 — Manager raises two overrides in the same cycle

> First override: 7 May 10:00–12:00 PM | Second override requested: 7 May 3:00 PM

[TBD — is a second override in the same cycle allowed? Recommend: max 1 override per user per cycle, requires Super Admin approval for a second.]

---

## Common / Cross-Cutting Requirements

- **Audit trail** — Every cut-off event must be logged: cut-off triggered, override raised (by whom, duration, reason), revert triggered, submission after override
- **Notifications** — [TBD — in-app only or email too? What events trigger a notification?]
- **Role-based access** — Only the direct manager (or above) can raise an override; non-managers cannot
- **Reporting / MIS** — Period bucketing must feed into existing MIS dashboards; the reporting layer reads the bucket, not the raw timestamp
- **Global cut-off config** — Configurable by Super Admin; changes take effect from the next cycle, not retroactively
