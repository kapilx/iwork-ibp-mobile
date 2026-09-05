# Policy Creation from Won Opportunity — PRD

**Module:** IIRM-797_Opty-Management  
**Sub-PRD:** 04 — Policy Creation  
**Parent:** [prd-00-overview.md](prd-00-overview.md)  
**Related:** [prd-02-stage-activities.md](prd-02-stage-activities.md) · [prd-03-won-lost.md](prd-03-won-lost.md)

---

## 1. Overview

Policy creation is not a separate user action. It is a **system consequence of approving the Placement Slip activity (Activity 10)**. The moment a user clicks "Approve" on the Placement Slip, the opportunity service runs `createPolicyWithDetails()` inside a database transaction that:

1. Reads data from the Placement Slip activity record, the opportunity header, and the owning user
2. Writes the `policy` record with all premium, brokerage, and insurer data
3. Writes 6 related tables (`PolicyParticipantMap`, `PolicyRiskLocationMap`, `PolicyTpaMap`, `PolicyInsurerMap`, `PolicyCoverMap`, `PolicyInstallments`)
4. Updates `opportunity.status_lid` to `OPPORTUNITY_STATUS_WON`

All steps are wrapped in a single `EntityManager` transaction. If any step fails, the entire transaction rolls back.

**Source method:** `opportunity.repository.ts → updatePlacementSlipData()` (line 13402)  
**Policy creation method:** `opportunity.repository.ts → createPolicyWithDetails()` (line 7918)

---

## 2. Trigger Condition

| Condition | Value |
|---|---|
| Activity | Activity 10 — Placement Slip Generation |
| Trigger | `isApproved = true` submitted to `PUT /opportunity/:opportunityActivityId/activity-approval` |
| Guard | No policy must already exist for this opportunity (`policy.opportunity_id = this opportunityId`) |
| Transaction | Atomic — policy creation + WON transition together |

If a policy already exists for this opportunity, the system skips policy creation and does not error. This guard prevents duplicate policies if the approval endpoint is called more than once.

---

## 3. Policy Field Mapping

The table below maps every field written to the `policy` record. Source column notation: `opp.` = opportunity header; `slip.` = placement slip activity data.

### 3.1 From Opportunity Header (`opportunity` table)

| Policy Field | Source | Value / Expression |
|---|---|---|
| `policy_name` | `opp.policyType.lookUpValue` | The LookUp display name of the policy type |
| `policy_type_lid` | `opp.policyTypeLid` | Direct copy |
| `opportunity_id` | `opp.opportunityId` | FK linking policy back to opportunity |
| `company_id` | `opp.companyId` | Direct copy |
| `country_id` | `opp.company.countryId` | Resolved from company relation |
| `owner_id` | `opp.ownerId` (fallback: `userId`) | Opportunity owner; falls back to creating user |
| `am_id` | `opp.amId` (fallback: `opp.company.accountManager`) | Account Manager |
| `isg_id` | `opp.isgId` | ISG Owner |
| `service_level_lid` | `opp.serviceLevelLid` | Direct copy |
| `opportunity_type` | `opp.opportunityType.lookUpKey` | `"SO"` or `"RO"` (max 2 chars) |
| `is_policy_mined_lid` | `opp.isPolicyMinedLid` | Direct copy |
| `nature_of_bussiness_lid` | `INSURENCE_ONLY` lookup | Fixed — all pipeline-created policies are insurance-only |
| `created_by` / `updated_by` | `opp.ownerId` (fallback: `userId`) | Audit fields |
| `created_at` / `updated_at` | Current timestamp | System-set |

### 3.2 From Placement Slip Activity (`opportunity_placement_slip_generation`)

| Policy Field | Source Field on Slip | Notes |
|---|---|---|
| `policy_from` | `slip.policyDetails.policyFromDate` | Policy effective date |
| `policy_to` | `slip.policyDetails.policyToDate` | Policy end date |
| `sum_insured` | `slip.policyDetails.sumInsured` | Confirmed cover amount |
| `premium_at_inception` | `slip.policyDetails.basicPremium` | Base premium at policy start |
| `basic_premium` | `slip.policyDetails.basicPremium` | Also stored separately |
| `net_premium` | `slip.policyDetails.netPremium` | Net premium |
| `gross_premium` | `slip.policyDetails.grossPremium` | Total premium |
| `gst_percentage` | `slip.policyDetails.gstPercentage` | GST % |
| `gst` | `slip.policyDetails.gstPercentage` | GST amount (note: stored in both `gst` and `gst_amount`) |
| `gst_amount` | `slip.policyDetails.gstAmount` | GST amount |
| `basic_brokerage_percentage` | `slip.policyDetails.basicBrokeragePercentage` | Brokerage % |
| `basic_brokerage_amount` | `slip.policyDetails.basicBrokerageAmount` | Brokerage amount |
| `tc_brokerage_amount` | `slip.policyDetails.tcBrokerageAmount` | TC brokerage |
| `total_brokerage_amount` | `slip.policyDetails.totalBrokerageAmount` | Total brokerage |
| `terrorism_amount` | `slip.policyDetails.terrorism` | Terrorism premium |
| `terrorism_brokerage_percentage` | `slip.policyDetails.terrorismBrokeragePercentage` | Terrorism brokerage % |
| `commission_terrorism` | `slip.policyDetails.terrorismBrokeragePercentage` | Same value, stored in two fields |
| `srcc_percentage` | `slip.policyDetails.srccPercentage` | SRCC % |
| `srcc_amount` | `slip.policyDetails.srccAmount` | SRCC amount |
| `srcc_brokerage_amount` | `slip.policyDetails.srccBrokerageAmount` | SRCC brokerage |
| `admin_charges_percentage` | `slip.policyDetails.adminChargesPercentage` | Admin charges % |
| `admin_charges` | `slip.policyDetails.adminCharges` | Admin charges |
| `cess_percentage` | `slip.policyDetails.cessPercentage` | Cess % |
| `cess_amount` | `slip.policyDetails.cessAmount` | Cess amount |
| `fee_percentage` | `slip.policyDetails.feePercentage` | Fee % |
| `fee_amount` | `slip.policyDetails.fee` | Fee amount |
| `other_percentage` | `slip.policyDetails.otherPercentage` | Other charges % |
| `other_amount` | `slip.policyDetails.other` | Other charges |
| `share_percentage` | `slip.insurerDetails[0].sharePercentage` | Lead insurer's share % |

### 3.3 From Owning User (`user` record)

| Policy Field | Source | Notes |
|---|---|---|
| `organisation_id` | `user.organisationId` | User's org at time of policy creation |
| `sbu_id` | `user.sbuId` | User's SBU |
| `vertical_id` | `user.verticalId` | User's vertical |
| `department_id` | `user.departmentId` | User's department |
| `branch_id` | `user.branchId` | User's branch |

### 3.4 System-Generated Fields

| Policy Field | Value | Notes |
|---|---|---|
| `provisional_policy_no` | Generated as `"IIRM-00000001"` format | Sequential number, padded to 8 digits |
| `unique_ref_key` | System-generated, appended with policy ID | Unique reference key |
| `date_of_income` | Current date | Set at creation |
| `income_month` | First day of current month | `YYYY-MM-01` |
| `date_of_income_from_iwork` | Current date | Iwork income date |
| `policy_status_lid` | `POLICY_STATUS_MIG_GENERATED` | Initial status — not yet Active |
| `deal_confirmed_lid` | `TOGGLE_TYPE_YES` | Confirms deal is confirmed |
| `policy_group_type_lid` | `POLICY_GROUP_IIRM` | Identifies as IIRM-originated policy |

---

## 4. Related Tables Written at Policy Creation

All six tables are populated in the same transaction as the `policy` record.

### 4.1 PolicyParticipantMap
- Source: Opportunity owner (BD Executive), AM, ISG, and any participants from `opportunity_activity_participants`
- Creates user-to-policy cross-reference entries with their roles

### 4.2 PolicyRiskLocationMap
- Source: `opportunity.opportunityRiskLocations`
- Each risk location on the opportunity is mirrored to the policy

### 4.3 PolicyTpaMap
- Source: `slip.tpaDetails` (TPA assignments on the placement slip)
- Maps TPA ID, TPA branch, and TPA contact to the policy

### 4.4 PolicyInsurerMap
- Source: `slip.insurerDetails`
- Captures insurer participation type, insurer ID, branch, contact, share %, and brokerage amounts per insurer
- Handles co-insurance scenarios (multiple insurer rows)

### 4.5 PolicyCoverMap
- Source: `OpportunityPlacementSlipCoverDetail` (cover details on the placement slip)
- Maps cover templates from the opportunity pipeline to the policy

### 4.6 PolicyInstallments
- Source: `slip.installmentDetails`
- Only populated if `isPremiumInstallmentBased = 1` on the placement slip
- Normalised with net/gross amounts and tax details per instalment

---

## 5. Business Rules — Policy Creation

**BR-OPTY-POL-001 — Single policy per opportunity**  
The system checks `policy.opportunity_id = opportunityId` before creating. If a policy already exists, creation is skipped silently. No duplicate policies are created.

**BR-OPTY-POL-002 — Placement Slip is the source of truth**  
All financial fields on the policy (premium, brokerage, charges, insurer share) come from the Placement Slip. Values from Final Negotiation or earlier activities are not re-read at policy creation time.

**BR-OPTY-POL-003 — Org context from user, not opportunity**  
`organisation_id`, `sbu_id`, `vertical_id`, `department_id`, `branch_id` on the policy come from the **owning user's profile** at the time of policy creation — not from the opportunity header. For RO, these are typically the same since the scheduler sets them from the policy owner.

**BR-OPTY-POL-004 — Initial policy status**  
Policy is created with `policy_status_lid = POLICY_STATUS_MIG_GENERATED`. Transitioning to an Active status is a downstream action by the Policy Service, outside the opportunity pipeline.

**BR-OPTY-POL-005 — Provisional policy number**  
`provisional_policy_no` is system-generated at creation (`"IIRM-NNNNNNNN"` format). The final insurer policy number comes from Activity 13 (Policy Hard Copy Receipt), where `insurer_policy_no` is recorded. These are two different fields.

**BR-OPTY-POL-006 — Transaction rollback**  
Any failure in writing `policy`, `PolicyParticipantMap`, `PolicyRiskLocationMap`, `PolicyTpaMap`, `PolicyInsurerMap`, `PolicyCoverMap`, or `PolicyInstallments` causes a full rollback. The Placement Slip approval does not persist. The opportunity remains `WORK_IN_PROGRESS`.

**BR-OPTY-POL-007 — No direct policy service call**  
The opportunity service does NOT call the Policy Service API. It writes directly to the `policy` table via its own repository (`opportunity.repository.ts`). The Policy Service owns all subsequent policy lifecycle actions.

---

## 6. Fields NOT Populated at Creation (Post-WON)

These fields are populated by later activities or by the Policy Service after creation:

| Field | Set By | When |
|---|---|---|
| `insurer_policy_number` | Activity 13 (Policy Hard Copy) | After hard copy is received |
| `premium_collected` | Policy Service | After premium payment |
| `brokerage_collected` | Policy Service | After brokerage receipt |
| `rcon_status` / `rcon_brokerage` / `rcon_outcome` | Policy Service | Post-placement |
| `pending_brokerage` | Policy Service | Derived |
| `policy_details_status_lid` | Policy Service approval flow | After policy details verified |
| `policy_covers_status_lid` | Policy Service approval flow | After covers verified |
| `policy_cd_status_lid` | Policy Service approval flow | After CD verified |
| `income_type_lid` | Policy Service | Income classification |
| `financial_year` | Policy Service | Derived from `policy_from` |

---

## 7. Open Questions

| # | Question | Owner |
|---|---|---|
| OQ-POL-001 | Do Activities 11–16 (post-WON servicing) update any fields on the `policy` record? For example, does Activity 16 (Policy Confirmation) update `policy_status_lid`? | Tharun (TL) |
| OQ-POL-002 | `gst` and `gst_amount` are both written from `gstPercentage` (the same source). Is this intentional, or is one of them supposed to be the computed amount (`basicPremium × gstPercentage / 100`)? | Tharun (TL) |
| OQ-POL-003 | When RO is Won, the org-context fields come from the owning user. But for RO, those were originally set from the source policy. Confirm: are these always identical, or can they diverge? | Ramarao / IIRM |
