# Spec: Policy Documents — Upload Tab

## Overview

Add a new **Upload** tab in the Policy Details page. This tab allows users to manually upload policy-level documents (Mandate or Policy Feature Documents) directly against a policy, outside of the inception/endorsement/claims flow. Uploaded documents must appear as records in the existing **Documents** tab.

---

## Background

The existing **Documents** tab in Policy Details (`CompanyPage/PolicyDetails/index.tsx`) displays all files uploaded during Inception, Endorsement, and Claims flows via a consolidated `GET :policyId/documents` API. Currently this API queries:

- `document_processing_file`
- `endorsement` / `policy_asset_endorsement`
- `policy_claim`
- `file_upload` (joined for metadata)

There is already a `policy_feature_document_map` table (`policy-feature-document.entity.ts`) which is **not yet included** in this API's query. This feature adds a `document_type` column to that table, wires it into the API, and builds the UI to upload to it.

---

## Scope

### In Scope
- New **Upload** sub-tab within the Documents tab on Policy Details page
- Document Type dropdown (Mandate / Policy Feature Document)
- File upload component (enabled only after document type is selected)
- New POST API to save the uploaded file to `policy_feature_document_map`
- Add `document_type` column to `policy_feature_document_map` table (DB migration)
- Update `GET :policyId/documents` to include rows from `policy_feature_document_map`

### Out of Scope
- Download Template button (not required for this upload)
- Bulk upload
- Editing or deleting uploaded documents

---

## UI Changes

### Location
`apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx`

The Documents section currently has one view (the documents list). It will be split into two sub-tabs:

| Sub-Tab | Content |
|---------|---------|
| **Documents** (existing) | Existing documents list — no change |
| **Upload** (new) | New upload form described below |

---

### Upload Tab — UI Layout

```
┌──────────────────────────────────────────┐
│  Document Type *                          │
│  ┌────────────────────────────────────┐  │
│  │  Select document type          ▼   │  │
│  └────────────────────────────────────┘  │
│                                           │
│  Upload Document *                        │
│  ┌────────────────────────────────────┐  │
│  │  [Choose File]                     │  │
│  │  (disabled until type selected)    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

#### Document Type Dropdown
- **Label:** Document Type
- **Required:** Yes
- **Options:**
  1. `mandate` → display label: `Mandate`
  2. `policy_feature_document` → display label: `Policy Feature Document`
- Until a type is selected, the file upload component below is **disabled / greyed out**.

#### File Upload Component
- **Reference component:** The `documentupload` field used in the **Receive Acknowledgement from Insurer** step of the Inception flow.
  - File: `apps/ui/iwork/src/app/pages/EndorsementPage/EndorsementDetails/config.tsx` (lines 1638–1677)
  - Field key used there: `endorsementPolicyDocumentId`, type: `documentupload`, variant: `endorsementDoc`
- **For this feature:** Use only the **Choose File** button — no Download Template button.
- **Accepted formats:** PDF, PNG, JPG, JPEG, XLSX, XLS (confirm with team; follow the pattern from existing upload)
- **Max files:** 1
- **Enabled only after** Document Type is selected.

#### Behaviour on Upload
1. User selects Document Type from dropdown.
2. File upload component becomes active.
3. User clicks **Choose File**, selects a file.
4. On successful upload:
   - File is saved via the new POST API (see below).
   - A success toast is shown.
   - The **Documents** sub-tab is refreshed / re-fetched to show the new record.
5. On failure: show an error toast with the message from the API.

---

## Backend Changes

### 1. Database Migration — Add `document_type` to `policy_feature_document_map`

**File to create:** new migration in `apps/services/service-lib/src/lib/migrations/` (or the policy-service migrations folder — follow existing pattern)

```sql
ALTER TABLE policy_feature_document_map
  ADD COLUMN document_type VARCHAR(100) NOT NULL;
```

**Allowed values (application-level enum):**
- `mandate`
- `policy_feature_document`

**Entity update:**  
`apps/services/service-lib/src/lib/entities/policy-feature-document.entity.ts`

Add the `document_type` column to the entity class following the existing column definitions.

---

### 2. New POST API — Upload Policy Document

**Endpoint:** `POST /policy/:policyId/documents/upload`

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The document file to upload |
| `documentType` | string | Yes | `mandate` or `policy_feature_document` |

**Flow:**
1. Upload the file to file storage (follow the pattern used in existing document upload endpoints — save to `file_upload` table, get back a `fileId`).
2. Insert a row into `policy_feature_document_map` with:
   - `policy_id` = policyId (from path param)
   - `document_id` = fileId from step 1
   - `document_type` = documentType from request body
   - `status` = `active`
   - `created_by`, `created_at` = current user / timestamp

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Document uploaded successfully",
  "data": {
    "id": 123,
    "documentType": "mandate",
    "fileName": "example.pdf",
    "uploadedAt": "2026-05-13T10:00:00Z"
  }
}
```

**Error cases:**
- 400 if `documentType` is missing or invalid
- 400 if no file is attached
- 404 if `policyId` does not exist

---

### 3. Update `GET :policyId/documents` — Include `policy_feature_document_map`

**Controller:** `apps/services/policy-service/src/app/policy/policy.controller.ts`  
**Service:** `apps/services/policy-service/src/app/policy/policy.service.ts` — `getPolicyDocuments` method (~line 10062)  
**Repository:** `policy.repository.ts` — `getDocumentsByPolicyId` method (~line 30564)

The repository method builds a UNION query across multiple tables. Add a new UNION branch to include rows from `policy_feature_document_map`:

```sql
SELECT
  pfm.id                  AS id,
  fu.key                  AS fileName,
  NULL                    AS activityId,
  'Manual Upload'         AS activityName,
  NULL                    AS subActivityName,
  NULL                    AS osTicketNumber,
  pfm.document_type       AS documentName,
  pfm.created_at          AS uploadedAt,
  u.name                  AS uploadedBy
FROM policy_feature_document_map pfm
JOIN file_upload fu ON fu.id = pfm.document_id
LEFT JOIN users u ON u.id = pfm.created_by
WHERE pfm.policy_id = :policyId
  AND pfm.status = 'active'
  AND pfm.deleted_at IS NULL
```

This UNION'd result will appear in the Documents tab with:
- **Activity Name:** `Manual Upload`
- **Document Name:** the `document_type` value (`Mandate` or `Policy Feature Document`)
- **File Name, Uploaded By, Uploaded Date:** from `file_upload` and `users` joins

**Note:** Apply the same `searchBy` and date range (`from`/`to`) filters to this branch as are applied to the other UNION branches.

---

## Data Model Summary

### `policy_feature_document_map` (updated)

| Column | Type | Notes |
|--------|------|-------|
| `id` | int | PK, auto-increment |
| `policy_id` | int | FK, indexed |
| `document_id` | int | FK → `file_upload.id` |
| `document_type` | varchar(100) | **NEW** — `mandate` or `policy_feature_document` |
| `status` | varchar | e.g., `active` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | soft-delete |
| `created_by` | int | FK → users |
| `updated_by` | int | |
| `deleted_by` | int | |

---

## Acceptance Criteria

1. A new **Upload** sub-tab is visible in the Documents section of Policy Details.
2. The Document Type dropdown shows exactly two options: **Mandate** and **Policy Feature Document**.
3. The file upload component is **disabled** when no document type is selected.
4. After selecting a document type, the file upload component becomes **active**.
5. Uploading a file saves it to `policy_feature_document_map` with the correct `document_type`.
6. The uploaded document appears as a new row in the **Documents** tab after upload (without full page refresh).
7. The `GET :policyId/documents` API returns documents from `policy_feature_document_map` alongside existing sources.
8. The `document_type` column exists on `policy_feature_document_map` with a migration.
9. Selecting a document type is required — the form cannot be submitted without it.

---

## Files to Create / Modify

### Frontend
| Action | File |
|--------|------|
| Modify | `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/index.tsx` — add Upload sub-tab |
| Create | `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/UploadDocumentTab.tsx` — new tab component |
| Modify | `apps/ui/iwork/src/app/pages/CompanyPage/PolicyDetails/documentsConfig.tsx` — if column changes needed |

### Backend — Policy Service
| Action | File |
|--------|------|
| Modify | `apps/services/policy-service/src/app/policy/policy.controller.ts` — add POST upload endpoint |
| Modify | `apps/services/policy-service/src/app/policy/policy.service.ts` — add upload logic, update `getPolicyDocuments` |
| Modify | `apps/services/policy-service/src/app/policy/policy.repository.ts` — update `getDocumentsByPolicyId` UNION |

### Backend — Service Lib
| Action | File |
|--------|------|
| Modify | `apps/services/service-lib/src/lib/entities/policy-feature-document.entity.ts` — add `document_type` column |
| Create | New migration file — `ALTER TABLE policy_feature_document_map ADD COLUMN document_type` |

---

## Open Questions

1. **File format restrictions** — Are there specific file types allowed for manual uploads? (PDF only, or also images/Excel?)
2. **Max file size** — Should the same limit as other uploads apply?
3. **Permissions** — Should there be a feature flag or role-based permission to control who can see/use the Upload tab?
4. **Display label in Documents tab** — Should `document_type` values (`mandate`, `policy_feature_document`) be displayed as-is or formatted (e.g., "Mandate", "Policy Feature Document")?
5. **Activity Name** — Is `"Manual Upload"` the right label for the Activity Name column in the Documents tab for these records?
