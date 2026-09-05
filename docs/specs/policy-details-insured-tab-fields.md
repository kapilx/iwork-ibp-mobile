# Spec: Policy Details — Employee Insured Tab, Enrolment & Endorsement Fields

## Overview

Six columns added to the **Employee Insured** grid on the Policy Details page: the
enrolment window, enrolment status, the enrolment confirmation (reference) number,
the endorsement type, and the ingestion mode. None of these were previously exposed
anywhere in iwork.

---

## Background

The Insured tab reads the `policy_enrollment_employee_policy_map` table as its
membership list — one row per (employee, policy) — and enriches each row from
`policy_enrollment_employee`, `policy_employee_enrollment`, `policy_enrollment_dependent`
and `endorsement`. Dependents are unioned in as separate rows under the same employee.

There are **two independent implementations of this read**, and both had to change:

| Path | File | When used |
|---|---|---|
| Shared util (TypeScript enrichment) | `apps/services/service-lib/src/lib/utils/policy-employee-insured.util.ts` | ibp-service, and policy-service when the requested sort is unsupported |
| Optimized union (raw SQL) | `policy.repository.ts` → `getPolicyEmployeeInsuredDetailsByIdOptimized` | policy-service whenever the sort fields are in `EMPLOYEE_INSURED_OPTIMIZED_SORT_FIELDS` — i.e. the common case |

They must stay in agreement. A field added to only one will appear and disappear
depending on which column the user sorted by.

---

## Fields

| Column | Response field | Source |
|---|---|---|
| Enrolment Start Date | `enrollmentStartDate` | `policy_enrollment_employee_policy_map.enrollment_start_date` |
| Enrolment End Date | `enrollmentEndDate` | `policy_enrollment_employee_policy_map.enrollment_end_date` |
| Enrolment Status | `enrollmentStatus` | `policy_employee_enrollment.employee_enrollment_status_key` for (policy_id, employee_id); **no row → "Not Started"** |
| Enrolment Confirmation No. | `enrollmentConfirmationNumber` | `employee_enrollment_submission.reference_number` — see resolution below |
| Endorsement Type | `endorsementType` | batch id → `document_processing_file` → `endorsement.endorsement_type` |
| Ingested Mode | `ingestedMode` | the same resolved `endorsement.ingested_mode` |

UI columns: `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/insuredConfig.tsx`,
inserted before "Relationship group". All render `--` when null; dates go through the
shared `formatDate`.

---

## Resolution logic

### Enrolment Status

The status key is a raw constant (`EMPLOYEE_ENROLLMENT_STATUS_ENROLLED`,
`..._IN_PROGRESS`, `..._ENDORSEMENT_SENT`). The label is derived by stripping the
`EMPLOYEE_ENROLLMENT_STATUS_` prefix and title-casing the remainder, rather than
maintaining a key→label table. New status keys therefore render sensibly without a
code change.

Absence of a `policy_employee_enrollment` row for the (policy, employee) pair is
itself the signal for **"Not Started"** — the employee is mapped to the policy but has
never been through enrolment.

### Endorsement Type and Ingested Mode

Chain, evaluated per map row:

```
COALESCE(map.enrollment_addition_batch_id, map.enrollment_deletion_batch_id)
  → document_processing_file.document_id
  → document_processing_file.endorsement_id
  → endorsement.endorsement_type, endorsement.ingested_mode
```

`document_processing_file` can hold **several rows per `document_id`**, so the lookup
collapses with `MAX(endorsement_id)` to avoid multiplying insured rows. If a single
batch legitimately spans more than one endorsement, only the highest id is visible
here — see Known limits.

### Enrolment Confirmation No.

`employee_enrollment_submission` is not a per-policy table. Its grain is
**one row per submit action per employee per company**:

- unique on `(employee_id, company_id, submission_count)`
- `policy_ids` is a jsonb array of the policies that submit covered
- insert-only, never updated, so `MAX(submission_count)` is always the latest submit
- `reference_number` format `ENR-<YYYYMMDD>-<HHMMSS>-<employeeId>-<submissionCount>`,
  built from the **UTC** submit timestamp
  (`onboarding.repository.ts` → `buildEnrollmentSubmissionReference`)

An employee therefore accumulates N reference numbers, none of them scoped to a single
policy. The rule chosen for this column:

> **The latest submit that included this policy.**
> `MAX(submission_count)` over rows for that employee where `policy_ids @> [policyId]`.

Rejected alternatives: latest submit ignoring `policy_ids` (would show a reference
belonging to a different policy's submit), and first submit containing the policy
(would not reflect re-submits).

Rows are only written when `submit = true`. HR and bypass uploads never create one, so
those insured rows legitimately show `--`. That is the same population that shows
"Not Started" or an uploaded-only status.

There is no dependent-level submission or enrolment row, so **dependent rows inherit
the parent employee's** dates, status and confirmation number.

---

## Implementation notes

**Shared util.** One extra query per request: submissions for the page's employees,
filtered on `policy_ids @> CAST(:policyIdJson AS jsonb)`, ordered
`employeeId ASC, submissionCount DESC`; the first hit per employee wins. Batch →
endorsement resolution is a single `find` over `DocumentProcessingFile` keyed by the
collected batch ids, reusing the already-loaded `endorsementMap`.

**Optimized union.** Two left joins added to *both* union legs (employee and
dependent), in matching select order so the `UNION ALL` column lists still line up:

- grouped subquery over `document_processing_file` (`MAX(endorsement_id)` by
  `document_id`) joined to `endorsement`
- grouped subquery over `employee_enrollment_submission` using
  `(ARRAY_AGG(reference_number ORDER BY submission_count DESC))[1]` by `employee_id`

The `ARRAY_AGG` form is deliberate: a correlated subquery would re-run per row inside
the union, which the `COUNT(1)` wrapper also materializes.

---

## Worked example

Employee `4021` ("ACME-118"), company `77`, viewing policy **9001**.

`policy_enrollment_employee_policy_map` (employee 4021, policy 9001):
`enrollment_start_date = 2026-04-01`, `enrollment_end_date = 2027-03-31`,
`enrollment_addition_batch_id = 5512`, `enrollment_deletion_batch_id = null`

`policy_employee_enrollment` (9001, 4021): `employee_enrollment_status_key = EMPLOYEE_ENROLLMENT_STATUS_ENROLLED`

`document_processing_file`: two rows with `document_id = 5512` → `endorsement_id` 8804 and 8807

`endorsement` 8807: `endorsement_type = 'ADDITION'`, `ingested_mode = 'BULK_UPLOAD'`

`employee_enrollment_submission` (employee 4021, company 77):

| submission_count | policy_ids | reference_number |
|---|---|---|
| 1 | [9001] | ENR-20260401-101500-4021-1 |
| 2 | [9002] | ENR-20260610-144233-4021-2 |
| 3 | [9001, 9002] | ENR-20260715-093012-4021-3 |

Rendered row:

| Column | Value | Why |
|---|---|---|
| Enrolment Start Date | 2026-04-01 | map row |
| Enrolment End Date | 2027-03-31 | map row |
| Enrolment Status | Enrolled | key present, prefix stripped |
| Enrolment Confirmation No. | ENR-20260715-093012-4021-3 | newest submit containing 9001; **count 2 is skipped** — it never touched this policy |
| Endorsement Type | ADDITION | 5512 → dpf → `MAX(endorsement_id)` 8807 |
| Ingested Mode | BULK_UPLOAD | endorsement 8807 |

Dependents of 4021 on policy 9001 repeat the four employee-level values and 8807's type.

---

## Known limits

- **Multi-endorsement batch.** `MAX(endorsement_id)` hides 8804 in the example above.
  Upgrade path if it matters: expose all types as a joined string, or pick by the
  endorsement's own date rather than id.
- **Reference number timestamp is UTC.** A late-evening IST submit carries the previous
  UTC date in its reference. This matches how the number was minted and is not
  re-derived here — the string is displayed verbatim.
- **Two code paths.** Any further field added to this grid must be added to both, or it
  will vanish when the user sorts by a supported column.

---

## Out of scope

- The Insured tab **Excel export** (`getPolicyEmployeeInsuredExcelByPolicyId` plus the
  header constants in `service-lib/constants.ts`) still carries the old column set.
- Filtering or sorting on any of the six new columns.
- Backfilling confirmation numbers for enrolments created by upload rather than submit.
