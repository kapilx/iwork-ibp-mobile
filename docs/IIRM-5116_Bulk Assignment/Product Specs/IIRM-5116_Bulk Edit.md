# Bulk Edit Module – Product Specification# Bulk Edit Module – Product Specification



## 1. Overview## 1. Overview



The Bulk Edit module enables authorized users to efficiently edit multiple records (opportunities, companies, policies) across the system. It streamlines operational workflows by allowing multi-select and bulk field updates, reducing manual effort and ensuring data consistency while maintaining comprehensive audit trails through the existing platform audit log mechanism.The Bulk Edit module enables authorized users to efficiently edit multiple records (opportunities, companies, policies) across the system. It streamlines operational workflows by allowing multi-select and bulk field updates, reducing manual effort and ensuring data consistency while maintaining comprehensive audit trails.



## 2. Supported Entities & Editable Fields## 2. Supported Entities & Editable Fields



### **Company Entity**### **Company Entity**

- **Editable Fields:**- **Editable Fields:**

    - `lead_crm` - Lead CRM assignment    - `lead_crm` - Lead CRM assignment

    - `account_manager` - Account Manager assignment      - `account_manager` - Account Manager assignment  

    - `status` - Company status (Active, Inactive, Suspended, etc.)    - `status` - Company status (Active, Inactive, Suspended, etc.)

    - `priority` - Priority level (High, Medium, Low)    - `priority` - Priority level (High, Medium, Low)



### **Sales Opportunity Entity**### **Sales Opportunity Entity**

- **Editable Fields:**- **Editable Fields:**

    - `bd_owner` - Business Development Owner assignment    - `bd_owner` - Business Development Owner assignment

    - `isg_owner` - ISG Owner assignment    - `isg_owner` - ISG Owner assignment

    - `status` - Opportunity status (New, In Progress, Qualified, Closed, etc.)    - `status` - Opportunity status (New, In Progress, Qualified, Closed, etc.)

    - `expiry_date` - Opportunity expiry date    - `expiry_date` - Opportunity expiry date



### **Policy Entity**### **Policy Entity**

- **Editable Fields:**- **Editable Fields:**

    - `lead_crm` - Lead CRM assignment    - `lead_crm` - Lead CRM assignment

    - `isg_owner` - ISG Owner assignment    - `isg_owner` - ISG Owner assignment

    - `account_manager` - Account Manager assignment    - `account_manager` - Account Manager assignment

    - `status` - Policy status (Active, Inactive, Expired, etc.)    - `status` - Policy status (Active, Inactive, Expired, etc.)



## 3. Filtering & Record Selection## 3. Filtering & Record Selection



### **Flexible Filtering**### **Flexible Filtering**

- Users can apply any combination of filters available on the listing screens- Users can apply any combination of filters available on the listing screens

- **No restrictions** on filter combinations for bulk edit operations- No restrictions on filter combinations for bulk edit operations

- Users have complete freedom to filter records by any criteria including:- Standard filters include:

    - User type filters (CRM, AM, BD, ISG)    - User type filters (CRM, AM, BD, ISG)

    - Status filters (Active, Inactive, etc.)    - Status filters (Active, Inactive, etc.)

    - Date range filters    - Date range filters

    - Custom field filters    - Custom field filters

    - Search filters    - Search filters

    - Any other available filters on the listing screens

### **Record Selection**

### **Record Selection**- Multi-select checkboxes are visible only to users with bulk edit privileges

- Multi-select checkboxes are visible **only to users with bulk edit privileges**- Users can select individual records or use "Select All" for visible records

- Users without bulk edit privileges see standard listing interface without checkboxes- Selection persists across pagination

- Users can select individual records or use "Select All" for visible records- Clear visual indicators for selected records

- Selection persists across pagination

- Clear visual indicators for selected records

## 4. Bulk Edit Workflow

## 4. Bulk Edit Workflow

### **Step 1: Access Control**

### **Step 1: Access Control**- Only users with bulk edit privileges can see multi-select checkboxes on listing screens

- Only users with bulk edit privileges can see multi-select checkboxes on listing screens- Only users with bulk edit privileges can see the "Bulk Edit" CTA button

- Only users with bulk edit privileges can see the "Bulk Edit" CTA button- Users without privileges see standard listing interface without bulk edit capabilities

- Users without privileges see standard listing interface without bulk edit capabilities        - Bulk assignment is only allowed when listings are filtered by a single user type, as transfers must occur between users of the same type.

        - After filtering by a single user type, the user must also select status as 'active'.

### **Step 2: Flexible Filtering & Selection**            - Only when status is 'active' and a single user type is selected, the multi-select checkbox is enabled for eligible listings.

- Users apply any desired filters to narrow down the record list (no restrictions)

- Once the filtered list is displayed, users can select records using checkboxes2. **Selecting Records**

- Selection can be made across multiple pages with persistent selection state    - After filtering by a single user type, the user can select one or more listings that are currently owned by that type and eligible per the entity’s criteria.



### **Step 3: Initiate Bulk Edit**3. **UI Behavior on Selection**

- Once records are selected, standard listing CTAs (e.g., "Save View", "Table Settings", "Create New") are hidden    - Once multiple listings are selected:

- "Bulk Edit" CTA becomes visible and accessible        - The "Save View", "Table Setting", and "Create New Opportunity" CTAs will disappear.

- Clicking "Bulk Edit" opens the bulk edit interface        - A "Bulk Edit" CTA will appear in their place.



### **Step 4: Field Selection & Editing**4. **Bulk Edit Action**

- Bulk edit interface displays available editable fields for the selected entity type    - When the user clicks the "Bulk Edit" CTA:

- Users can select which fields to edit from the supported field list        - The "To User" field is prefilled (if contextually available).

- For each selected field, users can:        - A user dropdown is shown, allowing the user to select the target user (of the same type) to whom the selected listings will be transferred.

    - Set a specific value for all selected records

    - Clear the field for all selected records5. **Assignment Confirmation**

    - Apply conditional logic (if supported)    - The user reviews the selected records and the chosen target user in a confirmation step.

    - Upon confirmation, ownership is transferred to the selected user.

### **Step 5: Preview & Validation**

- System shows preview of changes to be applied6. **Error Handling**

- Validation checks are performed on all selected records    - If some records fail validation, the system allows users to retry failed records after reviewing error details.

- Users can review and modify selections before confirmation

## 5. Audit & Logging

### **Step 6: Confirmation & Execution**

- Users confirm the bulk edit operation- All bulk assignment actions are logged in the backend for audit purposes.

- System processes records in batches- Audit log visibility for users will be defined later; currently, logs are accessible only to admins/managers.

- Progress indication provided for large operations

- Success/failure summary displayed upon completion## 6. Notifications (Updated)



### **Step 7: Error Handling**- If the source user is removed, trigger a notification to the target user that the listings are assigned, and send a confirmation notification to the manager.

- Failed records are identified with specific error messages- If the source user is not removed and the listing is being assigned for some reason, trigger notifications to both the source user and the target user, along with a confirmation notification to the manager.

- Users can retry failed records after addressing issues

- Partial success scenarios are handled gracefully## 7. Permissions (Updated)



## 5. Audit & Logging- Only Managers (with reportees) and the Super Admin can perform bulk assignments.

- If the logged-in user is an ISG Executive (or any role without reportees), the Bulk Assignment functionality is disabled for them.

- **All bulk edit transactions are logged using the existing Audit Log Mechanism in the platform**

- Each bulk edit operation creates detailed audit entries including:
    - Who performed the bulk edit
    - Which records were modified
    - What fields were changed (old values → new values)
    - Timestamp of the operation
    - Reason for the change (if provided)
- Individual record audit trails show bulk edit operations as part of the record's change history
- Audit logs follow the platform's existing audit log structure and retention policies

## 6. Notifications

### **Intelligent Notification Logic**
- **Ownership Changes**: 
    - If owner is changed: Notify old owner, new owner, and user performing the action
    - If old owner is inactive: Only notify new owner and performing user
- **Status Changes**: Notify affected users when status changes impact their workflow
- **Critical Field Changes**: Send alerts for changes to important fields
- **Bulk Operation Summary**: Send completion summary with success/failure counts
- **Configurable Notifications**: Users can configure which bulk edit types trigger notifications

## 7. Permissions

### **Role-Based Access Control**
- Bulk edit functionality is enabled only for users with explicit bulk edit privileges
- Permission levels determine:
    - Which users can see multi-select checkboxes
    - Which users can access the "Bulk Edit" CTA
    - Which fields can be edited by different user roles
- Field-level permissions control access to sensitive fields
- Users can only bulk edit records they have permission to modify individually

### **Security Enforcement**
- System validates permissions before displaying bulk edit interface
- Each field modification is validated against user permissions
- Unauthorized access attempts are logged and blocked
- Sensitive fields may require additional authorization levels

## 8. User Experience

### **Seamless Integration**
- Bulk edit functionality integrates seamlessly with existing listing screens
- No disruption to users without bulk edit privileges
- Consistent UI patterns across all entity types
- Responsive design for desktop and mobile devices

### **Performance Optimization**
- Efficient handling of large record selections
- Background processing for bulk operations
- Real-time progress tracking
- Optimized database operations to minimize system impact

## 9. Data Integrity

### **Validation & Consistency**
- Pre-validation of all operations before execution
- Business rule enforcement during bulk updates
- Data consistency checks across related records
- Rollback capabilities for critical operations
- Comprehensive error reporting and recovery options