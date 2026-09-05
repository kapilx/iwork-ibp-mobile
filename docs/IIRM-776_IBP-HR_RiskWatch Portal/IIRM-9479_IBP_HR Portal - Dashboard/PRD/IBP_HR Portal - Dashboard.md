# PRD - Phase 1

## 1. Objective

To provide HR users with a comprehensive, policy-level dashboard that delivers actionable insights on premium, enrolment, claims, and member analytics, enabling informed decision-making through visual summaries, filters, and drill-down capabilities.

---

## 2. Functional Requirements

### 2.1 Policy Selector
- **FR-DASH-001:** Display a policy selector to switch between the policies
    - User can switch between policies that available for the company
    - All dashboard data should refresh based on selected policy

### 2.2 Quick Insights
- **FR-DASH-002:** Display the following metrics:
    - **Inception Premium**
        - Premium calculated for all lives added during inception for the selected policy
        - Based on configuration: Per Life / Per Family
    - **Addition Premium**
        - Premium for lives added through endorsements (All endorsements for selected till date)
        - Excludes inception premium
    - **Deletion Premium**
        - Premium of lives removed through endorsements (All endorsements for selected policies till date)
    - **Total Premium**
        - Total Premium = Net Payable Premium as of today
        - Formula: Total Premium = (Inception Premium + Addition Premium - Deletion Premium)
        - (Including both Base + Top-Up components)
    - **Top-Up Premium**
        - Total premium applicable for top-up components only

### 2.3 Policy Cards (Component-Level)
- **FR-DASH-003:** Display component-level cards (For Dashboard "All Policies" show all the policies, for policy level, show only at policy level):
    - **Card Information:**
        - Total Lives (Total Lives associated with that policy till date)
        - Net Premium (Net Premium for the policy as of the day - Inception Premium + Addition Premium)
        - CD Balance (Associated with the CD account linked, balance as of today)
        - Total Claims Count (Total Claims reported for the policy)
        - Policy Period
        - Enrolment: (Total enrolments done - COUNT)
            - Percentage and amount (visual representation)
        - Claim Utilization: (Total Sum insured utilised)
            - Percentage and amount (visual representation)
        - Member Activity:
            - Total additions (Total additions in inspection + Endorsements)
            - Total deletions (Total Deletions in the endorsements)
    - **Interaction:**
        - Clicking a card (From All policies dashboard tab) navigates to:
        - Navigate to respective policy dashboard screen and show all the insights along with the components of that policy (Add on policies)

### 2.4 Claims Insights
- **FR-DASH-004:** Provide comprehensive claims analysis:
    - **Views:**
        - Stacked View
        - Table View
    - **Switch Options:**
        - Amount
        - Count
    - **Filters:**
        - Time Period (Month / Quarterly / Halfyear / manual date entry)
        - Claim Type (Cashless / Reimbursement)
        - Claim Status (Paid / Outstanding / Rejected / Closed / Denied)
            - All the status to be discussed if to add in the claim intimation form or as of now go with the 2 status like employee portal)
        - Member Type (Self / Spouse / Children / Parent / Others)
    - **Static Insight:**
        - Cashless vs Reimbursement % (always visible)

### 2.5 Claim Ratio
- **FR-DASH-005:** Display Claim Ratio %
    - **Formula:** Claim Ratio = Incurred Claim Amount / Earned Premium
    - **Where:**
        - Incurred Claim Amount = Total Outstanding / Settled Claim amount
        - Earned Premium = (Total Premium × Number of days) / 365
        - (Inception Premium + Addition Premium - Deletion premium = Total Premium)

### 2.6 Member Insights
- **FR-DASH-006:** Provide demographic analysis:
    - **Demographics:**
        1. **Inception**
            - 👉 Represents members added at the start of the policy
            - Metric: Total members added during inception
            - Split: Employee vs Dependents (%)
            - Example:
                - Employees: 100
                - Dependents: 50
                - Total Lives: 150
                - Employee % = (100 / 150) × 100 = 67%
                - Dependent % = (50 / 150) × 100 = 33%
        2. **Additions (Endorsements)**
            - 👉 Members added after inception through:
                - New joiners
                - Life events (marriage, child birth, etc.)
            - Metric: Total additions across all endorsements
            - Split: Employee vs Dependents (%)
            - Example:
                - Employees added: 20
                - Dependents added: 30
                - Total Additions: 50
                - Employee % = (20 / 50) × 100 = 40%
                - Dependent % = (30 / 50) × 100 = 60%
        3. **Deletions (Endorsements)**
            - 👉 Members removed during policy period due to:
                - Employee exits
                - Dependent removal (divorce, death, etc.)
            - Metric: Total deletions across all endorsements
            - Split: Employee vs Dependents (%)
            - Example:
                - Employees deleted: 10
                - Dependents deleted: 15
                - Total Deletions: 25
                - Employee % = (10 / 25) × 100 = 40%
                - Dependent % = (15 / 25) × 100 = 60%
        4. **Total Lives (Current)**
            - 👉 Represents current active members (Inception + Additions − Deletions)
            - Metric: Total active lives till date
            - Split: Employee vs Dependents (%)

    - **Enrolment Status:**
        - Logged In (Total number of employees logged at least once - If created password and not logged atleast once dont include in this list)
        - Not Logged In
        - Enrolment Confirmed (total number of users confirmed Enrolment) (Dont include total enrolments submitted by default choices)

### 2.7 Top 10 Insights
- **FR-DASH-007:** Display graphical insights for:
    - Top 10 Employees by claim amount
    - Top 10 Hospitals
    - Top 10 Diseases
    - **Requirements:**
        - Reflect only active (non-deleted) members
        - Top-up premium must:
            - Be calculated separately from base premium
        - Navigation from dashboard must:
            - Maintain context (selected policy filter)

---

## 3. User Stories

### User Story 1: Policy Selection
**As an HR user,**  
I want to switch between policies,  
so that I can view policy-specific insights.

**Acceptance Criteria**
- Given multiple policies are available
- When the user selects a policy from the selector
- Then all dashboard data (premium, claims, members, cards, insights) should refresh based on the selected policy
- And the selected policy context should persist across navigation from the dashboard

### User Story 2: View Premium Insights (Quick Insights)
**As an HR user,**  
I want to view premium breakdown,  
so that I understand cost distribution and current liability.

**Acceptance Criteria**
- Given a policy is selected
- When the dashboard loads
- Then the system should display:
    - Inception Premium
    - Addition Premium (excluding inception)
    - Deletion Premium (excluding inception)
    - Total Premium (Net Payable = Inception + Additions − Deletions, including Base + Top-Up)
    - Top-Up Premium (separately calculated)
- And premium calculation should respect configuration (Per Life / Per Family)
- And Top-Up Premium should not be double-counted in Total Premium display

### User Story 3: View Component-Level Policy Cards
**As an HR user,**  
I want to view component-level insights,  
so that I can analyze each policy component.

**Acceptance Criteria**
- Given a policy is selected
- When the dashboard loads
- Then the system should display component-level cards with:
    - Total Lives
    - Net Premium
    - CD Balance
    - Total Claims Count
    - Policy Period
    - Enrolment % and amount
    - Claim Utilization % and amount
    - Member Activity (additions & deletions)
- When the user clicks on a card
- Then the system should navigate to the Members screen
- And apply the selected policy and component as filters

### User Story 4: Analyze Claims Insights
**As an HR user,**  
I want to analyze claims using multiple views and filters,  
so that I can understand claim trends and patterns.

**Acceptance Criteria**
- Given claims data exists
- When the dashboard loads
- Then the system should display claims insights in:
    - Stacked View
    - Table View
- When the user switches between Amount and Count
- Then the visualization should update accordingly
- When the user applies filters:
    - Time Period (1–12 months)
    - Claim Type (Cashless / Reimbursement)
    - Claim Status (Paid / Outstanding / Rejected / Closed / Denied)
    - Member Type (Self / Spouse / Children / Parent / Others)
- Then insights should dynamically update
- And Cashless vs Reimbursement % should always be visible as a static insight

### User Story 5: View Claim Ratio
**As an HR user,**  
I want to view claim ratio,  
so that I can evaluate policy performance.

**Acceptance Criteria**
- Given claims and premium data are available
- When the dashboard loads
- Then Claim Ratio % should be displayed
- And should be calculated as:
    - Incurred Claim Amount = Outstanding Cashless + Reimbursement
    - Earned Premium = (Total Premium × Number of days) / 365
- And the calculation should update based on selected policy and time filters

### User Story 6: Member Demographics Insights
**As an HR user,**  
I want to view member demographics across lifecycle stages,  
so that I understand employee vs dependent distribution.

**Acceptance Criteria**
- Given member data exists
- When the dashboard loads
- Then the system should display segmentation for:
    - Inception (Employee vs Dependents %)
    - Additions (Employee vs Dependents %)
    - Deletions (Employee vs Dependents %)
    - Total (Employee vs Dependents %)

### User Story 7: Enrolment Status Insights
**As an HR user,**  
I want to view enrolment status,  
so that I can track user participation.

**Acceptance Criteria**
- Given enrolment data exists
- When the dashboard loads
- Then the system should display:
    - Logged In users
    - Not Logged In users
    - Enrolment Confirmed users
- And values should be shown in both count and percentage

### User Story 8: Top 10 Claim Insights
**As an HR user,**  
I want to view top claim contributors,  
so that I can identify high-impact areas.

**Acceptance Criteria**
- Given claim data exists
- When the dashboard loads
- Then the system should display:
    - Top 10 Employees by claim amount
    - Top 10 Hospitals
    - Top 10 Diseases
- And only active (non-deleted) members should be considered
- And insights should respect selected policy and applied filters