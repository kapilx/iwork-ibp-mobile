<<<<<<< Updated upstream
### 

IIRM-8341  
IIRM-10095

### **HR User Profile & Role Switching**

* The **HR User Profile screen** should remain **consistent with the Employee Profile UI**, ensuring a unified experience across roles.  
* All standard profile details (Employee ID, DOB, Gender, Contact Information, etc.) should be displayed **as-is from the employee portal design**.

---

### **Role Switch Functionality**

* A **“Switch to HR View” / “Switch to Employee View” toggle** should be provided **near the Logout option (top-right corner)**.

---

### **Behavior**

* **Default View:**  
  * If the user has both roles (Employee \+ HR), system loads **Employee View by default** *(configurable if needed)*.  
* **On Switch to HR View:**  
  * Enable HR-specific modules:  
    * Enrolment (Members)  
    * Claims (including process claims)  
    * Reports  
    * Dashboard (HR insights)  
  * Show organization-level data based on **RBAC hierarchy (Branch / Unit / Location / All)**  
* **On Switch to Employee View:**  
  * Show personal data only:  
    * Personal policies  
    * Dependents  
    * Claims  
    * Profile

---

### **Access Control Rules**

* Role switch should be visible **only if user has both roles assigned**  
* If user has only one role:  
  * Do **not show switch option**

---

### **UX Behavior**

* Switching roles should:  
  * Not require logout  
  * Refresh the UI dynamically  
  * Maintain session  
* Show a **visual indicator**:  
  * “Viewing as HR”  
  * “Viewing as Employee” 

### **Optional Enhancements (Recommended)**

* Confirmation popup (optional):  
  * “You are switching to HR view. Continue?”  
* Remember last selected role (configurable)

Switch between the policy and policy period

* User should be able to switch between the policy period ( 2024 \- 2025 / 2025 \- 2026 / 2026-2027  
* Each policy year might have multiple policies within it, user should be able to switch between the policies and components

=======
# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Provide a unified user profile screen for HR users with role-switching capability between HR View and Employee View, along with policy period and policy switching within each view.
- **Business Value:** Eliminates the need for separate logins for dual-role users (employee + HR), improving operational efficiency and reducing session management overhead.
- **User Value:** Users who hold both HR and Employee roles can seamlessly switch between views without logging out, with each view showing the appropriate data scope.
- **Module Type:** Core
- **Phase 1 Scope:** HR User Profile screen (consistent with Employee Portal UI), role switch toggle (HR View / Employee View), policy period switcher, policy switcher within a period, and component-level switcher.

---

## 2. Scope & Boundaries

- **In Scope:**
    - HR User Profile screen displaying standard profile details (Employee ID, DOB, Gender, Contact Information, etc.) consistent with the Employee Portal design
    - Role switch toggle near the logout option (top-right corner): "Switch to HR View" / "Switch to Employee View"
    - Role switch behavior: load HR-specific modules on switch to HR View; load personal data only on switch to Employee View
    - Policy Period selector: switch between policy years (e.g., 2024–2025, 2025–2026, 2026–2027)
    - Policy selector within a period: switch between policies (e.g., GMC, GTL, GPA)
    - Component selector within a policy: switch between components (e.g., Base Cover, Parental Cover, Top-Up)
    - Visual indicator showing current view (Viewing as HR / Viewing as Employee)
    - RBAC-based data scoping for HR View (Branch / Unit / Location / All)

- **Out of Scope:**
    - Profile field editing (displayed as-is from employee portal design)
    - User role assignment or permission management (managed in admin configuration)
    - Multi-company switching
    - Offline mode or session persistence across devices

- **Dependencies:**
    - Authentication/session module — to maintain session across role switches without logout
    - RBAC module — to determine which data scope the HR user has access to
    - Policy module — to provide the list of policy periods, policies, and components
    - Employee Portal profile module — HR profile UI must match the employee portal design

- **Dependents:**
    - All HR-specific modules (Dashboard, Enrolment, Claims, CD Management, etc.) — receive policy period, policy, and component context from this module's selectors
    - Employee-facing modules (Personal Policies, Dependents, Claims, Profile) — receive personal context when in Employee View

---

## 3. User Personas & Contexts

- **Persona:** Dual-Role User (Employee + HR)
    - **Goals:** Access both personal insurance data and HR management capabilities without separate logins; switch context instantly based on the task at hand.
    - **Context:** A user who is both an employee covered under the company's insurance policy and an HR administrator responsible for managing the company's group policy.
    - **Pain Points:** Currently requires separate logins or browser sessions to access HR and Employee functionality; switching between roles is cumbersome and time-consuming.

- **Persona:** HR-Only User
    - **Goals:** Access HR management modules directly without being presented irrelevant employee-facing content.
    - **Context:** A user assigned only the HR role; the role switch option should not be shown to them.
    - **Pain Points:** No current issue — this user type has a simpler access model.

---

## 4. User Stories

### Dual-Role User (Employee + HR)

- **US-HRP-001:** As a dual-role user, I want to see a role switch toggle so that I can switch between HR and Employee views without logging out.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user has both Employee and HR roles assigned, when they are logged in, then the role switch toggle ("Switch to HR View" / "Switch to Employee View") must be visible near the logout option in the top-right corner.
        - Given the user has only one role assigned, when they are logged in, then the role switch toggle must not be visible.

- **US-HRP-002:** As a dual-role user, I want the system to load HR-specific modules when I switch to HR View so that I can manage policy and member data.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user is in Employee View, when they click "Switch to HR View", then the system should load HR-specific modules: Enrolment (Members), Claims (including process claims), Reports, and Dashboard (HR insights), showing organization-level data scoped by the user's RBAC hierarchy.
        - Given the role switch occurs, when the UI refreshes, then it must not require a logout; the session must be maintained.
        - Given the HR View is active, when the user is in HR View, then a visual indicator "Viewing as HR" must be displayed.

- **US-HRP-003:** As a dual-role user, I want the system to show only my personal data when I switch to Employee View so that I can check my own coverage.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user is in HR View, when they click "Switch to Employee View", then the system should show only personal data: Personal Policies, Dependents, Claims, and Profile.
        - Given the Employee View is active, when the user is in Employee View, then a visual indicator "Viewing as Employee" must be displayed.
        - Given the default load behavior is configured, when a dual-role user logs in for the first time, then Employee View should load by default.

- **US-HRP-004:** As an HR user, I want to switch between policy periods so that I can view data for historical, current, and upcoming policy years.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given multiple policy periods exist (e.g., 2024–2025, 2025–2026, 2026–2027), when the user selects a policy period from the selector, then the system should load all policies mapped to that period along with associated enrolment, claims, and coverage data.
        - Given the system loads, when no manual selection is made, then the current active policy period should be selected by default.
        - Given a past policy period is selected, when data is displayed, then it should be view-only with no editing, enrolment, or data modification permitted.

- **US-HRP-005:** As an HR user, I want to switch between policies within a selected period so that I can view policy-specific data.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given a policy period is selected, when the user selects a policy (e.g., GMC, GTL, GPA), then the system should update data to reflect the selected policy including members, claims, premium, and coverage.

- **US-HRP-006:** As an HR user, I want to switch between components within a selected policy so that I understand component-specific coverage and member data.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given a policy is selected, when components are shown (e.g., Base Cover, Parental Cover, Top-Up), when the user selects a component, then the system should display component-specific coverage, members, and premium data.

---

## 5. Functional Requirements

- **FR-HRP-001:** The HR User Profile screen must display standard profile details (Employee ID, DOB, Gender, Marital Status, Contact Information) consistent with the Employee Portal profile UI design. All fields are read-only.

- **FR-HRP-002:** A role switch toggle must be displayed near the logout option (top-right corner) only for users who have both HR and Employee roles assigned. The toggle must read "Switch to HR View" when in Employee View and "Switch to Employee View" when in HR View.

- **FR-HRP-003:** Switching to HR View must load HR-specific modules (Enrolment, Claims, Reports, Dashboard) and display organization-level data scoped by the user's RBAC hierarchy (Branch / Unit / Location / All). The switch must not require logout; it must refresh the UI dynamically while maintaining the session.

- **FR-HRP-004:** Switching to Employee View must display personal data only: Personal Policies, Dependents, Claims, and Profile. Organization-level data must not be accessible in Employee View.

- **FR-HRP-005:** The default view on login for a dual-role user must be Employee View (configurable if needed).

- **FR-HRP-006:** A visible indicator must be displayed at all times showing the current active view: "Viewing as HR" or "Viewing as Employee".

- **FR-HRP-007:** A Policy Period selector (dropdown or switcher) must be provided at the top of the HR View screen, showing all configured policy periods for the company. Default selection must be the current active period.

- **FR-HRP-008:** Within a selected policy period, a policy selector must display all policies available under that period (e.g., GMC, GTL, GPA). Switching policies must refresh all contextual data.

- **FR-HRP-009:** Within a selected policy, a component selector must display all components configured for that policy (e.g., Base Cover, Parental Cover, Top-Up). Switching components must update component-specific data sections.

- **FR-HRP-010:** Historical (past) policy periods must be accessible in read-only mode; no edits, enrolment changes, or data modifications are permitted for past periods.

---

## 6. Business Rules & Logic

- **BR-HRP-001:** The role switch toggle must only be visible if the logged-in user has both Employee and HR roles explicitly assigned. Single-role users must never see the toggle.
    - **Example:** An HR-only administrative user should see the HR modules directly with no toggle.
    - **Edge Cases:** If a user's role is changed mid-session (e.g., HR role revoked), the toggle must disappear on the next UI refresh or navigation event.

- **BR-HRP-002:** Switching roles must not require a logout or re-authentication; a single session must support both views.
    - **Example:** A user switches from Employee View to HR View and back five times in a single session without being logged out.
    - **Edge Cases:** If the session expires during a role switch attempt, the user must be redirected to the login page.

- **BR-HRP-003:** HR View must always respect the user's RBAC hierarchy for data scoping.
    - **Example:** A branch-level HR user must only see employee and policy data for their branch, even in HR View.
    - **Edge Cases:** If RBAC configuration is missing, access must default to the most restrictive scope (no data shown) rather than the broadest.

- **BR-HRP-004:** Historical policy periods must be view-only; no enrolment, edits, or modifications are permitted.
    - **Example:** Selecting the 2023–2024 period shows read-only data; all action buttons (Add, Edit, Delete) are hidden or disabled.
    - **Edge Cases:** If a policy period is marked as "upcoming", it should also be view-only until it becomes active.

- **BR-HRP-005:** The hierarchy for data context is: Policy Period → Policy → Component. Changing a higher-level selection resets lower-level selections to their defaults.
    - **Example:** Switching the policy period resets the selected policy and component to default values for the new period.
    - **Edge Cases:** If the new period has only one policy, it should be auto-selected.

---

## 7. User Interface Requirements

- **Screen:** HR User Profile
    - **Purpose:** Display user's personal profile details in a consistent, read-only format.
    - **Key Elements:** Profile fields as per Employee Portal design (Employee ID, DOB, Gender, Marital Status, Contact Info); role switch toggle in top-right corner.
    - **User Flow:** User clicks profile icon → profile screen opens → reads details → optionally switches role.
    - **Validation Rules:** All fields are read-only; no edit actions available in Phase 1.

- **Screen:** Role Switch Toggle (Global — Top Right)
    - **Purpose:** Allow dual-role users to switch between HR and Employee view contexts.
    - **Key Elements:** Toggle button labeled "Switch to HR View" or "Switch to Employee View"; current view indicator ("Viewing as HR" / "Viewing as Employee").
    - **User Flow:** User clicks toggle → UI refreshes to the target view → visual indicator updates.
    - **Validation Rules:** Toggle must be hidden for single-role users; switching must not cause data loss or session interruption.

- **Screen:** Policy Period / Policy / Component Selector (HR View — Global)
    - **Purpose:** Set the data context for all HR modules.
    - **Key Elements:** Policy Period dropdown, Policy selector (tabs or cards), Component selector (accordion or sub-tabs).
    - **User Flow:** HR user selects period → policies for that period load → user selects policy → components load → user selects component → all HR modules update.
    - **Validation Rules:** Current active period is pre-selected; past periods are labeled "Expired"; upcoming periods are labeled "Upcoming"; hierarchical selection resets lower levels on parent change.

---

## 8. Data Requirements

- **Input Data:**
    - User profile data (Employee ID, DOB, Gender, Contact Info) from the employee profile system
    - Role assignments per user from the RBAC/authentication system
    - Policy periods, policies, and components from the Policy module
    - RBAC scope definition (Branch / Unit / Location / All) for the HR user

- **Output Data:**
    - Current role view context (HR or Employee) broadcasted to all child modules
    - Selected policy period, policy, and component context broadcasted to all HR modules
    - Profile fields displayed in read-only format

- **Stored Data:**
    - Selected role view may be stored in session state (not persisted across logins unless "remember last role" is enabled)
    - Selected policy period, policy, and component stored in application state for the duration of the session

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /user/profile` — returns current user's profile details
    - `GET /user/roles` — returns assigned roles for the current user
    - `GET /policy-periods?companyId={id}` — returns list of policy periods for the company
    - `GET /policies?periodId={id}&companyId={id}` — returns policies under the selected period
    - `GET /components?policyId={id}` — returns components under the selected policy
    - `POST /user/switch-role` — records the role switch event (optional, for audit logging)

- **Events:**
    - Role switch triggers a global context update event that all active modules subscribe to, causing them to reload data in the appropriate scope.
    - Policy period, policy, or component change triggers a context broadcast that all HR modules subscribe to for data refresh.

- **Data Flow:**
    - User logs in → default view (Employee) loads → role toggle appears if dual-role.
    - User switches to HR View → RBAC scope fetched → HR modules load with scoped data.
    - User selects policy period → policies loaded → user selects policy → components loaded → HR modules update.

- **Error Handling:**
    - If role switch fails (e.g., RBAC lookup error), show an error message and keep the user in their current view.
    - If policy period data is unavailable, selectors show an error state with retry; previously loaded module data remains visible.

---

## 10. Performance & Quality Requirements

- **Performance:**
    - Role switch must complete (UI refresh to new view) within 2 seconds.
    - Policy period / policy / component change must refresh all dependent sections within 2 seconds.

- **Reliability:**
    - Role switch must be idempotent; clicking the toggle multiple times rapidly must not create duplicate switch events or corrupt the session.

- **Security:**
    - Role switch must be validated server-side; the client must not be able to access HR data by manipulating the view state without a valid HR role assignment.
    - RBAC enforcement must occur at the API level, not only in the UI.
    - All API endpoints must require authenticated sessions.

- **Usability:**
    - The active view indicator must be permanently visible (e.g., in the header or sidebar) so users always know which view they are in.
    - Breadcrumb navigation must show selected Policy Period > Policy > Component at all times in HR View.

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in support tickets related to dual-role access confusion or re-login requirements.

- **User Metrics:**
    - % of dual-role users who use the role switch feature at least once per week.
    - Average number of role switches per session for dual-role users.

- **Technical Metrics:**
    - Role switch response time under 2 seconds at p95.
    - Zero incidents of cross-role data leakage (HR user seeing data outside their RBAC scope).

- **Adoption Metrics:**
    - % of dual-role users who actively use both views within the same session.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** RBAC lookup fails during role switch to HR View.
    - **User Experience:** Error message: "Unable to switch to HR View. Please try again."
    - **System Behavior:** User remains in Employee View; no partial HR data is loaded.

- **Error Case 2:** Policy period data is unavailable.
    - **User Experience:** Policy period selector shows an error state with a retry option.
    - **System Behavior:** HR modules may show stale or empty data until the selector is resolved.

- **Error Case 3:** Session expires during a role switch.
    - **User Experience:** User is redirected to the login page with a message: "Your session has expired. Please log in again."
    - **System Behavior:** No data is exposed; session is fully terminated.

- **Edge Case 1:** A dual-role user's HR role is revoked while they are in HR View.
    - **Business Logic:** On the next navigation or data refresh, the RBAC check fails; the user is switched to Employee View and the toggle is hidden.
    - **User Impact:** User loses HR access without needing to log out and back in.

- **Edge Case 2:** A policy period has only one policy.
    - **Business Logic:** The single policy is auto-selected when the period is chosen; the policy selector is shown but pre-populated.
    - **User Impact:** No extra click required; component selection proceeds immediately.

- **Edge Case 3:** A user switches role view while a form or action is in progress (e.g., mid-claim intimation).
    - **Business Logic:** Role switch navigates away from the current screen; unsaved data is lost.
    - **User Impact:** A confirmation prompt should warn: "Switching views will discard unsaved changes. Continue?"

---

## 13. Future Considerations

- **Enhancement 1:** "Remember last selected role" — persist the last active role view across login sessions as a configurable preference.
- **Enhancement 2:** Optional confirmation popup before role switch ("You are switching to HR view. Continue?") as a configurable setting.
- **Enhancement 3:** Role-specific notification badge — show pending items (e.g., endorsements awaiting action) on the HR view indicator.
- **Enhancement 4:** Profile editing — allow HR users to update certain profile fields directly (scope TBD).
- **Enhancement 5:** Multi-company support — for HR users with access to multiple companies, add a company selector as an additional context layer.

---

## 14. Acceptance Criteria Summary

- [ ] HR User Profile screen displays standard profile details consistent with the Employee Portal design in read-only format.
- [ ] Role switch toggle is visible only for users with both Employee and HR roles assigned.
- [ ] Switching to HR View loads HR-specific modules and scopes data to the user's RBAC hierarchy without requiring logout.
- [ ] Switching to Employee View shows personal data only; organization-level data is inaccessible.
- [ ] Default view on login for dual-role users is Employee View.
- [ ] A persistent visual indicator shows the current active view ("Viewing as HR" or "Viewing as Employee").
- [ ] Policy Period selector defaults to the current active period; switching periods triggers a full data refresh.
- [ ] Policy selector within a period shows all available policies; switching updates all contextual data.
- [ ] Component selector within a policy shows all configured components; switching updates component-specific sections.
- [ ] Historical policy periods are accessible in read-only mode; no edits or enrolment changes are permitted.
- [ ] RBAC enforcement occurs at the API level; HR users cannot access data outside their assigned scope.
- [ ] Role switch is idempotent and does not require logout or re-authentication.

---

## 15. Open Questions

- **Question 1:** Should the default view on login be configurable per company or per user, or is "always default to Employee View" a fixed rule?
- **Question 2:** Should role switching trigger an audit log entry (who switched, when, from which view to which)?
- **Question 3:** Should the "Upcoming" policy period be accessible for preview only (no data) or should it show pre-configured coverage and member plans?
- **Question 4:** Is there a requirement to show a confirmation popup before role switching, and if so, should it be configurable or always shown?
- **Question 5:** When a dual-role user is in HR View and switches the policy period to a historical one, should the Employee View also reflect that historical period or always show the current period?
>>>>>>> Stashed changes
