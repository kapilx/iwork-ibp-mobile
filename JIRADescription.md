## Action Buttons
- Action 1: “Save”
    - When the user clicks the “Save” button, the claim entry should be saved as a draft.
    - The saved entry must appear in the “Manage Claims” screen, with the most recent entry displayed at the top.
    - The entry should carry a status tag indicating its current stage
    - When the user clicks on this status, they should be able to re-enter the same stage and continue from where they left off.
    - Claim Status Workflow: ( Please refer - Claims (Non GMC) Field Details.xlsx )
    - Note : For every stage, if the user clicks Save or uploads a document, the status in the Manage Claims screen should display the current stage name with a status of “Pending.”
    - If the user does not save or upload in the current stage, the system should continue to display the status of the previous stage.
        - Example : The claim is currently at Step 3: Loss Adjuster Appointed.
        - If the user uploads a document or clicks Save at this step, the status shown in Manage Claims will be “Loss Adjuster Appointed – Pending.”
        - If the user does not save or upload at this step, the status will continue to show the previous stage, e.g., “FONL Sent to Insurer – Pending.”

- Action 2: “Next CTA”
    - When the user selects “Next,” the system should save the current entries and automatically redirect the user to the next step in the workflow.
    - At First step, the system should auto-generate a unique Claim Number.
    - This Claim Number must be displayed on all subsequent screens for reference and tracking.

- Action 3: “Document Upload”
    - At the stages where document upload is required, once the user uploads a document, the system should automatically save the status.
    - The user should not be required to click the “Save Draft” button separately for the uploaded document to be saved.
    - Replace doc capability
    - User should be able to replace an already uploaded document at stages where document upload is required.
    - A “Replace Document” option must be available next to each uploaded file.
    - Once a document is replaced, the system should auto-save the new version without requiring the “Save Draft” action.
    - The latest replaced document should be displayed to the user.
    - System should maintain an audit log (date, time, user) for each replacement.
    - Status of the claim should remain unchanged after replacement, but the replacement action should be captured in the claim history/timeline.
    - Standard validations (file type, size, format) should apply to replaced documents.
    - If replacement fails, the system should retain the previous document and display an error message.

 