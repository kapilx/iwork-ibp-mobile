# **1\. Objective**

Employees often do not know:

* Have I completed all the required steps?

* Has my enrollment been submitted?

* Are any details missing?

* Is any correction needed?

* Is my coverage active yet?

The **Enrolment Status** module answers these questions by showing a **timeline of steps**, their statuses, and any pending actions.

---

# **2\. Enrollment Stages for Employee**

Only **5 stages** are relevant for the employee:

| Stage No. | Stage Name | Description |
| ----- | ----- | ----- |
| 1 | Personal Details | Completing/confirming employee profile data |
| 2 | Dependent Details | Adding/editing/removing dependents as per policy rules |
| 3 | Plan Selection | Selecting employer-provided basic plans & add-ons |
| 4 | Enrollment Review | Reviewing summary before final confirmation |
| 5 | Enrollment Submitted | Employee successfully submits enrollment |

**FINAL OUTPUT:**  
 Employee knows whether enrollment is fully submitted or still pending.

---

# **3\. Status Values**

Each stage has one of the following statuses:

* **Not Started**

* **In Progress**

* **Completed**

* **Requires Correction** (system-detected validation issue)

* **Submitted (final stage only)**

No manual approval stages exist.

---

# **4\. Detailed Stage Specification**

---

## **Stage 1: Personal Details**

### **Description**

Employee verifies and updates personal data like name, gender, DOB, address, mobile, etc.

### **System Rules**

* Mandatory fields must be completed.

* Auto-validations (DOB, mobile format, email format).

### **Stage Completion Event**

→ Employee saves personal details.

### **Possible Status States**

* Not Started

* In Progress

* Completed

---

## **Stage 2: Dependent Details**

### **Description**

Employee adds or edits dependents (spouse, children, parents etc.) based on company policy.

### **System Validations**

* Relationship allowed under policy rules

* Max no. of dependents per relationship

* Age limits (child \<25, parents \>60 etc.)

* Duplicate dependent checks

### **Stage Completion Event**

→ All dependent details pass validation.

### **Possible Status States**

* Not Started

* In Progress

* Completed

* Requires Correction (if validation fails)

---

## **Stage 3: Plan Selection**

### **Description**

Employee selects:

* Base plan (auto-selected if only one)

* Top-up plans

* Add-on policies (optional)

* Other insurance variations provided by employer

### **UI Rules**

* Single plan → auto-expanded

* Dual plan → comparison layout

* Multiple plans → carousel/grid

### **Stage Completion Event**

→ Selected plans stored in system.

### **Possible Status States**

* Not Started

* In Progress

* Completed

---

## **Stage 4: Enrollment Summary Review**

### **Description**

Shows summary of:

* Personal details

* Dependent details

* Selected plans

* Premiums (if applicable)

Allows employee to edit any section.

### **Stage Completion Event**

→ Employee clicks **Proceed to Submit**.

### **Possible Status States**

* Not Started

* In Progress

* Completed

---

## **Stage 5: Enrollment Submitted (Final Stage)**

### **Description**

Employee finalizes the enrollment process.

### **Trigger**

→ Employee clicks **Submit Enrollment**.

### **System Response**

* Locks earlier steps (read-only) unless corrections are allowed by corporate rules.

* Shows confirmation message.

* Sends standard email/SMS confirmation (if enabled).

### **Possible Status States**

* Submitted

* Requires Correction (if system flags missing data)

---

# **5\. Enrolment Status Page – UI/UX Specification**

---

## **5.1 Layout**

### **A. Header**

`Enrollment Status – <Policy Year>`

### **B. 5-Step Progress Timeline**

Each step represented as:

* Grey → Not Started

* Blue → In Progress

* Green → Completed

* Orange → Requires Correction

### **C. Status Cards for Each Stage**

Each card contains:

* Stage Name

* Status Chip (e.g., Completed / Pending)

* Last updated timestamp

* Short description

* Action button (e.g., “Continue”, “Edit”, “Fix Now”, “View Summary”)

---

# **6\. Functional Behavior**

---

## **6.1 Auto-Status Update Rules**

| Action | Status Change |
| ----- | ----- |
| Employee opens personal details page | In Progress |
| Employee saves a step | Completed |
| System finds invalid dependent data | Requires Correction |
| Employee clicks Submit | Stage 5 → Submitted |

---

## **6.2 Correction Flow (Employee Only)**

If the system detects inconsistency (e.g., missing DOB, invalid dependent age):

* A red alert bar appears

* A message shows: "Some details need your attention"

* Clicking “Fix Now” takes the user to the exact section

* After fixing → Status resets to Completed

---

## **6.3 Read-Only Restrictions**

After Stage 5 (Submitted):

* Steps 1–4 become non-editable.

* Depending on corporate rules, "Correction Allowed" flag may reopen steps.

---

# **7\. Data Model (Simplified)**

### **Employee Enrollment Status Table**

| Field | Type | Purpose |
| ----- | ----- | ----- |
| employee\_id | string | Unique identifier |
| policy\_year | string | Enrollment period |
| personal\_status | enum | Not Started/In Progress/Completed |
| dependent\_status | enum | Not Started/In Progress/Completed/Correction |
| plan\_status | enum | Not Started/In Progress/Completed |
| summary\_status | enum | Not Started/In Progress/Completed |
| submission\_status | enum | Submitted/Correction Required |
| updated\_at | datetime | Last update |

---

# **8\. APIs Needed**

### **GET /employee/enrollment/status**

Returns current status for all 5 stages.

### **POST /employee/enrollment/update-status**

System uses this internally after each step is completed.

### **POST /employee/enrollment/submit**

Marks final stage as Submitted.

---

# **9\. Notifications (Optional for Now)**

Triggered after final submission:

* **Email**: "Your enrollment has been successfully submitted."

* **SMS** (optional): "Enrollment submitted."

---

# **10\. Edge Cases**

| Scenario | System Behavior |
| ----- | ----- |
| Employee starts but doesn’t finish | Status shows stage in-progress |
| Dependent invalid | Status \= Requires Correction |
| Employee tries to edit after submission | System blocks editing |
| Data load failure | Status shows "System Error – Try Again" |

