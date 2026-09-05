## Opportunity Draft Save – User Stories (Simplified)

### Personas
1. Sales/BD Executive
    - Goal: Progress opportunity stages without losing partially entered data.
    - Context: Frequently multitasks; cannot finish long stage forms in one sitting.
    - Pain Point: Re-entering data after interruptions.
2. ISG Owner
    - Goal: Review and complete strategic or approval stages efficiently.
    - Context: May add complex data across multiple sessions.
    - Pain Point: Loss of partially drafted structured inputs.

### User Stories
1. US-OPTY-DRAFT-001: As a Sales/BD Executive, I want to click Save while a stage form is incomplete so I can preserve all entered values without fixing validation errors yet.
    - Acceptance Criteria:
        - Given I am editing a stage form with missing mandatory fields only (no other validation errors), when I click Save, then the draft is stored successfully.
        - Given there is a format or range validation error (non-mandatory), when I click Save, then the draft is NOT stored and blocking errors are displayed.
        - Given the save succeeds, then I receive a simple confirmation (e.g., non-blocking toast or status).
2. US-OPTY-DRAFT-002: As a Sales/BD Executive, I want previously saved values to automatically re-populate when I reopen the same stage so I can continue seamlessly.
    - Acceptance Criteria:
        - Given a draft exists for (Opportunity, Stage), when I reopen that stage form before completion, then each saved field value appears in its corresponding input.
        - Given no draft exists, when I open the stage form, then all fields appear in their default empty or initial state.
3. US-OPTY-DRAFT-003: As a Sales/BD Executive, I want a new Save to overwrite the prior draft so the system always reflects my latest partial progress.
    - Acceptance Criteria:
        - Given a draft already exists, when I change one or more field values and click Save again, then only the latest snapshot is retained (previous snapshot not recoverable).
        - Given I perform multiple Saves for the same (Opportunity, Stage), then only the most recent inputs appear on next load.
4. US-OPTY-DRAFT-004: As an ISG Owner, I want validation to run only on stage completion so interim saves never block progress.
    - Acceptance Criteria:
        - (Updated) Draft Save runs all validations except mandatory presence: missing mandatory fields allowed; other validation errors block save.
        - Given I click Save with only missing mandatory fields, save succeeds.
        - Given I click Save with a format/constraint error, save fails and errors are shown.
        - Given I click Complete Stage, then mandatory presence is enforced along with all other validations.
5. US-OPTY-DRAFT-005: As an ISG Owner, I want the draft removed automatically once the stage is completed so outdated partial data does not linger.
    - Acceptance Criteria:
        - Given a draft exists, when the stage is successfully completed (passes validation), then the draft record is deleted.
        - Given the stage was completed and later reopened, then no prior draft values appear.

### Acceptance Criteria Summary
- Save stores all current field values regardless of validation state.
- Reopen auto-populates saved values when a draft exists.
- Subsequent Save overwrites previous draft snapshot.
- Validation rules defined but enforced only at completion.
- Draft purged immediately after successful stage completion.

### Open Questions (If Any)
- None at this time; scope intentionally minimal.
