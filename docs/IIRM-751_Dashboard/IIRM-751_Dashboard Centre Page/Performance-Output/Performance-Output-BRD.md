# Performance Output Generation — BRD

> Business Requirements Document for the `generate-performance-output` job, covering
> the policy + endorsement + **reward** consolidation. Reflects the system as
> implemented. Technical detail lives in the companion
> [Performance-Output-TRD.md](./Performance-Output-TRD.md).

- **Owning service:** `policy-service`
- **Primary entry point:** `GET /policy/generate-performance-output`
- **Output store:** `performance_output` table (`PerformanceOutput` entity)
- **Status:** Rewards KPI added to the ETL (latest revision). Prior scope: brokerage + premium from policies/endorsements.
- **Consumption:** rewards are included in the **RO achieved** figure of the quarterly dashboards (TRD §12), with an italic UI disclaimer stating so (TRD §13).

---

## 1. Purpose

Produce a **user-wise consolidated performance snapshot** per month, so leadership
and reporting surfaces can measure each employee's booked business and income.
The job aggregates a user's brokerage, premium, brokerage collected, and (new)
reward income into a single flat table that downstream reports read.

## 2. Business context

Performance for an employee is driven by three income streams:

1. **Brokerage** booked on policies and endorsements they own.
2. **Premium / brokerage collected** against those policies and endorsements.
3. **Rewards** — standalone income entries (e.g. insurer incentives) recorded in
   the rewards module.

Until this revision only (1) and (2) were consolidated. Rewards existed only in
the Biz Done Excel report as a flat, unattributed sheet. Business asked for
rewards to also appear in the per-user performance output so a user's snapshot
reflects total income, not just policy-derived income.

## 3. Glossary

| Term | Meaning |
|------|---------|
| **User** | The employee credited with the business. For policies/endorsements = `Policy.ownerId`. For rewards = `reward.created_by`. Restricted to employee user types. |
| **SO** | Sales Opportunity — new business. `Policy.opportunityType = "SO"`. |
| **RO** | Renewal Opportunity — renewal. `Policy.opportunityType = "RO"`. |
| **Mined** | A sub-split of SO where the policy is flagged mined (`isPolicyMinedLid`). |
| **KPI** | The metric family a row represents: `BROKERAGE`, `PREMIUM_COLLECTED`, `BROKERAGE_COLLECTED`, `REWARD`. |
| **Entity type** | The bucket within a KPI (e.g. `SO_POLICY`, `TOTAL_ENDORSEMENT`, `TOTAL_REWARD`). |
| **Brokerage (booked)** | `basic_brokerage_amount` — the target/booked brokerage. |
| **Brokerage collected** | `brokerage_collected` — actually collected brokerage. |
| **Reward** | An income record keyed to insurer + organisation, with `reward_amount`. No policy/agent linkage. |
| **Performance month** | First-of-month date the aggregates are stamped to. |

## 4. Business rules

- **BR-1 — User universe.** Only employees are processed (`USER_TYPE_IIRM_EMPLOYEE`,
  `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE`).
- **BR-2 — Attribution.**
  - Policy/endorsement metrics → the **policy owner** (`ownerId`).
  - Reward metrics → the reward's **creator** (`created_by`), taken as a proxy for
    who earned it. Rewards with a null creator, or a creator outside the employee
    universe, are **excluded**.
- **BR-3 — Time bucketing.** A record lands in the month of its **date of income**
  (`date_of_income`), applied uniformly to policies, endorsements, and rewards.
- **BR-4 — Performance eligibility.** Policies/endorsements must have
  `enabled_for_performance = YES`. **Rewards have no such flag — all non-deleted
  rewards in range count.**
- **BR-5 — Reward classification.** Rewards carry no SO/RO/Mined concept; they
  appear only under the single `TOTAL_REWARD` bucket.
- **BR-6 — Org hierarchy.** Every row carries the owner's/creator's org hierarchy
  (organisation, SBU, vertical, department, branch). Reward org dims come from the
  creator's employee record.
- **BR-7 — Regeneration.** Re-running for a month fully replaces that month's rows
  (delete-then-insert). The job is idempotent per performance month.

## 5. Scope

**In scope:** monthly consolidation of brokerage, premium collected, brokerage
collected, and reward income per user × org hierarchy, written to
`performance_output`.

**Out of scope:** any file/Excel export (the endpoint writes a DB table only);
reward attribution rules beyond `created_by`; splitting a reward across multiple
users or months.

## 6. Trigger & consumers

- **Trigger:** `GET /policy/generate-performance-output` (manual or scheduled),
  optional `month` / `year` query params.
- **Consumers:** downstream reporting/dashboard queries reading `performance_output`.

## 7. Dashboard consumption

- **Rewards in RO achieved (done).** Business confirmed reward income is folded
  into the **RO achieved** figure of both quarterly dashboards
  (`quarterly-dashboard-business-performance` and its `-by-sbu-basis` variant),
  rather than shown as a separate stacked series. Implemented in the backend — see
  TRD §12.
- **UI note (done, frontend).** An italic disclaimer — *Rewards are included in
  the RO achieved figures.* — is shown beneath the business-performance widget
  (covers both quarterly and SBU charts). See TRD §13.

## 8. Open / pending business items

- **Attribution review.** `created_by` attribution (BR-2) is a proxy. If business
  wants true earner attribution or a distribution rule, it must be defined — see
  TRD §9 (KI-2).
