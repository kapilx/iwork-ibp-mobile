# Enrolment Drive Report — PRD (IIRM-10744)

This document specifies the **Enrolment Drive Report** screen in the IBP Risk Watch portal (HR Portal, base path `/hr-portal/*`). It gives HR users a single view of all **active and upcoming enrolment activity** for their company: which policies are open (or opening) for enrolment, over which window, and how far employees have progressed. It is written for the product team, the Tech Lead who will derive the TRD, and the client sign-off authority. It describes what the screen does, not how it is built.

**A note on the core concept.** "Enrolment drive" is a *derived* concept, new to this PRD. Nothing in the platform today stores a drive: each policy independently carries an enrolment window (`enrolment start date` / `enrolment end date`, configured per policy via the Portal Configurator, IIRM-8059). This screen *derives* drives by grouping a company's policies that share the identical start/end date pair — because in practice, when a company runs an enrolment exercise, all participating policies are configured with the same window. The grouping is computed at read time; there is no drive entity to create, edit, or delete.

---

## 1. Scope

The screen is deliberately a read-only report: it aggregates what policy configuration and employee enrolment already produce, and hands off to existing screens for anything deeper.

**In scope**

- A new first-class sidebar entry in the Risk Watch portal (working label: **Enrolment Drives**), sibling to Portfolio, Dashboard, Reports, Hospitals, Support Ticket, and User Mgmt.
- Listing all **active** and **future** enrolment drives for the company (or companies) the logged-in user is scoped to.
- Grouping policies into drives by identical enrolment start + end date, per company.
- An accordion per drive; expanding it lists the drive's policies with four employee counts: **Total Employees**, **Enrolled**, **In Progress**, **Yet to Start**.
- Navigation from a policy row to that policy's **Policy Detail** page.
- Multi-company behaviour for group HR and CRM users, consistent with Portfolio's display modes.
- Empty state when the company has no active or future drives.

**Out of scope (deferred)**

- Completed / past drives and any drive history view.
- Creating, editing, naming, or cancelling drives — drives are derived, not managed.
- Dependent-level counts (dependents remain on the Policy Detail / Dashboard drilldowns).
- Export or download of the report.
- Reminders, nudges, or notifications to unenrolled employees from this screen.
- Any employee-portal-side view of drives.

---

## 2. Roles and Access

All HR-side roles see this screen. This is a deliberate product decision that **deviates from the existing Reports rule** (EXTERNAL_HR is hidden from Reports elsewhere in the portal): the Enrolment Drive Report is visible to EXTERNAL_HR as well, because external HR partners are often the ones running the enrolment exercise.

| Role | Access | Data scope |
|---|---|---|
| HR_ADMIN | Full view | Own company / group (via subdomain-resolved `companyId`) |
| ONLY_HR | Full view | Own company / group |
| EXTERNAL_HR | Full view | Own company / group |
| PORTAL_CRM | Full view | All managed companies (via `crmUserId`) |
| ROLE_COMPANY_EMPLOYEE (pure employee) | No access | — |

Hybrid employee+HR users access the screen through their Risk Watch (HR) context, consistent with the rest of the portal.

---

## 3. User Stories

There is no approved BRD for this module; stories trace to the Jira ticket **IIRM-10744** and to the Risk Watch portal definition. Each story carries acceptance criteria in §5.

**Viewing drives**

- **US-EDR-001** — As an HR user, I want to open **Enrolment Drives** from the sidebar after login and see every active and upcoming enrolment drive for my company, so that I have one place to track all enrolment activity without opening each policy.
- **US-EDR-002** — As an HR user, I want policies that share the same enrolment window to appear as **one drive**, so that a company-wide enrolment exercise spanning GMC, GTL, and GPA reads as a single event rather than three separate entries.
- **US-EDR-003** — As an HR user, I want to tell at a glance whether a drive is **Active** (window open now) or **Upcoming** (window starts later), and how much time remains on an active drive, so that I can prioritise follow-ups.

**Drilling into a drive**

- **US-EDR-004** — As an HR user, I want to expand a drive and see each policy in it with **Total Employees, Enrolled, In Progress, and Yet to Start** counts, so that I can spot which policies are lagging.
- **US-EDR-005** — As an HR user, I want to click a policy in an expanded drive and land on that policy's **Policy Detail** page, so that I can act on the detail (pending employees, policy specifics) without re-searching.

**Multi-company contexts**

- **US-EDR-006** — As a group HR (parent company), I want drives grouped **per company** across my group, so that I can track each subsidiary's enrolment separately.
- **US-EDR-007** — As a PORTAL_CRM user, I want the same per-company grouping across **all companies I manage**, so that I can monitor every client's enrolment status from one screen.

**Empty state**

- **US-EDR-008** — As an HR user with no active or future drives, I want a clear empty state saying so, so that I don't mistake an empty list for an error.

---

## 4. Business Rules

**Drive derivation**

- **BR-EDR-001** — A drive is the set of a single company's policies whose enrolment window start date **and** end date are both identical. Grouping never crosses company boundaries: two companies with the same window have two separate drives.
- **BR-EDR-002** — A policy belongs to at most one drive. Policies with **no enrolment window configured** (either date missing) are excluded from this screen entirely.
- **BR-EDR-003** — Drives are derived at read time from current policy configuration. If a policy's window dates are changed in the Portal Configurator, the drive composition on this screen reflects it on next load — a policy can "move" between drives.
- **BR-EDR-004** — A drive has no stored name. It is identified by its enrolment period, displayed as a date range (e.g. *01 Jul 2026 – 31 Jul 2026*).

**Drive status**

- **BR-EDR-005** — Drive status is computed against today's date at local-day granularity, boundary days inclusive:
  - **Active**: start date ≤ today ≤ end date.
  - **Upcoming**: today < start date.
  - Drives whose end date has passed are **not shown** (out of scope).
- **BR-EDR-006** — An active drive on its final day is still Active; it disappears from the screen the day after its end date.
- **BR-EDR-007** — Active drives show remaining time ("X days left", derived from end date − today). This mirrors the deadline-alert treatment already defined for pending enrolment in HR analytics.

**Ordering**

- **BR-EDR-008** — Within a company: Active drives first, ordered by end date ascending (closest deadline on top); then Upcoming drives, ordered by start date ascending (next to open on top).
- **BR-EDR-009** — Within a drive, policies are listed in a stable order (policy type, then policy number) — final ordering is a design decision (see OQ-EDR-005).

**Counts**

- **BR-EDR-010** — All four counts are **employee counts only**. Dependents are not counted on this screen.
- **BR-EDR-011** — Count definitions per policy, based on the employee enrolment status for that policy:
  - **Total Employees** — employees eligible for / mapped to the policy for this enrolment window.
  - **Enrolled** — employees whose enrolment is confirmed (`ENROLLED`).
  - **In Progress** — employees who have started but not completed enrolment (`IN_PROGRESS`).
  - **Yet to Start** — employees who have not begun (`NOT_STARTED`).
- **BR-EDR-012** — Enrolled + In Progress + Yet to Start must account for every employee in Total Employees. Employees in intermediate statuses (`PENDING`, `NOTIFY`, `ENDORSEMENT_SENT`) must be mapped into exactly one of the three buckets — the mapping is an open technical question (OQ-EDR-001) and must be resolved before build.
- **BR-EDR-013** — An employee enrolled in multiple policies of the same drive is counted independently per policy row. Counts are per policy, not deduplicated across the drive.
- **BR-EDR-014** — Drive-level rollups (if shown on the collapsed accordion header, e.g. total policies in drive) are sums of the policy-level figures.

**Scoping**

- **BR-EDR-015** — Data scope follows the portal's existing multi-tenancy: HR roles are scoped by the subdomain-resolved company (and its group, where applicable); PORTAL_CRM is scoped by managed-company mapping. No user ever sees a company outside their scope.
- **BR-EDR-016** — In group and CRM contexts, drives are presented grouped by company, consistent with Portfolio's Group / Standalone / CRM display modes.

---

## 5. Acceptance Criteria

**US-EDR-001 — sidebar entry and drive list**

- **AC-EDR-001** — Given a logged-in HR user, when they open the Risk Watch sidebar, then an **Enrolment Drives** entry is visible, and selecting it opens the Enrolment Drive Report screen.
- **AC-EDR-002** — Given the user's company has three policies with window 01 Jul–31 Jul and two policies with window 01 Aug–15 Aug, when the screen loads, then exactly **two drives** are listed.

**US-EDR-002 — grouping**

- **AC-EDR-003** — Given two policies of the same company with identical start and end dates, when the screen loads, then both appear inside a single drive accordion.
- **AC-EDR-004** — Given two policies whose windows share a start date but differ in end date, when the screen loads, then they appear as **two separate drives**.
- **AC-EDR-005** — Given a policy with no enrolment start or end date configured, when the screen loads, then that policy appears in no drive.

**US-EDR-003 — status and countdown**

- **AC-EDR-006** — Given today is 10 Jul and a drive runs 01 Jul–31 Jul, when the screen loads, then the drive is labelled **Active** and shows the remaining days to 31 Jul.
- **AC-EDR-007** — Given today is 10 Jul and a drive runs 01 Aug–15 Aug, when the screen loads, then the drive is labelled **Upcoming**.
- **AC-EDR-008** — Given today is 01 Aug and a drive ended 31 Jul, when the screen loads, then that drive is not shown.

**US-EDR-004 — policy counts**

- **AC-EDR-009** — Given an expanded drive, when its policy rows render, then each row shows the policy identity and the four counts: Total Employees, Enrolled, In Progress, Yet to Start.
- **AC-EDR-010** — Given a policy with 100 mapped employees of whom 60 are enrolled and 25 have started but not finished, when the row renders, then it shows Total 100, Enrolled 60, In Progress 25, Yet to Start 15.

**US-EDR-005 — navigation**

- **AC-EDR-011** — Given an expanded drive, when the user clicks a policy row, then the app navigates to that policy's **Policy Detail** page (`/hr-portal/policies/:policyId`), and browser back returns to the report with the drive still expanded.

**US-EDR-006 / US-EDR-007 — multi-company**

- **AC-EDR-012** — Given a group HR user whose group has two subsidiaries each running a drive, when the screen loads, then drives are grouped under each company, and no company outside the group appears.
- **AC-EDR-013** — Given a PORTAL_CRM user managing companies A and B, when the screen loads, then drives for both A and B are shown grouped per company, and identical windows at A and B remain **separate drives**.

**US-EDR-008 — empty state**

- **AC-EDR-014** — Given a company with no active or future enrolment windows on any policy, when the screen loads, then an empty state explains that no enrolment drives are currently active or scheduled — no error, no blank panel.

---

## 6. Data Contract

This screen is read-only; it consumes existing configuration and enrolment data and produces only navigation.

**Consumes**

- Per policy: `policyId`, policy number, policy type (GMC/GTL/GPA/…), `enrolmentStartDate`, `enrolmentEndDate` — from policy configuration (Portal Configurator, IIRM-8059).
- Per policy: employee enrolment status counts aggregated by status (`NOT_STARTED`, `IN_PROGRESS`, `ENROLLED`, plus intermediate statuses per OQ-EDR-001) and total mapped employees — from the enrolment status model (IIRM-8242 / IIRM-8078).
- Company context: subdomain-resolved `companyId` / group structure for HR roles; managed-company list for PORTAL_CRM.

**Produces**

- Navigation to Policy Detail: `/hr-portal/policies/:policyId`.

**Cross-module notes — ⚠ technical changes, Tech Lead review required**

- **New backend aggregation.** No existing API returns policies grouped by enrolment window with per-status employee counts. A new (or extended) service endpoint is required. The nearest existing primitive is the per-policy in-progress/completed count aggregation in opportunity-service.
- **New UI surface.** A new sidebar entry and screen in the Risk Watch portal — touches the shared HR portal shell/navigation.
- **No schema change expected.** Drives are derived; no new tables or columns — unless the status-bucket mapping (OQ-EDR-001) forces one.

---

## 7. Open Questions

These block the TRD (40b), not client review of the product behaviour above — except OQ-EDR-001, which affects the numbers HR users see and should be resolved first.

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-EDR-001 | Bucket mapping for intermediate statuses `PENDING`, `NOTIFY`, `ENDORSEMENT_SENT` — which of Enrolled / In Progress / Yet to Start does each land in? Counts must total (BR-EDR-012). | Tech Lead | Open |
| OQ-EDR-002 | Does the HR-portal header **Policy Location filter** apply to this screen's counts, as it does on Portfolio/Dashboard? | Product | Open |
| OQ-EDR-003 | Is there a horizon limit for Upcoming drives (e.g. next 12 months) or are all future-dated windows shown? | Product | Open |
| OQ-EDR-004 | Final sidebar label, icon, and position ("Enrolment Drives" is a working title). | Design | Open |
| OQ-EDR-005 | Policy row ordering within a drive, and what summary (if any) appears on the collapsed accordion header. | Design | Open |
| OQ-EDR-006 | "Total Employees" basis: all employees mapped to the policy vs employees eligible in the current window (joiners/leavers mid-window). | Product + Tech Lead | Open |

---

## 8. Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
