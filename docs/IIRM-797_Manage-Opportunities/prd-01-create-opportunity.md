# Create Opportunity — PRD

**Module:** IIRM-797_Opty-Management  
**Sub-PRD:** 01 — Create Opportunity  
**Parent:** [prd-00-overview.md](prd-00-overview.md)  
**Related:** [prd-02-stage-activities.md](prd-02-stage-activities.md) · [prd-03-won-lost.md](prd-03-won-lost.md) · [prd-04-policy-creation.md](prd-04-policy-creation.md)

---

## 1. Overview

Creating an Opportunity is the entry point into the pipeline. There are two creation paths:

1. **Manual (SO)** — A BD Executive fills the Create Opportunity form to capture a new sales deal.
2. **System-triggered (RO)** — The nightly scheduler detects a policy expiring within 365 days and auto-creates a Renewal Opportunity, pre-populated from the source policy.

Both paths produce an `opportunity` record with an identical schema. The `opportunityTypeLid` field distinguishes SO from RO.

---

## 2. User Stories

**US-OPTY-001** — As a BD Executive, I want to create a Sales Opportunity (SO) by selecting the client company, policy type, service level, expiry date, contacts, and risk locations so that the deal enters the pipeline and is tracked.

**US-OPTY-002** — As a BD Executive, I want the system to block submission if required fields are missing or the expiry date is not in the future, so that incomplete deals never enter the pipeline.

**US-OPTY-003** — As the System Scheduler, I want to automatically create a Renewal Opportunity (RO) for every SBU-enabled policy expiring within the next 365 days so that the renewal team has sufficient lead time before policy lapse.

**US-OPTY-004** — As a BD Executive, I want to extend the expiry date on an existing opportunity when a client's policy term is extended, so that the pipeline reflects the correct renewal timeline.

**US-OPTY-005** — As a BD Executive, I want to delete an opportunity (soft-delete) when a deal was entered in error, so that it no longer clutters the pipeline.

---

## 3. Opportunity Header Fields

All fields map to the `opportunity` table. Source entity: `opportunity.entity.ts`.

| Field | DB Column | Type | Required | Business Rule |
|---|---|---|---|---|
| Opportunity ID | `opportunity_id` | int (PK) | Auto | System-generated; never editable after creation |
| Company | `company_id` | int (FK → Company) | **Yes** | Must be an active company. Drives contact and cover lookup in child forms |
| Policy Type | `policy_type_lid` | int (FK → LookUp) | **Yes** | Determines the stage-activity template applied (`mstr_stage_activity_template.policy_type_lid`). Cannot change after first activity is completed |
| Policy Status | `policy_status_lid` | int (FK → LookUp) | **Yes** | Current status of the underlying policy (e.g., Inforce, Lapsed) |
| Service Level | `service_level_lid` | int (FK → LookUp) | **Yes** | Agreed servicing tier for this client relationship |
| Expiry Date | `expiry_date` | date | **Yes** | Must be strictly in the future on creation (YYYY-MM-DD). Extend-expiry endpoint allows future updates |
| Premium Paid | `premium_paid` | float | **Yes** | Current / estimated gross premium. For RO: auto-set from `policy.grossPremium` |
| Is Policy Mined | `is_policy_mined_lid` | int (FK → LookUp) | **Yes** | Whether policy data was mined/sourced. For RO: auto-set to `MINED_POLICY` |
| Risk Locations | `opportunity_risk_locations` (rel) | array | **Yes** | At least one risk location required on creation. Zero-element array is rejected |
| Contacts | `opportunity_contact_map` (rel) | array | **Yes** | At least one contact required on creation |
| Opportunity Type | `opportunity_type_lid` | int (FK → LookUp) | Auto | System-sets to SO on manual create; RO on scheduler create |
| Status | `status_lid` | int (FK → LookUp) | Auto | System-managed. Initial value: `OPPORTUNITY_STATUS_OPEN` |
| Estimated Brokerage | `estimated_brokerage` | float | No | Optional. Can be computed from `premium_paid × estimated_brokerage_percentage` |
| Estimated Brokerage % | `estimated_brokerage_percentage` | float | No | Optional. No DB-enforced max, but should not exceed 100 |
| Sum Insured | `sum_insured` | float | No | Cover amount |
| Estimated Fee | `estimated_fee` | float | No | Advisory fee, separate from brokerage |
| Source | `source` | varchar(255) | No | How the opportunity was sourced. Free text, max 255 chars |
| Source Type | `opportunity_source_type_lid` | int (FK → LookUp) | No | Categorised source |
| Sales Pitch | `sales_pitch` | text | No | Free-text pitch narrative |
| Owner | `owner_id` | int (FK → User) | Auto | Set to creating user by default. Reassignable by admin |
| AM | `am_id` | int (FK → User) | No | Account Manager |
| ISG | `isg_id` | int (FK → User) | No | ISG Owner. Required before the ISG Planning stage can be approved |
| Ref Policy | `ref_policy_id` | int (FK → Policy) | No | For RO only: the expiring policy this renewal tracks. Auto-set by scheduler |
| Ref Opportunity | `ref_opportunity_id` | int (FK → Opportunity) | No | Links a new SO to a prior related/lost opportunity |
| Organisation | `organisation_id` | int (nullable) | No | For RO: carried from source policy. For SO: set manually or inherited |
| SBU | `sbu_id` | int (nullable) | No | Carried from source policy for RO |
| Vertical | `vertical_id` | int (nullable) | No | Carried from source policy for RO |
| Department | `department_id` | int (nullable) | No | Carried from source policy for RO |
| Branch | `branch_id` | int (nullable) | No | Carried from source policy for RO |
| Performance Flag | `enabled_for_performance_lid` | int | Auto | Default `9401`. Contributes to performance dashboards. Not user-editable without PTL approval |
| Unique Ref Key | `unique_ref_key` | varchar(35) | Auto | System-generated reference key |

---

## 4. Business Rules — Create

**BR-OPTY-001** — `expiry_date` must be strictly greater than today on creation. Updating to a past date via the extend-expiry endpoint is also blocked.

**BR-OPTY-002** — `policy_type_lid` determines the full activity template (stages × activities × ordering) for this opportunity. It cannot be changed once the first activity is completed.

**BR-OPTY-003** — At least one `riskLocations` entry and one `contacts` entry must be supplied on creation. Empty arrays are rejected with a validation error.

**BR-OPTY-004 (RO-specific)** — For system-created Renewal Opportunities, the scheduler sets the following fields automatically from the source policy:
- `ref_policy_id` → source policy ID
- `premium_paid` → `policy.grossPremium`
- `sum_insured` → `policy.sumInsured`
- `expiry_date` → `policy.policyTo`
- `estimated_brokerage` → `policy.basicBrokerageAmount`
- `estimated_brokerage_percentage` → `policy.basicBrokeragePercentage`
- `organisation_id`, `sbu_id`, `vertical_id`, `department_id`, `branch_id` → carried from source policy
- `is_policy_mined_lid` → set to `MINED_POLICY` lookup value
- `opportunity_type_lid` → set to `RO` lookup value
- `owner_id` → `policy.ownerId` (fallback to `policy.createdBy`)
- `injected_by` → `"SYSTEM"`

**BR-OPTY-005** — `estimated_brokerage_percentage` and `estimated_brokerage` are both optional at creation. If only the percentage is supplied, the system may compute the amount when premium is known. Neither independently blocks save.

**BR-OPTY-006** — `enabled_for_performance_lid` defaults to `9401` on creation and contributes to performance dashboards. It must not be modified by the UI without PTL approval.

**BR-OPTY-007 (RO dedup)** — The scheduler skips RO creation if an RO with `ref_policy_id = policy.id` already exists in the `opportunity` table. One active RO per policy at a time.

**BR-OPTY-008 (SBU scoping for RO)** — The scheduler only creates ROs for SBUs where `org_sbu.is_ro_generation_enabled = true`. Policies with `sbu_id = NULL` are excluded. Suppression rules in `sbu_ro_policy_type_suppression` can additionally exclude specific policy types per SBU.

---

## 5. Acceptance Criteria — Create

**AC-OPTY-001**
- Given a BD Executive submits the Create Opportunity form with all required fields valid and `expiry_date` in the future
- When the form is submitted
- Then an opportunity record is created with `status_lid = OPPORTUNITY_STATUS_OPEN` and the user is redirected to the opportunity detail page

**AC-OPTY-002**
- Given a BD Executive submits the form with `expiry_date` set to today or a past date
- When submitted
- Then the system rejects the request with a validation error: "Expiry date must be in the future"

**AC-OPTY-003**
- Given the Create form has zero `riskLocations` or zero `contacts`
- When submitted
- Then the system rejects with a validation error on the missing array

**AC-OPTY-004 (RO)**
- Given the nightly scheduler runs and finds a policy expiring within 365 days for an SBU with `is_ro_generation_enabled = true` and no existing RO
- When the scheduler creates the RO
- Then the opportunity record contains `ref_policy_id`, all five org-context fields, and `injected_by = "SYSTEM"`, and `opportunity_type_lid` resolves to `RO`

**AC-OPTY-005 (Extend Expiry)**
- Given an open opportunity exists
- When a user calls PUT `/opportunity/extend-expiry/:opportunityId` with a future date
- Then `expiry_date` is updated successfully

**AC-OPTY-006 (Delete)**
- Given an opportunity in `OPEN` or `WORK_IN_PROGRESS` status
- When DELETE `/opportunity/:opportunityId` is called
- Then the record is soft-deleted (`deleted_at` populated); it no longer appears in active lists

---

## 6. CRUD Endpoints — Create / Read / Update / Delete

| Operation | Endpoint | Notes |
|---|---|---|
| **CREATE** Opportunity | `POST /opportunity` | Required fields: see §3 |
| **CREATE** RO (system) | `POST /opportunity/renewal-opportunity` | Called by scheduler; `optyType = RO`, `injectedBy = SYSTEM` |
| **READ** List | `GET /opportunity` | Filters, pagination, search |
| **READ** Detail | `GET /opportunity/:opportunityId` | Full record with relations |
| **READ** By Company | `GET /opportunity/company/:companyId` | All for a company |
| **READ** By Contact | `GET /opportunity/contact/:contactId` | All linked to a contact |
| **UPDATE** Header | `PUT /opportunity/:opportunityId` | WON opportunities blocked |
| **UPDATE** Extend Expiry | `PUT /opportunity/extend-expiry/:opportunityId` | Date-only update |
| **UPDATE** Bulk | `POST /opportunity/bulk-update` | WON excluded; error: `OPPORTUNITY_WON` |
| **DELETE** | `DELETE /opportunity/:opportunityId` | Soft-delete |
| **ASSIGN** Stage Owner | `POST /opportunity/assign-stage-owner` | Per-stage owner |
| **READ** Stage Owners | `GET /opportunity/:opportunityId/stage-owners` | Per-stage assignments |
| **READ** Documents | `GET /opportunity/:opportunityId/documents` | Uploaded docs |

---

## 7. Open Questions

| # | Question | Owner |
|---|---|---|
| OQ-CREATE-001 | Is `isg_id` set at creation time, or only when the opportunity reaches Stage 2 (ISG Planning)? | Ramarao / IIRM |
| OQ-CREATE-002 | Can a BD Executive create an opportunity for a company they do not own? What RBAC rule applies? | Tharun (TL) |
