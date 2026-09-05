# HR Portal – Portfolio Page – Product Requirements Document (PRD)

**Document Version:** 1.0
**Date:** 2026-05-07
**Author:** IIRM Product Team
**Jira Reference:** IIRM-PORTFOLIO
**Related Documents:**
- SDS: `hr-portal-portfolio-SDS.md`
- TRD: `hr-portal-portfolio-TRD.md`
- Framework Reference: `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> This document captures business requirements only. UI layout, component behaviour, navigation patterns, field mappings, and interaction details are in the SDS. Any update to the framework spec must be reflected in the TRD and the API endpoint contracts described there.

---

## 1. Objective

The Portfolio page is the primary landing screen of the HR Portal. It gives the broker/IBP admin a consolidated view of all client companies and their insurance policies across Group Clients and Individual Clients. It enables the admin to:

- Monitor overall portfolio health (total companies, policies, lives, and annual premium)
- Navigate the group company hierarchy to inspect each member company's policies
- Identify companies with active vs. inactive policies at a glance
- Navigate directly to a specific company's Dashboard for deeper analytics
- Navigate directly to a specific policy's detail page

---

## 2. Business Rules and Constraints

| Rule | Description |
|---|---|
| Broker scoping | All data is scoped to the authenticated broker/IBP organization's `companyId` from JWT. The user cannot change the organization scope on this page. |
| Group Clients definition | A client company is a Group Client if it has a parent group entity assigned in the system. All companies sharing the same group parent are shown together under that group. |
| Individual Clients definition | A client company is an Individual Client if it has no parent group entity. It is shown directly in the Individual Clients section. |
| Company classification is mutually exclusive | A company appears in exactly one section — either Group Clients or Individual Clients, never both. |
| Policy status visibility | Both Active and Inactive/Expired policies are included in the portfolio. Status is displayed per policy row. |
| Active/Inactive filter scope | The Policies KPI chip filter shows companies/groups with *at least one* policy matching the selected status. A company with 3 active and 1 expired policy appears in **both** Active-filtered and Inactive-filtered views. |
| Filter chip mutual exclusivity | Only one filter chip (Active or Inactive) can be selected at a time. Selecting the current chip deselects it. |
| AUM definition | AUM (Assets Under Management) shown per group = sum of `premium_amount` across all policies of all member companies in that group. All policy statuses are included. |
| Policy type codes | Recognized types: GMC (Group Medical Cover), GTL (Group Term Life), GPA (Group Personal Accident), GPC (Group Personal Cover). Any unknown type renders its raw code. |
| Policy status values | Three business statuses: **Active** (policy in effect), **Renewal Due** (end date within 60 days), **Expired** (end date in the past). These are derived from `policy.status` DB values. |
| Company navigation | Clicking a company name navigates to the HR Portal Dashboard pre-scoped to that company's data via `companyId` query param. |
| Policy navigation | Clicking a policy row navigates to the policy detail page using the policy's database integer ID. The type code (GMC, GTL, etc.) is never used as a route identifier. |
| Expand/collapse independence | Groups and companies have independent expand/collapse states. Expanding a group does not automatically expand its member companies. |
| RM assignment | Each company row displays its assigned Relationship Manager name. "Unassigned" is shown when no RM is linked. |
| Lives counting | Lives = distinct enrolled employee count across all policies for a company. An employee enrolled in both GMC and GTL at the same company is counted once in the company's life count, but contributes to both policies' individual life counts. Portfolio total lives = sum across all companies (may double-count cross-company employees in conglomerates). |
| Premium currency | All premium values are stored and displayed in Indian Rupees (₹). Large values are formatted in Cr (crore) or L (lakh) notation. |

---

## 3. Section 1 — Portfolio KPI Summary

Four key metrics are always visible at the top of the page.

| # | Metric | Definition |
|---|---|---|
| 1 | Companies | Total count of distinct client companies (group member companies + individual companies combined) |
| 2 | Policies | Total policy count (all statuses). Includes interactive sub-chips showing Active count and Inactive count |
| 3 | Total Lives | Sum of enrolled lives across all policies across all client companies |
| 4 | Total Premium | Sum of annual premiums across all policies, formatted in ₹ Cr |

The Policies KPI card (metric 2) is interactive. Tapping the "Active" sub-chip filters the full portfolio list to show only companies or groups that have at least one active policy. Tapping the "Inactive" sub-chip filters to show companies or groups with at least one inactive or expired policy. Tapping the active chip a second time removes the filter and restores the full list.

---

## 4. Section 2 — Group Clients

### 4.1 Purpose

Displays all group client organizations (conglomerates, holding groups) and their member companies. Each group contains one or more member companies; each company has one or more policies.

### 4.2 Group Row Fields

| Field | Description |
|---|---|
| Group Logo | Two-letter initials of the group, rendered on the group's assigned background colour |
| Group Name | Display name of the parent group organization |
| Sector Tag | Industry sector of the group (e.g., Conglomerate, Information Technology) |
| Summary Line | "X companies · Y policies · Z lives" — computed from member company data |
| AUM | Sum of annual premiums across all member companies' active policies, shown in ₹ Cr |

A count badge on the section divider shows the total number of group organizations.

### 4.3 Company Row Fields (visible on group expansion)

| Field | Description |
|---|---|
| Company Name | Clickable — navigates to the HR Portal Dashboard pre-scoped to this company |
| Industry | Business sector of the company |
| Location | City and State |
| Employee Count | Number of enrolled employees |
| RM Name | Assigned Relationship Manager name; "Unassigned" if none |
| Policy Count | Count of policies for this company |

### 4.4 Policy Table (visible on company expansion)

| Column | Description |
|---|---|
| Name | Full policy type name (e.g., Group Medical Cover, Group Term Life, Group Personal Accident) |
| Type | Policy type badge: GMC / GTL / GPA / GPC |
| Insurer | Insurer company name |
| Policy No. | Insurer-assigned policy number |
| Premium | Annual premium amount |
| Validity | Policy end / renewal date |
| Status | Active / Renewal Due / Expired |

Clicking any policy row navigates to the policy detail page.

---

## 5. Section 3 — Individual Clients

### 5.1 Purpose

Displays client companies that are not part of any group organization.

### 5.2 Company Row Fields

Same as §4.3 (Company Row Fields), with the addition of an **INDIVIDUAL** badge alongside the company name.

### 5.3 Policy Table (visible on company expansion)

Identical structure to §4.4.

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| KPI cards load time | < 2 seconds |
| Company and group list load time | < 2 seconds |
| Companies pagination | 20 companies per page, scroll-triggered load-more per section |
| Policy rows | Loaded on demand when a company is expanded (no additional round-trip for unexpanded companies) |
| Availability | 99.9% |

---

## 7. User Stories

| # | Story |
|---|---|
| US-01 | As an IBP admin, I can view the total count of companies, policies, lives, and premium across all my clients at a glance, so I can monitor overall portfolio health without opening individual dashboards. |
| US-02 | As an IBP admin, I can expand a group client organization to see its member companies and then expand each company to see its policies, so I can navigate the full client hierarchy efficiently. |
| US-03 | As an IBP admin, I can filter the portfolio to show only companies with Active or Inactive policies using the Policies KPI chip, so I can quickly identify clients needing attention or renewal action. |
| US-04 | As an IBP admin, I can click a company name to go directly to that company's Dashboard pre-scoped to their data, so I can investigate a specific client without re-selecting the company from another screen. |
| US-05 | As an IBP admin, I can click a policy row to navigate to the full policy detail page, so I can review policy-level analytics (claims, enrollment, CD balance, inception) for that specific policy. |

---

## 8. Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| No group clients exist | GROUP CLIENTS section header and list are hidden; only INDIVIDUAL CLIENTS is displayed |
| No individual clients exist | INDIVIDUAL CLIENTS section header and list are hidden; only GROUP CLIENTS is displayed |
| No companies at all | Full-page empty state with message; all KPI values show zero |
| A company has zero policies | Company row is visible; policy count badge shows 0; expanding shows a no-policies empty state |
| A group has only one member company | Group summary shows "1 company" |
| Active/Inactive filter yields no matches | Empty state displayed with a message explaining no results match the filter; a reset prompt is provided |
| Premium amount is not recorded for a policy | Premium column shows "—" |
| RM is unassigned for a company | RM field displays "Unassigned" |
| Policy end date is null | Validity column shows "—" |
| Policy number is not set | Policy No. column shows "—" |
| Total lives is zero | KPI card shows 0 Lives |

---

## 9. ICR (Incurred Claim Ratio) Display

ICR is visible as a secondary metric per policy row in the Group Clients section. It is derived from claims data and is displayed as a percentage with a coloured bar indicator.

| ICR range | Urgency state | Colour |
|---|---|---|
| ≤ 65% | Healthy | Green (`#10B981`) |
| 66% – 80% | Caution | Amber (`#F59E0B`) |
| > 80% | At Risk | Red (`#EF4444`) |

ICR is not shown in the Individual Clients section policy table (space constraint). It is shown in the Group Clients policy table only. If ICR data is not available from the report framework at initial release, the ICR column is omitted — do not block the portfolio release on ICR.

---

## 10. Out of Scope

- Creating or editing company or group records from this page
- Assigning or reassigning RMs from this page
- Adding new policies from this page
- Bulk portfolio export
- Company-level search/filtering within the portfolio (handled by the global top-nav search bar)
- Sorting of group or individual company lists
- ICR data for Individual Clients section (deferred)

---

## 10. Stakeholders

| Role | Interest |
|---|---|
| IBP Admin / Broker Admin | Primary user — monitors portfolio health and navigates to clients |
| Relationship Manager | Tracks their assigned companies within the portfolio |
| Product Manager | Acceptance criteria |
| Engineering Lead | Technical delivery |

---

# END OF PRD
