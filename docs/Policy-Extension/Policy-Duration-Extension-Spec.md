# Policy Duration Extension — Product Specification

**Feature:** Policy Duration Extension (Non-Grouped Policies)
**Status:** Draft — Updated
**Date:** 2026-05-18

---

## 1. Overview

Policy Duration Extension allows users to extend the end date (`policy_to`) of non-grouped policies via an in-page form within the Endorsement Details page. When the user selects "Policy Extension" from the Data Type dropdown, a structured input form is displayed in place of the file upload component. On submission with confirmation, the policy end date is updated synchronously and a new endorsement record is created in the endorsement table. After a successful extension, the endorsement workflow is restricted to two steps — document upload (Step 1) and endorsement summary (Step 2). No Excel template download or asynchronous scheduler processing is involved.

---

## 2. Scope

### 2.1 Grouped Policies (Excluded from this feature)

The following policy types are classified as **grouped** and are **not eligible** for this feature:

| Constant |
|---|
| `POLICY_TYPE_GTL` |
| `POLICY_TYPE_GMC` |
| `POLICY_TYPE_GPA` |
| `POLICY_TYPE_OPD` |
| `POLICY_TYPE_GMC_PARENTAL` |
| `POLICY_TYPE_GMC_PARENTAL_TOP_UP` |
| `POLICY_TYPE_GMC_TOP-UP` |
| `POLICY_TYPE_2_SURGICAL_HOSPITAL_INSURANCE` |

### 2.2 Non-Grouped Policies (In scope)

Any policy whose type is **not** in the list above is a non-grouped policy and is eligible for Policy Duration Extension.

---

## 3. Input Form Fields

When "Policy Extension" is selected from the Data Type dropdown, the following form replaces the file upload component. No Excel template is available for this flow.

| Field | Label | Mandatory | Behaviour |
|---|---|---|---|
| IIRM Policy Number | IIRM Policy Number | — | Pre-filled from the current policy record; **disabled** (read-only) |
| Extension Date | Extension Date | **Yes** | Date picker; must be strictly after the current `policy_to` date |
| Endorsement Type | Endorsement Type | **Yes** | Dropdown with two options: **Financial** / **Non-Financial** |
| Premium | Premium | **Conditional** | Mandatory when Endorsement Type = "Financial"; optional when "Non-Financial" |
| Remarks | Remarks | No | Free-text field; no validation applied |

**Form action buttons:**
- **Cancel** — Resets the form; returns the page to the dropdown selection state without making any changes
- **Submit** — Runs client-side validation; if all mandatory fields are satisfied, opens the confirmation popup

---

## 4. Validation Rules

All validation is performed on the client side before the confirmation popup is shown.

| Field | Rule | Error Message |
|---|---|---|
| Extension Date | Required; must be a valid date strictly after the current `policy_to` | "Extension Date must be after the current policy end date" |
| Endorsement Type | Required selection | "Please select an endorsement type" |
| Premium | Required when Endorsement Type is "Financial" | "Premium is required for financial endorsements" |

---

## 5. Confirmation Popup & Submission

On clicking **Submit** (after successful client-side validation), a modal confirmation popup is displayed:

> **"Are you sure you want to update the policy to [Extension Date]?"**

Popup actions:
- **Cancel** — Dismisses the popup; no API call is made; form values are retained
- **Submit** — Triggers the synchronous API call with the following effects:
  1. Updates `policy_to` in the `policy` table to the Extension Date entered by the user
  2. Inserts a new record in the `endorsement` table with the net premium value from the Premium field

On success, a success confirmation is shown to the user and the endorsement workflow transitions to the restricted 2-step flow described in Section 6.

---

## 6. Post-Extension Behaviour

After the policy extension is successfully submitted, the following apply:

### 6.1 Asset Upload Disabled

Asset and sub-asset data upload is **disabled** for this endorsement. The upload option for "Asset + Sub Asset Data with Insurance Benefits" is no longer available.

### 6.2 Endorsement Steps Restricted to 2

The endorsement workflow is reduced from the standard multi-step flow to exactly **two steps**:

| Step | Label | Content |
|---|---|---|
| Step 1 | Document Upload | Document upload section using `FileUpload.tsx` component |
| Step 2 | Endorsement Summary | CD Balance, Gross Premium, Net Premium |

### 6.3 Step 1 — Document Upload

In Step 1, after the policy extension is completed, users can upload supporting documents. There is **no template** — documents are uploaded freely using the shared `FileUpload.tsx` common component.

**Upload process:**
1. User selects a file via the `FileUpload.tsx` component
2. File is uploaded to the **S3 bucket**
3. A record is created in the `file_uploads` table
4. A corresponding record is created in the new `policy_extension_documents` table (see Section 7)

**Document display:**
Uploaded documents appear in a table **below the upload icon** in Step 1 with the following columns:

| Column | Description |
|---|---|
| ID | Document record ID |
| File Name | File name displayed as a downloadable link |
| Uploaded Time | Timestamp when the document was uploaded |

### 6.4 Step 2 — Endorsement Summary

The summary step displays the following fields for the extended policy's endorsement:

| Field |
|---|
| CD Balance |
| Gross Premium |
| Net Premium |

---

## 7. Document Storage — `policy_extension_documents` Table

A new table stores the document references for each policy extension endorsement.

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` (PK, auto-increment) | Primary key |
| `policy_id` | `bigint` (FK → policy) | The policy the extension belongs to |
| `endorsement_id` | `bigint` (FK → endorsement) | The endorsement record created for this extension |
| `document_id` | `bigint` (FK → file_uploads) | Reference to the uploaded file record |
| `status` | `varchar` | Document status (e.g., `active`, `deleted`) |
| `created_at` | `timestamp` | Record creation timestamp |
| `created_by` | `bigint` (FK → user) | User who uploaded the document |
| `updated_at` | `timestamp` | Last update timestamp |
| `updated_by` | `bigint` (FK → user) | User who last modified the record |
| `deleted_at` | `timestamp` | Soft-delete timestamp (null if not deleted) |
| `deleted_by` | `bigint` (FK → user) | User who soft-deleted the record |

---

## 8. UI / UX Flow

1. User navigates to the Endorsement Details page for a non-grouped policy.
2. User selects **"Policy Extension"** from the Data Type dropdown.
3. The policy extension form is rendered with the fields in Section 3 (file upload component is hidden).
4. User fills in: Extension Date, Endorsement Type, Premium (if Financial), and optionally Remarks.
5. User clicks **Submit**.
6. Client-side validation runs; any errors are shown inline on the form fields.
7. If validation passes, confirmation popup appears: *"Are you sure you want to update the policy to [Extension Date]?"*
8. User clicks **Submit** in the popup → API call is made.
9. On success: success toast is shown; the endorsement workflow transitions to the 2-step restricted flow.
10. In **Step 1**: Document upload section is visible using `FileUpload.tsx`. Uploaded documents appear in the table below the upload icon.
11. In **Step 2**: Endorsement summary displays CD Balance, Gross Premium, and Net Premium.

---

## 9. Out of Scope

- Grouped policies are not eligible; the Policy Extension form must not render for them.
- Excel template download and bulk file upload are **not applicable** to this flow.
- Asynchronous scheduler-based processing is **not used** — submission is synchronous.
- Error file generation is **not applicable** — errors are surfaced inline on the form.
- Revert / rollback of a submitted policy extension is **not in scope**.
- No email or in-app notifications are sent on completion.
- No role-based access restrictions apply to this feature.
- No maximum extension duration limit is enforced.

---

## 10. Decisions Log

| # | Question | Decision |
|---|---|---|
| 1 | Role restriction for this feature? | None — no role gating required |
| 2 | Notifications on success/failure? | None |
| 3 | Input method? | Form-based inline input — no Excel upload |
| 4 | Maximum extension duration? | No limit enforced |
| 5 | Should extensions be reversible? | Not in scope for this version |
| 6 | What gets updated on submission? | `policy_to` in policy table + new endorsement record with net premium |
| 7 | How many endorsement steps after extension? | Restricted to exactly 2 steps |
| 8 | Document upload template required? | No template — free upload using `FileUpload.tsx` |
| 9 | Where are extension documents stored? | S3 bucket + `file_uploads` + `policy_extension_documents` tables |
| 10 | What fields appear in endorsement summary after extension? | CD Balance, Gross Premium, Net Premium |
