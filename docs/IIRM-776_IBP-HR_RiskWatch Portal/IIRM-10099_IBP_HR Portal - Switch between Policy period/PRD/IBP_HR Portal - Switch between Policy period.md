IIRM-10099

### **Policy Period & Policy Switching**

---

### **1\. Objective**

To enable users (HR & Employee) to **seamlessly switch between different policy periods and policies**, ensuring visibility of historical, current, and upcoming coverage along with respective components.

---

### **2\. Policy Period Selection**

* Provide a **Policy Period Selector (Dropdown / Switcher)** at the top of the screen.  
* Example options:  
  * 2024 – 2025  
  * 2025 – 2026  
  * 2026 – 2027

---

### **Behavior**

* On selecting a **Policy Period**:  
  * System should load:  
    * All policies mapped to that period  
    * Associated enrolment, claims, and coverage data  
* Default selection:  
  * Current active policy period *(configurable)*

---

### **3\. Policy Selection Within Period**

* Once a policy period is selected:  
  * Display **list of policies under that period**  
* Example:  
  * GMC Policy  
  * GTL Policy  
  * GPA Policy

---

### **Behavior**

* User should be able to:  
  * Switch between policies  
  * View policy-specific data:  
    * Members  
    * Claims  
    * Premium  
    * Coverage

---

### **4\. Component-Level Selection**

* Within each policy:  
  * Show **components (as per configuration)**  
* Example (GMC):  
  * Base Cover  
  * Parental Cover  
  * Top-up

---

### **Behavior**

* User should be able to:  
  * Switch between components  
  * View component-specific:  
    * Coverage  
    * Members  
    * Premium

---

### **5\. Hierarchy Flow**

Policy Period  
  ↓  
Policy  
  ↓  
Component  
---

### **6\. UI/UX Behavior**

* Show **current selection clearly**:  
  * Selected Policy Period  
  * Selected Policy  
  * Selected Component  
* Suggested UI:  
  * Policy Period → Dropdown  
  * Policy → Tabs / Cards  
  * Component → Accordion / Sub-tabs

---

### **7\. Data Refresh Behavior**

* On change of:  
  * Policy Period → Full data refresh  
  * Policy → Contextual data refresh  
  * Component → Section-level update

---

### **8\. Business Rules**

* Policy Period must:  
  * Be pre-configured at company level  
* Each Policy Period:  
  * Can have multiple policies  
* Each Policy:  
  * Can have multiple components  
* Data should always reflect:  
  * Selected period \+ policy \+ component combination  
* Historical data:  
  * Must be view-only (no edits / enrolment)

---

### **9\. User Stories & Acceptance Criteria**

---

#### **User Story 1: Switch Policy Period**

**As a user,**  
 I want to switch between policy periods,  
 so that I can view historical and current data

**Acceptance Criteria**

* **Given** multiple policy periods exist  
* **When** user selects a period  
* **Then** system loads data for that period

---

#### **User Story 2: Switch Policy**

**As a user,**  
 I want to switch between policies,  
 so that I can view policy-specific information

**Acceptance Criteria**

* **Given** policies exist under selected period  
* **When** user selects a policy  
* **Then** system updates data accordingly

---

#### **User Story 3: Switch Components**

**As a user,**  
 I want to view components within a policy,  
 so that I understand coverage details

**Acceptance Criteria**

* **Given** components exist  
* **When** user selects a component  
* **Then** system displays component-level data

---

### **10\. UX Enhancements (Recommended)**

* Show **breadcrumb-style navigation**:

   2025–2026 \> GMC \> Base Cover

* Highlight:  
  * Active policy  
  * Active component  
* Show:  
  * “Expired” tag for past policies  
  * “Upcoming” tag for future policies 

