# HR Portal – Enrolment Status Page – Product Requirements Document (PRD)

**Document Version:** 1.0
**Date:** 2026-07-08
**Author:** IIRM Product Team
**Jira Reference:** IIRM-ENROLMENT-STATUS
**Related Documents:**
- TRD: `hr-portal-enrollment-status-TRD.md`
- Framework Reference: `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> This document captures business requirements only. UI layout, component behaviour, navigation patterns, field mappings, and interaction details are in the TRD (no separate SDS exists for this module — the TRD covers implementation detail directly).

---

## 1. Objective

The Enrolment Status page gives an HR admin (internal or client-side) a single
screen to answer "how is enrolment going right now?" for their company. It
shows, grouped by enrolment period, every policy that is open for enrolment
and how many employees on that policy are Enrolled, In Progress, or Not
Enrolled. It enables the admin to:

- See every current or upcoming enrolment period for their company at a glance
- Drill into each period to see per-policy enrolment counts
- Identify policies at risk of low enrolment before the window closes
- Jump directly to a policy's Enrolment tab for detail
- Send an immediate reminder email to not-yet-enrolled employees on a policy,
  without leaving the page

---

## 2. Business Rules and Constraints

| Rule | Description |
|---|---|
| Company scoping | All data is scoped to the company currently selected in the HR Portal's company switcher (`portfolioCompanyId`). The admin cannot view another company's data from this page. |
| Period visibility window | Only enrolment periods whose `enrollment_end_date` is today or in the future are shown. A period whose end date has already passed is excluded entirely — this page is a live status view, not a historical report. |
| Grouping | Rows are grouped by enrolment period (`enrollment_start_date`, `enrollment_end_date`). All policies open under that period are listed inside its group. |
| Status buckets are mutually exclusive | Every counted employee falls into exactly one of Enrolled / In Progress / Not Enrolled. The three buckets always sum to Total. |
| Employee eligibility | Only active, non-deleted employees are counted (`user_status_key = 'USER_STATUS_ACTIVE'`, `deleted_at IS NULL`). Terminated or deleted employees never appear in any bucket. |
| Period-to-employee matching | An employee counts toward a period's numbers only if they were part of that period's specific enrolment batch (i.e. added via that period's document/endorsement batch) — not merely because they are enrolled in the policy at some other time. |
| No filters, no search | This page intentionally has no search box, date filter, or policy filter. It always shows the complete, unfiltered current picture for the company in context. |
| Policy number fallback | If a policy has no insurer-assigned policy number on file, the UI displays `POL-<policyId>` instead of leaving the field blank. |
| Reminder scope | "Send Reminder" targets the whole policy's not-yet-enrolled population, not just the specific period row it was clicked from. A policy typically has one active enrolment window at a time, so this is not expected to cause confusion in practice. |
| Reminder recipients | Reminder emails go to every employee on the policy who is not `ENROLLED` — this includes both "Not Enrolled" and "In Progress" employees (see §8, known gap, for the UI implication of this rule). |
| Expand/collapse independence | Each enrolment period card has its own expand/collapse state. A single "Expand All / Collapse All" control (matching the existing Portfolio page's behaviour) toggles every period at once. |

---

## 3. Section 1 — Page Header

| Field | Description |
|---|---|
| Title | "Enrolment Status" |
| Subtitle | "Enrolment progress by period and policy, with reminders for employees who haven't enroled" |
| Last synced timestamp | Not shown on this page (this is a live query, not a cached/synced snapshot — showing a sync time would be misleading) |

---

## 4. Section 2 — Enrolment Period List

### 4.1 Purpose

Displays every current/future enrolment period for the company as a
collapsible card, most recent period first.

### 4.2 Period Card Header Fields

| Field | Description |
|---|---|
| Period range | `enrollment_start_date` – `enrollment_end_date`, formatted as e.g. "12 Jul 2026 – 30 Jul 2026" |
| Policy count badge | Number of policies open under this period |
| Expand/collapse chevron | Toggles this period's policy table |

A page-level summary line shows the total number of enrolment periods found
("N enrolment periods"), and an "Expand All / Collapse All" control sits
alongside it.

### 4.3 Policy Table (visible on period expansion)

| Column | Description |
|---|---|
| Policy | Policy name (clickable) with policy number underneath |
| Total | All eligible employees mapped to this policy for this period's batch |
| Enroled | Count with enrolment status Enrolled |
| In Progress | Count with status In Progress or Endorsement Sent |
| Not Enroled | Count with no enrolment status, or explicit Not Started |
| Send Reminder | Action button — sends a reminder email to not-yet-enrolled employees on this policy |

Clicking the policy name navigates to that policy's Policy Summary page,
landing on the **Enrolment** tab (not the default CD Balance tab).

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time | < 2 seconds for a company with a typical number of open periods/policies |
| Data freshness | Live query on every page load / company switch — no caching layer beyond the 30s client-side stale window used for de-duplication |
| Pagination | None — the report is fetched in full (`limit=0`) since the expected row count (periods × policies) is small |
| Availability | 99.9% |

---

## 6. User Stories

| # | Story |
|---|---|
| US-01 | As an HR admin, I can see every open enrolment period for my company at a glance, so I know what's currently active without checking multiple screens. |
| US-02 | As an HR admin, I can expand a period to see Total/Enrolled/In Progress/Not Enrolled counts per policy, so I can tell which policies need attention. |
| US-03 | As an HR admin, I can expand or collapse all periods at once, or one at a time, so I can manage a long list efficiently (matching the Portfolio page's behaviour). |
| US-04 | As an HR admin, I can click a policy name to go directly to that policy's Enrolment tab, so I can investigate further without re-navigating from the Portfolio or Dashboard. |
| US-05 | As an HR admin, I can send a reminder email to not-yet-enrolled employees on a policy directly from this page, so I don't have to build a separate list or wait for the scheduled reminder cron. |
| US-06 | As an HR admin, I do not see closed/past enrolment periods on this page, so the view stays focused on what's actionable right now. |

---

## 7. Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Company has no open enrolment periods | Empty state: "No enrolment periods found for this company" |
| A period has only one policy | Policy count badge shows "1 policy" |
| A policy has zero not-enrolled employees | "Send Reminder" button is disabled (greyed out, not clickable) |
| Policy number not set | Policy number line shows `POL-<policyId>` instead of blank |
| Two periods share the same start date | Both are shown as separate cards; sort order is deterministic (by start date descending, ties broken by grouping key) |
| Reminder send fails (network/API error) | Error toast shown; button re-enables so the admin can retry |
| Reminder send succeeds | Success toast states how many not-enrolled employees the reminder was queued for |
| Company switched via top switcher | Page reloads its data scoped to the newly selected company |

---

## 8. Known Gaps / Backlog (not yet actioned)

- **Reminder button disabled-state accuracy:** the button is disabled only
  when `notEnrolled === 0`, but the backend reminder actually emails both Not
  Enrolled *and* In Progress employees. A policy with 0 Not Enrolled but some
  In Progress employees will still send reminders to those In Progress
  employees when clicked, even though the button/toast implies the action
  only affects the Not Enrolled bucket. Not fixed as of this writing.
- **Period-scoped reminders:** reminders are sent for the whole policy, not
  scoped to the period row clicked. Acceptable today since policies
  practically run one enrolment window at a time; would need revisiting if
  that assumption changes.

---

## 9. Out of Scope

- Editing enrolment data, employee records, or policy configuration from this page
- Bulk reminder sends across multiple policies in one action
- Export of the enrolment status data (CSV/Excel) — not implemented in v1
- Historical/closed enrolment period reporting (handled by other existing HR reports)
- Search or filter controls of any kind (explicit product decision for v1)
- Sorting controls (fixed sort: most recent period first, then policy name)

---

## 10. Stakeholders

| Role | Interest |
|---|---|
| HR Admin (internal `PORTAL_CRM`) | Primary user — monitors and acts on enrolment status across managed companies |
| External HR (`EXTERNAL_HR`) | Primary user — monitors and acts on enrolment status for their own company |
| Product Manager | Acceptance criteria |
| Engineering Lead | Technical delivery |

---

# END OF PRD
