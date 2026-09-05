# Won & Lost Opportunity — PRD

**Module:** IIRM-797_Opty-Management  
**Sub-PRD:** 03 — Won & Lost  
**Parent:** [prd-00-overview.md](prd-00-overview.md)  
**Related:** [prd-02-stage-activities.md](prd-02-stage-activities.md) · [prd-04-policy-creation.md](prd-04-policy-creation.md)

---

## 1. Overview

Every opportunity reaches a terminal state: **Won**, **Lost**, or **Auto-Closed**.

- **Won** — triggered when the Placement Slip activity (Activity 10) is approved. The policy is created atomically in the same transaction.
- **Lost** — manually triggered by a BD Executive at any stage. Records a reason, notifies stakeholders, and auto-creates a Renewal Opportunity.
- **Auto-Close** — scheduler-triggered when the expiry date passes with no activity.

These are the only three states from which an opportunity cannot return to `OPEN` or `WORK_IN_PROGRESS`.

> Policy creation is covered in full at → [prd-04-policy-creation.md](prd-04-policy-creation.md)

---

## 2. User Stories

### Won

**US-OPTY-020** — As a BD Executive, I want the system to automatically mark the opportunity as Won when I submit and the Placement Slip is approved, so that the deal shows as closed-won in the pipeline without a separate manual action.

**US-OPTY-021** — As a BD Executive, I want all header-level data and all premium/brokerage/insurer data captured across the pipeline to be carried through to the Policy record at the point of Won, so that the Policy team has no gaps to fill.

### Lost

**US-OPTY-030** — As a BD Executive, I want to mark an opportunity as Lost at any pipeline stage by selecting a reason and entering remarks, so that the loss is documented and the pipeline is accurate.

**US-OPTY-031** — As the System, I want to automatically create a Renewal Opportunity when an SO is marked Lost, so that the renewal cycle is not broken.

**US-OPTY-032** — As an ISG Owner, I want to update the reason for loss or remarks after an opportunity is already marked Lost, so that post-mortem analysis is accurate.

---

## 3. Won Rules

**BR-OPTY-WON-001 — Trigger**  
The opportunity transitions to `OPPORTUNITY_STATUS_WON` **when and only when** the Placement Slip activity (Activity 10) is approved (`isApproved = true`). This is not a manual action — it is a system consequence of the approval. The transition and policy creation happen in a single database transaction (`opportunity.repository.ts → updatePlacementSlipData()`).

**BR-OPTY-WON-002 — Atomicity**  
If policy creation fails for any reason, the transaction rolls back. The opportunity remains in `WORK_IN_PROGRESS`; the placement slip approval does not persist. No partial Won state is possible.

**BR-OPTY-WON-003 — Immutability**  
A Won opportunity is immutable at the header level. No fields on the `opportunity` record may be updated after `status_lid = WON`. The UI must lock the header form. Attempting an update via `PUT /opportunity/:opportunityId` on a WON record is blocked.

**BR-OPTY-WON-004 — Bulk operations excluded**  
Won opportunities are excluded from bulk-edit (`POST /opportunity/bulk-update`). Attempting to include them returns error code `OPPORTUNITY_WON` (line 12485 of `opportunity.service.ts`).

**BR-OPTY-WON-005 — Post-WON activities continue**  
Activities 11–16 (Premium Calculation, Held Cover Note, Policy Hard Copy, Policy Docket, Hand Over Meet, Policy Confirmation) continue after Won. These are servicing activities; they record delivery and handover data against the already-created policy. They do not change the Won status.

**BR-OPTY-WON-006 — Policy status on creation**  
The created policy carries `policy_status_lid = POLICY_STATUS_MIG_GENERATED` (not yet Active). Policy activation is downstream of the opportunity pipeline.

---

## 4. Won — Data Carried to Policy

The placement slip drives policy creation. The opportunity header fills remaining fields. See the full mapping at [prd-04-policy-creation.md](prd-04-policy-creation.md).

Summary of what must be in the Placement Slip for policy creation to succeed:

| Group | Fields |
|---|---|
| Dates | `policyFromDate`, `policyToDate` |
| Premium | `basicPremium`, `netPremium`, `grossPremium`, `gstPercentage`, `gstAmount` |
| Brokerage | `basicBrokeragePercentage`, `basicBrokerageAmount`, `tcBrokerageAmount`, `totalBrokerageAmount` |
| Charges | `terrorism`, `srccAmount`, `srccBrokerageAmount`, `cessAmount`, `adminCharges`, `fee`, `other` |
| Coverage | `sumInsured` |
| Insurer | `leadInsurerId`, `insurerDetails` (share %, brokerage per insurer) |
| TPA | `tpaDetails` (if applicable) |
| Covers | `placementSlipCoverDetails` |
| Instalments | `installmentDetails` (if `isPremiumInstallmentBased = 1`) |

---

## 5. Lost Rules

**BR-OPTY-LOST-001 — Stage independence**  
An opportunity can be marked Lost at **any stage** — including Stage 1 (BD Planning). Loss is not gate-blocked by activity completion status.

**BR-OPTY-LOST-002 — Required data for Lost**  
Marking an opportunity Lost creates an `opportunity_lost` record. Fields:

| Field | DB Column | Required | Rule |
|---|---|---|---|
| Opportunity ID | `opportunity_id` | Yes | FK to parent opportunity |
| Reason for Loss | `reason_for_loss_lid` | No | Strongly recommended; drives loss analytics |
| Remarks | `remarks` | No | Free text explanation |
| Status | `status_lid` | Yes | Status of the loss record (from LookUp) |
| Injected By | `injected_by` | No | Source system if triggered externally |

**BR-OPTY-LOST-003 — Auto-RO on SO loss**  
When an SO is marked Lost, `createRenewalOpportunity()` is called automatically. This creates a new RO linked to the same company and policy to ensure the renewal cycle is not missed.

**BR-OPTY-LOST-004 — State lock**  
A Lost opportunity is not editable at the header level. Only the `opportunity_lost` record itself can be updated via `PUT /opportunity/opportunity-lost/:opportunityId`. Updatable fields: `reason_for_loss_lid`, `remarks`, `status_lid`.

**BR-OPTY-LOST-005 — No re-open**  
A Lost opportunity cannot transition back to `OPEN` or `WORK_IN_PROGRESS`. The only allowed action after loss is updating the lost record (§ above).

**BR-OPTY-LOST-006 — Pipeline visibility**  
Lost opportunities remain visible in the list view under status filter `LOST`. They contribute to loss-rate analytics. They are not physically deleted.

**BR-OPTY-LOST-007 — Notification**  
Marking an opportunity Lost fires `NOTIFICATION_EVENT_TYPES.OPPORTUNITY_LOST` with the client URL. AM and Owner receive the notification.

---

## 6. Auto-Close Rules

**BR-OPTY-AUTOCLOSE-001**  
The scheduler sets `status_lid = OPPORTUNITY_STATUS_AUTO_CLOSE` when `expiry_date < today` and `status_lid ∈ (OPEN, WORK_IN_PROGRESS)`. The exact scheduler trigger condition must be confirmed (see OQ-007 in [prd-00-overview.md](prd-00-overview.md)).

**BR-OPTY-AUTOCLOSE-002**  
Auto-closed opportunities are treated the same as Lost for pipeline reporting. They are visible with status filter `AUTO_CLOSE`.

---

## 7. Acceptance Criteria

**AC-OPTY-WON-001**
- Given a BD Executive approves the Placement Slip activity for an in-progress opportunity
- When `isApproved = true` is submitted
- Then `opportunity.status_lid` transitions to `OPPORTUNITY_STATUS_WON`, a new policy record is created with `policy_status_lid = POLICY_STATUS_MIG_GENERATED`, and the opportunity header becomes locked (non-editable)

**AC-OPTY-WON-002**
- Given the policy creation step fails during Placement Slip approval (e.g., DB error)
- When the transaction fails
- Then `opportunity.status_lid` remains `WORK_IN_PROGRESS`, the placement slip approval does not persist, and an error is returned to the caller

**AC-OPTY-WON-003**
- Given a Won opportunity
- When `PUT /opportunity/:opportunityId` is called with any header field update
- Then the request is rejected with an appropriate error

**AC-OPTY-WON-004**
- Given a Won opportunity is included in a bulk-update request
- When `POST /opportunity/bulk-update` is submitted
- Then the Won opportunity is excluded and the response includes error code `OPPORTUNITY_WON`

**AC-OPTY-LOST-001**
- Given a BD Executive marks an opportunity Lost with `statusLid` provided
- When `POST /opportunity/opportunity-lost` is submitted
- Then an `opportunity_lost` record is created, a notification fires, and for an SO, a new RO is auto-created

**AC-OPTY-LOST-002**
- Given an opportunity is already Lost
- When `PUT /opportunity/opportunity-lost/:opportunityId` is called with a new `reasonForLossLid`
- Then the `opportunity_lost` record is updated and the change is reflected in the UI

**AC-OPTY-LOST-003**
- Given a Lost opportunity
- When any attempt is made to update header fields via `PUT /opportunity/:opportunityId`
- Then the request is blocked

---

## 8. Won/Lost Endpoints

| Operation | Endpoint | Notes |
|---|---|---|
| **TRIGGER WON** | `PUT /opportunity/:opportunityActivityId/activity-approval` with `isApproved = true` on Placement Slip | Atomic: policy creation + WON transition |
| **CREATE Lost** | `POST /opportunity/opportunity-lost` | Creates `opportunity_lost` record + fires notification + auto-RO |
| **UPDATE Lost** | `PUT /opportunity/opportunity-lost/:opportunityId` | Updates reason, remarks, statusLid only |
| **READ Brokerage** | `GET /opportunity/:opportunityId/brokerage` | Brokerage summary at any stage |
