# Stage Activity Pipeline — PRD

**Module:** IIRM-797_Opty-Management  
**Sub-PRD:** 02 — Stage Activity Pipeline  
**Parent:** [prd-00-overview.md](prd-00-overview.md)  
**Related:** [prd-01-create-opportunity.md](prd-01-create-opportunity.md) · [prd-03-won-lost.md](prd-03-won-lost.md) · [prd-04-policy-creation.md](prd-04-policy-creation.md)

---

## 1. Overview

Once an Opportunity is created, it progresses through a **6-stage, 16-activity pipeline**. The pipeline is configured in `mstr_stage_activity_template`, keyed by `(policy_type_lid, stage_id, activity_id)`. The `stageActivityOrder` governs sequencing within a stage.

> **Critical:** Activity 10 (Placement Slip Generation) — when **approved** — triggers policy creation and transitions the opportunity to `WON`.  
> Activities 11–16 are post-placement servicing activities that run after the policy already exists.  
> See → [prd-04-policy-creation.md](prd-04-policy-creation.md) for the full field mapping.

SO and RO follow identical stages. Activity display names differ in early stages:

| Activity | SO name | RO name |
|---|---|---|
| Activity 1 | Data Validation | RSR Creation |
| Activity 2 | KDM Meeting | Renewal KDM Meeting |
| Activity 3 | Mandate Details Entry | Renewal Mandate Details Entry |
| Activity 4 | RFP Data Collection | Renewal RFP Data Collection |
| Activity 5 | RFP Details Entry | Renewal RFP Details Entry |
| Activities 6–16 | Same name for both | Same name for both |

---

## 2. Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1 — BD Planning                                          │
│    Activity 1 : Data Validation / RSR Creation                  │
│    Activity 2 : KDM Meeting / Renewal KDM Meeting               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Stage 2 — ISG Planning   [approval gate]                       │
│    Activity 3 : Mandate Details Entry                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Stage 3 — RFP Mandate                                          │
│    Activity 4 : RFP Data Collection                             │
│    Activity 5 : RFP Details Entry                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Stage 4 — Negotiations                                         │
│    Activity 6 : Broking Slip Generation                         │
│    Activity 7 : Enter Quote                                     │
│    Activity 8 : QCR Generation                                  │
│    Activity 9 : Meeting for Final Negotiation                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Stage 5 — Placement                                            │
│    Activity 10: Placement Slip Generation ◄── POLICY CREATED    │
│    Activity 11: Premium Calculation          on approval        │
│    Activity 12: Held Cover Note                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │  (Opportunity is WON from here)
┌──────────────────────────────▼──────────────────────────────────┐
│  Stage 6 — Policy Servicing (post-WON)                         │
│    Activity 13: Policy Hard Copy Receipt                        │
│    Activity 14: Policy Docket                                   │
│    Activity 15: Hand Over Meet                                  │
│    Activity 16: Policy Confirmation                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. User Stories — Stage Management

**US-OPTY-010** — As a BD Executive, I want a filterable list of my opportunities with status, current stage, company, policy type, and expiry date, so that I can prioritise work.

**US-OPTY-011** — As a BD Executive, I want to open an Opportunity detail page and see all stages, each activity with completion status, and overall opportunity status, so that I know exactly where a deal stands.

**US-OPTY-012** — As a BD Executive, I want to save partial activity form data as a draft without completing the stage, so that I do not lose progress between work sessions.

**US-OPTY-013** — As a BD Executive, I want to complete each activity by filling all mandatory fields and submitting, so that the opportunity advances to the next activity.

**US-OPTY-014** — As an ISG Owner, I want activities marked `approval = Y` to enter a "Submitted" state until I approve or reject them, so that no stage advances without sign-off.

**US-OPTY-015** — As a BD Executive, I want to assign a stage owner per stage so that accountability is clear.

---

## 4. Stage-Level Business Rules

**BR-OPTY-010** — Activities within a stage execute in `stageActivityOrder` sequence. An activity cannot be started until all mandatory activities with a lower `stageActivityOrder` in the same stage are `CLOSED` or `APPROVED`.

**BR-OPTY-011** — An activity marked `mandatory = Y` blocks stage advancement. All mandatory activities must reach `CLOSED` or `APPROVED` before the next stage begins.

**BR-OPTY-012** — An activity marked `approval = Y` moves to `SUBMITTED` on save/completion. It requires ISG Owner action (approve → `APPROVED`; reject → `REJECTED`). A `REJECTED` activity must be re-submitted before the stage can advance. The `isg_id` field on the parent opportunity must be populated before approval activities can be actioned.

**BR-OPTY-013** — Form data for each activity is stored in both the corresponding `opportunity_*` table AND in the `activity_meta` JSONB column of `opportunity_activity_map`. The `activity_key` on `mstr_stage_activity_template` maps to the storage table via `ACTIVITY_NAME_TABLE_MAP`.

**BR-OPTY-014** — The draft save mechanism stores partial form data without enforcing mandatory-field validation. Format/type/range errors still block draft save. Completing an activity enforces all validations including mandatory fields. Draft is auto-deleted on successful activity completion.

**BR-OPTY-015** — `opportunity.status_lid` transitions from `OPEN` to `WORK_IN_PROGRESS` when the first activity is started, and from `WORK_IN_PROGRESS` to `WON` when the Placement Slip is approved (Activity 10). See [prd-03-won-lost.md](prd-03-won-lost.md).

---

## 5. Activity Status Values

Activities use `OPPORTUNITY_ACTIVITY_STATUS`:

| Status Key | Meaning |
|---|---|
| `OPPORTUNITY_ACTIVITY_STATUS_OPEN` | Created, not started |
| `OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS` | BD Executive working on it |
| `OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED` | Submitted for approval |
| `OPPORTUNITY_ACTIVITY_STATUS_CLOSED` | Completed (no approval required) |
| `OPPORTUNITY_ACTIVITY_STATUS_APPROVED` | Approved by ISG Owner |
| `OPPORTUNITY_ACTIVITY_STATUS_REJECTED` | Rejected; must be reworked |

---

## 6. Activity Field Rules

### Activity 1 — Data Validation (SO) / RSR Creation (RO)
**Table:** `data_validation`  
**Stage:** BD Planning  
**Key:** `data_validation_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| description | text | No | Notes on data quality / RSR summary |
| statusLid | int (FK) | Yes | Activity status |
| taskId | int (FK) | No | Linked task, if raised during validation |

**BR-OPTY-A01-001** — Entry activity. Opportunity cannot advance to Stage 2 until this activity is `CLOSED`.

**BR-OPTY-A01-002** — For RO, displayed as "RSR Creation". Field schema is identical; only the display name changes via `roActivityName` on `mstr_stage_activity_template`.

---

### Activity 2 — KDM Meeting / Renewal KDM Meeting
**Table:** `kdm_meeting`  
**Stage:** BD Planning  
**Key:** `kdm_meeting_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| meetingDate | date | Yes | Cannot be a past date on creation |
| startTime | timetz | Yes | Must precede `endTime` |
| endTime | timetz | Yes | Must be after `startTime` |
| kdmMeetingTypeLid | int (FK → LookUp) | No | Type of KDM meeting |
| locationTypeLid | int (FK → LookUp) | No | Physical / Virtual / Telephonic |
| meetingId | int (FK → Meeting) | No | Link to a pre-existing Meeting record |
| selectMeeting | int | No | Selected meeting slot reference |
| remarks | text | No | Free text |
| mom | text | No | Minutes of Meeting |
| statusLid | int (FK) | Yes | Activity status |

**BR-OPTY-A02-001** — `startTime` must be strictly before `endTime`.

**BR-OPTY-A02-002** — Either `meetingId` (link to existing) or `meetingDate + startTime + endTime` (new meeting) must be provided. Both are allowed; linked meeting takes precedence for calendar sync.

---

### Activity 3 — Mandate Details Entry
**Table:** `opportunity_mandate_details_entry`  
**Stage:** ISG Planning  
**Key:** `mandate_details_entry_activity`  
**Approval:** `approval = Y` — ISG Owner must approve before Stage 3 begins

| Field | Type | Required | Rule |
|---|---|---|---|
| activityDate | date | Yes | Defaults to today |
| planDate | date | No | Target date for mandate completion |
| mandateTypeLid | int (FK) | No | Exclusive / non-exclusive / etc. |
| validFrom | date | No | Mandate validity start |
| validTo | date | No | Mandate validity end |
| compensationPayable | numeric(21,4) | No | Brokerage / fee per mandate |
| compensationTypeLid | int (FK) | No | Percentage or flat |
| issuedOn | date | No | Date mandate was issued |
| remarks | text | No | Free text |
| statusLid | int (FK) | No | Activity status |
| contacts (rel) | array | No | Contacts who signed the mandate |
| documents (rel) | array | No | Mandate documents |

**BR-OPTY-A03-001** — If both `validFrom` and `validTo` are provided, `validFrom` must be ≤ `validTo`.

**BR-OPTY-A03-002** — `isg_id` on the parent opportunity must be set before this activity can be approved.

**BR-OPTY-A03-003** — Approval gate: ISG Owner must approve this activity. Rejection requires rework and re-submission before Stage 3 can begin.

---

### Activity 4 — RFP Data Collection
**Table:** `opportunity_rfp_cover_detail`  
**Stage:** RFP Mandate  
**Key:** `rfp_cover_detail_activity`

One row per insurance cover being sent to market.

| Field | Type | Required | Rule |
|---|---|---|---|
| coverMapId | int (FK → OpportunityCoverMap) | Yes | Cover must already exist on opportunity |
| policyTypeId | int (FK) | Yes | Policy type for this cover |
| coverName | varchar | Yes | Name of the insurance cover |
| coverResponse | varchar | Yes | Insurer's response or coverage status |

**BR-OPTY-A04-001** — At least one cover entry must exist in `opportunity_cover_map` before this activity can be started.

**BR-OPTY-A04-002** — Multiple rows allowed: one per cover being placed in the market.

---

### Activity 5 — RFP Details Entry
**Table:** `opportunity_rfp_details_entry`  
**Stage:** RFP Mandate  
**Key:** `rfp_details_entry_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| description | text | No | RFP summary |
| requirements | text | No | Client requirements |
| targetQcrDate | date | No | Expected QCR ready date; must not be in the past |
| multipleBrokersInvolved | int (0/1) | No | Competing brokers in market |
| isMarketAllocationDone | int (0/1) | No | Market allocation to insurers finalised |
| clientConsiderations | text | No | Client preferences / red lines |
| threatsFromExistingInsurer | text | No | Retention risk from incumbent insurer |
| threatsFromExistingBroker | text | No | Competition from existing broker |
| extraneousFactors | text | No | External market / macro factors |
| planForClosingDetail | text | No | BD strategy for winning |
| remarks | text | No | Free text |
| statusLid | int (FK) | No | Activity status |
| TPA details (rel) | array | No | TPAs to include in RFP |
| Insurer details (rel) | array | No | Insurers receiving the RFP |
| Client contacts (rel) | array | No | Client-side contacts for RFP process |
| Credit sharing (rel) | array | No | Credit split between BD team members |
| Documents (rel) | array | No | RFP documents |

**BR-OPTY-A05-001** — `targetQcrDate` must not be in the past on creation.

**BR-OPTY-A05-002** — If credit sharing entries are provided, their percentages should sum to 100%. Partial sums are allowed as drafts.

---

### Activity 6 — Broking Slip Generation
**Table:** `opportunity_broking_slip_version_details`  
**Stage:** Negotiations  
**Key:** `broking_slip_activity`

Multiple versions allowed. Prior versions soft-deleted but retained for audit.

| Field | Type | Required | Rule |
|---|---|---|---|
| brokingSlipVersion | numeric | Auto | Auto-incremented per new version |
| brokingSlipName | text | No | Descriptive name / identifier |
| sumInsured | numeric(21,4) | No | Cover amount on this slip |
| brokeragePercentage | numeric(7,4) | No | Proposed brokerage % |
| policyFrom | date | No | Proposed policy start |
| policyTo | date | No | Proposed policy end; must be after `policyFrom` |
| renewalDate | date | No | Renewal trigger date |
| quoteReceiptTimeline | date | No | Deadline for insurer to submit quote |
| businessActivity | text | No | Client business description |
| riskMitigationFeatures | text | No | Risk controls in place |
| clauses | text | No | Special clauses |
| insurerRemarks | text | No | Pre-submission insurer feedback |
| basicPremium | numeric(21,4) | No | Estimated base premium |
| brokerageAmount | numeric(21,4) | No | Derived: `basicPremium × brokeragePercentage / 100` |
| remarks | text | No | Free text |

**BR-OPTY-A06-001** — `policyTo` must be strictly after `policyFrom`.

**BR-OPTY-A06-002** — `brokerageAmount` is computed from `basicPremium × brokeragePercentage / 100`. Manual override is permitted but raises a deviation flag.

**BR-OPTY-A06-003** — Prior broking slip versions are soft-deleted (not hard-deleted). Each version is addressable via `GET /opportunity/activities/broking-slip/:opportunityId/:versionId`.

---

### Activity 7 — Enter Quote
**Table:** `opportunity_quote_entry`  
**Stage:** Negotiations  
**Key:** `quote_entry_activity`

One quote per insurer per broking slip version.

| Field | Type | Required | Rule |
|---|---|---|---|
| brokingSlipId | int (FK) | No | Links quote to a specific broking slip version |
| insurerId | int (FK) | No | Insurer submitting this quote |
| insurerLocationId | int (FK) | No | Insurer branch |
| quoteReceivedOn | date | No | Date quote arrived |
| basicPremium | numeric(21,4) | No | Quoted base premium |
| netPremium | numeric(21,4) | No | Net premium after adjustments |
| terrorism / terrorismBrokeragePercentage | numeric | No | Terrorism add-on |
| srccPercentage / srccAmount / srccBrokerageAmount | numeric | No | SRCC cover |
| gstPercentage / gstAmount | numeric | No | GST |
| basicBrokeragePercentage / basicBrokerageAmount | numeric | No | Brokerage |
| tcBrokerageAmount | numeric(21,4) | No | TC brokerage |
| totalBrokerageAmount | numeric(21,4) | No | Sum of all brokerage components |
| feePercentage / fee | numeric | No | Advisory fee |
| adminChargesPercentage / adminCharges | numeric | No | Admin charges |
| cessPercentage / cessAmount | numeric | No | Cess |
| otherPercentage / other | numeric | No | Other charges |
| grossPremium | numeric(21,4) | No | Total premium inc. all components |
| totalGrossPremiumIncTax | numeric(21,4) | No | Grand total with GST |
| insurerRemarks | text | No | Insurer's quote commentary |
| attachmentUrl | text | No | Quote document URL |
| statusId | int (FK) | No | Quote status |

**BR-OPTY-A07-001** — At least one quote must be entered before Activity 8 (QCR Generation) can be started.

**BR-OPTY-A07-002** — `grossPremium = basicPremium + terrorism + srccAmount + gstAmount + cessAmount + adminCharges + other`. System computes this on save; manual override permitted with deviation flag.

**BR-OPTY-A07-003** — A quote cannot be hard-deleted if it is referenced in a QCR or Final Negotiation.

---

### Activity 8 — QCR Generation
**Table:** `opportunity_quote_comparison_report`  
**Stage:** Negotiations  
**Key:** `quote_comparison_report_activity`

Multiple QCR versions supported per `qcr_versions`.

| Field | Type | Required | Rule |
|---|---|---|---|
| insuranceMarket | text | No | Market commentary |
| clientSpecific | text | No | Client-specific considerations |
| issuesFaced | text | No | Challenges getting quotes |
| industryBenchmarkingComments | text | No | Benchmark analysis |
| analysisRecommendation | text | No | Recommended insurer and rationale |
| overallComments | text | No | Summary |
| remarks | text | No | Free text |
| statusLid | int (FK) | No | Activity status |

**BR-OPTY-A08-001** — At least one approved quote must exist before QCR can be generated.

**BR-OPTY-A08-002** — Multiple QCR versions are allowed; each version is linked to `opportunityActivityId`.

---

### Activity 9 — Meeting for Final Negotiation
**Table:** `opportunity_final_negotiation`  
**Stage:** Negotiations  
**Key:** `final_negotiation_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| meetingDate | date | Yes | Must not be a past date on creation |
| startTime | timetz | Yes | Must precede `endTime` |
| endTime | timetz | Yes | Must be after `startTime` |
| locationTypeLid | int (FK) | No | Meeting format |
| isFinalNegotiationTypeLid | int (FK) | No | Negotiation type |
| policyPlacedTypeLid | int (FK) | Yes | How policy placed (single / co-insurance / lead) |
| leadInsurerId | int (FK) | No | Required if co-insurance |
| isLeadInsurerPayCommissionLid | int (FK) | No | Commission payment arrangement |
| finalizedVersionId | int (FK) | Yes | Broking slip version locked for this negotiation |
| finalizedQuoteId | int (FK) | Yes | Quote selected as final |
| insurerId | int (FK) | Yes | Insurer to place with |
| insurerLocationId | int (FK) | No | Insurer location |
| isQuoteEdited | int (0/1) | No | Whether quote was modified from original |
| basicPremium, netPremium, grossPremium (and all premium components) | numeric | No | Final agreed premiums |
| mom | text | No | Minutes of Meeting |
| remarks / otherInsurerComments | text | No | Free text |
| statusLid | int (FK) | Yes | Activity status |

**BR-OPTY-A09-001** — `finalizedVersionId` must reference a valid broking slip version for this opportunity.

**BR-OPTY-A09-002** — `finalizedQuoteId` must reference a quote from `opportunity_quote_entry` for this opportunity.

**BR-OPTY-A09-003** — If `policyPlacedTypeLid` = co-insurance, then `leadInsurerId` is required.

**BR-OPTY-A09-004** — The premium figures captured here become the **source of truth** for Placement Slip prefill. Placement Slip is pre-populated from these values.

---

### Activity 10 — Placement Slip Generation  ⚑ POLICY CREATION TRIGGER
**Table:** `opportunity_placement_slip_generation`  
**Stage:** Placement  
**Key:** `placement_slip_generation_activity`

> **When this activity is approved (`isApproved = true`), the system creates the Policy record and transitions the opportunity to `OPPORTUNITY_STATUS_WON` in a single database transaction.**  
> See → [prd-04-policy-creation.md](prd-04-policy-creation.md) for the full field mapping.

| Field | Type | Required | Rule |
|---|---|---|---|
| policyFromDate | date | Yes | Policy effective date |
| policyToDate | date | Yes | Policy end date; must be after `policyFromDate` |
| sumInsured | numeric(21,4) | Yes | Confirmed sum insured |
| basicPremium | numeric(21,4) | Yes | Agreed base premium |
| netPremium | numeric(21,4) | Yes | Net premium |
| grossPremium | numeric(21,4) | Yes | Total premium |
| leadInsurerId | int (FK) | Yes | Lead insurer |
| isLeadInsurerPayCommission | int (0/1) | Yes | Commission arrangement flag |
| basicBrokeragePercentage | numeric(7,4) | Yes | Brokerage % |
| basicBrokerageAmount | numeric(21,4) | Yes | Brokerage amount |
| tcBrokerageAmount | numeric(21,4) | Yes | TC brokerage |
| totalBrokerageAmount | numeric(21,4) | Yes | Total brokerage |
| gstPercentage / gstAmount | numeric | Yes | GST |
| isPremiumInstallmentBased | int (0/1) | Yes | Instalment flag |
| totalInstallmentAmount | numeric(21,4) | No | Required if instalment flag = 1 |
| isFeeInInstallment | int (0/1) | Yes | Fee in instalments flag |
| fee / feePercentage | numeric | No | Advisory fee |
| placementSlipDate | date | No | Date slip issued |
| maxAgeOfDependents | int | No | Age cap for dependents |
| policyPlacedTypeLid | int (FK) | No | Placement type |
| remarks | varchar | No | Free text |
| statusLid | int (FK) | Yes | Activity status |
| Insurer details (rel) | array | Yes | Lead / co-insurer shares and brokerage |
| TPA details (rel) | array | No | TPA assignments |
| Cover details (rel) | array | No | Cover template |
| Instalment details (rel) | array | No | Required if instalment flag = 1 |
| CD details (rel) | array | No | Caution deposit details |

**BR-OPTY-A10-001** — `policyToDate` must be after `policyFromDate`.

**BR-OPTY-A10-002** — If `isPremiumInstallmentBased = 1`, then `totalInstallmentAmount` must be provided and must equal `grossPremium` within rounding tolerance (±1).

**BR-OPTY-A10-003** — `basicBrokerageAmount` is computed as `basicPremium × basicBrokeragePercentage / 100`. Manual override raises a deviation flag.

**BR-OPTY-A10-004** — **Approval of this activity atomically: (a) creates the policy record from placement slip data, (b) updates `opportunity.status_lid = OPPORTUNITY_STATUS_WON`.** If either step fails, the transaction rolls back.

**BR-OPTY-A10-005** — A policy is not created if one already exists with `policy.opportunity_id = this opportunity`. The system checks before creating.

---

### Activity 11 — Premium Calculation
**Table:** `opportunity_premium_calculation`  
**Stage:** Placement  
**Key:** `premium_calculation_activity`

> Runs after the policy is already created (post-WON). Purpose: verify calculated amounts before issuing Held Cover Note.

| Field | Type | Required | Rule |
|---|---|---|---|
| remarks | text | No | Notes on calculation |
| statusLid | int (FK) | No | Activity status |

**BR-OPTY-A11-001** — Premium figures are drawn from the Placement Slip. This is a verification activity; no new premium values are introduced here.

**BR-OPTY-A11-002** — `activityMeta` JSONB on `opportunity_activity_map` stores any computed breakdowns during this review.

---

### Activity 12 — Held Cover Note
**Table:** `opportunity_held_cover_note`  
**Stage:** Placement  
**Key:** `held_cover_note_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| placementSlipDeviationsLid | int (FK) | No | Whether deviations exist vs placement slip |
| deviations | varchar(500) | No | Required if deviations flag is set |
| deviationsAddressedLid | int (FK) | No | Whether deviations were resolved |
| revisedHeldCoverNoteLid | int (FK) | No | Whether revised cover note issued |
| resolutionLid | int (FK) | No | Resolution type |
| acknowledgedBy | int (FK → User) | No | User who acknowledged the cover note |
| receiptNo | varchar(255) | No | Cover note receipt number |
| receiptDate | date | No | Date of receipt; cannot be in future |
| allDocumentsReceivedDate | date | No | Date all supporting docs received |
| isPremiumInstallmentBased | int (0/1) | No | Instalment flag (carried from Placement Slip) |
| totalInstallmentAmount | numeric(21,4) | No | Required if instalment flag = 1 |
| Premium fields | numeric | No | Same structure as Placement Slip |
| leadInsurerId | int (FK) | Yes | Lead insurer |
| isLeadInsurerPayCommission | int (0/1) | Yes | Commission flag |
| sumInsured | numeric(21,4) | Yes | Sum insured |
| policyPlacedTypeLid | int (FK) | No | Placement type |
| remarks | varchar(1000) | No | Free text |

**BR-OPTY-A12-001** — If `placementSlipDeviationsLid` indicates deviations, `deviations` text is required.

**BR-OPTY-A12-002** — `receiptDate` must not be in the future.

**BR-OPTY-A12-003** — Premium fields must reconcile with Placement Slip values. A deviation flag is raised on mismatch.

---

### Activity 13 — Policy Hard Copy Receipt
**Table:** `opportunity_policy_hard_copy`  
**Stage:** Policy Servicing  
**Key:** `policy_hard_copy_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| insurerPolicyNo | varchar(100) | No | Policy number issued by insurer |
| hardCopyReceivedOn | date | No | Date physical copy received; cannot be future |
| deviationsLid / deviationCoveragesLid | int (FK) | No | Deviation flags vs cover note |
| coverages | varchar(500) | No | Coverage summary |
| exclusions | varchar(500) | No | Exclusion summary |
| deductibles | varchar(500) | No | Deductible schedule |
| deviationsAddressedLid / resolutionLid | int (FK) | No | Deviation resolution |
| policyHardCopyReceivedLid | int (FK) | No | Receipt confirmation |
| Premium fields | numeric | No | Final premium as on policy document |
| leadInsurerId | int (FK) | Yes | Lead insurer |
| sumInsured | numeric(21,4) | Yes | Sum insured |
| remarks | varchar(500) | No | Free text |

**BR-OPTY-A13-001** — `hardCopyReceivedOn` cannot be in the future.

**BR-OPTY-A13-002** — If deviations are flagged, `coverages`, `exclusions`, or `deductibles` must be filled.

---

### Activity 14 — Policy Docket
**Table:** `opportunity_policy_docket`  
**Stage:** Policy Servicing  
**Key:** `policy_docket_activity`

This is a **checklist activity**. Each boolean field confirms that a document or arrangement is in the docket.

| Field | Type | Rule |
|---|---|---|
| issuanceDate | date | Date docket assembled |
| heldCoverNote | int (0/1) | Held Cover Note in docket |
| policyDocument | int (0/1) | Policy document in docket |
| policyDocket | int (0/1) | Docket itself signed |
| endorsement | int (0/1) | Endorsement documents |
| healthClaims | int (0/1) | Health claims process docs |
| nonHealthClaims | int (0/1) | Non-health claims process docs |
| mir | int (0/1) | MIR document |
| monthlyMeeting | int (0/1) | Monthly review meeting scheduled |
| quarterlyMeeting | int (0/1) | Quarterly review scheduled |
| renewalNotice | int (0/1) | Renewal notice arrangement |
| dataCollection | int (0/1) | Data collection plan |
| remarks | varchar(500) | Free text |

**BR-OPTY-A14-001** — `policyDocument = 1` and `heldCoverNote = 1` must both be checked before this activity can be marked `CLOSED`.

---

### Activity 15 — Hand Over Meet
**Table:** `hand_over_meet`  
**Stage:** Policy Servicing  
**Key:** `hand_over_meet_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| meetingDate | date | Yes | Must not be past on creation |
| startTime | timetz | Yes | Must precede `endTime` |
| endTime | timetz | Yes | Must be after `startTime` |
| locationTypeLid | int (FK) | No | Meeting format |
| handOverMeetingTypeLid | int (FK) | No | Type of handover |
| meetingId | int (FK) | No | Pre-existing meeting record |
| mom | text | No | Minutes of Meeting |
| remarks | text | No | Free text |
| statusLid | int (FK) | No | Activity status |

**BR-OPTY-A15-001** — Signals formal handover from BD to servicing team. `mom` is strongly recommended but not mandatory.

---

### Activity 16 — Policy Confirmation
**Table:** `opportunity_policy_confirmation`  
**Stage:** Policy Servicing  
**Key:** `policy_confirmation_activity`

| Field | Type | Required | Rule |
|---|---|---|---|
| policyDataWrongLid | int (FK) | No | Flag if policy data is incorrect |
| deviationResolvedLid | int (FK) | No | Whether prior deviations are resolved |
| resolutionLid / deviations | int / varchar(500) | No | Resolution details |
| comments | varchar(500) | No | General comments |
| policyDataRectifiedLid | int (FK) | No | Confirmation data corrected |
| Premium fields | numeric | No | Final confirmed premium |
| leadInsurerId | int (FK) | Yes | Lead insurer |
| isLeadInsurerPayCommission | int (0/1) | Yes | Commission flag |
| sumInsured | numeric(21,4) | Yes | Confirmed sum insured |
| policyPlacedTypeLid | int (FK) | No | Placement type |
| totalBrokerageAmount | numeric(21,4) | Yes | Final confirmed brokerage |
| remarks | varchar(500) | No | Free text |

**BR-OPTY-A16-001** — If `policyDataWrongLid` flags incorrect data, `policyDataRectifiedLid` must confirm rectification before this activity can close.

**BR-OPTY-A16-002** — This is the final activity in the pipeline. Its completion closes out the servicing cycle. The opportunity is already `WON` at this point (since Activity 10 approval).

---

## 7. Stage Management Endpoints

| Operation | Endpoint |
|---|---|
| Read all activities | `GET /opportunity/activities/:opportunityId` |
| Update activity | `PUT /opportunity/activity` |
| Activity approval | `PUT /opportunity/:opportunityActivityId/activity-approval` |
| Read activity data | `GET /opportunity/activity-data/:opportunityActivityId` |
| Create activity meta | `POST /opportunity/activity-meta` |
| Update activity meta | `PUT /opportunity/activity-meta/:opportunityActivityId` |
| Assign stage owner | `POST /opportunity/assign-stage-owner` |
| Read stage owners | `GET /opportunity/:opportunityId/stage-owners` |
| Sales funnel | `GET /opportunity/sales-funnel` |
| Pending activities | `GET /opportunity/pending-activities-summary` |
