# User Stories - Phase 1

## 1. User Personas & Contexts
- **Persona:** Sales/BD Executive (merged role)
  - **Goals:** Progress opportunity stages efficiently; capture complex data across multiple sessions.
  - **Context:** Frequently interrupted; gathers data from multiple stakeholders over time.
  - **Pain Points:** Loses partially entered data; forced to re-enter large forms.
- **Persona:** ISG Owner
  - **Goals:** Validate technical/commercial details in later stages; ensure data integrity before completion.
  - **Context:** Reviews or supplements data saved earlier by Sales/BD Executive.
  - **Pain Points:** Receives incomplete forms without indicators; delays due to missing info.

## 2. User Stories
### Sales/BD Executive
- **US-OPPTY-SAVE-001:** As a Sales/BD Executive, I want to save a partially completed stage form as a draft so that I can return later without losing progress.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given a stage form with at least one field filled, when I click Save Draft, then a draft is persisted regardless of validation errors.
    - Given a successful save, when I remain on the form, then I see a confirmation and draft indicator.
- **US-OPPTY-SAVE-002:** As a Sales/BD Executive, I want the form to auto-populate with my previously saved draft so that I can continue from where I left off.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given an existing draft and I navigate back to the same stage before completion, when the form loads, then all draft field values appear.
    - Given a draft with a removed field, when the form loads, then that field is not shown and data is retained internally as stale_fields.
- **US-OPPTY-SAVE-003:** As a Sales/BD Executive, I want saving not to block on required field validation so that I can store incomplete sets of data.
  - **Priority:** High
  - **Acceptance Criteria:**
    - Given missing required fields, when I click Save Draft, then save succeeds without validation errors.
    - Given missing required fields, when I click Complete, then I receive validation prompts and completion is blocked.

### ISG Owner
- **US-OPPTY-SAVE-004:** As an ISG Owner, I want to see if a draft exists when opening a stage so that I understand data is still in progress.
  - **Priority:** Medium
  - **Acceptance Criteria:**
    - Given a stage with a draft, when I open the stage form, then I see a draft indicator immediately.
    - Given no draft, when I open the stage form, then no draft indicator is shown.
- **US-OPPTY-SAVE-005:** As an ISG Owner, I want previously saved draft data to appear for review so that I can finalize details before completion.
  - **Priority:** Medium
  - **Acceptance Criteria:**
    - Given an existing draft saved by another user, when I open the stage, then I see all draft fields restored.
    - Given stale draft fields due to schema changes, when I open the stage, then those fields are excluded from the form but draft restore still succeeds.

## 3. Acceptance Criteria Summary
- Draft can be saved with incomplete/invalid data (US-OPPTY-SAVE-001,003).
- Draft auto-restores on stage load (US-OPPTY-SAVE-002,005).
- Draft indicator visible when draft exists (US-OPPTY-SAVE-004).
- Completion enforces validation; save does not (US-OPPTY-SAVE-003).
- Stale fields ignored gracefully (US-OPPTY-SAVE-002,005).

## 4. User Flows & Contextual Notes
- **Save Draft Flow:** Enter partial data → Save Draft → Confirmation → Later reopen → Auto-restore.
- **Completion Flow:** Draft (optional) → Fill required fields → Complete → Draft deleted.
- **Stale Field Handling:** Removed fields omitted from UI; not blocking restore.

## 5. Open Questions Related to Users
- Should an ISG Owner be able to overwrite a Sales/BD Executive draft without warning?
- Do users need a timestamp display ("Last saved at HH:MM") in Phase 1?
