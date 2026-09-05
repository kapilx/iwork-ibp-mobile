# Product Requirements Document — Manage Insurer

**Module:** MANAGE-INSURER  
**Jira:** IIRM-10435  
**Product:** Insurance Wellness Hub (iWork Edge)  
**Stage:** 40a — Module PRD  
**Method:** Reverse-engineered from production codebase and live application screenshots  
**Created Date:** 2026-05-13  
**Updated Date:** 2026-05-21  

---

## 1. Overview

The Manage Insurer module is the master data management surface for insurance carriers within iWork Edge. An insurer is an insurance company — the entity that underwrites policies sold or managed through IIRM's brokerage operations.

Before a policy can be placed, renewed, or serviced, the insurer behind it must exist as a verified master record. This module owns the full lifecycle for those records: create, read, update. It also surfaces KPI snapshots and enables search-and-filter navigation across all registered carriers.

The module lives under **Manage Placements** in the navigation tree. It shares form infrastructure with the TPA and Broker modules but this PRD scopes to the insurer entity only. Contacts linked to an insurer are accessible via the "Insurer contacts" tab — referenced where necessary but not fully specified here.

---

## Business Model

An insurer record is the top-level master entity. Below it sits one or more branches. Every branch — including the HQ — is the same data structure: one address, multiple contacts, one KYC record, and one or more GST entries. The difference between HQ and other branches is form presentation only, not data model.

**Data structure:**

- **Insurer** — master record; holds core identity (name, display name, insurance type, company type, company tag, country, insurer code, website, remarks, logo, status)
  - **Branch** — one or more per insurer; every branch (including HQ) contains:
    - **One address** — physical location (address lines, area, pin code, city, state, country)
    - **Multiple contacts** — people reachable at this branch (name, phone, email, support number)
    - **One KYC record** — registration number, TIN number, PAN card number for this branch
    - **One or more GST entries** — state, GST category, GST number; scoped to this branch's address. Maximum one entry per state.
    - **Branch metadata** — branch type, branch code, branch name, branch display name, parent branch

**Form presentation (UI only — not a data model difference):**

The Add / Edit insurer form is structured in two distinct sections for branch data:

1. **HQ details section** — a fixed, non-repeatable section that always appears first. It captures the branch whose `branch_type` = **HQ - Head Quarter**. The Branch type field in this section is locked to HQ and cannot be changed.
2. **Branch details section** — a repeatable section below HQ details. Each block captures one additional branch (CO, RO, BO, etc.). Users can add or remove blocks. The Parent Branch field is available here (not in HQ details).

Both sections use the same underlying data structure: `address` + `insurer_address` + contacts + KYC + GST entries.

> **GST is address-scoped:** Each branch/HQ address owns its GST rows. Removing a branch address also removes all its GST entries in the same operation. This is governed by BR-023.

---
## 2. Scope

### In scope

- Insurer listing page (`/insurer`): KPI cards, smart search with collapsible filters, paginated AG-Grid table, row actions
- Add insurer form (`/insurer/new`): insurer details, GST details, logo upload, HQ details section, multi-branch section (each branch: one address, multiple contacts, one KYC record)
- View insurer details (`/insurer/:id`): read-only structured detail view with summary bar
- Edit insurer form (`/insurer/:id/edit`): same form pre-populated with saved values
- Duplicate insurer prevention (name + country uniqueness enforced by backend)
- Logo upload with image cropper, preview, replace, and delete
- Multi-branch capture and persistence (one address + multiple contacts + one KYC per branch)
- Permission gating via `FeatureKey.VIEW_INSURER`

### Out of scope

- Insurer contacts management UI — separate sub-module; however, **contact sync from the branch/HQ form to Insurer contacts is in scope** (see US-016, BR-018)
- TPA and Broker master data — share form infrastructure but are separate entities
- Policy placement, RFP, and opportunity workflows — those modules consume insurer records but do not define them here
- Bulk import of insurer master records
- Insurer deactivation or status-change workflows — status is auto-set on create; no user-facing toggle exists today
- Insurer Config ("Send to Insurer" utility file format template) — separate PRD

---

## 3. User Stories

The primary actor is an IIRM back-office administrator who maintains carrier master data. All routes are guarded by `FeatureKey.VIEW_INSURER` (BR-010).

> **Status key:** `[LIVE]` — implemented and working in production · `[PARTIAL]` — code exists but behaviour is incomplete · `[PENDING]` — not yet implemented · `[ENH]` — new enhancement from IIRM-10435 scope

### Listing

**US-001** `[LIVE]` — As an IIRM admin, I want to see a paginated list of all active insurers so that I can find and open any record without knowing its exact identifier.

**US-002** `[LIVE]` — As an IIRM admin, I want to filter the list by organisation, insurer name, branch type, branch name, branch code, and city so that I can narrow results without scrolling through 380+ records.

**US-003** `[LIVE]` — As an IIRM admin, I want KPI cards showing total active insurers and total active policies linked to insurers so that I can assess master data health at a glance. *(All 4 KPI cards live — 392 Total active insurers, 92,536 Total active policies, 159.38 Cr Brokerage amount, 1554.47 Cr Net premium. Filter-awareness confirmed: address/branch filters use `getInsurerIdsByAddressFilters()`; Organisation filter resolves to `country_id` on the insurer table.)*

**US-004** `[LIVE]` — As an IIRM admin, I want to configure visible columns (Table settings) and save my active filter state (Save view) so that I don't repeat setup on every visit.

### Create

**US-005** `[LIVE]` — As an IIRM admin, I want to create a new insurer with core details (name, display name, company type, insurance type, company tag, country, code, website, remarks) so that the insurer is available for policy and opportunity workflows.

**US-006** `[LIVE]` — As an IIRM admin, I want to capture KYC identifiers (registration number, TIN number, PAN card number) per branch so that regulatory details are stored at the branch level.

**US-007** `[LIVE]` — As an IIRM admin, I want to add one or more GST entries (state, GST category, GST number) per branch address so that tax compliance details are stored at the branch level, one entry per state.

**US-008** `[LIVE]` — As an IIRM admin, I want to upload, crop, preview, replace, and delete an insurer logo so that the carrier is visually identifiable in downstream screens.

**US-009** `[LIVE]` — As an IIRM admin, I want to add one or more branches (each with one address, branch type, and branch code) so that regional office information is captured and searchable.

**US-010** `[LIVE]` — As an IIRM admin, I want the system to block duplicate insurer names within the same country so that master data stays clean.

### View

**US-011** `[LIVE]` — As an IIRM admin, I want a read-only detail view (summary bar, insurer details, KYC, branch hierarchy, GST details, logo) so that I can verify the record without entering edit mode.

### Edit

**US-012** `[LIVE]` — As an IIRM admin, I want to edit an existing insurer and save changes so that I can keep records current as carrier information evolves.

**US-013** `[LIVE]` — As an IIRM admin, I want the system to redirect me away from a non-editable record's edit form so that I don't encounter a silent save failure.

### HQ Details & Branch Hierarchy

**US-014** `[LIVE]` — As an IIRM admin, I want to capture headquarters details in a dedicated fixed "HQ details" section so that the primary office address is stored distinctly from branch records.

**US-015** `[PENDING]` `[ENH]` — As an IIRM admin, I want to assign a parent branch to each branch so that the full branch hierarchy is captured and navigable.

**US-016** `[LIVE]` `[ENH]` — As an IIRM admin, I want contact details I enter in the HQ or branch section to be automatically stored as Insurer contacts for that location so that contact data does not need to be entered twice.

**US-017** `[LIVE]` `[ENH]` — As an IIRM admin, I want KPI cards showing brokerage amount and net premium for the displayed insurers so that I can assess business volume at a glance.

**US-018** `[PENDING]` `[ENH]` — As an IIRM admin, when a sub-child record (contact, address, GST entry, or KYC) fails to save after the parent insurer has been saved, I want to be told what failed and why, and choose whether to bypass or correct and re-submit — so that I am never silently left with incomplete data.

---

## 4. Business Rules

**BR-001 — Name uniqueness per country** `[LIVE]`  
No two active insurer records may share the same `insurerName` within the same `countryId`. The check runs on create and re-runs on edit only when the insurer name has changed.  
Example: "Bajaj Allianz General Insurance Co. Ltd." cannot be registered twice for India; the same name may exist in a different country.

**BR-024 — Insurer name is locked after creation** `[LIVE]`  
The Insurer name field (`insurerName`) is disabled in edit mode — it cannot be changed once the record is saved. The field renders as read-only in the Edit form. The backend still guards against duplicate name conflicts server-side, but the UI prevents changes entirely.

**BR-002 — Country defaults from user profile** `[LIVE]`  
When the authenticated user has a `country.id` in their session, the Country field is pre-populated and disabled. Users without a profile country may select freely.

**BR-003 — Display name seeded from insurer name** `[LIVE]`  
Display name is seeded from the insurer name when the user first types it. It can be independently overridden.

**BR-004 — Company tag is system-controlled** `[LIVE]`  
The Company tag field is always disabled in the form. Its value is pre-set from the session-level `companyTagCompanyId` context. The `COMPANY_TAG` lookup has exactly two values: **Company** and **Individual**. The default for insurer records is **Company**.

**BR-005 — GST row cross-field completeness and state uniqueness** `[LIVE]`  
GST entries belong to a branch address, not the insurer as a whole. Each branch/HQ address has its own set of GST rows.  
A GST row is valid only when all three fields — state, GST category, and GST number — are filled, or all three are empty. Partial rows block save.  
GST number must match: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` (e.g. `27ABCDE1234F1Z5`)  
A branch address may have **at most one GST entry per state**. A second row for the same state within the same address is not permitted.  
When a branch address is removed, all its GST rows are deleted in the same operation (subject to the downstream reference check in BR-023).

**BR-006 — Logo rules** `[LIVE]`  
Logo upload is available only for insurer and TPA entity types (not broker). Only PNG and JPEG files are accepted. The file passes through an image cropper before upload; the stored reference is always the cropped version tagged with `insurer-logo`. The cropper enforces a **16:9 aspect ratio** (recommended output: 400×225 px).  
Logo **Delete** is an immediate operation — clicking Delete triggers a `DELETE /file-uploads/:id` API call at once; it does not wait for the form Save button. The logo reference is removed immediately on confirmation.

**BR-007 — Status auto-assigned on create** `[LIVE]`  
New insurer records are assigned `INSURER_STATUS_ACTIVE` automatically. There is no user-facing status field on the create form.

**BR-008 — Remarks character cap** `[LIVE]`  
Remarks renders a rich text editor. The character limit is **500 characters** enforced on plain text extracted from HTML — not the raw HTML string length. Blocked on both frontend and backend.

**BR-009 — At least one address block initialised** `[LIVE]`  
The form initialises with one empty address block. More may be added. No minimum of completed addresses is enforced before save.

**BR-010 — Permission gate** `[LIVE]`  
All insurer routes (`/insurer`, `/insurer/new`, `/insurer/:id`, `/insurer/:id/edit`) are guarded by `FeatureKey.VIEW_INSURER` via `PermissionGuard`.

**BR-011 — Insurance company type precedes Type of company** `[LIVE]`  
In the Insurer details section, the field order must be: Insurance company type (`isLifeLid`) first, then Type of company (`companyTypeLid`). Confirmed correct in `formConfig.ts` — `isLifeLid` is defined before `companyTypeLid`.

**BR-012 — Type of company restricted to PSU and Private** `[LIVE]`  
The `INSURANCE_COMPANY_TYPE` lookup contains exactly two values: **PSU** and **Private**. These are the only options surfaced in the insurer form — enforced at the database/lookup master level.

**BR-013 — HQ details is a fixed, non-repeatable section with locked branch type** `[LIVE]`  
The form must include a single fixed "HQ details" section that always appears above the repeatable Branch details section. Rules:
- The section cannot be added, removed, or reordered.
- The Branch type field within HQ details is **locked to "HQ - Head Quarter"** and is not editable by the user.
- The section contains: branch code, branch name, address fields, contact fields, and KYC fields.
- The **Parent Branch dropdown is not present** in HQ details — HQ has no parent.
- HQ is stored using the same `address` + `insurer_address` tables as other branches, distinguished by `branch_type_lid` = HQ lookup value.

**BR-014 — Branch display name is auto-computed and read-only** `[PARTIAL]` `[ENH]`  
Each branch address block (not HQ details) must include a read-only "Branch display name" field, computed as:  
`[Insurer Name] - [Branch Code] - [Branch Name] - [Branch City]`  
Example: `HDFC Life Insurance - MUM001 - Mumbai Central - Mumbai`  
The value updates live as the user fills its component fields. Any component that is empty is omitted from the string (no trailing or double delimiters).  
If the insurer display name changes, the branch display name recomputes automatically using the updated name. There are no downstream dependencies on this field — it is display-only.

**BR-015 — Parent branch dropdown excludes the current branch** `[PENDING]` `[ENH]`  
The Parent Branch dropdown in each branch block must list all other branches of the same insurer. Each option is labelled with the branch's computed Branch display name (BR-014). The current branch is always excluded from its own dropdown.

**BR-016 — Parent branch in Add flow uses in-memory state** `[PENDING]` `[ENH]`  
When adding a new insurer, no branch IDs exist in the database yet. The frontend must maintain an in-memory registry of all branch blocks currently on the form. Parent branch selections reference other in-memory blocks by a temporary client-side key. On submit, the backend must follow a two-phase sequence:  
1. Insert all branch address rows to obtain their persisted IDs.  
2. Update each `address.parent_branch_id` with the resolved address ID from phase 1.  
This two-phase sequence is required because parent-child links cannot resolve until all rows have been persisted.

**BR-017 — Parent branch in Edit flow merges DB and in-memory sources** `[PENDING]` `[ENH]`  
In the Edit flow, the Parent Branch dropdown for each branch must be populated from a merged list:  
- **Saved branches** — loaded from `GET /insurers/:id`; the branch currently being edited is excluded.  
- **New branches added in this session** — held in-memory; treated identically to the Add flow (BR-016).  
On submit, saved branches update their `address.parent_branch_id` directly; new branches go through the two-phase insert.

**BR-021 — KYC details are per branch, not per insurer** `[LIVE]`  
Each branch (including HQ) has its own KYC record containing registration number, TIN number, and PAN card number. These identifiers belong to the branch, not the insurer as a whole.  
- One KYC record per branch; captured inside each branch/HQ block in the Add/Edit form.  
- KYC is rendered per branch in the detail view.  
- The KYC section appears inside each branch/HQ block, not as a standalone insurer-level section.

**BR-022 — Each branch has exactly one address and multiple contacts** `[PENDING]` `[ENH]`  
The branch model enforces:
- **One address per branch** — a branch block contains exactly one address. Multiple addresses cannot be added to a single branch.
- **Multiple contacts per branch** — a branch can have one or more contact records (person name, phone, email, support number), synced to Insurer contacts on save (BR-018).

**BR-025 — Address omission in PUT payload silently removes the address link** `[LIVE]`  
When saving an Edit insurer form, any existing branch address that is **not included** in the `PUT /insurers/:id` payload is silently unlinked: its `insurer_address` row is removed and the address no longer appears on the insurer. No warning is shown to the user before this happens.  
The frontend must carry every existing address in the payload unless the user has explicitly removed it. Omitting an address by accident results in a silent data loss that is difficult to detect.

**BR-019 — Insurer delete is soft-delete with cascade** `[PARTIAL]`  
When an admin deletes an insurer:
- The insurer row is soft-deleted (`deleted_at` set). The record is not physically removed.
- All linked `address` rows (via `insurer_address`) and `state_gst_detail` rows are cascade-soft-deleted in the same transaction.
- Existing policy, opportunity, and claims references to the insurer are preserved. Downstream modules retain their foreign key references and continue to function against the soft-deleted record.
- A soft-deleted insurer does not appear in the listing page or any selection dropdown.

*Note: Insurer-level soft-delete is implemented (`softDeleteInsurer()` in `insurer.service.ts`). Cascade soft-delete of linked `address` and `state_gst_detail` rows is NOT implemented — only the insurer row gets `deleted_at` set. The `@OneToMany cascade: true` on the entity covers persist/save operations only, not soft-delete.*

**BR-023 — Branch address removal must check downstream usage** `[PENDING]` `[ENH]`  
When a user removes a branch address block in the Edit insurer form, the system must check whether that address is referenced in any opportunity or policy record before proceeding.

- **If referenced** — the address cannot be deleted. The system shows a warning: *"This branch is linked to one or more opportunities or policies. It cannot be removed, but can be disabled to prevent future use."* The address block is marked as inactive (`is_active = false` or equivalent) rather than deleted. Inactive branches do not appear in selection dropdowns but remain visible on the insurer detail view with an "Inactive" label.
- **If not referenced** — the address row is soft-deleted (`deleted_at` set) and removed from the form and detail view.

This check must run on the backend at save time. The frontend may also warn the user before they attempt to remove the block, based on a flag returned by `GET /insurers/:id`.

**BR-020 — No circular parent branch references** `[PENDING]` `[ENH]`  
A branch's Parent Branch must never create a cycle in the hierarchy. The system must enforce the following rules:

1. A branch cannot be set as its own parent.
2. A branch cannot be assigned a parent that is already its direct or indirect child.

**How to derive the logic:**  
Before allowing a parent assignment, walk up the candidate parent's ancestor chain. If the current branch appears anywhere in that chain, the assignment is invalid.

Example:
- Branch A → parent is Branch B → parent is Branch C. This is valid (linear chain).
- Now user tries to set Branch C's parent to Branch A. Walking up from Branch A: A → B → C. Branch C appears in A's chain, so this assignment would create a loop. **Block it.**

The validation must run:
- On the frontend: when the user selects a parent from the dropdown (disable or exclude options that would create a cycle).
- On the backend: as a guard on the save operation, in case the frontend check is bypassed.

**BR-026 — Sub-child save failures must be surfaced to the user** `[PENDING]` `[ENH]`  
When the parent insurer record saves successfully but any sub-child operation fails — contact sync, address upsert, GST row save, or KYC save — the failure must not be silently swallowed. The required behaviour:

1. A dialog (or inline notification) appears: *"Unable to save [entity]. [Reason from API response]."*
2. The user is presented with two explicit choices:
   - **Bypass** — navigate to the detail view accepting that the sub-child was not saved. The partial state is visible.
   - **Correct and re-submit** — remain on the form; the user fixes the data and retries the save.
3. The parent insurer record is **not rolled back** — it has already been committed.
4. This rule applies to all sub-children: contacts, addresses, GST rows, KYC records.

*Current state: contact sync failures are silently caught in `InsurerForm/index.tsx` (line 587: `catch {}`). Address, GST, and KYC failures may be similarly unhandled. See Pending item-3.*

**BR-018 — Contact fields in HQ/branch sections sync to Insurer contacts** `[LIVE]`  
When the user fills contact fields (phone, alternate phone, email, support number) in the HQ details or any branch block and saves, the backend creates a corresponding Insurer contact record linked to the `address_id` of that HQ or branch block. The contact is visible in the Insurer contacts tab for that insurer. Contact creation code in `InsurerForm/index.tsx` (lines 542–590) is active — existing contacts are updated via `PUT /contacts/:id`, new contacts created via `POST /contacts`. `stripContactFields` still removes contact fields from the address payload, but contact data is captured first into `pendingContactDataRef` before stripping.  
*Known gap (to be resolved by BR-026 / Pending item-3): contact sync failures are currently silently swallowed — no error is shown to the user.*

---

## 5. Acceptance Criteria

### US-001 — Insurer listing

**AC-001** `[LIVE]`  
Given an admin with `VIEW_INSURER` permission navigates to `/insurer`  
Then a paginated table renders with columns: Insurer name, Branch type, Branch name, Branch code, Address, City, State, Phone  
And each row is clickable, opening the insurer detail page

### US-002 — Filters

**AC-002** `[LIVE]`  
Given the listing page is open  
When the user expands Smart Search and sets one or more filters (Organisation, Insurer name, Branch type, Branch name, Branch code, City)  
Then the table refreshes showing only matching records  
When the user clicks Reset, all filters clear and the full list returns

### US-003 — KPI cards

**AC-003** `[LIVE]`  
Given the listing page loads  
Then four KPI cards are visible above the table:  
— "Total active insurers" (purple `#E0DBFF`) — count of insurers with active status  
— "Total active policies with insurer" (yellow `#FFE7B7`) — count of active policies where insurer is lead insurer  
— "Brokerage amount" (purple `#E0DBFF`) — sum of `basicBrokerageAmount` across policies, endorsements, asset endorsements  
— "Net premium" (yellow `#FFE7B7`) — sum of `netPremium` across policies, endorsements, asset endorsements  
When a smart search filter is active, all four counts/amounts reflect the filtered subset: address/branch filters scope via `getInsurerIdsByAddressFilters()`; Organisation filter resolves to `country_id` on the insurer table

### US-004 — Table personalisation

**AC-004** `[LIVE]`  
Given the user toggles columns via "Table settings," the table reflects the updated column set  
Given the user clicks "Save view," the current filter + column state is persisted and restored on next visit

### US-005 — Create insurer

**AC-005** `[LIVE]`  
Given the user navigates to `/insurer/new`, fills all required fields, and submits  
Then a `POST /insurers` request is issued; on success a success toast shows and the user is redirected to the detail page

**AC-006** `[LIVE]`  
Given the user submits with any required field empty  
Then inline validation messages appear per field and the form is not submitted

**AC-007** `[LIVE]`  
Given the Website field contains a value that does not match the URL pattern  
Then an error message is shown and save is blocked

### US-006 — KYC details

**AC-008** `[LIVE]`  
Given the user enters Registration number, TIN number, or PAN card number  
Then those values are saved and visible in the KYC details section of the detail view  
And all KYC values are stored in uppercase

### US-007 — GST details

**AC-009** `[LIVE]`  
Given the user fills all three fields in a GST row, the row is valid and submitted  
Given the user fills only one or two fields in a row, save is blocked with a field-level error on the missing field(s)

**AC-010** `[LIVE]`  
Given a GST number that does not match the GSTIN pattern  
Then the error "Invalid GST Number format (e.g., 27ABCDE1234F1Z5)" is shown

### US-008 — Logo

**AC-011** `[LIVE]`  
Given the user selects a PNG or JPEG file in the Logo section  
Then the image cropper dialog opens; when the user confirms the crop, a preview renders

**AC-012** `[LIVE]`  
Given a logo preview is visible:  
— Clicking Replace opens the file picker and the existing logo can be swapped  
— Clicking Delete removes the logo reference and the preview disappears

### US-009 — Addresses

**AC-013** `[LIVE]`  
Given the user fills at least one address block (including branch type and branch code where applicable)  
Then the addresses are persisted and visible in the detail view under Branch type & hierarchy and address sections

### US-010 — Duplicate prevention

**AC-014** `[LIVE]`  
Given an insurer with name "X" already exists for country "India"  
When the user tries to create a new insurer with the same name and country  
Then the backend returns a conflict error, the form shows a duplicate-prevention message, and the record is not created

### US-011 — Detail view

**AC-015** `[LIVE]`  
Given a user opens `/insurer/:id`  
Then the summary bar shows: Insurer code, Insurance company type, Company tag  
And the body shows: Insurer details, logo, Head Quarters details, Branch type & hierarchy, KYC details, GST details  
And the logo is shown if one is uploaded  
And the HQ details section renders branch type, branch code, branch name, address, city, state, pin code, phone number, email, support number

### US-012 — Edit insurer

**AC-016** `[LIVE]`  
Given a user opens `/insurer/:id/edit`  
Then all previously saved values are pre-populated  
When the user updates fields and submits, a `PUT /insurers/:id` request is issued  
On success: a success toast shows and the detail view reflects the updated values

### US-013 — Non-editable record

**AC-017** `[LIVE]`  
Given a user opens `/insurer/:id/edit` for a record flagged as non-editable  
When the API response indicates the record cannot be edited  
Then the user is redirected to the unauthorized page and no form renders

### Form field ordering (BR-011, BR-012)

**AC-018** `[LIVE]`  
Given the user opens the Add or Edit insurer form  
Then in the Insurer details section, Insurance company type appears immediately before Type of company

**AC-019** `[LIVE]`  
Given the user opens the Type of company dropdown  
Then only two options are available: PSU and Private

### US-014 — HQ details section (BR-013)

**AC-020** `[LIVE]`  
Given the user opens the Add or Edit insurer form  
Then a fixed "HQ details" section is always present and contains branch type, branch code, branch name, address fields, and contact fields  
And a Parent Branch dropdown is not present in the HQ details section  
And the section cannot be added, removed, or reordered

### US-015 — Branch display name and Parent Branch (BR-014, BR-015, BR-016, BR-017)

**AC-021** `[PARTIAL]` `[ENH]`  
Given the user fills Branch code, Branch name, and City in a branch block  
Then the Branch display name field shows `[Insurer Name] - [Branch Code] - [Branch Name] - [City]`  
And the value updates live without page reload  
And empty component values are omitted without leaving double delimiters  
*(Auto-calculation logic is active in `InsurerForm/index.tsx` via `branchDisplayNameCalcFields`; however the display field itself is still commented out in `insurerSharedFormConfig.ts` — not yet visible in the form UI.)*

**AC-022** `[PENDING]` `[ENH]`  
Given the user is on the Add insurer form with two or more branch blocks  
When the user opens the Parent Branch dropdown for Branch B  
Then the dropdown lists all other branch blocks on the form (by their Branch display name) excluding Branch B

**AC-023** `[PENDING]` `[ENH]`  
Given the user submits the Add insurer form with parent branch selections  
Then the backend inserts all branch address rows first  
Then updates each `insurer_address.parent_address_id` with the resolved address ID  
And no parent-branch reference is lost

**AC-024** `[PENDING]` `[ENH]`  
Given the user is on the Edit insurer form for an insurer with 3 saved branches  
When the user opens the Parent Branch dropdown for Branch B  
Then the dropdown lists Branch A and Branch C from the database, excluding Branch B itself  
When the user adds a new Branch D in this edit session  
Then the Parent Branch dropdown for any branch lists all other branches (DB-saved + in-memory) excluding itself

**AC-030** `[PENDING]` `[ENH]`  
Given Branch A's parent is Branch B, and Branch B's parent is Branch C  
When the user tries to set Branch C's parent to Branch A  
Then the system blocks the selection with the message: "This assignment would create a circular hierarchy. A branch cannot be set as a parent of its own ancestor."  
And Branch A does not appear as a selectable option in Branch C's Parent Branch dropdown  

Given the user tries to set a branch as its own parent  
Then the branch is excluded from its own Parent Branch dropdown and the assignment is blocked

### Branch address removal (BR-023)

**AC-031** `[PENDING]` `[ENH]`  
Given the user removes a branch address block in the Edit insurer form  
When the backend detects that the address is referenced in one or more opportunities or policies  
Then the address is NOT deleted  
And a warning is shown: "This branch is linked to one or more opportunities or policies. It cannot be removed, but has been disabled to prevent future use."  
And the branch is marked inactive and remains visible on the detail view with an "Inactive" label  
And the branch does not appear in any selection dropdown going forward

Given the user removes a branch address block that has no downstream references  
Then the address is soft-deleted and no longer appears on the form or detail view

### US-016 — Contact sync to Insurer contacts (BR-018)

**AC-025** `[LIVE]`  
Given the user fills contact fields in the HQ details section and saves the insurer  
Then an Insurer contact record is created and linked to the HQ address ID  
And the contact is visible in the Insurer contacts tab for this insurer

**AC-026** `[LIVE]`  
Given the user fills contact fields in a branch block and saves the insurer  
Then an Insurer contact record is created and linked to that branch's address ID  
And the contact is visible in the Insurer contacts tab for this insurer

### US-017 — Brokerage Amount and Net Premium KPI cards

**AC-028** `[LIVE]`  
Given the listing page loads  
Then the Brokerage amount KPI card (purple) shows the sum of `basicBrokerageAmount` across policies, endorsements, and asset endorsements linked to the displayed insurers, formatted in the user's currency locale  
When a smart search filter is active, the value recomputes for the filtered insurer subset  
When no policies exist for the displayed insurers, the card shows 0

**AC-029** `[LIVE]`  
Given the listing page loads  
Then the Net premium KPI card (yellow) shows the sum of `netPremium` across policies, endorsements, and asset endorsements linked to the displayed insurers, formatted in the user's currency locale  
When a smart search filter is active, the value recomputes for the filtered insurer subset  
When no policies exist for the displayed insurers, the card shows 0

### US-018 — Sub-child save failure handling (BR-026)

**AC-032** `[PENDING]` `[ENH]`  
Given the insurer record saves successfully but a contact sync call (POST or PUT) fails  
Then a dialog or inline notification appears: *"Unable to save contact. [API error reason]."*  
And the user sees two options: **Bypass** and **Correct and re-submit**  
When the user clicks Bypass, they are navigated to the insurer detail view  
When the user clicks Correct and re-submit, the form remains open with focus on the failed section

**AC-033** `[PENDING]` `[ENH]`  
The same failure-handling behaviour (AC-032) applies to:  
— Address save failures (create or update of an address row)  
— GST row save failures  
— KYC save failures  
In each case the notification identifies the entity that failed, shows the API reason, and offers Bypass or Correct and re-submit.

### US-Delete — Insurer delete

**AC-027** `[PARTIAL]`  
Given an admin clicks Delete on an insurer row in the listing  
Then the insurer is soft-deleted (`deleted_at` set) and disappears from the listing table and all selection dropdowns *(LIVE)*  
And all linked address rows and GST rows are cascade-soft-deleted in the same transaction *(PENDING — cascade not implemented)*  
And existing policy, opportunity, and claims records that reference this insurer retain their reference unchanged

---

## 6. Listing Page — Search, Filters, KPI Cards, and Table

The listing page at `/insurer` has four stacked areas: a tab bar (Insurer | Insurer contacts), a collapsible smart search panel, four KPI cards, and the AG-Grid table with action buttons above it.

### 6.1 Smart search filters

| Filter field | Type | Data source | Backend mapping |
|---|---|---|---|
| Organisation | Select dropdown | `GET /master-data/organisation` | Server resolves selected org to its `countryId`; filters insurers by that country — not by org directly |
| Insurer name | API-driven select | `endPoints.insurerDistinctBranchNames` variant | `insurer.name` (partial match) |
| Branch type | Select dropdown | `GET /look-up/by-name/INSURER_BRANCH_TYPE` | `address.branch_type_lid` |
| Branch name | API-driven select | `endPoints.insurerDistinctBranchNames` | `address.branch_name` (`ILIKE` match) |
| Branch code | Text input | User-typed | `address.branch_code` |
| City | API-driven select | `GET /master-data/city?searchBy=name` | `address.city_id` |

Filter values are passed to `GET /insurers` as a serialised `search` parameter. The panel has a **Run** button to apply filters and a **Reset | Collapse** control to clear and collapse.

### 6.2 KPI cards

Four KPI cards are displayed above the listing table. All four must recompute when a smart search filter is active, reflecting the filtered subset — not global totals.

The Premium and Brokerage values follow the same aggregation logic used by the BizDown Report page (`BizDownReportListing/tableConfig.ts` → `bizDownReportData`): values are summed from the `policy` rows linked to the displayed insurers.

| # | Label | Colour | Value rule | Current state |
|---|---|---|---|---|
| 1 | Total active insurers | Purple (`#E0DBFF`) | Count of insurers with `status_lid = INSURER_STATUS_ACTIVE`, scoped to active filters | **Live** — `kpisData.totalActiveInsurers` |
| 2 | Total active policies with insurer | Yellow (`#FFE7B7`) | Count of active policies where insurer is mapped as lead insurer | **Live** — `kpisData.totalActivePolicies` |
| 3 | Brokerage amount | Purple (`#E0DBFF`) | Sum of `basicBrokerageAmount` across policies + endorsements + asset endorsements | **Live** — `kpisData.brokerageAmount` |
| 4 | Net premium | Yellow (`#FFE7B7`) | Sum of `netPremium` across policies + endorsements + asset endorsements | **Live** — `kpisData.netPremium` |

All four cards must respect active smart search filters (organisation, insurer name, branch type, branch name, branch code, city). Currency values (Brokerage Amount, Net Premium) must be formatted using the user's localisation setting (`formatCurrencyByLocalization`).

### 6.3 Table columns

All address-derived columns read from `insurerAddresses[0]`. Insurers with no addresses show `--` in those columns.

| Column | Source | Note |
|---|---|---|
| Insurer name | `insurer.insurerName` | Clickable — opens `/insurer/:id` |
| Address | `insurerAddresses[0].address1` | First address line 1 |
| City | `insurerAddresses[0].city.name` | Eager-loaded |
| State | `insurerAddresses[0].state.name` | Eager-loaded |
| Phone | `insurerAddresses[0].phoneNumber` | — |
| Branch type | `insurerAddresses[0].branchType.lookUpValue` | From `address.branch_type_lid` |
| Branch name | `insurerAddresses[0].branchName` | From `address.branch_name` |
| Branch code | `insurerAddresses[0].branchCode` | From `address.branch_code` |

### 6.4 Table actions

| Button | Behaviour |
|---|---|
| Save view | Persists current filter + column state, restored on next visit |
| Table settings | Toggles AG-Grid column visibility panel |
| Add insurer | Navigates to `/insurer/new` |

Row-level actions (view, edit, delete) are accessible per record. Pagination is server-side; defaults are `page = 1`, `limit = 10`.

---

## 7. Lookup Reference

### Dropdown values

**`INSURER_BRANCH_TYPE`** — Branch type dropdown (address form, HQ details section, smart search filter, listing table)

- HQ - Head Quarter
- CO - Corporate Office
- HO - Head Office
- DO - Divisional Office
- ZO - Zonal Office
- RO - Regional Office
- AO - Area Office
- BO - Branch Office
- Facultative Reinsurance Unit
- India Branch Office
- Operations Hub
- Representative Office
- Treaty Management
- Unit Underwriting Desk

The HQ details fixed section (BR-013) locks Branch type to **HQ - Head Quarter** — it is not user-selectable. The Branch details repeatable section shows all other values from this list.

**`INSURANCE_COMPANY_TYPE`** — Type of company dropdown (insurer form, restricted per BR-012)

- PSU
- Private

**`INSURANCE_TYPE`** — Insurance company type dropdown (insurer form)

- Life Insurance
- General Insurance
- Health Insurance
- Non-Life Insurance
- ReInsurance

---

## 8. Pending Implementation

Confirmed requirements for the IIRM-10435 enhancement scope that are not yet implemented. The TRD (stage 40b) must cover these.

### Pending item-1 — Branch display name

**Current state:** No `branch_display_name` field exists in the schema. The auto-calculation logic (`branchDisplayNameCalcFields`) exists in the frontend but the display field is not yet visible in the form UI.

**Required behaviour:** Each branch block shows a read-only auto-computed field: `[Insurer Name] - [Branch Code] - [Branch Name] - [Branch City]`. Updates live as component fields are filled. Empty components are omitted.

**DB changes required:** `branch_display_name` is already declared in `create-address.dto.ts` (line 178) and `update-address.dto.ts` (line 167) — the DTO accepts the value but the `@Column` decorator is absent from `address.entity.ts`, so the value is silently dropped before persistence. Only change needed: add `branch_display_name varchar(500)` as a mapped `@Column` to the entity (TRD to decide computed vs stored).

**Refs:** BR-014 `[PARTIAL]`, AC-021

### Pending item-2 — Parent Branch

**Current state:** The column `parent_branch_id` (nullable int, FK → `address.id`) already exists on the `address` entity (`address.entity.ts` line 106). No parent branch dropdown exists in the form — it is commented out in `insurerSharedFormConfig.ts` and `AddInsurerBranch/formConfig.ts`.

**Required behaviour:**
- Parent Branch dropdown per branch block — lists all other branches by their display name, excludes self.
- Add flow: in-memory branch registry with two-phase submit (insert addresses first, then update `address.parent_branch_id`).
- Edit flow: merged list of DB-saved branches + in-memory new branches.
- Circular reference prevention (BR-020, AC-030).

**DB changes required:** None — `address.parent_branch_id` column already exists. Work is frontend-only (uncomment + wire up the dropdown) plus backend submit-sequence logic.

**Refs:** BR-015–017, BR-020 `[PENDING]`, AC-022–024, AC-030


### Pending item-3 — Sub-child save failure handling

**Current state:** When the parent insurer saves successfully, all sub-child operations (contact sync, address upsert, GST save, KYC save) run independently. Failures are silently swallowed — confirmed for contacts at `InsurerForm/index.tsx` line 587 (`catch {}`). Address, GST, and KYC failure paths are likely unhandled as well.

**Required behaviour:** Any sub-child failure after a successful parent save must show a dialog with the failure reason and present the user with **Bypass** or **Correct and re-submit** options (BR-026). The parent record is not rolled back.

**Scope of change:**
- `InsurerForm/index.tsx` — replace bare `catch {}` on contact loop with error capture + dialog trigger
- Audit address, GST, and KYC save calls in the same form for identical silent-failure patterns
- New dialog component (or reuse existing confirm dialog) that accepts entity name + error reason + two action callbacks

**Refs:** US-018 `[PENDING]`, BR-026 `[PENDING]`, AC-032, AC-033

---

## 9. Open Questions

Items below are unresolved. Each must be answered before the TRD (stage 40b) is written or development begins on the affected feature.

### Missing specs

**OQ-001 — Logo file size and dimension limits**  
Only file type (PNG/JPEG) is currently specified. What is the maximum file size allowed? Are there minimum or maximum dimension requirements for the cropped output?

**OQ-002 — Logo crop cancellation behaviour**  
When the user opens the image cropper and clicks Cancel, the existing logo must remain unchanged. This behaviour is assumed but not stated — needs confirmation and an AC.


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

## 11. Technical Reference

### 11.1 API Contract

#### APIs consumed

| Endpoint | Data | Used for |
|---|---|---|
| `GET /look-up/by-name/INSURANCE_COMPANY_TYPE` | Company type options | Type of company dropdown |
| `GET /look-up/by-name/INSURANCE_TYPE` | Insurance type options | Insurance company type dropdown |
| `GET /look-up/by-name/COMPANY_TAG` | Company tag options | Company tag default (Company / Individual) |
| `GET /look-up/by-name/INSURER_BRANCH_TYPE` | Branch type options | Smart search filter + address branch type |
| `GET /look-up/by-name/TAX` | GST category options | GST category segmented control |
| `GET /countries` | Country list | Country dropdown + address country |
| `GET /master-data/state?gst=true` | State list | GST state selector |
| `GET /master-data/city` | City search | Smart search city filter |
| `GET /master-data/organisation` | Organisation list | Smart search organisation filter |
| `POST /file-uploads` | File upload | Logo upload |
| `GET /file-uploads/:id` | File download | Logo preview |
| `GET /insurers/distinct-branch-names` | Distinct insurer/branch names | Smart search — Insurer name and Branch name filters |
| `POST /contacts` | Create contact | Contact sync on insurer save (BR-018) |
| `PUT /contacts/:id` | Update contact | Contact sync on insurer save (BR-018) |
| Session `userData.country.id` | Logged-in user's country | Country field default + disabled flag |

#### APIs produced

| Endpoint | Method | Consumers |
|---|---|---|
| `/insurers` | `POST` | Opportunity, policy, and placement modules |
| `/insurers/:id` | `PUT` | Same downstream consumers |
| `/insurers` | `GET` | Listing page |
| `/insurers/:id` | `GET` | Detail and edit pages |
| `/insurers/:id` | `DELETE` | Admin delete action (soft delete) |
| `/insurers/:id/contacts` | `GET` | Insurer contacts tab |
| `/insurers/:id/locations` | `GET` | Location mapping |

### 11.2 Cross-module Contract

The following modules read insurer records and will break if `id`, `insurerName`, or `displayName` are changed, or if the `/insurers/:id` contract changes:

- `opportunity-service` — insurer participation, RFP details, placement slip
- `policy-service` — policy-insurer map, TPA-insurer info
- `claims-service` — claim voucher to insurer

### 11.3 Field-to-Database Mapping

#### 11.3.1 Insurer table (`insurer`)

KYC fields (registration number, TIN, PAN) are captured per branch in the Add/Edit form and rendered per branch in the detail view (BR-021).

| UI label | DTO field | DB column | Type | Constraints | Lookup group |
|---|---|---|---|---|---|
| Insurer name | `insurerName` | `name` | `varchar(200)` | NOT NULL, unique per `country_id` | — |
| Display name | `displayName` | `display_name` | `varchar(100)` | NOT NULL | — |
| Type of company | `companyTypeLid` | `company_type_lid` | `int` | NOT NULL, FK → `look_up.id` | `INSURANCE_COMPANY_TYPE` |
| Insurance company type | `isLifeLid` | `is_life_lid` | `int` | NOT NULL, FK → `look_up.id` | `INSURANCE_TYPE` |
| Company tag | `companyTagLid` | `company_tag_lid` | `int` | NOT NULL, FK → `look_up.id` | `COMPANY_TAG` |
| Country | `countryId` | `country_id` | `int` | nullable, FK → `country.id` | — |
| Insurer code | `insureCode` | `insure_code` | `varchar(100)` | nullable | — |
| Website | `website` | `website` | `varchar(255)` | nullable, URL format | — |
| Remarks | `remarks` | `remarks` | `varchar(500)` | nullable; 500-char plain-text cap, HTML stripped before count | — |
| Logo | `insurerLogoFileId` | `insurer_logo_file_id` | `int` | nullable, FK → `file_uploads.id` | — |
| Status (system) | `statusLid` | `status_lid` | `int` | NOT NULL, auto-set to `INSURER_STATUS_ACTIVE` | `INSURER_STATUS` |
| Registration number *(KYC)* | `registrationNo` | `registration_no` | `varchar(50)` | nullable, stored uppercase | — |
| TIN number *(KYC)* | `tanNumber` | `tan_number` | `varchar(20)` | nullable, stored uppercase | — |
| PAN card number *(KYC)* | `panCardNumber` | `pan_card_no` | `varchar(20)` | nullable, stored uppercase, max 10 chars enforced in UI | — |
| — | `createdBy` / `updatedBy` | `created_by` / `updated_by` | `int` | system-managed | — |
| — | — | `created_at` / `updated_at` / `deleted_at` | `timestamp` | system-managed; `deleted_at` is soft-delete | — |

#### 11.3.2 GST details table (`state_gst_detail`)

One row per GST registration. GST is scoped to a branch address — each branch/HQ address owns its own GST rows. The link to the address is via `address_id`; `company_id` is a legacy field retained for backward compatibility.

| UI label | DTO field | DB column | Type | Constraints | Lookup group |
|---|---|---|---|---|---|
| State | `stateId` | `state_id` | `int` | FK → `state.id`; unique per address | — |
| GST number | `gstNumber` | `gst_number` | `varchar(15)` | globally unique, GSTIN format | — |
| Category | `gstCategoryLid` | `gst_category_lid` | `int` | FK → `look_up.id` | `TAX` |
| — | `addressId` | `address_id` | `int` | FK → `address.id`; links GST to branch address | — |
| — | `companyId` | `company_id` | `int` | legacy FK to insurer's company reference | — |
| — | — | `entity_type` | `varchar(50)` | default `'COMPANY'` | — |
| — | — | `created_by` / `updated_by` / `created_at` / `updated_at` / `deleted_at` | — | system-managed | — |

#### 11.3.3 Insurer-Address join table (`insurer_address`)

Links insurers to their address rows.

| Property | DB column | Type | Notes |
|---|---|---|---|
| `id` | `id` | int PK | — |
| `insurerId` | `insurer_id` | int | NOT NULL, FK → `insurer.id` |
| `addressId` | `address_id` | int | nullable, FK → `address.id` |
| `contactId` | `contact_id` | int | nullable, FK → `contact.id` |

#### 11.3.4 Address table (`address`)

Each address block creates one row in `address`. The insurer-to-address link is held in `insurer_address`.

| UI label | DTO field | DB column | Type | Constraints | Notes |
|---|---|---|---|---|---|
| Address type | `addressTypeLid` | `address_type_lid` | `int` | nullable, FK → `look_up.id` | — |
| Address line 1 | `address1` | `addr_1` | `varchar(200)` | NOT NULL | — |
| Address line 2 | `address2` | `addr_2` | `varchar(200)` | nullable | — |
| Area | `area` | `area` | `varchar(100)` | nullable | — |
| Pin code | `pinCode` | `pincode` | `varchar(20)` | nullable | — |
| Phone number | `phoneNumber` | `phone_number` | `varchar(20)` | NOT NULL | Shown in listing table |
| Alternate phone | `alternatePhoneNumber` | `alternate_phone_number` | `varchar(20)` | nullable | — |
| Email | `email` | `email` | `varchar(100)` | nullable | — |
| Support number | `supportNumber` | `support_number` | `varchar(20)` | nullable | — |
| Branch type | `branchTypeLid` | `branch_type_lid` | `int` | nullable, FK → `look_up.id` | `INSURER_BRANCH_TYPE`; shown in listing + detail |
| Branch code | `branchCode` | `branch_code` | `varchar(100)` | nullable | Searchable via smart search |
| Branch name | `branchName` | `branch_name` | `varchar(200)` | nullable | Shown in Branch hierarchy section |
| Parent branch | `parentBranchId` | `parent_branch_id` | `int` | nullable, FK → `address.id` | Column exists in entity; dropdown UI pending (BR-015–017) |
| *(pending)* Branch display name | `branchDisplayName` | `branch_display_name` | `varchar(500)` | NOT EXISTS as `@Column` in entity — DTO already declares it | Computed or stored (TRD decision); BR-014 |
| Country | `countryId` | `country_id` | `int` | FK → `country.id` (eager-loaded) | — |
| State | `stateId` | `state_id` | `int` | FK → `state.id` (eager-loaded) | — |
| City | `cityId` | `city_id` | `int` | FK → `city.id` (eager-loaded) | Shown in listing table |
| — | — | `created_by` / `updated_by` / `created_at` / `updated_at` / `deleted_at` | — | system-managed | — |
