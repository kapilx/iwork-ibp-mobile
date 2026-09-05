# IIRM-4849 Opportunity Save Activity – Product Specs (Phase 1)

## A. Overview
**Purpose:** Provide a manual "Save Draft" capability for in-progress Opportunity stage activity data without enforcing completion validations.
**Business Value:** Eliminates rework from lost partial entries; increases data completeness and speeds stage progression.
**User Value:** Users (Sales/BD Executive, ISG Owner) can return later and continue exactly where they left off.
**Scope (Phase 1):** Single latest draft per (Opportunity, Stage); manual save; automatic restore; no discard feature, no auto-save, no versioning, no multi-user locking.

## B. Personas (Summary)
1. **Sales/BD Executive (merged)** – Primary creator of stage data; works incrementally across interruptions.
2. **ISG Owner** – Reviewer/completer in later stages; needs visibility of in-progress data.

## C. Functional Requirements
- **FR-OPPTY-SAVE-001:** Save draft snapshot (raw field JSON + metadata) for stage.
- **FR-OPPTY-SAVE-002:** Auto-restore draft on re-entry before stage completion.
- **FR-OPPTY-SAVE-003:** Visual draft indicator when a draft exists.
- **FR-OPPTY-SAVE-004:** Bypass completion validation on Save Draft; validations enforced only on Complete.
- **FR-OPPTY-SAVE-005:** Persist metadata: saved_at (UTC), saved_by, opportunity_id, stage_id.

## D. Business Rules
- **BR-OPPTY-SAVE-001:** One active draft per (Opportunity, Stage); new save overwrites.
- **BR-OPPTY-SAVE-002:** Draft deleted automatically upon successful completion.
- **BR-OPPTY-SAVE-003:** Removed schema fields stored under `stale_fields` and excluded from UI restore.

## E. User Stories (Extract)
### Sales/BD Executive
- **US-OPPTY-SAVE-001:** Save partial stage data as draft (incomplete/invalid allowed).
- **US-OPPTY-SAVE-002:** Draft auto-populates on return to stage.
-- **US-OPPTY-SAVE-003:** Save action does not block on required field validation; completion does.
### ISG Owner
-- **US-OPPTY-SAVE-004:** See draft indicator on opening stage.
-- **US-OPPTY-SAVE-005:** Review restored draft data (exclude stale fields).

## F. Acceptance Criteria (Consolidated)
- Draft persists with any subset of fields (incl. invalid/missing required).
- Restoring stage before completion shows saved values.
- Indicator visible when draft exists; absent otherwise.
- Stage completion removes associated draft.
- Stale fields segregated and not rendered.
- Metadata saved (saved_by, saved_at) every save.
- Save action ≤ 500ms p95 under normal load.

## G. Data Model (Phase 1 Minimal)
Recommended separate draft store for per-stage granularity:
```json
{
  "opportunity_id": 123,
  "stage_id": "RFP",
  "fields": { /* raw form data */ },
  "stale_fields": { /* removed schema keys (optional) */ },
  "saved_by": 456,
  "saved_at": "2025-11-24T10:15:00Z"
}
```
RDBMS option: table `opportunity_stage_draft(opportunity_id, stage_id, fields jsonb, stale_fields jsonb, saved_by, saved_at)` with PK over (opportunity_id, stage_id).
Alternative (entity-level flags) noted in technical spec for simpler implementation.

## H. API Endpoints (Phase 1)
- `POST /opportunities/{id}/stages/{stageId}/draft` – Save/overwrite draft.
- `GET /opportunities/{id}/stages/{stageId}/draft` – Retrieve draft (404 if none).
Draft not needed on submit completion endpoint; completion implicitly removes.

## I. UI Elements
- Save Draft button (primary for interim persistence).
- Complete button (runs validations; removes draft on success).
- Draft badge (e.g., "Draft Saved") near form title.

## J. Edge Cases
1. **Network interruption mid-save:** Return error; previous draft intact; form state retained client-side.
2. **Concurrent overwrite:** Latest save wins silently (Phase 1 no conflict UI).
3. **Schema evolution / stale fields:** Store unknown keys in `stale_fields`; exclude from UI; purge on completion.

## K. Non-Functional Requirements
- Reliability: ≥99% successful draft retrieval.
- Security: Role-based access (Sales/BD Exec, ISG Owner) enforced; no elevation via drafts.
- Audit: Each save logged with user and timestamp.
- Performance: p95 save ≤ 500ms; payload size typical form JSON (<50KB).

## L. Success Metrics (Phase 1)
1. **Draft Usage Rate:** % opportunities with ≥1 draft before stage completion.
2. **Time Saved:** Avg reduction in re-entry effort measured via elapsed time from first data entry to completion versus baseline.
Collection planned via API instrumentation (future analytics service).

## M. Out of Scope (Phase 1)
- Auto-save timer
- Version history
- Conflict resolution/locking
- Draft aging reminders
- Multi-stage batch save

## N. Future Enhancements
1. Auto-save + dirty state indicator
2. Draft versioning & revert
3. Collaborative locking & conflict alerts
4. Aging draft notification workflow

## O. Open Questions
1. Purge policy (age threshold vs manual only)?
2. Partial file upload handling – ignore vs placeholder reference?
3. Discard confirmation modal – required for safety?
4. Should user see last saved timestamp in UI header? (If yes, formatting standard?)

## P. Traceability Mapping
| Requirement | User Story / Rule | Spec Section |
|-------------|-------------------|--------------|
| Save draft incomplete | US-OPPTY-SAVE-001 / BR-OPPTY-SAVE-001 | C, D, E |
| Restore draft | US-OPPTY-SAVE-002 | C, E, F |
| Indicate draft | US-OPPTY-SAVE-005 | C, E, I |
| Skip validation on save | US-OPPTY-SAVE-003 / FR-OPPTY-SAVE-004 | C, D |
| Stale fields handling | US-OPPTY-SAVE-002,005 / BR-OPPTY-SAVE-003 | D, F, J |
| Metadata capture | FR-OPPTY-SAVE-005 | C, F, K |

## Q. Source Documents
- `test-policy-feature-prd.md` (Phase 1 PRD)
- `test-policy-feature-user-stories.md` (User Stories & Acceptance Criteria)
- `Technical Specs/IIRM-4849_SaveActivity.md` (Implementation & architecture reference)

---
This Product Specs file consolidates functional intent (PRD) and user interaction goals (User Stories) for rapid engineering and QA alignment.
