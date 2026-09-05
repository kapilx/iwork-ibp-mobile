# Employee Deactivation Flow - Admin Module

In the Employee page of the Admin module, I need an option to deactivate a user (IIRM employee).

A delete/deactivate icon should be displayed beside every employee in the employee listing page.

When the delete icon is clicked:

- Open a confirmation popup/modal.
- The popup should display the count of records associated with the employee being deactivated.

The following counts should be shown:

1. Number of companies where the user is:
   - `lead_crm`
   - `account_manager`

2. Number of opportunities where:
   - `owner_id = this user`

3. Number of policies where:
   - `owner_id = this user`

4. Number of endorsements where:
   - `created_by = this user`

5. Number of records in `opportunity_activity_map` where:
   - `owner_id = this user`

---

## Popup Actions

The popup should contain two action buttons:

1. `Auto-assign`
2. `Manually-assign`

---

# Auto-Assign Flow

If the admin clicks on `Auto-assign`, then automatically reassign all dependent records to the deactivating user's reporting manager (`reporting_user_id`).

---

## 1. Company Table Reassignment

### Account Manager Reassignment

If the user is assigned as `account_manager` in any company:

- Update `account_manager` with the deactivating user's `reporting_user_id`
- Update:
  - `created_by`
  - `updated_by`

for those company records.

---

### Lead CRM Reassignment

If the user is assigned as `lead_crm` in any company:

- Update `lead_crm` with the deactivating user's `reporting_user_id`
- Update:
  - `created_by`
  - `updated_by`

for those company records.

---

## 2. Policy Reassignment

For all policies where:

- `owner_id = deactivating user`

Update:

- `owner_id = reporting_user_id`
- `created_by = reporting_user_id`
- `updated_by = reporting_user_id`

---

## 3. Opportunity Reassignment

For all opportunities where:

- `owner_id = deactivating user`

Update:

- `owner_id = reporting_user_id`
- `created_by = reporting_user_id`
- `updated_by = reporting_user_id`

---

## 4. Endorsement Reassignment

For all endorsements where:

- `created_by = deactivating user`

Update:

- `created_by = reporting_user_id`
- `updated_by = reporting_user_id`

---

## 5. Opportunity Activity Map Reassignment

In `opportunity_activity_map` table, where:

- `owner_id = deactivating user`

Update:

- `owner_id = reporting_user_id`
- `created_by = reporting_user_id`
- `updated_by = reporting_user_id`

---

# Manual-Assign Flow

If the admin clicks on `Manually-assign`:

- Open a separate page/screen.
- Display all records associated with the employee being deactivated.

The admin should be able to manually reassign all dependent records to other users.

The page should include:

- Companies
- Policies
- Opportunities
- Endorsements
- Opportunity Activities
- Any other related entities owned/managed by the user

Each record should allow selecting another employee/user for reassignment.

---

## Validation Rules

- The `Deactivate` button should remain disabled until:
  - All dependent records are reassigned manually.

- The user should not be allowed to deactivate the employee if:
  - Any dependency is still assigned to the deactivating user.

---

# Reporting Hierarchy Reassignment

Before deactivating the user:

## User Hierarchy

- Get the `reporting_user_id` of the user being deactivated.
- Find all users in the `user` table whose `reporting_user_id` is equal to the deactivating user’s ID.
- Reassign those users to the deactivating user’s reporting manager.

---

## Employee Hierarchy

- Get the employee record of the user being deactivated.
- Fetch their `reporting_manager_employee_id`.
- Find all employees whose `reporting_manager_employee_id` is equal to the deactivating employee’s ID.
- Update those employees so their `reporting_manager_employee_id` becomes the deactivating employee’s reporting manager.

---

## Employee Hierarchy Table

After reassignment:

- Update the `employee_hierarchy` table to reflect the corrected hierarchy and maintain proper parent-child combinations.

---

# Mark Employee as Inactive

In the `employee` table:

- Update `status_lid` using the lookup value where:
  - `lookup_key = 'EMPLOYEE_STATUS_INACTIVE'`

---

# Handle User Type Logic

Based on `user_type_key`:

## Case 1

If `user_type_key` is:

- `'USER_TYPE_COMPANY_EMPLOYEE'`
- `'USER_TYPE_IIRM_EMPLOYEE'`

Then:

- Mark the user as inactive.

---

## Case 2

If `user_type_key` is:

- `'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'`

Then:

- Change the `user_type_key` to:
  - `'USER_TYPE_COMPANY_EMPLOYEE'`

---

# Mark User as Inactive

In the `user` table:

Update:

- `user_status_key = 'USER_STATUS_INACTIVE'`

Update `status_lid` using the lookup value where:

- `lookup_key = 'USER_STATUS_INACTIVE'`

---

# Important Notes

- Ensure all hierarchy updates, ownership reassignments, and status changes happen within a single database transaction.
- Roll back the transaction if any step fails.
- Maintain hierarchy consistency after reassignment.
- Avoid orphaned employee/user relationships.
- Ensure audit fields (`created_by`, `updated_by`) are updated correctly wherever applicable.
- Ensure no active dependency remains mapped to the deactivated employee.