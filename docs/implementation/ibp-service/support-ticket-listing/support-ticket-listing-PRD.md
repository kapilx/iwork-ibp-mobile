# Support Ticket Listing — Product Requirements Document (PRD)

**Document Version:** 1.0
**Date:** 2026-05-19
**Author:** IIRM Product Team
**Jira Reference:** TBD
**Related Documents:**
- SDS: `support-ticket-listing-SDS.md`
- TRD: `support-ticket-listing-TRD.md`
- Framework: `../hr-module-report-framework-tech-spec.md`

> This document captures business requirements only. UI layout, component
> behaviour and field mappings are in the SDS. Implementation approach,
> APIs, schema and execution detail are in the TRD.

---

## 1. Background

The Support Ticket *raise* flow already exists in production:

- Employees raise a ticket from the Support page via `POST /company-employee/:employeeId/tickets` (form lives in [SupportFormSection/index.tsx](../../../../apps/ui/ibp/src/app/common/SupportFormSection/index.tsx), wired from [SupportPage/index.tsx](../../../../apps/ui/ibp/src/app/pages/SupportPage/index.tsx)).
- Anonymous users can also raise via `POST /company-employee/tickets`.
- Tickets are persisted in the `raise_ticket` table ([raise-ticket.entity.ts](../../../../apps/services/service-lib/src/lib/entities/raise-ticket.entity.ts)).

What is missing is a complete **read** picture for two consumers, plus the HR Portal needs a **raise ticket** button surfaced alongside the listing:

| Consumer | What they need | API needed |
| --- | --- | --- |
| Employee Portal | The tickets *the logged-in employee* raised, with current status | `GET /company-employee/:employeeId/tickets` (already implemented; needs auth hardening) |
| HR Portal — listing | Every ticket raised across *the HR user's company* | `POST /hr-module/generate/hr_support_tickets` (new `admin_reports` row) |
| HR Portal — raise | Ability to raise a support ticket directly from the HR Portal | `POST /company-employee/:employeeId/tickets` (same endpoint as Employee Portal — no new backend work) |

Today the employee has no reliable way to confirm whether a previously raised ticket is open, in progress or resolved without contacting support. HR has no aggregate view at all — they cannot triage workload, spot category spikes, or close the loop on a complaining employee. All consuming UIs are owned outside this spec batch (see §3.2).

---

## 2. Objectives

1. Give every employee a self-service view of their own ticket history with current status, on the Support page.
2. Give HR administrators a company-scoped operational view of all tickets raised by their employees, served through the existing `admin_reports` framework so it is consistent with every other HR Portal data screen.
3. Allow HR administrators to raise a support ticket directly from the HR Portal, reusing the same endpoint and form logic as the Employee Portal.

---

## 3. Scope

### 3.1 In Scope (this batch — backend only)

- **Authorization hardening** of the already-implemented `GET /company-employee/:employeeId/tickets` endpoint, so an authenticated employee cannot read another employee's tickets even by tampering with the URL.
- **A new HR report** `hr_support_tickets` seeded into the `admin_reports` framework tables, exposing all tickets raised by a company's employees via `POST /hr-module/generate/hr_support_tickets`. Company scoping is JWT-derived; the client never sends `companyId`.

### 3.2 Owned Outside This Spec (UI already built)

- **HR Portal "Support Tickets" listing UI** — already built and merged on the user's branch. It begins consuming live data the moment the seed migration lands.
- **HR Portal "Raise Ticket" button** — already built on the user's branch. It calls `POST /company-employee/:employeeId/tickets`, the same endpoint used by the Employee Portal. No new backend work is required; the endpoint already handles the request.
- **Employee Portal "My Raised Tickets" UI** — handled outside this spec batch. The endpoint already exists; the rendering layer is being built elsewhere.

### 3.3 Out of Scope (Phase 1, regardless of owner)

- Editing or transitioning ticket status.
- Assigning tickets to agents.
- Comment threads or attachment review beyond what is already linked to the ticket record.
- Export to CSV/Excel.
- Notifications when ticket status changes.
- Cross-company HR access (super-admin view).

### 3.3 Personas

| Persona | Description | Permissions |
| --- | --- | --- |
| Employee | Authenticated user on the Employee Portal who has raised one or more tickets | View own tickets only; raise new tickets |
| HR Administrator | Authenticated user on the HR Portal scoped to a single company | View all tickets raised by employees of that company; raise new tickets via the same endpoint as employees |

---

## 4. Business Rules

| ID | Rule | Description |
| --- | --- | --- |
| BR-STKT-001 | Employee data scoping | An employee can see only the tickets where `raise_ticket.employee_id` matches their own employee ID from the JWT. The employee ID must never be taken from the request body or URL on behalf of another user. |
| BR-STKT-002 | HR data scoping | HR administrators can see only tickets raised by employees whose `policy_enrollment_employee.company_id` matches the company ID derived from the HR user's JWT. Cross-company data access must be prevented at the data layer. |
| BR-STKT-003 | Anonymous tickets excluded from employee view | Tickets where `employee_id IS NULL` (raised via the public/anonymous endpoint) do not belong to any logged-in employee and are not listed in the Employee Portal view. |
| BR-STKT-004 | Anonymous tickets in HR view | Anonymous tickets are out of scope for the HR view in Phase 1, because they have no `employee_id` and therefore cannot be attributed to a company. They remain queryable in the database and may be surfaced in a future cross-company admin view. |
| BR-STKT-005 | Read-only listing | Neither view exposes mutation actions on the ticket (no status change, no assignment, no comment) in Phase 1. |
| BR-STKT-006 | Default ordering | Tickets are listed newest-first by `created_at DESC` in both views, so the most recent activity is always at the top. |
| BR-STKT-007 | Status vocabulary | Status values shown in the UI are exactly the four values defined on the entity: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. No additional statuses are introduced. |
| BR-STKT-008 | Category vocabulary | Category values shown are exactly the five defined on the entity: `BILLING`, `CLAIMS`, `POLICY`, `ENROLLMENT`, `OTHER`. |
| BR-STKT-009 | Pagination required | Both listings paginate. The Employee Portal uses a generous default page size to cover typical history; the HR Portal uses a smaller page size and exposes paging controls because volumes are higher. |
| BR-STKT-010 | Refresh after raise | When an employee raises a new ticket via the existing form, their personal list must reflect the new ticket without a full page reload. |
| BR-STKT-011 | HR raise ticket reuses employee endpoint | The HR Portal "Raise Ticket" button calls `POST /company-employee/:employeeId/tickets` — the same endpoint used by the Employee Portal. No parallel raise endpoint is introduced. The `employeeId` in the path must correspond to a valid employee within the HR user's company. |

---

## 5. User Stories

> **Note:** These stories describe the *capability* the backend must deliver to its consumers. They do not prescribe UI behaviour — that belongs to whoever owns the consumer surface.

### US-STKT-001 — Employee retrieves their own raised tickets

> **As an** employee who has raised support tickets,
> **I want** an API that returns every ticket I have raised, with current status,
> **so that** the consuming UI can show me my history without me contacting support.

**Acceptance Criteria:**
- The Employee endpoint returns, for the authenticated caller, every ticket where `raise_ticket.employee_id = JWT.employeeId`.
- Each ticket record includes at minimum: ticket ID, category, status, priority, mail ID, escalation description, document IDs, raised date.
- Results are ordered `created_at DESC` (newest first).
- An attempt to read another employee's tickets by tampering with the path parameter returns HTTP 403.
- Anonymous tickets (`employee_id IS NULL`) are not returned in this view.

### US-STKT-002 — Status is part of the response

> **As an** API consumer,
> **I want** the ticket status to be returned as a discrete enum value,
> **so that** the consuming UI can render it however it chooses (badge, colour, label).

**Acceptance Criteria:**
- The `status` field in every ticket record is one of: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- No "computed" status (e.g. "Almost Resolved") is emitted. The vocabulary is exactly what the entity defines.

### US-STKT-003 — HR retrieves all tickets raised in their company

> **As an** HR administrator,
> **I want** an API that returns every ticket raised by employees of my company,
> **so that** the HR Portal UI can show an operational view of support load.

**Acceptance Criteria:**
- `POST /hr-module/generate/hr_support_tickets` returns, for the authenticated HR caller, every non-anonymous ticket where `policy_enrollment_employee.company_id = JWT.companyId`.
- The response uses the standard `admin_reports` framework envelope: `data.rows` + `data.count`.
- Each row includes: ticket ID, employee ID, employee name, employee email, category, status, priority, ticket mail ID, description preview (≤ 120 chars), full description, raised date.
- Results are ordered `created_at DESC`.
- Rows belonging to other companies are never returned, even if a `companyId` is supplied in the request body or query — the value is sourced exclusively from the JWT.
- Pagination follows the framework defaults (page-based, server-side).
- Data is restricted to tickets where the associated employee belongs to the HR user's company.
- The table is served via the existing `admin_reports` framework endpoint (`POST /hr-module/generate/:report`), with a new report name `hr_support_tickets`. No bespoke controller is introduced.

### US-STKT-005 — HR raises a support ticket

> **As an** HR administrator,
> **I want** to raise a support ticket directly from the HR Portal,
> **so that** I can report issues without switching to the Employee Portal.

**Acceptance Criteria:**
- The HR Portal calls `POST /company-employee/:employeeId/tickets` — the same endpoint used by the Employee Portal.
- No new backend endpoint or controller is introduced for this flow.
- The request payload and response envelope are identical to those used by the Employee Portal raise flow.
- The ticket is persisted in `raise_ticket` and immediately visible in the HR Portal listing (`POST /hr-module/generate/hr_support_tickets`) after the raise.

---

### US-STKT-004 — HR filters tickets by status and category

> **As an** API consumer building the HR view,
> **I want** the `hr_support_tickets` report to accept optional `status` and `category` parameters,
> **so that** the consuming UI can narrow the list without filtering client-side.

**Acceptance Criteria:**
- The report SQL substitutes `###status###` and `###category###` parameters; when either is null/omitted, that filter is a no-op.
- Filter values, when present, must match the entity's enum vocabulary (`status` and `category` rules in §4).
- Filters compose with AND logic: `status=OPEN` AND `category=BILLING` returns only tickets satisfying both.
- Omitting both parameters returns the full company-scoped list.

---

## 6. Non-Functional Requirements

| Concern | Requirement |
| --- | --- |
| Performance | Both endpoints must respond within 1500 ms p95 for the typical company workload (≤ 10,000 tickets per company, ≤ 100 tickets per employee). |
| Pagination defaults | Employee Portal: default limit 50, max 100. HR Portal: default limit 10, configurable up to 100. |
| Auth | Both endpoints behind `JwtAuthGuard`. HR endpoint additionally behind the existing role guard used for HR Portal screens. |
| Indexing | The `raise_ticket` table already carries indexes on `employee_id`, `status`, `category`, `created_at`. No new indexes are required for Phase 1. |
| Backwards compatibility | The Raise Ticket POST is untouched. The employee GET endpoint is already deployed; the new HR report row must be additive — no schema migration to `raise_ticket` itself. |

---

## 7. Open Questions

| # | Question | Owner | Resolution Required Before |
| --- | --- | --- | --- |
| 1 | Should the HR view eventually include anonymous tickets (when the company can be inferred from `mailId` matching a company employee)? Phase 1 excludes them. | Product | A future iteration, not this batch |
| 2 | Does HR need a date-range filter parameter on the report in Phase 1, or only `status` + `category`? | Product | Seed-migration sign-off |

---

## 8. Success Metrics

- Zero P1 incidents related to cross-company or cross-employee data leakage in the first 30 days post-launch.
- Backend p95 latency on both endpoints stays within the targets in §6 across the first month of live traffic.
