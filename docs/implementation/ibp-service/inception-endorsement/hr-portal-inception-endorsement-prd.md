# IBP HR Portal — Endorsement Tab PRD

**Document Version:** 3.3
**Date:** 2026-08-06
**Author:** IIRM Product Team
**Jira Reference:** IIRM-10101
**Related Documents:**
- TRD: `hr-portal-inception-endorsement-trd.md`
- SDS: `hr-portal-inception-endorsement-sds.md`
- Enrolment Module PRD: `docs/IIRM-10091_IBP_ HR Portal - Enrolment/PRD/IBP_HR Portal - Enrolment.md`
- HR Analytics PRD: `../hr-analytics/hr-analytics-prd.md` (Endorsement display spec originally lived in §7.3 — now owned here)

> **Revision note (v3.3, 2026-08-06).** Two further corrections to the Policy Journey card's Added/Deleted figures, an `endorsementStats` counting fix, and — per explicit product request — a new §15 covering CD Balance and Claims tab fixes made on the same screen during this round (that screen-level scope is otherwise outside this PRD's normal boundary; called out explicitly rather than silently expanding §2). See §3.2, §3.5, §13, and §15.
>
> **Revision note (v3.2, 2026-08-05).** The display card previously called "Employee Strength / Premium Impact" (§3.2/§3.3) has been redesigned and renamed **"Policy Journey & Enrolment Summary"** on the Policy Summary screen's Enrolment tab (`apps/ui/ibp/src/app/pages/HRPortalPolicySummary/index.tsx`). The redesign's driving business problem: HR admins could not tell, from the roster/premium counts alone, how many of the people added by endorsements had *actually completed enrolment* versus merely been uploaded. A 10,000-person inception batch where only 1,000 had logged in and finished enrolling showed "10,000" everywhere, with no way to see the real, billable, enrolled population. §3.2, §3.3, and §3.5 (new) are updated accordingly. No change to Feature Areas 2–3 (file upload / upload history).

> **Scope of this document.** This PRD owns the full **Endorsement** tab within the IBP HR Portal's Enrollment page. It covers two areas:
> 1. **Endorsement Overview Display** — the read-only view of endorsement analytics data sourced from iWork: overview KPIs, cumulative employee/lives metrics, premium breakdown, and per-endorsement record listing with expandable detail.
> 2. **Member Data Upload** — the capability for HR Admins to submit member data files for any given endorsement record. Upload, processing, and outcome display are described in Feature Areas 2–3 below.
>
> **iWork boundary.** iWork manages the full endorsement lifecycle — creating endorsement records, approval flows, policy finalization, and premium computation. IBP displays this data and provides the upload surface. IBP does not create, approve, or modify iWork endorsement records.
>
> **Document split.** This PRD owns *what the module must do and why* — scope, field contracts, validation rules, status definitions, business rules, user stories, and acceptance criteria. The TRD owns *how it is built* — API design, processing pipeline, data model, and security. The SDS owns *how it looks on screen* — layout, interaction flow, and state behaviour.

---

## 1. Module Overview

The Endorsement tab gives HR Admins a unified view of all endorsement activity for their policy. The tab has two functional areas:

**Display area (top of tab):** Surfaces endorsement analytics sourced from iWork — overall KPI metrics (Net Gross Premium, Total Endorsements), cumulative employee and lives counts across all endorsements, premium component breakdown, and a per-endorsement listing showing type, date, summary, and expandable employee/premium snapshots. This data is read-only and reflects what iWork has processed.

**Upload area (within each individual endorsement):** Allows HR Admins to submit member data files for a specific endorsement. IBP accepts the file, validates it, processes it asynchronously, and surfaces the outcome. Both inception data (initial member roster) and endorsement data (additions, deletions, corrections) flow through the same upload experience. All uploaded files and their processing results are visible in an upload history scoped to that endorsement.

---

## 2. Scope

**In scope:**

- Displaying endorsement overview KPIs: Net Gross Premium · Total Endorsements
- Displaying cumulative employee and lives metrics across all endorsements for the policy
- Displaying the premium component breakdown (10 components)
- Listing all iWork-processed endorsement records (Inception, Addition, Deletion, Correction) with type, date, and summary
- Expandable per-endorsement detail: employee info snapshot + premium component snapshot
- Uploading member data files (Excel or CSV) within the context of a specific endorsement
- Asynchronous file processing: row-level validation and member record creation
- Upload processing outcome display: Success or Failed, with per-upload error summary and breakdown
- Upload history listing: all file submissions for an endorsement with their status and outcome
- Template download: HR Admin can download the configured file template for any endorsement

**Explicitly out of scope — iWork capabilities not present in IBP:**

- Approving endorsements or managing endorsement approval workflows
- Enrolment completion tracking (intermediate step in iWork for employee-only uploads)
- "Create Inception" or policy finalization actions
- Inception or endorsement approval workflows
- Correction endorsement creation workflows
- Premium impact calculation or modification

---

## 3. Feature Area 1 — Endorsement Tab Display

*This spec was previously located in `hr-analytics-prd.md §7.3`. It is now owned here as the authoritative source. See `../hr-analytics/hr-analytics-prd.md` for the redirect note.*

### 3.1 Overview KPIs

Two top-level KPIs summarise endorsement impact for the policy:

| KPI | Definition |
|---|---|
| Net Gross Premium | Total net gross premium across all endorsements for this policy |
| Total Endorsements | Count of all endorsement records for this policy |

### 3.2 Cumulative Employee and Lives Metrics

Eight cumulative metrics aggregated across all endorsements for the policy, plus two derived metrics added in v3.2 to close the enrolled-vs-roster ambiguity described in the v3.2 revision note above.

**Scoping rule (v3.2):** Employees/Lives at inception, in addition, and in deletion are **roster events** — they count everyone added or removed by that batch, regardless of whether they have completed enrolment. This is deliberate and unchanged from the original design: "added to the roster" and "removed from the roster" are not gated on enrolment completion, any more than a name appearing on an uploaded file is. **Active employees / Active lives are the one exception** — they answer "how many are actually enrolled (status = Enrolled) right now," policy-wide, not batch-scoped, and are what changed in v3.2: previously these could be satisfied by a broader "not still in progress" reading in some call sites; they are now strictly `policy_employee_enrollment.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'`.

**Lifetime-tally rule (v3.3):** "Roster event" in the rule above means **permanent historical fact, not current net status.** Employees in addition/deletion (and inception) must not shrink or grow after the fact just because a *different, later* endorsement changes the same person's roster status. Confirmed bug (v3.2 implementation): the SQL required a person to still be un-deleted at query time to count toward "Added," so if endorsement A added 4 people and a later endorsement B removed 1 of them, endorsement A's own Added figure silently dropped from 4 to 3 — an HR admin looking at endorsement A alone would see a number that had quietly changed for a reason nothing on that endorsement's own card explained. Fixed in v3.3: Added/Deleted/Inception are now computed with no "still active" condition at all — a roster event that happened, happened, permanently. The *only* figure that reflects current net reality is Enrolled/Eligible (unchanged from v3.2).

**Disclaimer rule (v3.3), per-endorsement accordion only:** because Added is now permanent, a specific endorsement's card can show "Added: 4" while the roster currently holds fewer than 4 of those people (one was removed elsewhere). Silently showing a mismatched number an HR admin can't explain is worse than the original bug, so each accordion now also tracks how many of *its own* added people are *still* currently active, and shows an inline disclaimer whenever that's fewer than the Added total: *"N of the M employees added by this endorsement have since been removed via a different endorsement."* This is the one place in the module where a "current status" read is deliberately shown alongside a lifetime figure, specifically to explain an otherwise-confusing discrepancy — it does not change what Added itself means.

| Metric | Definition |
|---|---|
| Employees at inception | Employee count at the inception endorsement — roster event, not gated by enrolment status |
| Employees in addition | Count of employees added across addition endorsements, lifetime — roster event, not gated by enrolment status |
| Employees in deletion | Count of employees removed across deletion endorsements, lifetime — roster event, unchanged |
| Active employees | Employees currently enrolled (status = Enrolled), policy-wide — **not** a roster count, and not necessarily equal to Inception + Added − Deleted |
| Lives at inception | Total lives (employees + dependents) at inception — roster event |
| Lives in addition | Lives added across addition endorsements, lifetime — roster event |
| Lives in deletion | Lives removed across deletion endorsements, lifetime — roster event |
| Active lives | Total lives currently enrolled, policy-wide |
| **Total Eligible** *(new, v3.2)* | Employees at inception + Employees in addition − Employees in deletion. The roster headcount after all endorsement movements, independent of enrolment status. This is the denominator HR compares Active employees against. |
| **Enrolled % of Eligible** *(new, v3.2)* | Active employees ÷ Total Eligible, as a percentage. Answers "of everyone who should be enrolled by now, how many actually are." |

**Why Active employees can look inconsistent with Inception/Added/Deleted:** because it is measured independently (a live count of who currently holds Enrolled status), not derived by arithmetic from the other three. A policy can show `Inception: 476, Added: 0, Deleted: 0` alongside `Active employees: 1` — that is not a bug; it means 476 people are on the roster and only 1 has actually completed enrolment so far. See §3.5 for how this is now surfaced on screen without requiring the HR admin to do that subtraction mentally.

### 3.3 Premium Component Breakdown

Ten premium components representing the total premium breakdown for the policy:

| Component | Notes |
|---|---|
| Base premium | |
| Tax amount | |
| Gross premium | |
| Addition premium | From addition endorsements |
| Deletion premium | From deletion endorsements |
| Correction addition premium | From correction endorsements — additions side |
| Correction deletion premium | From correction endorsements — deletions side |
| Net premium | |
| Net tax amount | |
| Net gross premium | Total of net premium + net tax amount |

### 3.4 Individual Endorsements Listing

The listing surfaces every endorsement record associated with the policy. Endorsement types: Inception · Addition · Deletion · Correction. The following information is accessible per endorsement record:

- **Identification and summary:** Endorsement type, date, and aggregate counts (additions, deletions, active members, net gross premium).
- **Employee movement data:** A snapshot of the employee records affected by this endorsement. The fields surfaced vary by endorsement type and cover employee identification, the nature of the change, department, and effective date. Screen-level layout and column definitions are in the SDS.
- **Premium component data:** The premium components applicable to this specific endorsement — a subset of the policy-level premium breakdown in §3.3.
- **Upload capability and upload history:** The file submission form and the history of all files submitted for this endorsement are accessible directly within the endorsement record. Described in Feature Areas 2 and 3 below.

**Per-endorsement premium note (v3.2):** the accordion's own "Employee Enrolled Net Premium" / "Employee Enrolled Gross Premium" badge is a *different* computation from the policy-level §3.3 table (which remains an unimplemented scaffold, see §13). It sums each employee's own `total_premium` for the subset of *this specific endorsement's batch* who are currently enrolled — i.e. the same enrolled-only filtering as Active employees in §3.2, scoped down to one endorsement instead of the whole policy. Gross/Tax are derived by applying that endorsement's own recorded gross-to-net ratio to the enrolled net figure, so Net + Tax = Gross still holds. For an endorsement with no premium impact at all (e.g. a demographic-only correction), this now correctly shows "—" rather than incorrectly substituting the whole policy's premium (a bug fixed in v3.2 — see §13).

### 3.5 Policy Journey & Enrolment Summary — Display Redesign (v3.2, 2026-08-05)

**Problem statement.** The original §3.2/§3.3 metrics, displayed together as "Employee Strength" / "Premium Impact," did not distinguish roster activity from enrolment completion. An HR admin looking at "Inception: 10,000, Current: 10,000" had no way to tell that only 1,000 of those 10,000 had actually logged in and finished enrolling — the number shown was the uploaded batch size, not the enrolled, billable population. Conversely, once Active employees (§3.2) was corrected to be strictly enrolled-only, a freshly-incepted policy where nobody had logged in yet showed the *entire* card as zeros — technically consistent with the new stricter definition, but it hid the fact that a real inception batch of thousands of people had been uploaded.

**Resolution — two distinct rows, not one overloaded number.** The card (renamed **"Policy Journey & Enrolment Summary,"** subtitle "Policy growth through endorsements and current enrolment") now shows two parallel "journeys," each with **four stages**:

**Employee Journey:** `Inception → +Added → −Deleted → Enrolled / Eligible`

| Stage | Source | Notes |
|---|---|---|
| Inception | §3.2 `employeesAtInception` | Roster event, lifetime |
| Added | §3.2 `employeesInAddition` | Roster event, lifetime |
| Deleted | §3.2 `employeesInDeletion` | Roster event, lifetime |
| Enrolled / Eligible | `activeEmployees` / `totalEligible` | The only enrolment-status-dependent figure on the card. Displayed as a pair (e.g. "1 / 476"), not a lone number, plus an "X% Enrolled" caption below it. |

**Premium Journey:** `Inception → +Added → −Deleted → Enrolled Premium / Total Premium` — same structure, premium instead of headcount. Inception Premium is sourced from `policy.premium_at_inception` (not the endorsement's own `net_premium` column, which is frequently `NULL` at the endorsement level for inception rows); Added/Deleted Premium are lifetime sums of `endorsement.net_premium` across all addition/deletion endorsements (not scoped to any currently-open enrolment window — see the related fix in §13 for why this matters); Total Premium = Inception + Added − Deleted; Enrolled Premium is the same policy-wide enrolled-only sum described for Active employees, applied to premium (`SUM(policy_employee_enrollment.total_premium)` filtered to Enrolled status).

**Why both Added and Deleted stay visible (not collapsed into the final figure):** an HR admin seeing "Added: 200 people / ₹10L" but "Enrolled: 100 / ₹2L" needs to know *why* — is it simply that not everyone has enrolled yet, or did some of those 200 get removed again afterward? Showing Deleted explicitly (rather than folding it silently into the Total Eligible/Total Premium arithmetic) answers that without the HR admin having to ask.

**Business rule:** Inception/Added/Deleted (both journeys) are never gated by enrolment status — they are pure roster/premium ledger events, matching the §3.2 scoping rule. Only the final stage of each journey (Enrolled / Eligible, Enrolled Premium / Total Premium) depends on live enrolment status.

**Eligible is a direct roster count (v3.3).** Eligible was originally computed as `Inception + Added − Deleted` (an arithmetic rollup). Fixed in v3.3 to be a direct count of the policy's current roster instead — mathematically equivalent when all three inputs are trustworthy, but no longer able to drift out of sync with reality if any one of them is (which is exactly what happened before the v3.3 lifetime-tally fix above).

---

## 4. Feature Area 2 — File Upload

### 4.1 Purpose

An HR Admin uploads a member data file to create a new endorsement or add data to an existing endorsement. IBP applies the same upload and processing experience in all cases.

**Two upload entry points exist:**

| Entry point | Location | Creates |
|---|---|---|
| New Endorsement upload form | Top of the Endorsement tab (Section 0) | A new endorsement record |
| Existing endorsement upload form | Inside an expanded individual endorsement card | Adds a file to the existing endorsement |

**Step 2 gate:** The upload form inside an existing endorsement card is disabled when iWork has completed Step 2 for that endorsement (endorsement is finalized/locked in iWork). The HR Admin sees an amber notice explaining why upload is unavailable. The new endorsement upload form at the top is never locked by Step 2 — it always creates a fresh endorsement record.

### 4.2 Supported File Formats

| Format | Notes |
|---|---|
| Excel (.xlsx) | Column headers in row 1 |
| CSV (.csv) | Column headers in row 1; UTF-8 encoding required |

### 4.3 File Schema

The file schema is not fixed across all policies. Each policy has an upload template configuration that defines the column headers, their mandatory or optional status, and the accepted value formats. The uploaded file must conform to the template configured for the selected policy.

IBP validates the uploaded file's column headers against the policy template at the file level before any rows are processed. Row-level validation is then applied against the field definitions in that template.

**Template configuration — relationship flag:**

The policy template includes a `relationship` setting that determines whether the file can contain dependent records alongside employee records.

| Template Setting | File Structure |
|---|---|
| `relationship: true` | The file contains both employee rows and dependent rows. A relationship column is present. Rows identified as Employee records are processed as employees; rows with any dependent relationship value are processed as dependent records linked to the employee identified in the same file. |
| `relationship: false` | The file contains employee records only. No relationship column is present or expected. Dependent data is not part of this upload. |

### 4.4 Dependent Records — Relationship Enabled

This section applies only when the policy template is configured with `relationship: true`. When the template has `relationship: false`, the file contains only employee records; dependent rows are not expected, and any relationship column in the file is ignored.

When relationship is enabled, dependent rows are identified by the presence of a dependent relationship value in the relationship column. Each dependent row must reference an Employee ID present in the same file. Dependent records are validated against the dependent field definitions in the policy template.

The set of accepted relationship values (for example, Spouse, Child, Parent, Parent-in-law, Sibling) is defined by the policy template and may differ per policy.

### 4.5 Validation Rules

Validation operates at two tiers. File-level failures reject the entire file before any rows are processed. Row-level failures skip the offending row while all other valid rows continue to be processed.

**File-level (hard stop — file rejected before queuing):**

| Rule | Rejection reason |
|---|---|
| File format not in the supported set | Unsupported file type |
| File is empty — no data rows after the header | Empty file |
| File contains no employee-type rows | No employee data found |
| One or more mandatory column headers required by the policy template are absent | File headers do not match the policy template — missing: {list} |
| File size exceeds 10 MB | File too large |

**Row-level (soft failure — row skipped, remainder continues):**

Row-level validations apply to fields present in the policy template for the selected policy. Rules marked "relationship-enabled only" apply only when the policy template is configured with `relationship: true`.

| Rule | Error code | Applies when |
|---|---|---|
| Any mandatory template field is blank or null | `MISSING_FIELD:{field_name}` | Always |
| The employee identifier value appears more than once in the same file | `DUPLICATE_EMPLOYEE_ID` | Always |
| Email field does not match a valid email format | `INVALID_EMAIL_FORMAT` | If email is a template field |
| Mobile field is not a valid 10-digit number | `INVALID_MOBILE_FORMAT` | If mobile is a template field |
| Date of Birth is a future date | `INVALID_DOB_FUTURE_DATE` | If DOB is a template field |
| Date of Birth implies age greater than 100 years | `INVALID_DOB_UNREASONABLE` | If DOB is a template field |
| Gender value is not in the set accepted by the policy template | `INVALID_GENDER_VALUE` | If gender is a template field |
| Sum Insured Tier does not match any active sub-plan on the policy | `INVALID_SUM_INSURED_TIER` | If sum insured tier is a template field |
| Dependent row references an employee identifier not present in the same file | `ORPHAN_DEPENDENT` | Relationship-enabled only |
| Relationship value is not in the set accepted by the policy template | `INVALID_RELATIONSHIP_VALUE` | Relationship-enabled only |

### 4.6 Processing Behaviour

The upload API stores the file and immediately returns an upload reference. Processing is asynchronous — the caller tracks progress using this reference.

Valid rows are written to the member data store. Invalid rows are skipped and individually recorded with their error codes. Rows that pass validation are committed regardless of failures in other rows.

The processing outcome is reported as **Success** or **Failed**. A file that encounters row-level errors still results in a **Success** outcome — the system processed the file and row-level errors are reported in the summary. A **Failed** outcome indicates a file-level error that prevented any processing.

### 4.7 Upload Processing Outcome

The processing outcome is displayed as one of two states.

| Outcome | Meaning |
|---|---|
| **Success** | The file was processed. Member records were created for all valid rows. Row-level errors, if any, are reported in the upload summary. |
| **Failed** | A file-level error prevented processing. No member records were written. The failure reason is reported in the upload summary. |

### 4.8 Upload Summary

Available once file processing is complete. Provides the HR Admin with the information needed to identify and correct data issues.

| Field | Definition |
|---|---|
| Total Records | Total data rows in the file, excluding the header row |
| Employees | Count of rows identified as Employee records |
| Dependents | Count of rows identified as Dependent records |
| Successfully Processed | Count of rows committed to the member data store |
| Failed / Skipped | Count of rows not written |
| Failure Reasons | Grouped error codes with counts — e.g., MISSING_FIELD: 3, INVALID_EMAIL_FORMAT: 2 |
| Upload Timestamp | Date and time the file was submitted |
| Uploaded By | HR Admin who submitted the file |

---

## 5. Feature Area 3 — Upload History

### 5.1 Purpose

The upload history gives HR Admins a chronological view of every file submitted for a specific endorsement. Each entry shows the current processing status and a summary of the outcome, and can be expanded to show the full error breakdown.

### 5.2 Data Per Upload Record

The following data is captured and accessible per upload record in the history.

| Field | Definition |
|---|---|
| Upload Reference | System-generated identifier for the upload |
| File Name | Original name of the submitted file |
| Submitted On | Date and time of submission |
| Submitted By | HR Admin who submitted the file |
| Total Records | Total rows in the file |
| Successfully Processed | Count of rows written |
| Failed / Skipped | Count of rows not written |
| Status | Processing outcome — Success or Failed (§4.7) |

The list is ordered by submission date, most recent first.

### 5.3 Upload Detail

Each upload record in the history provides full processing detail accessible without navigating away from the listing. The detail includes:

- Full error breakdown grouped by error code with counts
- Total, success, and failure counts (same as summary)
- Submission and completion timestamps
- Uploaded By

Null or missing values in detail fields are treated as not available. Screen-level rendering and interaction behaviour are defined in the SDS.

---

## 6. Business Rules

| Rule ID | Rule |
|---|---|
| BR-MDU-001 | All upload activity is scoped to the authenticated HR Admin's company. The company identifier is derived from the session; it is not user-supplied. |
| BR-MDU-002 | An upload is always associated with a single selected policy. The HR Admin selects the target policy before uploading. |
| BR-MDU-003 | IBP does not distinguish between inception and endorsement file types at the upload or processing level. Both are processed through the same pipeline and appear in the same history. |
| BR-MDU-004 | Multiple uploads are permitted for the same policy. No restriction is placed on upload count or sequence. |
| BR-MDU-012 | The upload form inside an individual endorsement card is disabled when iWork Step 2 is completed for that endorsement. The `endorsementStatus` field in the endorsement list API response determines this state. The exact status values that constitute "Step 2 completed" (`COMPLETED`, `LOCKED`, `APPROVED`, `FINALIZED`) must be confirmed with the iWork team before production. |
| BR-MDU-013 | After a successful new endorsement upload (from the top-level form), all endorsement display sections (Overview, Metrics, Premium, List) are immediately refreshed so the new endorsement appears in the accordion without a manual page reload. |
| BR-MDU-005 | A file that fails all row-level validations without producing any successfully processed rows results in a **Success** outcome with zero records written. Zero records written is a valid processing outcome, not a file-level failure. |
| BR-MDU-006 | Successfully processed rows are committed even when other rows in the same file fail. Partial success is the expected outcome for files with mixed data quality. |
| BR-MDU-007 | If a file fails a file-level validation check, no upload record is created and no member data is written. The rejection reason is returned immediately. |
| BR-MDU-008 | All uploads must be traceable to the HR Admin who submitted them, with a submission timestamp, for audit compliance. |
| BR-MDU-009 | Upload files must be retained for a minimum of seven years to satisfy audit requirements. |
| BR-MDU-010 | Processing runs server-side. If an HR Admin navigates away during processing, the job continues and the result is retrievable on return. |

---

## 7. User Stories

| # | Story |
|---|---|
| US-MDU-01 | As an HR Admin, I can upload a member data file for a selected policy so that the member records are ingested and available in IBP. |
| US-MDU-02 | As an HR Admin, I can see the processing outcome of my file upload — including a count of successfully processed and failed records with grouped failure reasons — so that I can identify and correct data issues. |
| US-MDU-03 | As an HR Admin, I can view the complete history of file submissions for a policy so that I have a record of all uploads, their submission details, and their processing outcomes in one place. |
| US-MDU-04 | As an HR Admin, I can expand any upload record in the history to see the full error breakdown so that I can understand exactly which rows failed and why, without navigating away from the listing. |

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Upload API response time | < 3 seconds (file receipt and queuing only; not processing time) |
| File processing time | < 2 minutes for files up to 5,000 rows |
| Upload history load time | < 2 seconds |
| Maximum upload file size | 10 MB |
| Availability | 99.9% |
| Uploaded file retention | Minimum 7 years for audit compliance |

---

## 9. Acceptance Criteria

The module is accepted for release when all of the following hold:

1. **File upload** accepts `.xlsx` and `.csv` files; rejects all other formats with a descriptive error before any processing begins.
2. **File-level validation** rejects empty files, files with missing required column headers, and files exceeding 10 MB before queuing.
3. **Row-level validation** processes valid rows, skips invalid rows, and records per-error-code counts for the upload summary.
4. **Upload processing outcome** is displayed as Success or Failed — Success when the file was processed (including with row-level errors); Failed when a file-level error prevents any processing.
5. **Upload summary** shows Total Records, Employees, Dependents, Successfully Processed, Failed count, and grouped failure reason codes.
6. **Partial success** — a file with a mix of valid and invalid rows displays as Success; valid rows are committed; row-level failures are reported in the summary.
7. **Upload history** shows all file submissions for the selected policy, ordered most recent first, with status and summary counts for each.
8. **Upload detail** is accessible for each history entry without an additional data fetch; error breakdown and full summary are displayed correctly.
9. **No type distinction** — inception and endorsement file submissions are uploaded, processed, and listed through the same experience with no differentiation.
10. **Multiple uploads per policy** are allowed without restriction.
11. **Company scoping** — all upload and history operations are restricted to the authenticated HR Admin's company.
12. **Audit trail** — every upload records the HR Admin identity, submission timestamp, file name, and policy reference.

---

## 10. Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| File has no data rows (header only) | File rejected at file-level; outcome is **Failed**: empty file — no data rows found. |
| All rows fail row-level validation | Outcome is **Success** with 0 records written; all rows are listed as failed with error codes in the summary. |
| Employee ID appears more than once in the file | First occurrence is processed normally; each subsequent duplicate is flagged as `DUPLICATE_EMPLOYEE_ID` and skipped. |
| Dependent row references an Employee ID not in the same file | Row flagged as `ORPHAN_DEPENDENT` and skipped; the associated employee (if present and valid) is still processed. |
| Processing job fails mid-run (crash or timeout) | Job is retried; rows already written carry the upload reference for idempotent re-processing; no duplicate records are created on retry. |
| HR Admin navigates away while processing is in progress | Processing continues server-side; status and summary are retrievable on return. |
| Multiple uploads submitted for the same policy | All uploads are accepted and appear in the upload history; no restriction is applied. |
| File is submitted for a policy that belongs to a different company | Upload is rejected with a not-found response; no file is stored. |
| Upload history has no entries for the selected policy | An empty state is shown; no error is raised. |

---

## 11. Out of Scope

The following capabilities are explicitly not part of this specification:

- Inception approval or "Create Inception" finalization (iWork)
- Endorsement creation, approval, or rejection workflows (iWork)
- Enrolment completion tracking for employee-only uploads (iWork)
- Premium calculation or premium modification
- Correction endorsement creation workflows

---

## 12. Stakeholders

| Role | Interest |
|---|---|
| HR Admin | Primary user — uploads member data files and tracks processing outcomes |
| IBP Operations | Context for what data has been submitted and its quality |
| Compliance | Audit trail of uploads and file retention |
| Product Manager | IBP scope boundary and acceptance criteria |
| Engineering Lead | Technical delivery |

---

## 13. Known Gaps and Clarifications

The following gaps were identified during the Stage 40c task breakdown (2026-05-05). Resolved items are marked below.

| Gap | Detail | Status |
|---|---|---|
| Data Type field not defined in User Stories | The SDS defines a "Data Type" dropdown (Employee Data Only / Employee + Dependents Data). This field maps to `documentType` in the TRD. Covered by BR-MDU-011 (below). | ✅ Resolved — BR-MDU-011 added. |
| Upload history scope: per-endorsement vs. per-policy | Product decision required: should the uploaded files table show only files for that endorsement, or all uploads across the whole policy? | ✅ Resolved — **per-endorsement**. The uploaded files table inside each accordion card is scoped to `endorsementId`. The summary API (`/enrollment-upload-summary-by-endorsement`) is called with the specific endorsement's ID. This matches the iWork domain model where each endorsement is an independent processing batch. |
| Endorsement display data source API | Real API endpoint for endorsement overview metrics (§3.1–§3.3) was unspecified. | ✅ Resolved — Display data is served via four `POST /hr-module/generate/:reportKey` endpoints using the existing hr-module admin_reports framework. Keys: `endorsement_overview`, `endorsement_employee_metrics`, `endorsement_premium_components`, `endorsement_list`. SQL seed scripts are in `hr-module-inception-endorsement-scripts.sql`. See TRD §1a. |
| Per-endorsement employee and premium snapshot | The expanded card view (SDS §8.2–§8.3) shows per-endorsement employee movement and premium data. The `endorsement_list` report provides aggregate counts; per-card drill-down data requires a separate endpoint. | ⚠️ Deferred — TASK-IE-017. Current implementation shows static placeholder data in the expanded card's employee info and premium snapshot tables. Real data pending TASK-IE-017 delivering a dedicated endpoint or extending `endorsement_list`. |
| Roster counts didn't distinguish enrolled from uploaded | §3.2/§3.4 counts (Employees at inception/addition, `endorsmentCount` per endorsement) counted everyone in the upload batch regardless of whether they'd completed enrolment. A 10,000-person batch with 1,000 actual logins showed "10,000" everywhere. | ✅ Resolved (v3.2, 2026-08-05) — see §3.5. Roster counts (Inception/Added/Deleted) stay raw by design; a new enrolled-only "Enrolled / Eligible" figure was added alongside them instead of overloading the roster counts themselves. |
| `endorsement_list` premium/count fallback borrowed the whole policy's total | For a non-inception, non-positive-premium endorsement (e.g. a demographic-only correction with no premium impact), `netPremium`/`grossPremium` fell back to the *policy's* premium when the endorsement's own column was `NULL`, incorrectly showing the entire policy premium on a single no-activity endorsement card. | ✅ Resolved (v3.2) — that fallback was removed; a `NULL` endorsement-level premium now renders as "—" (not applicable) instead of substituting an unrelated total. The **inception** row is the one deliberate exception: it falls back to `policy.premium_at_inception` specifically, since inception is the event that establishes the policy's premium in the first place. |
| Premium components source unknown (§3.3) | Still open as originally scoped — `endorsement_premium_components` continues to return `NULL` pending TASK-IE-017 identifying the iWork source table. | ⚠️ Still open for the standalone 10-component table. **Not blocking** the new Premium Journey (§3.5), which sources Inception/Added/Deleted/Enrolled Premium from `endorsement.net_premium`, `policy.premium_at_inception`, and `policy_employee_enrollment.total_premium` directly — columns already available today, independent of the iWork source-table question. |
| `endorsement_list` was scoped to the currently-open enrolment window only, silently affecting "lifetime" figures | The Added/Deleted Premium figures on the original Premium Impact card were computed client-side from `endorsement_list` rows, which are filtered to the currently-open enrolment period. When no drive was open, Added/Deleted Premium showed as empty despite the card's own "lifetime" framing. | ✅ Resolved (v3.2) — the Premium Journey's Added/Deleted Premium now come from `endorsement_employee_metrics`, which computes them as genuine lifetime sums (no date-window filter), matching how Employees in addition/deletion (§3.2) were always computed. `endorsement_list` itself remains intentionally scoped to the current window for its own purpose (the per-endorsement accordion listing). |
| Added/Deleted netted out a later, unrelated endorsement's changes | `employeesInAddition`/`employeesInDeletion` (and the per-endorsement `rawAddedCount`) required a person to still be un-deleted *at query time* to count — so endorsement A's own Added figure shrank whenever a *different, later* endorsement B removed one of the people A added, with nothing on A's card explaining why. Confirmed live: an addition endorsement showing "+4" dropped to "+3" purely because of an unrelated later deletion. | ✅ Resolved (v3.3, 2026-08-06) — see §3.2 lifetime-tally rule. Added/Deleted/Inception no longer carry any "still active" condition; a roster event is a permanent fact once it happens. |
| Deletion headcount was structurally unable to ever register | `employeesInDeletion` additionally required `deleted_at IS NULL` on the roster mapping row — but the deletion process sets `deleted_at` on that exact row as part of performing the deletion, so this condition could never be true for a real deletion. `employeesInDeletion` always returned 0 regardless of how many people were actually removed. | ✅ Resolved (v3.3) — condition dropped; `enrollment_deletion_batch_id` alone (not `deleted_at`) is the authoritative "was this person removed via this batch" signal. |
| Per-endorsement accordion's own Added/Enrolled/Exited pills used a fragile type-string classification | The "Enrolled"/"Exited" top pills and the "Additions"/"Deletions" Changes rows were gated on `endorsementType === 'ADDITION'`/`'DELETION'` — but endorsements are commonly typed the generic `FINANCIAL_ENDORSEMENT` regardless of whether they added or removed people, so a real addition/deletion could show 0/0 purely because of its type string, independent of any premium or status bug. | ✅ Resolved (v3.3) — classification now also checks the roster-confirmed `rawAddedCount`/`rawDeletedCount` (> 0), not the type string alone. The "Enrolled" pill's headline number also changed from a premium-gated computation to the same `stepSummary.employeeCompletedCount` source already proven correct on the "Enrolment status" tiles directly below it. |
| A deleted employee counted as "Enrolment completed" | `getEndorsementStats` (`hr.repository.ts`) computed "completed" as "status is anything except IN_PROGRESS," which folded `NOT_STARTED` employees into the completed bucket, and separately added `deletionCompleted` directly into the same completed total — so a person removed from the roster, or one who hadn't even started, both counted toward "Enrolment completed." | ✅ Resolved (v3.3) — "completed" now strictly requires `employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'`; deletions are no longer added into the completed total (they're a third, separate outcome, already tracked by Added/Deleted). Same fix mirrored for dependents. |

**BR-MDU-011** (added 2026-05-05): The Data Type field in the upload form determines the file schema for this upload. "Employee Data Only" maps to document type `policy_employee_data` (template `relationship: false`); "Employee + Dependents Data" maps to document type `policy_employee_enrollment_data` (template `relationship: true`). IBP does not allow the HR Admin to select a data type that is not configured for the selected policy. The IBP frontend maps these display strings to the backend document type constants via `ibpEndorsementDocTypeMap` (see TRD §13.3).

---

## 14. CD Balance and Claims Tab Fixes (v3.3, 2026-08-06)

> **Scope exception.** This module's scope (§2) is the Endorsement tab. The fixes below are on the CD Balance and Claims tabs of the *same* Policy Summary screen (`HRPortalPolicySummary/index.tsx`) — outside this PRD's normal boundary. Recorded here per explicit product request rather than left undocumented, since no other PRD currently owns this screen's CD Balance / Claims implementation specifically (as opposed to the standalone Claims Corner / Dashboard modules, which are separate features).

| Area | Gap | Resolution |
|---|---|---|
| CD Balance — Transaction history | `cd_transactions` returned zero rows for a policy that genuinely had CD transactions. Root cause: the query scoped by `caution_deposit.company_id` — a denormalized column that can drift from the truth (confirmed on a real policy: its CD account's stored `company_id` didn't match its own `company_id`). | ✅ Resolved — query now prefers the policy's own live `company_id` (already joined in the query) over the CD account's stored value, falling back to the CD account's value only for the minority of transactions with no linked policy at all. |
| CD Balance — "Upcoming Installments" card, linked-policies count | Same root cause as above, different report: `linked_policies_of_cd_account` showed "0 policies funded from this CD account" for a policy that genuinely was funded by one. | ✅ Resolved — same fix pattern: verify company ownership through the requested policy's own live `company_id`, not the CD account's stored value. |
| CD Balance — "Upcoming Installments" card, blank Policy label | Each installment row showed a blank "Policy:" label. Root cause: `upcoming_installments` never actually returns a `policyId`/`policyNumber` field (the frontend's type declared them, but the SQL never selected them). | ✅ Resolved — frontend now reads the page's own already-known policy number instead of a field that was never populated; redundant given this card is already scoped to one policy. |
| Claims tab — status filter returns zero rows for Approved/Rejected | The four UI status chips (Pending/Approved/Rejected/Settled) did an exact match against `claim_status`, which holds many more free-text, case-inconsistent raw values (e.g. "Ready for payment," "Payment Initiated," "Under Rejection Approval") — so "Approved"/"Rejected" never matched anything. | ✅ Resolved — exact match replaced with keyword-based bucket matching against the real raw values. 4 judgment calls on ambiguous values (Cancelled, Under Rejection Approval, Outstanding, Bank details awaited) are flagged in the migration for confirmation. |
| Claims tab — "Approved Amount" showed the settled amount | `approvedAmount` was `COALESCE(settled_amount, 0)` — settled amount only exists once a claim is actually paid, so any claim genuinely approved but not yet paid out showed ₹0. | ✅ Resolved — now prefers `policy_claim.clm_allowed_amt` (the TPA's actual sanctioned figure, populated independent of settlement), falling back to settled amount for older rows. |
| Dashboard — ICR overstated by including denied/rejected claims | The ICR (Incurred Claims Ratio) claim-amount base counted every claim regardless of status, including claims that were fully denied/rejected/cancelled and will never be paid — inflating the ratio and making a policy look riskier at renewal than it is. Confirmed on a real policy: ICR dropped from 30.1% to 26.0% once excluded. | ✅ Resolved — excludes the same denied/rejection/cancelled bucket established for the Claims tab status filter. Pending/approved/settled claims are unaffected (a claim still in process is legitimately carried as a reserve estimate). |
| Claims tab — TAT Overview KPI cards disagreed with the Claim Search table's own filtered counts | The "Claim TAT Overview" cards (Pending/Approved/Rejected/Settled) classified each claim with a separate, cruder client-side rule (`row.status === "Ready For Payment"` / `"Claim Denied"` / `"Settled"`, else "Pending") than the Claim Search table's server-side bucket filter — the two could and did disagree. Confirmed on a real policy: TAT card showed "Pending: 88," Claim Search showed "42" for the identical filter — the gap was 46 claims with raw status "DENIED," which the TAT card's catch-all silently absorbed into Pending instead of Rejected (its Rejected card showed 0). | ✅ Resolved — the report itself now returns a `statusBucket` field (§14.1), computed once server-side with the same keyword rules as the status filter. Both the TAT cards and the Claim Search table read this same field, so they cannot disagree again. |

### 14.1 Claim Status Bucket Mapping — Pending Approval

The Claims tab's 4 status buckets (Pending / Approved / Rejected / Settled) are UI labels only — the real `claim_status` column holds many more free-text, case-inconsistent raw values from TPA/ops updates. The table below is the full mapping of every raw value seen in production to its UI bucket, using keyword matching (not exact string match) so new case variants of an already-covered keyword are handled automatically.

| UI Bucket | Raw `claim_status` values matched |
|---|---|
| **Settled** | SETTLED, Settled |
| **Approved** | Ready for payment, READY FOR PAYMENT, Payment Initiated, PAYMENT INITIATED, Bank details awaited |
| **Rejected** | Claim denied, DENIED, CLAIM DENIED, Cancelled, Under Rejection Approval, UNDER REJECTION APPROVAL |
| **Pending** | PENDING, Under Process, UNDER PROCESS, CLAIM BILLS PENDING, Claim Bills Pending, Deficiency, "Claim Intimation " (trailing space in source data), RAL Intimation, RAL Deficiency, OUTSTANDING |

All 16 distinct raw values in production map to exactly one bucket each — no value matches more than one bucket's keywords.

**Awaiting explicit sign-off — 4 values where the bucket assignment is a judgment call, not a clear-cut mapping:**

| Raw value | Bucketed as | Alternative reading |
|---|---|---|
| Cancelled | Rejected | Claim won't be paid, so grouped with denied — could instead be its own "Withdrawn" bucket, distinct from an insurer-denied claim. |
| Under Rejection Approval | Rejected | Grouped as rejected even though not yet finalized — could instead read as Pending, since the outcome isn't decided yet. |
| Outstanding | Pending | Read as "claim still unresolved" — could instead mean "payment amount outstanding," which would lean Approved. |
| Bank details awaited | Approved | Read as "already approved, blocked only on payout logistics" — could instead be read as still Pending, since no payment has happened yet. |

If any of the 4 above is confirmed wrong, it is a one-line change (moving the keyword to a different bucket) — no schema or data migration required.

---

## 15. Approval

Leave blank. Product Manager sign-off authority. Required before Stage 50 (implementation) begins.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

# END OF PRD
