## Oppertunity Save Activity

### Purpose
Allow users to manually save partial data entered in an Opportunity stage form and reload it later so they do not have to retype unfinished information.

### Functionality
1. The "Save" button should store all current field values for the active stage. All validations applicable to “Save Draft” should be applied, except mandatory–field validation. Users should be allowed to save even if mandatory fields are not filled.
2. On returning to the same stage before completion, previously saved values auto-populate the form.
3. Only one draft per (Opportunity, Stage); a new save overwrites the previous snapshot.
4. On Save Draft the system executes all field-level validations (format, data type, range, cross-field) identical to completion validation EXCEPT it does not require mandatory fields to be present. Missing mandatory fields are allowed; any other validation failure (e.g., bad format) blocks the save until corrected.
5. Draft is deleted automatically when the stage is successfully completed.

### Acceptance
- Can save with missing mandatory fields (they do not block save).
- Non-mandatory validation errors (format, range) prevent save until fixed.
- Saved data reappears on revisit.
- Completing stage removes draft.

