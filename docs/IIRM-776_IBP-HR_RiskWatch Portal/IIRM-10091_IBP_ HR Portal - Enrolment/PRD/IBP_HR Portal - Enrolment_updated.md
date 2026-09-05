# PRD - Phase 1

## 1. Objective

To enable HR users to view, manage, and monitor employee enrolment and member data for policies through a centralized module. The module should provide comprehensive visibility of employees, dependents, enrolment status, and activity, along with operational controls such as access management, tagging, and data export.

---

## 2. Functional Requirements

### 2.1 Navigation & Structure
- **FR-ENR-001:** Enrolment module should be available in the left menu
    - On click, open a screen with tabs:
        - Enrolment
        - Endorsement (separate specification)
        - Employee Analytics (TBD)
        - Reports (TBD)

### 2.2 KPI Cards
- **FR-ENR-002:** Display the following KPI cards:
    - **Total Lives** → Total active lives under the policy (Till Date)
    - **Employees** → Total employee count (Employee only count)
    - **Dependents** → Total dependent count (Only Dependent Counts)
    - **Total Additions** → Additions from inception + endorsements (Total Employee + Dependents)
    - **Total Deletions** → Deletions from endorsements (Total Employee + Dependents)
    - **Total Enrolled** → Total enrolled lives

### 2.3 Bulk Upload
- **FR-ENR-003:** Support upload of (Separate story available):
    - Inception files
    - Endorsement files
    - Uploaded files should be stored and tracked (detailed requirements TBD)

### 2.4 Employee Listing Table
- **FR-ENR-004:** Display employee listing table with columns:
    - **Employee Number** (Inception / Endorsement File / enrolment details)
    - **Employee Name** (with tags: VIP / Blocked) (Inception / Endorsement File)
    - **Gender** (Inception / Endorsement File / enrolment details)
    - **DOB** (Month & Year only) (Inception / Endorsement File)
    - **Age** (Inception / Endorsement File / enrolment details)
    - **Email** (Inception / Endorsement File / enrolment details)
    - **Mobile** (Inception / Endorsement File / enrolment details)
    - **Enrolment Status** (Inception / Endorsement File/ enrolment details)
    - **Addition Type** (Inception / Endorsement) (Addition type action)
    - **Sum Insured** (Inception / Endorsement) (Addition type action)
    - **Dependents** (Inception / Endorsement File / enrolment details)
        - Display count
        - On click, show dependent list
    - **E-Card** (Import from TPA)
        - View option
        - Opens E-Card similar to Employee Portal
    - **Status** (Active / Inactive) (Based on addition deletion)
    - **Last Login** (timestamp) (Last time user logged in)
    - **Actions** (Separate)

### 2.5 Filters
- **FR-ENR-005:** Provide the following filters:
    - Member Type (Employee / Parent / Spouse / Partner / Siblings)
    - Status (Active / Inactive)
    - Enrolment Status (Enrolled / In Progress / Not Enrolled)
    - Gender (Male / Female / Others)
    - Addition Type (Inception / Endorsement)

### 2.6 Search
- **FR-ENR-006:** Search by:
    - Employee Name
    - Email ID
    - Phone Number

### 2.7 Actions
- **FR-ENR-007:** Employee action capabilities:

#### 2.7.1 Block Access
- **CTA:** Block Access
- **Show confirmation popup:**
    - "Do you wish to block access for Employee <Name>?"
    - Options: Yes / No
- **On Yes:**
    - Block user login
    - Show "Blocked" tag on employee name
    - Prevent login to employee portal
- **On No:**
    - Return to listing screen
- **Error message for blocked users:**
    - "Your access is blocked. Please contact your HR."

#### 2.7.2 Tag as VIP
- **CTA:** Tag as VIP
- **Show confirmation popup:**
    - "Do you want to tag this employee as VIP?"
    - Options: Yes / No
- **On Yes:**
    - Tag employee as VIP
    - Display VIP tag in employee name column

#### 2.7.3 Edit Employee
- **Allow following details of employee to edit:**
    - Alternate Phone number (Add / Update)
    - Alternate Mail ID (Add / update)

#### 2.7.4 Reset Password
- **This action is to share the reset password link to the employee**
- **When share, employee should be able to receive the reset password link similar to current functionality and reset the password**

#### 2.7.5 Extend Window Period (TBD)

### 2.8 Export
- **FR-ENR-008:** Export employee data as CSV file
    - Export should respect:
        - Applied filters
        - Search results

### 2.9 Employee Details (Drill-down View)
- **FR-ENR-009:** Employee Details screen requirements:
    - **Requirement:** When an HR user clicks on the Employee ID / Employee Name from the enrolment listing table, the system should open an Employee Details screen.
    
    - **The screen should display:**
        
        **1. Quick Info Section (Top):**
        - Total Dependents
        - Total Claims
        - Net Premium
        - Total Sum Insured
        
        **2. Tab-wise Sections:**
        - **Personal Info:**
            - Full Name, Employee ID, Email, Phone, Age, Gender (Employee Table)
        - **Dependents:**
            - Name, Relationship, Gender, Date of Birth (Dependent table)
        - **Policy Enrolment:**
            - Policy Name, Sum Insured, Effective Date, Expiry Date, Policy Status, Enrolment Status (Show policy wise separately)
        - **Claim History:**
            - Display claim details similar to the Claims Corner in the Employee Portal

---

## 3. User Stories

### User Story 1: Access Enrolment Module
**As an HR user,**  
I want to access the enrolment module from the left menu,  
so that I can manage employee enrolment data.

**Acceptance Criteria**
- Given I am logged in as an HR user
- When I click on the Enrolment option in the left menu
- Then the system should open the Enrolment screen with tabs: Enrolment, Endorsement, Employee Analytics, Reports
- And the Enrolment tab should be active by default

### User Story 2: View KPI Cards
**As an HR user,**  
I want to view key performance indicators at a glance,  
so that I can quickly understand the enrolment status.

**Acceptance Criteria**
- Given I am on the Enrolment tab
- When the screen loads
- Then I should see KPI cards displaying: Total Lives, Employees, Dependents, Total Additions, Total Deletions, Total Enrolled
- And all values should reflect the current policy data

### User Story 3: View Employee Listing
**As an HR user,**  
I want to view a comprehensive employee listing table,  
so that I can see all employee details in one place.

**Acceptance Criteria**
- Given I am on the Enrolment tab
- When the screen loads
- Then I should see an employee listing table with all defined columns
- And employee names should display VIP/Blocked tags when applicable
- And dependent count should be clickable to show dependent list
- And E-Card should have a view option

### User Story 4: Filter Employee Data
**As an HR user,**  
I want to filter employee data by various criteria,  
so that I can find specific employees quickly.

**Acceptance Criteria**
- Given I am viewing the employee listing
- When I apply filters for Member Type, Status, Enrolment Status, Gender, or Addition Type
- Then the listing should update to show only employees matching the selected criteria
- And I should be able to apply multiple filters simultaneously

### User Story 5: Search Employees
**As an HR user,**  
I want to search for employees by name, email, or phone,  
so that I can quickly locate specific employees.

**Acceptance Criteria**
- Given I am viewing the employee listing
- When I enter search criteria in the search field (Employee Name, Email ID, or Phone Number)
- Then the system should filter the results to show matching employees
- And the search should support both exact and partial matches

### User Story 6: Block Employee Access
**As an HR user,**  
I want to block employee access to the portal,  
so that I can restrict login for specific employees.

**Acceptance Criteria**
- Given I select an employee from the listing
- When I click "Block Access" action
- Then I should see a confirmation popup asking "Do you wish to block access for Employee <Name>?"
- When I click "Yes", then the employee should be blocked from portal login and show "Blocked" tag
- When I click "No", then I should return to the listing screen without changes

### User Story 7: Tag Employee as VIP
**As an HR user,**  
I want to tag employees as VIP,  
so that I can identify priority employees.

**Acceptance Criteria**
- Given I select an employee from the listing
- When I click "Tag as VIP" action
- Then I should see a confirmation popup asking "Do you want to tag this employee as VIP?"
- When I click "Yes", then the employee should display a VIP tag in the name column
- When I click "No", then I should return to the listing screen without changes

### User Story 8: Edit Employee Details
**As an HR user,**  
I want to edit employee contact details,  
so that I can keep employee information up to date.

**Acceptance Criteria**
- Given I select an employee from the listing
- When I click "Edit Employee" action
- Then I should be able to add/update Alternate Phone number and Alternate Mail ID
- And changes should be saved and reflected in the employee listing

### User Story 9: Reset Employee Password
**As an HR user,**  
I want to reset employee passwords,  
so that employees can regain access to their accounts.

**Acceptance Criteria**
- Given I select an employee from the listing
- When I click "Reset Password" action
- Then the system should send a password reset link to the employee's email
- And the employee should receive the link and be able to reset their password

### User Story 10: Export Employee Data
**As an HR user,**  
I want to export employee data as CSV,  
so that I can use the data for reporting and analysis.

**Acceptance Criteria**
- Given I am viewing the employee listing (with or without applied filters/search)
- When I click the export option
- Then the system should download a CSV file containing all currently visible employee data
- And the export should respect any applied filters and search criteria

### User Story 11: View Employee Details
**As an HR user,**  
I want to view detailed employee information,  
so that I can access comprehensive employee data in one place.

**Acceptance Criteria**
- Given I am viewing the employee listing
- When I click on an Employee ID or Employee Name
- Then the system should open an Employee Details screen
- And I should see Quick Info section with: Total Dependents, Total Claims, Net Premium, Total Sum Insured
- And I should see tabs for: Personal Info, Dependents, Policy Enrolment, Claim History
- And each tab should display the relevant detailed information for that employee

### User Story 12: Upload Bulk Files
**As an HR user,**  
I want to upload inception and endorsement files,  
so that I can add employee data in bulk.

**Acceptance Criteria**
- Given I am on the Enrolment tab
- When I access the bulk upload functionality
- Then I should be able to upload inception files and endorsement files
- And uploaded files should be stored and tracked by the system