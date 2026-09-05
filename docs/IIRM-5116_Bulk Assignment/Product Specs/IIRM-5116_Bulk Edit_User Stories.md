# Bulk Edit Module – User Stories & Acceptance Criteria


## User Story 1: Flexible Bulk Edit Access & Record Selection
As a user with bulk edit privileges,
I want to filter and select records using any available filtering options on listing screens,
So that I can choose exactly which records to bulk edit without restrictions.

**Acceptance Criteria:**
	- Multi-select checkboxes are visible only to users with bulk edit privileges
	- Users without bulk edit privileges see standard listing interface without checkboxes
	- Users can apply any combination of filters available on the listing screens
	- No restrictions on filter combinations for bulk edit operations
	- Record selection works regardless of applied filters
	- Selection persists across pagination

---

## User Story 1A: Privilege-Based Interface Control
As a system,
I want to show bulk edit interface elements only to authorized users,
So that unauthorized users cannot access bulk edit functionality.

**Acceptance Criteria:**
	- Only users with bulk edit privileges can see multi-select checkboxes
	- Only users with bulk edit privileges can see the "Bulk Edit" CTA button
	- Users without privileges see standard listing interface without bulk edit capabilities
	- Privilege validation occurs in real-time
	- No bulk edit elements are visible or accessible to unauthorized users


## User Story 1B: Entity-Specific Field Editing

As a user with bulk edit privileges,
I want to edit specific fields for different entity types,
So that I can efficiently update the most common and important fields for each entity.

**Acceptance Criteria:**
	- **Company Entity**: Can bulk edit `lead_crm`, `account_manager`, `status`, `priority`
	- **Opportunity Entity**: Can bulk edit `bd_owner`, `isg_owner`, `status`, `expiry_date`
	- **Policy Entity**: Can bulk edit `lead_crm`, `isg_owner`, `account_manager`, `status`
	- Bulk edit interface displays only relevant fields for selected entity type
	- Field validation is enforced for each entity type

---

## User Story 2: Bulk Field Editing
As a manager or super admin,
I want to select multiple records and edit common fields simultaneously,
So that I can efficiently update multiple entities with the same information.

**Acceptance Criteria:**
	- Bulk edit form displays only fields that are common across selected entities.
	- Users can modify multiple fields in a single operation.
	- Changes are applied to all selected records simultaneously.
	- System validates field compatibility across different entity types.
	- Preview shows the number of records that will be affected.

---

## User Story 2A: Field-Specific Bulk Operations
As a manager or super admin,
I want to perform specific bulk operations on different field types,
So that I can efficiently manage different aspects of the records.

**Acceptance Criteria:**
	- **Ownership Transfer**: Bulk assign records to different users of the same type.
	- **Status Updates**: Bulk change status (active/inactive, pending/approved) across records.
	- **Category/Type Updates**: Bulk update categories, priorities, or classification fields.
	- **Date Fields**: Bulk update renewal dates, review dates, or follow-up dates.

---


## User Story 3: Bulk Edit Confirmation & Preview
As a manager or super admin,
I want to confirm the bulk update.

**Acceptance Criteria:**
- Changes are applied only after explicit confirmation.

---

## User Story 4: Audit Logging with Existing Platform Mechanism
As a system,
I want to log all bulk edit actions using the existing platform audit log mechanism,
So that comprehensive audit trails are maintained consistently across the platform.

**Acceptance Criteria:**
	- All bulk edit transactions are logged using the existing Audit Log Mechanism in the platform
	- Each bulk edit operation creates detailed audit entries including:
		- Who performed the bulk edit
		- Which records were modified  
		- What fields were changed (old values → new values)
		- Timestamp of the operation
	- Individual record audit trails show bulk edit operations as part of the record's change history
	- Audit logs follow the platform's existing audit log structure and retention policies
	- Bulk edit audit entries are accessible through existing audit log interfaces

---

## User Story 6: Notification Logic

## User Story 6: Notification & Communication Logic
As a system,
I want to send intelligent notifications to relevant users about bulk edit actions, especially for assignment actions (notifications are not required for changes to other attributes),
So that all stakeholders are informed of changes according to the type of assignment and impact of modifications.

**Acceptance Criteria:**
	- **Ownership Changes**:
		- If owner is changed and old owner is active: Notify old owner, new owner, and manager (of new owner) of the action.
			- **To Old Owner:**
				- Subject: [Entity Type] Ownership Transferred
				- Body: You are no longer the owner of [X] [Entity Type] records. Ownership has been transferred to [New Owner Name].
			- **To New Owner:**
				- Subject: New [Entity Type] Ownership Assigned
				- Body: You have been assigned as the new owner of [X] [Entity Type] records. Please review your responsibilities.
			- **To Manager (of New Owner):**
				- Subject: [Entity Type] Ownership Change Notification
				- Body: [New Owner Name] is now the owner of [X] [Entity Type] records. Please ensure a smooth transition.
		- If old owner is inactive: Only notify new owner and manager (of new owner).
			- **To New Owner:**
				- Subject: New [Entity Type] Ownership Assigned
				- Body: You have been assigned as the new owner of [X] [Entity Type] records. Please review your responsibilities.
			- **To Manager (of New Owner):**
				- Subject: [Entity Type] Ownership Change Notification
				- Body: [New Owner Name] is now the owner of [X] [Entity Type] records. Please ensure a smooth transition.
		- For bulk transfers, notifications must summarize the number of records transferred (e.g., "You have been assigned as the new owner of 250 records") and must not list all item names.
---

## User Story 7: Privilege-Based Permission Enforcement
As a system,
I want to restrict bulk edit functionality to users with explicit bulk edit privileges,
So that only authorized users can perform bulk operations on data.

**Acceptance Criteria:**
- Bulk edit functionality is enabled only for users with explicit bulk edit privileges
- Privilege determines:
    - Which users can see multi-select checkboxes
    - Which users can access the "Bulk Edit" CTA
    - Which fields can be edited by different user roles
- System validates permissions before displaying bulk edit interface

---

## User Story 8: Error Handling & Recovery
As a manager or super admin,
I want robust error handling during bulk operations,
So that partial failures don't corrupt data and I can understand what went wrong.

**Acceptance Criteria:**
	- System processes records in a single transaction batch to minimize impact of failures.

---
