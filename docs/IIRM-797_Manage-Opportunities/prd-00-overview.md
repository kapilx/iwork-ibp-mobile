# Opportunity Management — Master PRD Index

**Module:** IIRM-797_Opty-Management  
**Product:** iWork Edge — Insurance CRM  
**Client:** IIRM  
**Document type:** PRD Master Index (Stage 40a)  
**Status:** Draft  
**Date:** 2026-05-22  
**Author:** Nithin Krishna Sirigiri

---

## 1. Purpose

The Opportunity Management module is the **revenue pipeline engine** of iWork Edge. It tracks every insurance deal — from initial client interest through to policy issuance — as a structured, 16-activity, stage-gated workflow.

Two Opportunity types exist:

| Type | Key | Origin | Description |
|---|---|---|---|
| Sales Opportunity | SO | Manual creation | New business — prospect or existing client pitched a new cover |
| Renewal Opportunity | RO | System-generated | Policy nearing expiry triggers an RO via the nightly scheduler |

Both types follow the same 16-activity pipeline with minor naming differences at the early stages.

> **Policy creation happens at Placement Slip approval (Activity 10), not at the end of the pipeline.**  
> Activities 11–16 are post-placement servicing activities that run after the policy already exists.  
> See → [prd-04-policy-creation.md](prd-04-policy-creation.md)

---

## 2. Scope

### In scope
- Create Opportunity (SO manual; RO system-triggered)
- Full CRUD — Read, Update, Delete opportunity records
- 16-activity stage-gated pipeline (6 stages)
- Per-activity field rules and stage business rules
- Stage draft save (per-activity partial save without completing)
- Won: triggered at Placement Slip approval
- Lost: at any stage with reason and auto-RO consequence
- Policy creation from Placement Slip data
- Bulk assignment and bulk update
- Stage owner assignment

### Out of scope (deferred)
- Policy entity lifecycle after creation (Policy Service owns)
- Instalment plan management (separate module)
- AI Nudges / Insights on opportunities (IIRM-8064)
- Bulk CSV import of opportunities
- IBP portal visibility of opportunity data

---

## 3. User Roles

| Role | Description |
|---|---|
| BD Executive | Business Development; creates SO, owns early stages |
| ISG Owner | Insurance Solutions Group; owns ISG Planning stage and approvals |
| AM | Account Manager; assigned on opportunity, receives notifications |
| System (Scheduler) | Creates RO automatically from expiring policies |

---

## 4. Sub-PRD Map

This module's PRD is split into four focused documents. All files live in the same folder.

```
IIRM-797_Opty-Management/
├── prd-00-overview.md            ← This file (master index)
├── prd-01-create-opportunity.md  ← Create Opportunity (SO + RO)
├── prd-02-stage-activities.md    ← Stage pipeline + all 16 activity rules
├── prd-03-won-lost.md            ← Won & Lost rules
└── prd-04-policy-creation.md     ← Policy creation trigger + field mapping
```

| Sub-PRD | Covers | Key decisions |
|---|---|---|
| [prd-01-create-opportunity.md](prd-01-create-opportunity.md) | Header fields, required/optional rules, RO auto-creation, CRUD endpoints | BR-OPTY-001 to 006 |
| [prd-02-stage-activities.md](prd-02-stage-activities.md) | 6 stages, 16 activities, per-activity field tables and business rules | BR-OPTY-010 to 014, BR-OPTY-A01 to A16 |
| [prd-03-won-lost.md](prd-03-won-lost.md) | Won trigger, Lost reason, auto-RO on loss, state locks | BR-OPTY-WON, BR-OPTY-LOST |
| [prd-04-policy-creation.md](prd-04-policy-creation.md) | Exact trigger stage, field-by-field mapping to policy tables | BR-OPTY-POL |

---

## 5. Opportunity Status State Machine

```
         ┌──────────────────────────────────────────────┐
         │             OPPORTUNITY_STATUS_OPEN           │
         │        (created, no activity started)         │
         └──────────────────┬───────────────────────────┘
                            │  First activity started
                            ▼
         ┌──────────────────────────────────────────────┐
         │       OPPORTUNITY_STATUS_WORK_IN_PROGRESS     │
         │        (at least one activity active)         │
         └─────────┬────────────────────────────────────┘
                   │                        │
  Placement Slip   │                        │  Mark as Lost (any stage)
  approved         ▼                        ▼
  ┌──────────────────────┐    ┌────────────────────────────┐
  │  OPPORTUNITY_STATUS  │    │   OPPORTUNITY_STATUS_LOST  │
  │         WON          │    │   (opportunity_lost row     │
  │   (immutable; policy │    │    created; auto-RO fires)  │
  │    already created)  │    └────────────────────────────┘
  └──────────────────────┘
                                Expiry past, status still OPEN/WIP
                                           ▼
                          ┌────────────────────────────────┐
                          │   OPPORTUNITY_STATUS_AUTO_CLOSE │
                          │     (scheduler-triggered)       │
                          └────────────────────────────────┘
```

> Policy is created **inside the WON transition**, not after it.  
> The Placement Slip approval atomically creates the policy and marks the opportunity WON in a single transaction.

---

## 6. Cross-Module Data Contract

### What this module produces

| Data | Consumer | Via |
|---|---|---|
| `policy` record (fully populated) | Policy Service | Created by opp-service at Placement Slip approval |
| `opportunity_id` on policy | Policy Service | FK on `policy.opportunity_id` |
| `opportunity_status = WON` | Analytics, dashboards | Status field |
| `opportunity_lost` record | Analytics, Auto-RO pipeline | Loss reason + auto-renewal trigger |

### What this module consumes

| Input | Source |
|---|---|
| `company_id` | Company Service — active companies only |
| `policy_type_lid` | LookUp / Master Data — drives activity template |
| `ref_policy_id` (RO) | Policy Service — expiring policy pre-fills RO fields |
| `sbu_id` for RO scoping | `org_sbu.is_ro_generation_enabled = true` |
| User IDs (owner, AM, ISG) | User Service — active users only |
| All `*_lid` fields | LookUp Service |

---

## 7. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-001 | What LookUp values are valid for `reasonForLossLid`? | Loss analytics UX | Ramarao / IIRM |
| OQ-002 | Does `status_lid` transition to `WORK_IN_PROGRESS` on activity creation or on first data save? | Dashboard counts | Tharun (TL) |
| OQ-003 | Activities 11–16 run after the policy is WON. Do they update the already-created policy record, or are they purely servicing records? | TRD field update scope | Tharun (TL) |
| OQ-004 | Does `policy_status` change when Activity 16 (Policy Confirmation) completes — e.g., from MIG_GENERATED to ACTIVE? | Policy lifecycle | Ramarao / IIRM |
| OQ-005 | Are there policy-type-specific activity templates (e.g., GMC vs Marine vs Fire)? `mstr_stage_activity_template.policy_type_lid` suggests yes. Confirm full matrix. | Stage template completeness | Ramarao / IIRM |
| OQ-006 | What happens to the linked RO when an SO is Won? Is the RO auto-closed? | Duplicate pipeline risk | Ramarao / IIRM |
| OQ-007 | `AUTO_CLOSE` — exact scheduler condition: `expiry_date < today` AND `status ∈ (OPEN, WIP)`? | Scheduler TRD | Tharun (TL) |
| OQ-008 | Must RFP credit sharing splits sum to exactly 100%, or are partial splits allowed? | Validation rule | Ramarao / IIRM |

---

## 8. Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
