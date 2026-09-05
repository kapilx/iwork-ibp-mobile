# Rewards — Product Requirements Document

**Module:** IIRM-10616 · Rewards
**Product:** Insurance Wellness Hub — iWork (IIRM)
**Author:** Nithin Sirigiri
**Created on:** 2026-06-16
**Last updated:** 2026-06-25
**Status:** Draft — Pending open questions (see Section 9)

---

## 1. Overview

**Reward** = Income given by an Insurance company to IIRM over and above regular brokerage.

Rewards are captured in iWork by users with the Rewards privilege and reflected in BizDone reports. The module is exposed as a new **role-based "Insurer Rewards"** menu link under the **Admin Module**.

Phase 1 delivers the **Generic Reward** only. **Specific Reward** is a future category whose rules are **not yet defined** — it is intentionally excluded from this document (the Reward Category selector reserves a disabled "Specific" option for it).

| | Generic Reward (Phase 1) |
|---|---|
| Reward basis | A fixed amount from the commission statement |
| Scope | Not tied to any SBU (Corporate Business) |
| Trigger | Finance team emails with commission statement |
| Who enters | Privilege-gated (Add / Edit / Delete / View) |
| Dates | Financial Year → Business Month(s) + Date of Income (Income Month derived & stored) |
| Documents | Multiple uploads (optional) |
| BizDone | New "Rewards" sheet listing rewards per insurer; plus a "Rewards" column on the Summary-Insurer Classification sheet |

---

## 2. Scope

**In scope (Phase 1 — Generic):**
- New role-based **"Insurer Rewards"** menu link under **Admin Module**, privilege-gated (Add / Edit / Delete / View Only)
- Rewards list screen: smart search, filter, KPI summary cards, paginated results table
- Add New Reward — a single full-page form (the Reward Category selector is present; only Generic is active)
- **Generic Reward = fixed-amount entry** from the commission statement
- Edit / Delete of reward records — privilege-gated
- Export to Excel for the Rewards list — privilege-gated
- Multiple document upload per reward (each with Preview + Delete)
- BizDone impact: new "Rewards" sheet in the download (privilege-gated, hidden from users without Rewards view privilege); a "Rewards" column added to the Summary-Insurer Classification sheet

**Deferred (later phase) — see Section 11:**
- **Specific Reward** — entire category; requirements not yet defined
- Generic-reward **period aggregation** (Total Net Premium / Total Brokerage by Policy Start Date), **% reward calculation**, **Reward Base** selection, **snapshot-on-save**, and the **Policies Considered** reference list
- Dashboard With / Without Rewards toggle, and dashboard scope (SBU / CEO)
- Document field extraction via OCR / AI
- Notifications / alerts when reward targets are met
- Payment status lifecycle (Pending → Received)

---

## 3. Screen Design Reference

The Rewards screen follows the **Manage Insurer** pattern in iWork:
- Smart search bar + filter icon
- KPI summary cards row
- "List of records (N)" table with "Add New Reward" button
- Table: sortable columns, document link per row, Table Settings to show/hide columns

The **Add / Edit / View Reward form is a full-page form** (not a side drawer) — the client prefers maximum screen real-estate. Below the inputs the form shows a **Rewards list** — empty until an Insurer is selected, then the existing rewards for that insurer.

### 3.1 KPI Cards

All KPI values reflect the current active filter state. *(The "Total Rewards" count card was removed per client feedback.)*

| Card | Formula |
|---|---|
| Total Reward Amount | SUM(Reward Amount) for all matching records |
| Generic Reward Amount | SUM(Reward Amount) WHERE Reward Category = "Generic" AND matching active filter |
| Specific Reward Amount | Shown **greyed-out** (always 0) to signal the Specific category is coming in a future phase |

### 3.2 Filters

Filter panel follows the iWork/BizDone pattern.

| Group | Filter | Notes |
|---|---|---|
| Organisation | Organisation | Reserved for the future Specific category |
| Period | Business Month / Income Month (toggle) | User picks which month type the date range applies to |
| Period | From Date | Applied on the selected month type |
| Period | To Date | Applied on the selected month type |
| Reward | Reward Category | Generic (Specific reserved for future) |
| Reward | Insurer | Active and inactive insurers |

### 3.3 Results Table Columns

| Column | Default visible |
|---|---|
| Reward Category | Yes |
| Insurer | Yes |
| Business Month | Yes |
| Income Month | Yes |
| Reward Amount | Yes |
| Comments | Yes (truncated, full text on hover) |
| Document | Yes (link) |
| Created Date | Yes |
| Actions (Edit / Delete) | Yes |
| Created By | Table Settings |

---

## 4. User Stories

### US-REWARDS-001 — Access Insurer Rewards menu
As a user with any Rewards privilege,
I want a role-based "Insurer Rewards" menu link under Admin Module,
so that I can access all reward records.

### US-REWARDS-002 — View, search, and filter rewards list
As an authorised user,
I want to search and filter rewards (by Reward Category, Insurer, and a Business/Income Month date range) with KPI cards summarising totals,
so that I can find specific entries and track reward amounts at a glance.

### US-REWARDS-003 — Add a Generic reward
As an authorised user,
I want to add a Generic reward by recording the insurer, one or more business months, the date of income, and the fixed reward amount from the commission statement,
so that the reward is captured in iWork and flows into BizDone.

### US-REWARDS-004 — Edit a reward
As a user with the Edit privilege,
I want to edit a saved reward record,
so that I can correct details, with the change tracked in the audit trail.

### US-REWARDS-005 — Delete a reward
As a user with the Delete privilege,
I want to delete a reward record with confirmation,
so that I can remove entries created in error without losing auditability.

### US-REWARDS-006 — Export rewards list
As an authorised user,
I want to export the current filtered rewards list to Excel,
so that I can share or reconcile the data offline.

### US-REWARDS-007 — Upload multiple documents
As an authorised user,
I want to upload one or more supporting documents against a reward, each with preview and delete,
so that the reward is backed by its source evidence.

### US-REWARDS-008 — BizDone reflects rewards
As an authorised user running BizDone,
I want a "Rewards" sheet listing rewards per insurer and a "Rewards" column on the Insurer sheet,
so that the report reflects IIRM's reward income alongside brokerage.

---

## 5. Business Rules

### BR-REWARDS-001 — Single form, category selector, Generic only
The Add New Reward screen is a **single full-page form** with a Reward Category selector — the client does not permit two separate forms. **Phase 1 delivers only Generic**; the "Specific" option is shown **disabled** (future category, rules not yet defined). The category is set per record and cannot be changed after the record is saved.

### BR-REWARDS-002 — Generic Reward: fixed amount, not tied to any SBU
Generic Reward is recorded as a **fixed reward amount** taken from the insurer's commission statement. It is tagged to Corporate Business only — not associated with any SBU, Vertical, Department, Branch, or Owner. It captures one or more Business Months and a single Date of Income.

### BR-REWARDS-003 — Generic Reward: insurer as customer
In the Generic Reward entry the "customer" is the Insurance Company itself. The Insurer dropdown doubles as the customer/payee field and maps to the existing BizDone customer field for reporting.

### BR-REWARDS-004 — Insurer list: active and inactive
The Insurer dropdown lists **all insurers, both active and inactive**. Inactive insurers are shown with "(Inactive)" beside the name. A reward **can be saved against an inactive insurer** — back-dated data entry is a valid case.

### BR-REWARDS-005 — Financial Year drives Business Month; cumulative amount
The user selects a **Financial Year** first; the **Business Month** multi-select then lists only that FY's months (Apr–Mar). Business Month is a multi-select — a single reward may be tagged to one or more business months within the chosen FY. The Reward Amount is a **cumulative figure covering all the selected business months together** — it is not split or allocated per month. The reward is recognised once and bucketed by **Income Month** for income reporting; when filtered by the selected business-month range it appears once as the cumulative amount.

### BR-REWARDS-006 — Income Month is system-computed and stored
**Income Month** is not a form field and is not entered or shown during entry. The system computes it as the month-year of the **Date of Income** and stores it in the DB. BizDone provides two period filters — **Business Month** and **Income Month** — and a reward is matched on the respective field for each (see BR-REWARDS-020).

### BR-REWARDS-007 — Reward Type stored but hidden in Phase 1
The record carries a **Reward Type** field. In Phase 1 it is always **Fixed** and is **not shown on screen** (stored only). The Percentage option becomes visible in a later phase (Section 11).

### BR-REWARDS-008 — Document upload: optional, unlimited, preview + delete
Document upload is **optional**; the user may upload **any number of files (n)** per reward — no count limit in Phase 1. Each attachment is listed with **Preview** and **Delete** actions (icon + label). File-type and size constraints, and whether upload becomes mandatory, are to be confirmed with business.

### BR-REWARDS-009 — Privilege levels (four tiers)
Rewards access is controlled by four distinct privilege levels:

| Privilege | What it allows |
|---|---|
| View Only | View rewards list, filters, KPI cards, and document links |
| Add | View + create new reward records |
| Edit | Add + edit existing reward records; audit trail (updated by, updated at) |
| Delete | Edit + delete reward records; soft-delete with confirmation required |

Export to Excel follows the View privilege. Menu access follows the **standard Admin Module access model** used across the application (same role-permission mechanism as the rest of the app), in addition to the Rewards privilege.

### BR-REWARDS-010 — Edit / Delete: audit and soft-delete
Edits record "updated by" and "updated at" and apply to **future** BizDone runs; already-downloaded reports are point-in-time and are not restated in Phase 1. Deletion is a **soft delete** — the reward is marked **Inactive** (not physically removed) and excluded from future runs. Delete is an edge case (~0.01%) and requires confirmation. Reward **reversal / clawback** and **restatement** of prior reports are deferred to Phase 2 (Section 11C).

### BR-REWARDS-011 — Rewards form is the data source for BizDone
The Rewards entry form is the first point of data capture. Data entered here creates a Reward record that subsequently appears in BizDone. The reward amount is entered directly from the commission statement; BizDone output does NOT pre-populate the form.

### BR-REWARDS-012 — BizDone: new "Rewards" sheet
The BizDone download includes a new **"Rewards" sheet** that lists reward records grouped per insurer. It is visible only to users with the Rewards view privilege. Columns mirror the Rewards entry form fields (finalised after form sign-off).

### BR-REWARDS-013 — BizDone: "Rewards" column on the Insurer sheet
A **"Rewards" column** is added to the Summary-Insurer Classification sheet, computing the total reward amount per insurer. It is shown **separately** — reward income is never merged into the brokerage figure or any existing brokerage total/variance. Generic Reward does **not** appear in the Comp or Policy Classification sheets.

### BR-REWARDS-014 — BizDone: Income Type dropdown includes "Rewards"
The Income Type dropdown in BizDone includes a **"Rewards"** value, visible only to users with the Rewards view privilege. Other values (All, Policy, Endorsement) are unchanged. Reward rows are hidden from users without the privilege.

### BR-REWARDS-015 — Mandatory field validation on save
Save is blocked until all Mandatory fields (Insurer, Business Month, Date of Income, Reward Amount) are filled. Inline per-field validation errors are shown.

### BR-REWARDS-016 — Reward Amount: positive only, locale-formatted
Reward Amount accepts **positive values only** — zero and negative values are rejected with an inline error. Every amount field displays **locale-based thousands separators**, applied when the user leaves the field (on blur): Indian numbering for INR (e.g. `1,00,00,000`), with grouping determined by the country.

### BR-REWARDS-017 — Rewards list in the form
Below the inputs the form shows a **Rewards list**. It is **empty by default**; once an Insurer is selected it shows the **existing rewards for that insurer only** (read-only history). It is not a batch-entry grid.

### BR-REWARDS-018 — Duplicate detection on save
On save the system checks for duplicates:
- **Hard block (save prevented):** same Insurer + same Business Month(s) + same Reward Amount — an exact duplicate cannot be saved.
- **Soft warn (override allowed):** same Insurer + same Date of Income (same day) — the user is warned and may confirm to proceed.

### BR-REWARDS-019 — Comments
The form provides an **optional Comments** text area (above Document upload) for free-text notes. Its value is saved with the reward record and shown on Edit/View.

### BR-REWARDS-020 — BizDone inclusion by Business Month / Income Month
BizDone exposes two period filters — **Business Month** and **Income Month** — usable as a month selection or a date range.
- When filtered by **Business Month**, a reward is included if **any of its discretely selected Business Months** falls within the filter. Months that were *not* selected are never matched, even if they lie between selected ones — e.g. a reward tagged **Apr + Jun** (May not selected) does **not** appear for a May filter.
- When filtered by **Income Month**, a reward is included if its **Income Month** (derived from Date of Income) falls within the filter.
- A matched reward is shown **once** with its **full cumulative amount**, even when several of its Business Months fall inside the selected range. It is never counted per month or split.

> **Dependency:** the separate Business Month and Income Month period filters in BizDone are a BizDone change currently in progress (not yet in the codebase). It is expected to be in production before this feature ships; these rules assume it is available.

---

## 6. Acceptance Criteria

These are the client sign-off criteria. Each traces to a user story.

### AC-REWARDS-001 — Menu visibility & privilege (US-001)
**Given** a user with any Rewards privilege,
**When** the navigation renders,
**Then** the "Insurer Rewards" link appears under Admin Module and opens the rewards list.

**Given** a user with no Rewards privilege,
**When** the navigation renders,
**Then** the Insurer Rewards link is not shown and direct URL access returns an unauthorised state.

### AC-REWARDS-002 — List & KPI cards (US-002)
**Given** an authorised user opens Insurer Rewards,
**When** the page loads,
**Then** three KPI cards (Total Reward Amount, Generic Reward Amount, Specific Reward Amount) and a paginated results table render, and the KPI values reflect the active filter state.

### AC-REWARDS-003 — Filters (US-002)
**Given** the list is open,
**When** the user toggles the period type (Business Month / Income Month) and applies a date range, Insurer, or Reward Category filter,
**Then** the table and KPI cards update to show only matching records.

### AC-REWARDS-004 — Generic form (US-003)
**Given** the user clicks Add New Reward,
**When** the form opens,
**Then** Reward Category shows Generic active and Specific disabled; the fields are Insurer → Business Month (multi-select) → Date of Income → Reward Amount → Document upload; and the Reward Type field is not shown (stored as Fixed).

### AC-REWARDS-005 — Generic reward save (US-003)
**Given** all Mandatory fields are filled (Insurer, Business Month, Date of Income, Reward Amount),
**When** the user submits,
**Then** the record is saved (Reward Type = Fixed, stored) and appears in the list with Reward Category = Generic.

### AC-REWARDS-006 — Inactive insurer indication (US-003)
**Given** the Insurer dropdown is open,
**When** the list renders,
**Then** inactive insurers appear with "(Inactive)" beside the name.

### AC-REWARDS-007 — Mandatory validation (US-003)
**Given** a Mandatory field is empty,
**When** the user submits,
**Then** save is blocked and inline per-field validation errors are shown.

### AC-REWARDS-008 — Multiple document upload (US-007)
**Given** the user is adding or editing a reward,
**When** they attach more than one document,
**Then** all attachments are listed with Preview and Delete actions and saved with the record; submitting with zero documents is allowed.

### AC-REWARDS-009 — Edit a reward (US-004)
**Given** a user with the Edit privilege,
**When** they edit a saved reward and save,
**Then** the changes persist and "updated by" / "updated at" are recorded.

**Given** a user without the Edit privilege,
**When** they view a reward,
**Then** the edit action is unavailable.

### AC-REWARDS-010 — Delete a reward (US-005)
**Given** a user with the Delete privilege,
**When** they delete a reward,
**Then** a confirmation is required and the record is soft-deleted (removed from the list).

**Given** a user without the Delete privilege,
**When** they view a reward,
**Then** the delete action is unavailable.

### AC-REWARDS-011 — Export to Excel (US-006)
**Given** a user with any Rewards privilege,
**When** they export the list,
**Then** an Excel file matching the current search/filter state is downloaded.

### AC-REWARDS-012 — BizDone reflection (US-008)
**Given** reward records exist and a user with Rewards view privilege runs BizDone,
**When** the report is generated,
**Then** the download includes a "Rewards" sheet listing rewards per insurer, and the Summary-Insurer Classification sheet shows a computed "Rewards" column.

**Given** a user without Rewards view privilege runs the same report,
**When** it is generated,
**Then** the Rewards sheet and the Income Type "Rewards" value are not available to them.

---

## 7. Entry Form Fields

A single Add New Reward form is used; in Phase 1 the active category is Generic.

**Requirement legend:** Mandatory · Optional · Auto (system-populated) · Hidden (stored, not shown).

| Field | Type | Requirement | Notes |
|---|---|---|---|
| Reward Category | Radio | Mandatory | Generic active; Specific disabled (future category) |
| Insurer | Dropdown | Mandatory | All insurers, active & inactive; inactive shown as "Name (Inactive)" |
| Financial Year | Dropdown | Mandatory | Selected before Business Month; scopes which months are available |
| Business Month | Multi-select dropdown | Mandatory | Lists only the months of the selected Financial Year (Apr–Mar); one or more |
| Date of Income | Date | Mandatory | Income Month is system-derived from this and stored in DB — not shown as a form field |
| Reward Type | Radio | Hidden | Stored as Fixed in Phase 1; not shown on screen |
| Reward Amount | Number | Mandatory | Fixed amount from the commission statement |
| Comments | Text area | Optional | Free-text notes; placed above Document upload; saved with the record |
| Document upload | File (multiple) | Optional | Email / statement / supporting docs; each with Preview + Delete |
| Created by / Created at | Read-only | Auto | Audit fields |

---

## 8. BizDone Report Impact

| Report / sheet | Generic Reward |
|---|---|
| New "Rewards" sheet | Present (privilege-gated) — lists reward records grouped per insurer |
| Summary-Insurer Classification | New "Rewards" column, computed per insurer (shown separately, not merged into brokerage) |
| Summary-Comp Classification | Not present (Generic has no company) |
| Summary-Policy Classification | Not present (Generic has no policy) |
| Details-Policy Based | Not present |
| Income Type dropdown | Adds "Rewards" value (privilege-gated) |

Specific Reward's BizDone behaviour will be defined when that category is introduced.

---

## 9. Open Questions

All open questions raised to date are resolved and folded into the Business Rules (Section 5). None are blocking Stage 40b (TRD).

| # | Question | Resolution |
|---|---|---|
| 1 | Duplicate detection | Hard block on Insurer + Business Month(s) + Reward Amount; soft warn (override) on Insurer + same Date of Income — BR-018 |
| 2 | Generic in Policy Classification | Excluded; Generic appears only in the Rewards sheet and the Insurer-sheet column — BR-013 |
| 3 | "Rewards list" in the form | History — empty by default, shows existing rewards for the selected insurer — BR-017 |
| 4 | Specific KPI card | Shown greyed-out (always 0), signalling a future phase — Section 3.1 |
| 5 | Document upload limits | Unlimited count (n files) in Phase 1; type/size TBC — BR-008 |

---

## 10. Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

## 11. Deferred (later phase)

Detail retained so the work can be promoted into a delivery once confirmed.

### 11A. Specific Reward — *requirements not yet defined*
The Specific category is policy-bound (the insurer pays a reward for a specific policy or set of policies). Its user stories, business rules, and acceptance criteria were intentionally **removed** because the rules are expected to change. To be specced fresh when business provides clarity. The form reserves a disabled "Specific" option.

### 11B. Generic enhancements — period aggregation & % calculation
The original brief described Generic Reward as time-bound: "if IIRM achieves X Net Premium with an insurer within a period, it earns a Y reward." Removed from Phase 1 per client feedback (23-Jun-2026); retained here.

#### BR-P2-001 — Period aggregation and snapshot
Aggregate **Total Net Premium** and **Total Brokerage** from all policy records — inception and endorsements — placed with the selected Insurer whose **Policy Start Date** falls within the Period Start–End window. The reward % is applied to this aggregated total. The total and the resulting reward are **snapshotted on save**; they do not auto-update if underlying policy data later changes. Only a privileged edit re-saves and recomputes.

#### BR-P2-002 — Premium basis is always Net Premium
Premium aggregation always uses **Net Premium** — never Gross or Premium Collected. Gross is not captured (Net + GST = Gross).

#### BR-P2-003 — Policies Considered reference list
Before save, the form displays a **Policies Considered** list (the inception and endorsement records making up the aggregated total) for reconciliation against the insurer's statement.

#### BR-P2-004 — Reward calculation: percentage
When Reward Type = %, the user selects a base; the base value is the system-aggregated total:

| Base | Formula |
|---|---|
| Premium | Total Net Premium (period) × Reward % ÷ 100 |
| Brokerage | Total Brokerage (period) × Reward % ÷ 100 |

#### Phase-2 form fields (Generic enhancement)
| Field | Type | Requirement | Notes |
|---|---|---|---|
| Period Start Date | Date | Conditional Mandatory (when %) | Start of achievement window |
| Period End Date | Date | Conditional Mandatory (when %) | End of achievement window |
| Total Net Premium (period) | Number (read-only) | Auto / snapshot | Base when Base = Premium |
| Total Brokerage (period) | Number (read-only) | Auto / snapshot | Base when Base = Brokerage |
| Reward Base | Radio | Conditional Mandatory (when %) | Premium / Brokerage |
| Reward % | Number | Conditional Mandatory (when %) | Triggers real-time calculation |
| Calculated Reward Amount | Number (read-only) | Auto (when %) | Base value × Reward % ÷ 100 |

### 11C. Other deferred items
- **Reward reversal / clawback** (recording a reduced or taken-back reward) and **restatement** of already-generated BizDone reports after an edit
- Dashboard With / Without Rewards toggle; dashboard scope across SBU and CEO dashboards
- Document field extraction via OCR / AI (auto-capture + validation against uploaded content)
- Notifications / alerts when reward targets are met
- Payment status lifecycle (Pending → Received)
