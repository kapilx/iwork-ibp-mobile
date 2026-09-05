# Product Requirements Document (PRD)
## IIRM-8064: Nudges & Insights (AI-iWork Productivity)

---

### **Document Information**
| Field | Value |
|-------|-------|
| **Project ID** | IIRM-8064 |
| **Feature Name** | Nudges & Insights (AI-iWork Productivity) |
| **Version** | 1.0 |
| **Created Date** | November 28, 2025 |
| **Author** | Product Team |
| **Status** | Draft |
| **Target Release** | Release-1 (Leadership & Manager Roles) |

---

## **1. Executive Summary**

The Nudges & Insights feature transforms static data displays into actionable intelligence by providing contextual, AI-powered nudges and insights that guide users toward optimal business decisions and actions. This feature enhances the existing iWork platform by converting data visualization into proactive business intelligence.

---

## **2. Problem Statement**

### **Current State**
- The application displays numerous statistics and quick cards with numerical data
- Users see data but lack actionable guidance on what steps to take
- Information is static and doesn't provide contextual business intelligence
- No proactive suggestions for improving business operations
- Users must interpret data independently without system-guided recommendations

### **Pain Points**
- **Information Overload**: Users overwhelmed by data without clear action items
- **Missed Opportunities**: Critical business insights buried in numbers
- **Reactive Decision Making**: Users respond to problems after they occur
- **Low Data Utilization**: Rich data assets underutilized for business growth
- **Manual Analysis**: Time-consuming manual interpretation of business metrics

---

## **3. Business Objectives**

### **Primary Goals**
1. **Revenue Growth**: Increase business generation through proactive insights
2. **Operational Efficiency**: Improve business operations through data-driven nudges
3. **User Engagement**: Transform passive data consumption to active decision-making
4. **Competitive Advantage**: Leverage AI for intelligent business recommendations

### **Success Metrics**
| Metric | Baseline | Target | Timeline |
|--------|----------|---------|----------|
| User Engagement with Nudges | 0% | 70% | 3 months |
| Business Actions Taken | TBD | +40% | 6 months |
| Revenue Impact from Nudges | $0 | +15% | 12 months |
| Time to Decision Making | TBD | -30% | 6 months |
| User Satisfaction Score | Current NPS | +20 points | 6 months |

---

## **4. Target Users & Personas**

### **Release-1 Scope**
- **Primary Users**: Leadership team members
- **Secondary Users**: Managers
- **Application Roles**: "Leadership" and "Manager"

### **User Personas**

#### **Leadership Persona**
- **Role**: Strategic decision makers
- **Goals**: Drive business growth, optimize operations, identify opportunities
- **Pain Points**: Need quick insights across multiple business areas
- **Usage Pattern**: Dashboard reviews, strategic planning sessions
- **Nudge Preferences**: High-level strategic insights, trend analysis, opportunity identification

#### **Manager Persona**
- **Role**: Operational team leaders
- **Goals**: Improve team performance, meet targets, resolve operational issues
- **Pain Points**: Need actionable insights for day-to-day management
- **Usage Pattern**: Regular monitoring, team performance tracking
- **Nudge Preferences**: Team-specific insights, performance optimization, resource allocation

---

## **5. Feature Requirements**

### **5.1 Core Business Alert Framework**

#### **Business Alert Components**
1. **Alert Title**: Brief, attention-grabbing business headline
2. **Alert Message**: Dynamic message with contextual business values
3. **Alert Condition**: Business rules determining when alert appears
4. **Alert Source**: System-generated vs User-created classification
5. **Call-to-Action (CTA)**: Button/link for immediate business response

#### **Functional Requirements**

##### **FR-01: Smart Business Alert System**
- System must provide personalized business alerts based on current business state
- Alert content must update automatically as business data changes
- Alerts must be customized based on user role (Leadership vs Manager)

##### **FR-02: Flexible Nudge Management**
- Business team can configure and modify business alerts through Excel files
- Support for both automatic system alerts and custom team notifications
- Ability to create bulk notifications for team-wide communication

##### **FR-03: Custom Team Notifications**
- Managers can create custom business alerts for their teams
- Bulk notification capability for important team announcements
- Pre-built templates for common business scenarios

##### **FR-04: Real-time Business Intelligence**
- AI-powered automatic alert generation based on business conditions
- Instant data processing and alert trigger evaluation
- Context-aware alert presentation based on current page and user activity

##### **FR-05: Interactive Action Buttons**
- Each business alert includes relevant action button for immediate response
- Action buttons navigate directly to appropriate business pages with pre-applied filters
- Context preservation during navigation to maintain workflow efficiency

##### **FR-06: Non-Intrusive Alert Display**
- Dedicated alert section on each business page
- Alert display that doesn't interfere with normal business operations
- User can dismiss alerts with preference memory for personalization

### **5.2 Business Intelligence Features**

#### **BI-01: Smart Nudge Generation**
The system will automatically analyze business data and generate relevant nudges based on:
- **Business Performance Gaps**: Identify areas where targets are not being met
- **Process Bottlenecks**: Highlight workflow stages where items are stuck
- **Risk Identification**: Flag potential issues before they become problems
- **Opportunity Recognition**: Surface business growth opportunities

#### **BI-02: Personalized Business Insights**
- **Role-Based Intelligence**: Different nudges for Leadership vs Manager roles
- **User-Specific Data**: Show only data relevant to the logged-in user's scope
- **Priority-Based Display**: Most critical business issues displayed prominently
- **Actionable Recommendations**: Every nudge includes specific next steps

#### **BI-03: Real-Time Business Monitoring**
- **Live Data Updates**: Nudges reflect current business state
- **Performance Tracking**: Monitor key business metrics continuously
- **Trend Analysis**: Identify patterns in business performance
- **Exception Reporting**: Alert users to unusual business conditions

---

## **6. Page-Specific Nudge Requirements**

This section defines the **MANDATORY** nudge titles and content that must appear on each page when users navigate to respective sections. All nudge titles and descriptions are required as specified and contain dynamic values that will update based on real-time data.

### **6.1 CSV File Mapping & Future Reference Framework**

| CSV File | Application Page | Nudge Count | Status |
|----------|-----------------|-------------|---------|
| `IIRM-8064_Nudges_01_Dashboard_27-Nov-2025.csv` | Dashboard | 10 | Mandatory |
| `IIRM-8064_Nudges_02_Company_27-Nov-2025.csv` | My Company | 10 | Mandatory |
| `IIRM-8064_Nudges_03_Contacts_27-Nov-2025.csv` | My Contacts | 10 | Mandatory |
| `IIRM-8064_Nudges_04_SO_27-Nov-2025.csv` | MY SO | 13 | Mandatory |
| `IIRM-8064_Nudges_05_RO_27-Nov-2025.csv` | My RO | 18 | Mandatory |
| `IIRM-8064_Nudges_06_Policy_27-Nov-2025.csv` | Manage Policies | 16 | Mandatory |
| `IIRM-8064_Nudges_07_Meetings_27-Nov-2025.csv` | Manage Engagements → Meetings | 10 | Mandatory |
| `IIRM-8064_Nudges_08_Task_27-Nov-2025.csv` | Manage Engagements → Tasks | 15 | Mandatory |

**Future Framework**: When new CSV files are added, they should follow the naming convention `IIRM-8064_Nudges_[ID]_[PageName]_[Date].csv` and be mapped to the corresponding application page.

### **6.2 Dashboard Page Nudges**

**Source File**: `IIRM-8064_Nudges_01_Dashboard_27-Nov-2025.csv`
**Application Page**: Dashboard
**Total Nudges**: 10 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to the Dashboard, the system **MUST** display all 10 nudges with the exact titles and dynamic statements specified below. Dynamic variables will be populated with real-time data:

1. **Lead Qualification Alert**
   - Nudge - Dynamic Statement: "@leadCount leads are unqualified. Schedule a review session to improve lead qualification rate?"
   - Example: "140 leads are unqualified. Schedule a review session to improve lead qualification rate?"
   
2. **Pending Proposals**
   - Nudge - Dynamic Statement: "@qualifiedLeadCount qualified leads haven't received proposals yet. Generate proposal drafts for top prospects?"
   - Example: "85 qualified leads haven't received proposals yet. Generate proposal drafts for top prospects?"
   
3. **Pending Client Response**
   - Nudge - Dynamic Statement: "@proposalCount proposals are pending client response. Send follow-up reminders to move them to negotiation?"
   - Example: "53 proposals are pending client response. Send follow-up reminders to move them to negotiation?"
   
4. **Stalled Negotiations**
   - Nudge - Dynamic Statement: "@dealCount deals are in negotiation for over @stallDuration weeks. Schedule review meetings with sales managers?"
   - Example: "14 deals are in negotiation for over 2 weeks. Schedule review meetings with sales managers?"
   
5. **Renewal Quotes Pending**
   - Nudge - Dynamic Statement: "@policyCount policies due for renewal haven't been quoted yet. Generate renewal quotes?"
   - Example: "15 policies due for renewal haven't been quoted yet. Generate renewal quotes?"
   
6. **Renewal Follow-ups Due**
   - Nudge - Dynamic Statement: "@renewalCount quoted renewals need follow-up. Schedule client calls for this week?"
   - Example: "20 quoted renewals need follow-up. Schedule client calls for this week?"
   
7. **At-Risk Renewals**
   - Nudge - Dynamic Statement: "@riskCount renewals in negotiation are at risk of loss due to pricing. Review competitive pricing options?"
   - Example: "5 renewals in negotiation are at risk of loss due to pricing. Review competitive pricing options?"
   
8. **Win-Back Opportunity**
   - Nudge - Dynamic Statement: "@lostPolicyCount policies were lost this month. Initiate win-back campaigns for competitive losses?"
   - Example: "15 policies were lost this month. Initiate win-back campaigns for competitive losses?"
   
9. **Mined Business Below Target**
   - Nudge - Dynamic Statement: "Mined business is at @currentPercentage%, below the @targetPercentage% target. Review cross-sell opportunities with existing clients?"
   - Example: "Mined business is at 72%, below the 75% target. Review cross-sell opportunities with existing clients?"
   
10. **New Business Target Exceeded!**
    - Nudge - Dynamic Statement: "New business exceeded target by @achievementPercentage%! Recognize top performers and share best practices with the team?"
    - Example: "New business exceeded target by 11%! Recognize top performers and share best practices with the team?"

### **6.3 My Company Page Nudges**

**Source File**: `IIRM-8064_Nudges_02_Company_27-Nov-2025.csv`
**Application Page**: My Company
**Total Nudges**: 10 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to My Company page, the system **MUST** display all 10 nudges:

1. **Incomplete Company Profiles**
   - Nudge - Dynamic Statement: "@companyCount companies have incomplete profiles. Add missing details to improve data quality."
   - Example: "5 companies have incomplete profiles. Add missing details to improve data quality."
   
2. **Outdated Contact Details**
   - Nudge - Dynamic Statement: "@companyCount companies have outdated contact details. Refresh contact info for better communication."
   - Example: "3 companies have outdated contact details. Refresh contact info for better communication."
   
3. **Red-Flag Companies**
   - Nudge - Dynamic Statement: "@redFlagCount companies marked RED require attention. Schedule follow-up activities."
   - Example: "4 companies marked RED require attention. Schedule follow-up activities."
   
4. **Qualified Leads Ready for Conversion**
   - Nudge - Dynamic Statement: "@qualifiedLeadCount qualified leads are ready for conversion. Move them to prospect stage."
   - Example: "12 qualified leads are ready for conversion. Move them to prospect stage."
   
5. **Unassigned Relationship Managers**
   - Nudge - Dynamic Statement: "@unassignedCount companies don't have assigned relationship managers. Allocate resources."
   - Example: "7 companies don't have assigned relationship managers. Allocate resources."
   
6. **Quarterly Client Review Due**
   - Nudge - Dynamic Statement: "@clientCount clients are due for quarterly client review. Book meetings now."
   - Example: "8 clients are due for quarterly client review. Book meetings now."
   
7. **Industry Intelligence Update**
   - Nudge - Dynamic Statement: "Update industry intelligence for @companyCount companies to enhance sales strategy."
   - Example: "Update industry intelligence for 6 companies to enhance sales strategy."
   
8. **Policies Expiring This Month**
   - Nudge - Dynamic Statement: "@policyCount policies expiring this month. Initiate renewal opportunities."
   - Example: "15 policies expiring this month. Initiate renewal opportunities."
   
9. **No Recent Interaction**
   - Nudge - Dynamic Statement: "Log activities for @companyCount companies with no recent interactions in @dayCount+ days."
   - Example: "Log activities for 10 companies with no recent interactions in 30+ days."
   
10. **Incomplete Address Information**
    - Nudge - Dynamic Statement: "@companyCount companies have incomplete address information. Update for accurate records."
    - Example: "4 companies have incomplete address information. Update for accurate records."

### **6.4 My Contacts Page Nudges**

**Source File**: `IIRM-8064_Nudges_03_Contacts_27-Nov-2025.csv`
**Application Page**: My Contacts
**Total Nudges**: 10 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to My Contacts page, the system **MUST** display all 10 nudges:

1. **Incomplete Contact Profiles**
   - Nudge - Dynamic Statement: "@contactCount contacts have incomplete profiles. Update missing fields for better engagement."
   - Example: "18 contacts have incomplete profiles. Update missing fields for better engagement."
   
2. **Invalid / Outdated Email IDs**
   - Nudge - Dynamic Statement: "@contactCount contacts have bounced emails. Update valid email IDs to ensure successful communication."
   - Example: "6 contacts have bounced emails. Update valid email IDs to ensure successful communication."
   
3. **Unreachable Contacts**
   - Nudge - Dynamic Statement: "@contactCount contacts marked unreachable. Try alternate contact details or verify availability."
   - Example: "9 contacts marked unreachable. Try alternate contact details or verify availability."
   
4. **No Recent Interaction**
   - Nudge - Dynamic Statement: "@contactCount contacts have had no interaction for @dayCount+ days. Engage to maintain relationship."
   - Example: "22 contacts have had no interaction for 45+ days. Engage to maintain relationship."
   
5. **Decision Maker Not Identified**
   - Nudge - Dynamic Statement: "@companyCount companies have contacts but no decision-maker assigned. Identify and tag the right person."
   - Example: "7 companies have contacts but no decision-maker assigned. Identify and tag the right person."
   
6. **Contacts without Company Mapping**
   - Nudge - Dynamic Statement: "@contactCount contacts are not linked to any company. Assign them to the appropriate organization."
   - Example: "4 contacts are not linked to any company. Assign them to the appropriate organization."
   
7. **Duplicate Contacts Detected**
   - Nudge - Dynamic Statement: "@duplicateCount possible duplicate contacts found. Review and merge records."
   - Example: "5 possible duplicate contacts found. Review and merge records."
   
8. **Birthday / Anniversary Due**
   - Nudge - Dynamic Statement: "@contactCount contacts have birthdays/anniversaries this week. Schedule greetings."
   - Example: "12 contacts have birthdays/anniversaries this week. Schedule greetings."
   
9. **Contact Role Change Needed**
   - Nudge - Dynamic Statement: "@contactCount contacts may have updated roles or designations. Refresh information."
   - Example: "8 contacts may have updated roles or designations. Refresh information."
   
10. **Inactive Decision Makers**
    - Nudge - Dynamic Statement: "@decisionMakerCount decision makers have been inactive for @dayCount+ days. Re-engage with updated proposals or check-ins."
    - Example: "3 decision makers have been inactive for 60+ days. Re-engage with updated proposals or check-ins."

### **6.5 MY SO (Sales Opportunities) Page Nudges**

**Source File**: `IIRM-8064_Nudges_04_SO_27-Nov-2025.csv`
**Application Page**: MY SO
**Total Nudges**: 13 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to MY SO page, the system **MUST** display all 13 nudges:

1. **Opportunities Stuck in Early Stages**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
   - Example: "18 opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
   
2. **RFP Data Pending**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities have missing RFP data. Complete the information to avoid delays in broking slip generation."
   - Example: "10 opportunities have missing RFP data. Complete the information to avoid delays in broking slip generation."
   
3. **Quotes Not Entered**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities have broking slips generated but quotes are not yet entered. Update quotes to proceed with QCR."
   - Example: "7 opportunities have broking slips generated but quotes are not yet entered. Update quotes to proceed with QCR."
   
4. **QCR Pending**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities have pending QCR generation. Complete QCR to move opportunities into negotiation."
   - Example: "5 opportunities have pending QCR generation. Complete QCR to move opportunities into negotiation."
   
5. **Stalled Negotiations**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities are in Negotiation stage for more than @dayCount days. Take follow-up action."
   - Example: "9 opportunities are in Negotiation stage for more than 10 days. Take follow-up action."
   
6. **Placement Slip Pending**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities cleared negotiation but placement slip is not created. Create the placement slip to proceed."
   - Example: "6 opportunities cleared negotiation but placement slip is not created. Create the placement slip to proceed."
   
7. **Premium Calculation Pending**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities require premium calculations for closure. Complete premium calculations to finalize the opportunity."
   - Example: "4 opportunities require premium calculations for closure. Complete premium calculations to finalize the opportunity."
   
8. **Held Cover Note Pending**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities have premium calculated but held cover note not issued. Issue cover note to avoid delays."
   - Example: "3 opportunities have premium calculated but held cover note not issued. Issue cover note to avoid delays."
   
9. **Policy Documentation Delayed**
   - Nudge - Dynamic Statement: "@opportunityCount opportunities awaiting policy doclet / docket generation. Complete documentation for successful closure."
   - Example: "6 opportunities awaiting policy doclet / docket generation. Complete documentation for successful closure."
   
10. **Client Follow-Up Required**
    - Nudge - Dynamic Statement: "@opportunityCount opportunities require client follow-up (last activity > @dayCount days). Re-engage to prevent drop-off."
    - Example: "11 opportunities require client follow-up (last activity > 7 days). Re-engage to prevent drop-off."
    
11. **High-Value Opportunities Pending Action**
    - Nudge - Dynamic Statement: "@opportunityCount high-value opportunities (> @valueThreshold) require immediate updates. Prioritize for faster closure."
    - Example: "5 high-value opportunities (> ₹50L) require immediate updates. Prioritize for faster closure."
    
12. **Opportunities Near Expected Closure Date**
    - Nudge - Dynamic Statement: "@opportunityCount opportunities are nearing their expected closure date. Confirm status and expedite final steps."
    - Example: "8 opportunities are nearing their expected closure date. Confirm status and expedite final steps."
    
13. **Loss Risks Identified**
    - Nudge - Dynamic Statement: "@opportunityCount opportunities flagged at risk due to pricing or delay. Take corrective measures."
    - Example: "3 opportunities flagged at risk due to pricing or delay. Take corrective measures."

### **6.6 My RO (Renewal Opportunities) Page Nudges**

**Source File**: `IIRM-8064_Nudges_05_RO_27-Nov-2025.csv`
**Application Page**: My RO
**Total Nudges**: 18 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to My RO page, the system **MUST** display all 18 nudges:

1. **RSR Creation Pending**
   - Nudge - Dynamic Statement: "@renewalCount renewal opportunities are due for RSR creation. Complete RSR to initiate renewal workflow."
   - Example: "9 renewal opportunities are due for RSR creation. Complete RSR to initiate renewal workflow."
   
2. **Renewal KDM Meeting Pending**
   - Nudge - Dynamic Statement: "@renewalCount renewal opportunities require KDM meetings. Schedule meetings to finalize mandate renewal."
   - Example: "6 renewal opportunities require KDM meetings. Schedule meetings to finalize mandate renewal."
   
3. **Mandate Entry Pending**
   - Nudge - Dynamic Statement: "@renewalCount renewals have not completed Mandate Details Entry. Update mandate info to proceed with RFP."
   - Example: "7 renewals have not completed Mandate Details Entry. Update mandate info to proceed with RFP."
   
4. **RFP Data Collection Pending**
   - Nudge - Dynamic Statement: "@renewalCount renewals have incomplete RFP data. Complete data to move to ISG planning."
   - Example: "10 renewals have incomplete RFP data. Complete data to move to ISG planning."
   
5. **ISG Planning Delays**
   - Nudge - Dynamic Statement: "@renewalCount renewals are pending ISG planning. Initiate ISG discussions for timely slip creation."
   - Example: "4 renewals are pending ISG planning. Initiate ISG discussions for timely slip creation."
   
6. **Broking Slip Not Generated**
   - Nudge - Dynamic Statement: "@renewalCount renewals are ready for broking slips but not generated. Complete the slip to progress quoting."
   - Example: "8 renewals are ready for broking slips but not generated. Complete the slip to progress quoting."
   
7. **Quotes Not Entered**
   - Nudge - Dynamic Statement: "@renewalCount renewals have broking slips generated but quotes not entered. Update quotes to move ahead."
   - Example: "5 renewals have broking slips generated but quotes not entered. Update quotes to move ahead."
   
8. **QCR Pending**
   - Nudge - Dynamic Statement: "@renewalCount renewals need QCR generation. Complete QCR to proceed with negotiation."
   - Example: "3 renewals need QCR generation. Complete QCR to proceed with negotiation."
   
9. **Negotiation Stalled**
   - Nudge - Dynamic Statement: "@renewalCount renewals have been in negotiation for over @dayCount days. Follow up to avoid renewal leakage."
   - Example: "6 renewals have been in negotiation for over 10 days. Follow up to avoid renewal leakage."
   
10. **Placement Slip Pending**
    - Nudge - Dynamic Statement: "@renewalCount renewals have completed negotiation but placement slip is not created. Generate slip to proceed."
    - Example: "4 renewals have completed negotiation but placement slip is not created. Generate slip to proceed."
    
11. **Premium Calculation Pending**
    - Nudge - Dynamic Statement: "@renewalCount renewals require premium calculation for closure. Complete calculations to finalize renewal."
    - Example: "3 renewals require premium calculation for closure. Complete calculations to finalize renewal."
    
12. **Held Cover Note Pending**
    - Nudge - Dynamic Statement: "@renewalCount renewals have premium calculated but held cover note not issued. Issue cover note to avoid delays."
    - Example: "2 renewals have premium calculated but held cover note not issued. Issue cover note to avoid delays."
    
13. **Policy Documentation Pending**
    - Nudge - Dynamic Statement: "@renewalCount renewal opportunities have pending Policy Docket/Doclet. Complete documentation for closure."
    - Example: "5 renewal opportunities have pending Policy Docket/Doclet. Complete documentation for closure."
    
14. **Upcoming Renewals This Month**
    - Nudge - Dynamic Statement: "@renewalCount renewals are due within the next @dayCount days. Prioritize engagement."
    - Example: "12 renewals are due within the next 30 days. Prioritize engagement."
    
15. **At-Risk Renewals**
    - Nudge - Dynamic Statement: "@renewalCount renewals are marked high risk due to pricing or competitor pressure. Take corrective action."
    - Example: "4 renewals are marked high risk due to pricing or competitor pressure. Take corrective action."
    
16. **Renewal Follow-Up Required**
    - Nudge - Dynamic Statement: "@renewalCount renewal opportunities have no follow-up in @dayCount+ days. Engage clients to avoid drop-off."
    - Example: "9 renewal opportunities have no follow-up in 7+ days. Engage clients to avoid drop-off."
    
17. **High-Value Renewals Pending Action**
    - Nudge - Dynamic Statement: "@renewalCount high-value renewals (> @valueThreshold) require immediate attention. Prioritize engagement."
    - Example: "3 high-value renewals (> ₹50L) require immediate attention. Prioritize engagement."
    
18. **Renewal Lead Conversion Opportunity**
    - Nudge - Dynamic Statement: "@leadCount renewal leads have become qualified for cross-sell. Move them into New Opportunity stage."
    - Example: "7 renewal leads have become qualified for cross-sell. Move them into New Opportunity stage."

### **6.7 Manage Policies Page Nudges**

**Source File**: `IIRM-8064_Nudges_06_Policy_27-Nov-2025.csv`
**Application Page**: Manage Policies
**Total Nudges**: 16 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to Manage Policies page, the system **MUST** display all 16 nudges:

1. **Policies Pending Issuance**
   - Nudge - Dynamic Statement: "@policyCount policies are pending issuance from insurer. Follow-up to expedite."
   - Example: "14 policies are pending issuance from insurer. Follow-up to expedite."
   
2. **Policy Documents Not Uploaded**
   - Nudge - Dynamic Statement: "@policyCount issued policies do not have policy document uploaded. Add documents for compliance."
   - Example: "11 issued policies do not have policy document uploaded. Add documents for compliance."
   
3. **Held Cover Notes Expiring**
   - Nudge - Dynamic Statement: "@coverNoteCount held cover notes are expiring within the next @dayCount days. Convert to final policy."
   - Example: "6 held cover notes are expiring within the next 7 days. Convert to final policy."
   
4. **Endorsements Pending**
   - Nudge - Dynamic Statement: "@policyCount policies have pending endorsement requests. Complete endorsements to avoid servicing delays."
   - Example: "9 policies have pending endorsement requests. Complete endorsements to avoid servicing delays."
   
5. **Unassigned Policy Owners**
   - Nudge - Dynamic Statement: "@policyCount policies do not have assigned owners/CRM. Allocate responsible user."
   - Example: "4 policies do not have assigned owners/CRM. Allocate responsible user."
   
6. **Premium Payment Pending**
   - Nudge - Dynamic Statement: "@policyCount policies have pending premium payments. Follow up with client/finance team."
   - Example: "7 policies have pending premium payments. Follow up with client/finance team."
   
7. **Policy Renewal Due Soon**
   - Nudge - Dynamic Statement: "@policyCount policies are due for renewal within next @dayCount days. Initiate renewal process."
   - Example: "18 policies are due for renewal within next 30 days. Initiate renewal process."
   
8. **Policy Lapsed / At Risk**
   - Nudge - Dynamic Statement: "@policyCount policies are at risk of lapse due to non-payment or delay. Take urgent action."
   - Example: "3 policies are at risk of lapse due to non-payment or delay. Take urgent action."
   
9. **Missing Policy Schedule**
   - Nudge - Dynamic Statement: "@policyCount policies do not have policy schedule uploaded. Update records."
   - Example: "5 policies do not have policy schedule uploaded. Update records."
   
10. **Claims Reported but No FNOL Logged**
    - Nudge - Dynamic Statement: "@policyCount policies have reported claims but no FNOL recorded. Log FNOL immediately."
    - Example: "4 policies have reported claims but no FNOL recorded. Log FNOL immediately."
    
11. **Policies Without Sum Insured Details**
    - Nudge - Dynamic Statement: "@policyCount policies have incomplete sum insured details. Update SI values to maintain accuracy."
    - Example: "8 policies have incomplete sum insured details. Update SI values to maintain accuracy."
    
12. **Insurer Mapping Missing**
    - Nudge - Dynamic Statement: "@policyCount policies are missing insurer mapping or incorrect insurer name. Correct mapping required."
    - Example: "3 policies are missing insurer mapping or incorrect insurer name. Correct mapping required."
    
13. **Commission Not Received**
    - Nudge - Dynamic Statement: "@policyCount policies issued >@dayCount days ago have no commission entries yet. Follow up with insurer."
    - Example: "10 policies issued >30 days ago have no commission entries yet. Follow up with insurer."
    
14. **Premium Register Mismatch**
    - Nudge - Dynamic Statement: "@policyCount policies mismatch with insurer premium register. Review and reconcile."
    - Example: "6 policies mismatch with insurer premium register. Review and reconcile."
    
15. **Policy End Date Approaching**
    - Nudge - Dynamic Statement: "@policyCount policies will end within @dayCount days. Alert client for next steps."
    - Example: "12 policies will end within 15 days. Alert client for next steps."
    
16. **Policy with Missing Risk Details**
    - Nudge - Dynamic Statement: "@policyCount policies have incomplete risk information (vehicle, member count, assets). Update details."
    - Example: "7 policies have incomplete risk information (vehicle, member count, assets). Update details."

### **6.8 Manage Engagements → Meetings Page Nudges**

**Source File**: `IIRM-8064_Nudges_07_Meetings_27-Nov-2025.csv`
**Application Page**: Manage Engagements → Meetings
**Total Nudges**: 10 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to Meetings page, the system **MUST** display all 10 nudges:

1. **Meetings Scheduled Today**
   - Nudge - Dynamic Statement: "You have @meetingCount meetings lined up today. Ensure you are prepared."
   - Example: "You have 4 meetings lined up today. Ensure you are prepared."
   
2. **Meetings Overdue**
   - Nudge - Dynamic Statement: "@meetingCount past meetings have incomplete minutes or updates. Complete documentation."
   - Example: "3 past meetings have incomplete minutes or updates. Complete documentation."
   
3. **Upcoming Meetings (Next 7 Days)**
   - Nudge - Dynamic Statement: "@meetingCount meetings coming up soon but no prep material or agenda set."
   - Example: "6 meetings coming up soon but no prep material or agenda set."
   
4. **Client Review Meetings Pending**
   - Nudge - Dynamic Statement: "@clientCount clients due for monthly/quarterly review do not have meetings scheduled."
   - Example: "8 clients due for monthly/quarterly review do not have meetings scheduled."
   
5. **KDM Meetings Not Conducted**
   - Nudge - Dynamic Statement: "KDM meetings missing for @accountCount important accounts (SO/RO)."
   - Example: "KDM meetings missing for 5 important accounts (SO/RO)."
   
6. **Negotiation Meetings Delayed**
   - Nudge - Dynamic Statement: "Final negotiation meetings pending for @dealCount high-value deals."
   - Example: "Final negotiation meetings pending for 7 high-value deals."
   
7. **Meeting Notes Missing**
   - Nudge - Dynamic Statement: "@meetingCount meetings conducted but minutes/notes missing. Update documentation."
   - Example: "9 meetings conducted but minutes/notes missing. Update documentation."
   
8. **Low Meeting Conversion Rate**
   - Nudge - Dynamic Statement: "@meetingCount meetings completed, but opportunities are not moving. Review conversion strategy."
   - Example: "12 meetings completed, but opportunities are not moving. Review conversion strategy."
   
9. **Client Not Attended Meetings**
   - Nudge - Dynamic Statement: "@clientCount clients have missed scheduled meetings; follow-up required."
   - Example: "4 clients have missed scheduled meetings; follow-up required."
   
10. **Internal Meetings Pending Approval**
    - Nudge - Dynamic Statement: "@meetingCount internal review meetings scheduled but not approved by managers."
    - Example: "2 internal review meetings scheduled but not approved by managers."
    - Dynamic Values: Meeting count, approval status

### **6.9 Manage Engagements → Tasks Page Nudges**

**Source File**: `IIRM-8064_Nudges_08_Task_27-Nov-2025.csv`
**Application Page**: Manage Engagements → Tasks
**Total Nudges**: 15 (All Mandatory)

#### **Mandate Scenarios:**
When user navigates to Tasks page, the system **MUST** display all 15 nudges:

1. **Tasks Due Today**
   - Nudge - Dynamic Statement: "@taskCount tasks scheduled for today need user attention."
   - Example: "8 tasks scheduled for today need user attention."
   
2. **Overdue Tasks**
   - Nudge - Dynamic Statement: "@taskCount tasks that were due earlier remain incomplete."
   - Example: "5 tasks that were due earlier remain incomplete."
   
3. **High Priority Tasks Pending**
   - Nudge - Dynamic Statement: "@taskCount critical tasks with high priority are still open."
   - Example: "3 critical tasks with high priority are still open."
   
4. **Tasks Pending for More Than 7 Days**
   - Nudge - Dynamic Statement: "@taskCount tasks older than @dayCount days with no update."
   - Example: "6 tasks older than 7 days with no update."
   
5. **Tasks Without Due Date**
   - Nudge - Dynamic Statement: "@taskCount tasks created without a due date (risk of neglect)."
   - Example: "9 tasks created without a due date (risk of neglect)."
   
6. **Tasks Assigned but Not Started**
   - Nudge - Dynamic Statement: "@taskCount tasks are assigned but users haven't started them."
   - Example: "4 tasks are assigned but users haven't started them."
   
7. **Tasks Waiting for Client Inputs**
   - Nudge - Dynamic Statement: "@taskCount tasks pending action from clients (documents/approvals)."
   - Example: "7 tasks pending action from clients (documents/approvals)."
   
8. **Repetitive Tasks Due This Week**
   - Nudge - Dynamic Statement: "@taskCount weekly/recurring tasks scheduled for completion."
   - Example: "11 weekly/recurring tasks scheduled for completion."
   
9. **Tasks Pending Review/Approval**
   - Nudge - Dynamic Statement: "@taskCount tasks require manager review before closure."
   - Example: "4 tasks require manager review before closure."
   
10. **Tasks Linked to High-Value Deals**
    - Nudge - Dynamic Statement: "@taskCount tasks tied to large opportunities are pending."
    - Example: "6 tasks tied to large opportunities are pending."
    
11. **Cross-Department Tasks Pending**
    - Nudge - Dynamic Statement: "@taskCount tasks assigned to other departments stuck without update."
    - Example: "3 tasks assigned to other departments stuck without update."
    
12. **Tasks With Missing Documentation**
    - Nudge - Dynamic Statement: "@taskCount tasks pending due to missing invoice/quote/attachment."
    - Example: "8 tasks pending due to missing invoice/quote/attachment."
    
13. **Tasks Related to Renewals Due Soon**
    - Nudge - Dynamic Statement: "@taskCount renewal-linked tasks require action before expiry."
    - Example: "5 renewal-linked tasks require action before expiry."
    
14. **Tasks Auto-Created by Workflow**
    - Nudge - Dynamic Statement: "@taskCount workflow-generated tasks pending confirmation."
    - Example: "7 workflow-generated tasks pending confirmation."
    
15. **Tasks Stuck in Progress**
    - Nudge - Dynamic Statement: "@taskCount tasks in-progress but with no update for @dayCount+ days."
    - Example: "9 tasks in-progress but with no update for 5+ days."
    - Dynamic Values: Task count, update timeline
So that I can be properly prepared for client interactions

---

## **7. Scenario-Based Requirements (Gherkin Format)**

This section defines the behavior-driven requirements for nudge display using Gherkin scenarios. Each scenario demonstrates how dynamic values populate based on user context and real-time data conditions.

### **7.1 Dashboard Page Scenarios**

#### **Scenario 7.1.1: Lead Qualification Alert**
```gherkin
Feature: Lead Qualification Nudge
  As a Leadership/Manager user
  I want to see lead qualification alerts with accurate counts
  So that I can take action on unqualified leads

Scenario: Display unqualified leads count based on user scope
  Given I am logged in as a "{userRole}" user
  And there are {X} leads in the system with status "Unqualified" 
  And these leads are within my assigned territory/team scope
  When I navigate to the Dashboard page
  Then I should see the nudge "{@leadCount} leads are unqualified. Schedule a review session to improve lead qualification rate?"
  And the nudge should display with dynamic value "@leadCount = {calculated_count}"

Example:
  Given I am logged in as a "Leadership" user
  And there are 140 leads in the system with status "Unqualified" 
  And these leads are within my assigned territory/team scope
  When I navigate to the Dashboard page
  Then I should see the nudge "140 leads are unqualified. Schedule a review session to improve lead qualification rate?"
  And the nudge should display with dynamic value "@leadCount = 140"

Calculation Formula:
  @leadCount = COUNT(leads) WHERE status = 'Unqualified' 
               AND (user_role = 'Leadership' OR assigned_territory IN user_territories)
               AND active = true

Scenario: Different user sees different lead counts based on scope
  Given I am logged in as a "Manager" user with territory "{territory_name}"
  And there are {Y} leads in "{territory_name}" with status "Unqualified"
  And there are {Z} leads in other territories with status "Unqualified"
  When I navigate to the Dashboard page
  Then I should see the nudge "{@leadCount} leads are unqualified. Schedule a review session to improve lead qualification rate?"
  And the nudge should display with dynamic value "@leadCount = {Y_count_only}"

Example:
  Given I am logged in as a "Manager" user with territory "West Region"
  And there are 25 leads in "West Region" with status "Unqualified"
  And there are 115 leads in other territories with status "Unqualified"
  When I navigate to the Dashboard page
  Then I should see the nudge "25 leads are unqualified. Schedule a review session to improve lead qualification rate?"
  And the nudge should display with dynamic value "@leadCount = 25"

Calculation Formula:
  @leadCount = COUNT(leads) WHERE status = 'Unqualified' 
               AND assigned_territory = user.territory
               AND active = true

Scenario: No unqualified leads exist in user scope
  Given I am logged in as any user
  And there are 0 leads with status "Unqualified" in my scope
  When I navigate to the Dashboard page
  Then I should not see the "Lead Qualification Alert" nudge
  And the nudge should not appear in the dashboard

Calculation Formula:
  IF @leadCount = 0 THEN hide_nudge = true
```

#### **Scenario 7.1.2: Business Performance Target Nudge**
```gherkin
Feature: Business Performance Tracking
  As a Leadership user
  I want to see performance against targets with real percentages
  So that I can identify performance gaps

Scenario: Mined business below target calculation
  Given I am logged in as a "Leadership" user
  And the current mined business percentage is {X}%
  And the target mined business percentage is {Y}%
  And {X} < {Y} (performance is below target)
  When I navigate to the Dashboard page
  Then I should see the nudge "Mined business is at {@currentPercentage}%, below the {@targetPercentage}% target. Review cross-sell opportunities with existing clients?"
  And the nudge should display with dynamic values "@currentPercentage = {X}%" and "@targetPercentage = {Y}%"

Example:
  Given I am logged in as a "Leadership" user
  And the current mined business percentage is 72%
  And the target mined business percentage is 75%
  And 72% < 75% (performance is below target)
  When I navigate to the Dashboard page
  Then I should see the nudge "Mined business is at 72%, below the 75% target. Review cross-sell opportunities with existing clients?"
  And the nudge should display with dynamic values "@currentPercentage = 72%" and "@targetPercentage = 75%"

Calculation Formula:
  @currentPercentage = (SUM(mined_business_premium) / SUM(total_business_premium)) * 100
  @targetPercentage = business_targets.mined_business_target_percentage
  Display nudge IF @currentPercentage < @targetPercentage

Scenario: Mined business above target celebration
  Given I am logged in as a "Leadership" user
  And the current mined business percentage is {X}%
  And the target mined business percentage is {Y}%
  And {X} > {Y} (performance exceeds target)
  When I navigate to the Dashboard page
  Then I should see the nudge "New business exceeded target by {@achievementPercentage}%! Recognize top performers and share best practices with the team?"
  And the nudge should display with dynamic value "@achievementPercentage = {X-Y}%"

Example:
  Given I am logged in as a "Leadership" user
  And the current mined business percentage is 82%
  And the target mined business percentage is 75%
  And 82% > 75% (performance exceeds target)
  When I navigate to the Dashboard page
  Then I should see the nudge "New business exceeded target by 7%! Recognize top performers and share best practices with the team?"
  And the nudge should display with dynamic value "@achievementPercentage = 7%"

Calculation Formula:
  @achievementPercentage = @currentPercentage - @targetPercentage
  Display nudge IF @currentPercentage > @targetPercentage
```

### **7.2 Sales Opportunities (MY SO) Page Scenarios**

#### **Scenario 7.2.1: Opportunities Stuck in Early Stages**
```gherkin
Feature: Opportunity Stage Tracking
  As a Manager user
  I want to see opportunities stuck beyond expected TAT
  So that I can take action to move them forward

Scenario: Multiple opportunities stuck in early stages based on TAT
  Given I am logged in as a "Manager" user
  And there are {X} opportunities in "Data Validation" or "KDM Meeting" stage
  And these opportunities have been in this stage for more than the expected TAT of {Y} days
  And these opportunities are assigned to my team scope
  When I navigate to the MY SO page
  Then I should see the nudge "{@opportunityCount} opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
  And the nudge should display with dynamic value "@opportunityCount = {calculated_count}"

Example:
  Given I am logged in as a "Manager" user
  And there are 18 opportunities in "Data Validation" or "KDM Meeting" stage
  And these opportunities have been in this stage for more than the expected TAT of 5 days
  And these opportunities are assigned to my team scope
  When I navigate to the MY SO page
  Then I should see the nudge "18 opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
  And the nudge should display with dynamic value "@opportunityCount = 18"

Calculation Formula:
  @opportunityCount = COUNT(opportunities) 
                     WHERE stage_name IN ('Data Validation', 'KDM Meeting')
                     AND DATEDIFF(CURRENT_DATE, stage_last_changed_date) > stage_expected_tat_days
                     AND assigned_user_id IN user_team_members
                     AND status = 'Active'

Scenario: Different user sees different stuck opportunities based on team scope
  Given I am logged in as a "Manager" user for team "{team_name}"
  And there are {X} opportunities in early stages for "{team_name}"
  And there are {Y} opportunities in early stages for other teams
  And "{team_name}" opportunities have exceeded TAT
  When I navigate to the MY SO page
  Then I should see the nudge "{@opportunityCount} opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
  And the nudge should display with dynamic value "@opportunityCount = {X_count_only}"

Example:
  Given I am logged in as a "Manager" user for team "Team B"
  And there are 7 opportunities in early stages for "Team B"
  And there are 11 opportunities in early stages for other teams
  And "Team B" opportunities have exceeded TAT
  When I navigate to the MY SO page
  Then I should see the nudge "7 opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."
  And the nudge should display with dynamic value "@opportunityCount = 7"

Calculation Formula:
  @opportunityCount = COUNT(opportunities) 
                     WHERE stage_name IN ('Data Validation', 'KDM Meeting')
                     AND DATEDIFF(CURRENT_DATE, stage_last_changed_date) > stage_expected_tat_days
                     AND assigned_team_id = user.team_id
                     AND status = 'Active'
```

#### **Scenario 7.2.2: High-Value Opportunities Alert**
```gherkin
Feature: High-Value Opportunity Tracking
  As a Leadership user
  I want to see high-value opportunities needing attention
  So that I can prioritize them for faster closure

Scenario: Multiple high-value opportunities pending based on configurable threshold
  Given I am logged in as a "{userRole}" user
  And there are {X} opportunities with value greater than {threshold_amount}
  And these opportunities require updates or actions
  And these opportunities are in my scope
  When I navigate to the MY SO page
  Then I should see the nudge "{@opportunityCount} high-value opportunities (> {@valueThreshold}) require immediate updates. Prioritize for faster closure."
  And the nudge should display with dynamic values "@opportunityCount = {calculated_count}" and "@valueThreshold = {threshold_amount}"

Example:
  Given I am logged in as a "Leadership" user
  And there are 5 opportunities with value greater than ₹50L
  And these opportunities require updates or actions
  And these opportunities are in my scope
  When I navigate to the MY SO page
  Then I should see the nudge "5 high-value opportunities (> ₹50L) require immediate updates. Prioritize for faster closure."
  And the nudge should display with dynamic values "@opportunityCount = 5" and "@valueThreshold = ₹50L"

Calculation Formula:
  @valueThreshold = user_role_config.high_value_threshold
  @opportunityCount = COUNT(opportunities) 
                     WHERE opportunity_value > @valueThreshold
                     AND (last_activity_date < CURRENT_DATE - 3 
                          OR stage_last_changed_date < CURRENT_DATE - stage_expected_tat_days)
                     AND status IN ('Active', 'In Progress')
                     AND user_has_access(user.id, opportunity.id)

Scenario: High-value opportunities with role-based threshold configuration
  Given I am logged in as a "Manager" user
  And the system is configured with high-value threshold as {manager_threshold} for managers
  And there are {X} opportunities with value greater than {manager_threshold}
  When I navigate to the MY SO page
  Then I should see the nudge "{@opportunityCount} high-value opportunities (> {@valueThreshold}) require immediate updates. Prioritize for faster closure."
  And the nudge should display with dynamic values "@opportunityCount = {calculated_count}" and "@valueThreshold = {manager_threshold}"

Example:
  Given I am logged in as a "Manager" user
  And the system is configured with high-value threshold as ₹25L for managers
  And there are 8 opportunities with value greater than ₹25L
  When I navigate to the MY SO page
  Then I should see the nudge "8 high-value opportunities (> ₹25L) require immediate updates. Prioritize for faster closure."
  And the nudge should display with dynamic values "@opportunityCount = 8" and "@valueThreshold = ₹25L"

Calculation Formula:
  @valueThreshold = role_based_config.high_value_threshold WHERE user_role = 'Manager'
  @opportunityCount = COUNT(opportunities) 
                     WHERE opportunity_value > @valueThreshold
                     AND assigned_manager_id = user.id
                     AND requires_attention = true
```

### **7.3 Contact Management Page Scenarios**

#### **Scenario 7.3.1: Inactive Contacts Alert**
```gherkin
Feature: Contact Engagement Tracking
  As a Manager user
  I want to see contacts with no recent interaction
  So that I can re-engage to maintain relationships

Scenario: Contacts inactive for extended period with configurable threshold
  Given I am logged in as a "Manager" user
  And there are {X} contacts assigned to me
  And these contacts have had no interaction for more than {Y} days
  And the last interaction date is before "{current_date - Y days}"
  When I navigate to the My Contacts page
  Then I should see the nudge "{@contactCount} contacts have had no interaction for {@dayCount}+ days. Engage to maintain relationship."
  And the nudge should display with dynamic values "@contactCount = {calculated_count}" and "@dayCount = {Y}"

Example:
  Given I am logged in as a "Manager" user
  And there are 22 contacts assigned to me
  And these contacts have had no interaction for more than 45 days
  And the last interaction date is before "2025-10-14" (45 days ago from Nov 28, 2025)
  When I navigate to the My Contacts page
  Then I should see the nudge "22 contacts have had no interaction for 45+ days. Engage to maintain relationship."
  And the nudge should display with dynamic values "@contactCount = 22" and "@dayCount = 45"

Calculation Formula:
  @dayCount = contact_management_config.inactive_threshold_days
  @contactCount = COUNT(contacts) 
                 WHERE assigned_user_id = user.id
                 AND DATEDIFF(CURRENT_DATE, last_interaction_date) > @dayCount
                 AND status = 'Active'
                 AND contact_type != 'Archived'

Scenario: Real-time update when contact interaction is logged
  Given I am on the My Contacts page
  And I see the nudge "{X} contacts have had no interaction for {Y}+ days. Engage to maintain relationship."
  When I log an interaction for 1 of these inactive contacts
  And the system processes the interaction update
  Then I should see the nudge update to "{X-1} contacts have had no interaction for {Y}+ days. Engage to maintain relationship."
  And the nudge should display with dynamic value "@contactCount = {X-1}"

Example:
  Given I am on the My Contacts page
  And I see the nudge "22 contacts have had no interaction for 45+ days. Engage to maintain relationship."
  When I log an interaction for 1 of these inactive contacts
  And the system processes the interaction update
  Then I should see the nudge update to "21 contacts have had no interaction for 45+ days. Engage to maintain relationship."
  And the nudge should display with dynamic value "@contactCount = 21"

Calculation Formula:
  @contactCount = COUNT(contacts) 
                 WHERE assigned_user_id = user.id
                 AND DATEDIFF(CURRENT_DATE, last_interaction_date) > @dayCount
                 AND status = 'Active'
                 AND contact_id != just_updated_contact_id
                 [Real-time recalculation after interaction logging]
```

### **7.4 Policy Management Page Scenarios**

#### **Scenario 7.4.1: Policy Document Compliance**
```gherkin
Feature: Policy Document Tracking
  As a Compliance Manager
  I want to see policies missing documents
  So that I can ensure regulatory compliance

Scenario: Multiple policies missing documents based on issuance status
  Given I am logged in as a "Manager" user
  And there are {X} policies with status "Issued"
  And these policies do not have policy documents uploaded
  And these policies are in my management scope
  When I navigate to the Manage Policies page
  Then I should see the nudge "{@policyCount} issued policies do not have policy document uploaded. Add documents for compliance."
  And the nudge should display with dynamic value "@policyCount = {calculated_count}"

Example:
  Given I am logged in as a "Manager" user
  And there are 11 policies with status "Issued"
  And these policies do not have policy documents uploaded
  And these policies are in my management scope
  When I navigate to the Manage Policies page
  Then I should see the nudge "11 issued policies do not have policy document uploaded. Add documents for compliance."
  And the nudge should display with dynamic value "@policyCount = 11"

Calculation Formula:
  @policyCount = COUNT(policies) 
                WHERE policy_status = 'Issued'
                AND (policy_document_path IS NULL OR policy_document_uploaded = false)
                AND assigned_manager_id = user.id
                AND policy_active = true

Scenario: Document upload reduces nudge count in real-time
  Given I am on the Manage Policies page
  And I see the nudge showing "{X} issued policies do not have policy document uploaded"
  When I upload a document for 1 policy
  And the system processes the upload
  Then I should see the nudge update to "{X-1} issued policies do not have policy document uploaded. Add documents for compliance."
  And the nudge should display with dynamic value "@policyCount = {X-1}"

Example:
  Given I am on the Manage Policies page
  And I see the nudge showing "11 issued policies do not have policy document uploaded"
  When I upload a document for 1 policy
  And the system processes the upload
  Then I should see the nudge update to "10 issued policies do not have policy document uploaded. Add documents for compliance."
  And the nudge should display with dynamic value "@policyCount = 10"

Calculation Formula:
  @policyCount = COUNT(policies) 
                WHERE policy_status = 'Issued'
                AND (policy_document_path IS NULL OR policy_document_uploaded = false)
                AND assigned_manager_id = user.id
                AND policy_active = true
                AND policy_id != just_updated_policy_id
                [Real-time recalculation after document upload]
```

### **7.5 Meeting Management Page Scenarios**

#### **Scenario 7.5.1: Today's Meeting Preparation**
```gherkin
Feature: Daily Meeting Tracking
  As a Manager user
  I want to see today's scheduled meetings
  So that I can ensure proper preparation

Scenario: Multiple meetings scheduled for current date
  Given I am logged in as a "Manager" user
  And today's date is "{current_date}"
  And there are {X} meetings scheduled for "{current_date}"
  And these meetings are assigned to me
  When I navigate to the Manage Engagements → Meetings page
  Then I should see the nudge "You have {@meetingCount} meetings lined up today. Ensure you are prepared."
  And the nudge should display with dynamic value "@meetingCount = {calculated_count}"

Example:
  Given I am logged in as a "Manager" user
  And today's date is "2025-11-28"
  And there are 4 meetings scheduled for "2025-11-28"
  And these meetings are assigned to me
  When I navigate to the Manage Engagements → Meetings page
  Then I should see the nudge "You have 4 meetings lined up today. Ensure you are prepared."
  And the nudge should display with dynamic value "@meetingCount = 4"

Calculation Formula:
  @meetingCount = COUNT(meetings) 
                 WHERE DATE(meeting_date) = CURRENT_DATE
                 AND (assigned_user_id = user.id OR meeting_organizer_id = user.id)
                 AND meeting_status NOT IN ('Cancelled', 'Completed')

Scenario: Different user sees their own meetings only
  Given I am logged in as "{user_name}"
  And "{user_name}" has {X} meetings scheduled for today
  And "{other_user_name}" has {Y} meetings scheduled for today
  When I navigate to the Meetings page
  Then I should see the nudge "You have {@meetingCount} meetings lined up today. Ensure you are prepared."
  And the nudge should display with dynamic value "@meetingCount = {X_count_only}"

Example:
  Given I am logged in as "Manager A"
  And "Manager A" has 2 meetings scheduled for today
  And "Manager B" has 4 meetings scheduled for today
  When I navigate to the Meetings page
  Then I should see the nudge "You have 2 meetings lined up today. Ensure you are prepared."
  And the nudge should display with dynamic value "@meetingCount = 2"

Calculation Formula:
  @meetingCount = COUNT(meetings) 
                 WHERE DATE(meeting_date) = CURRENT_DATE
                 AND assigned_user_id = user.id
                 AND meeting_status NOT IN ('Cancelled', 'Completed')
```

### **7.6 Task Management Page Scenarios**

#### **Scenario 7.6.1: Overdue Tasks Tracking**
```gherkin
Feature: Task Due Date Monitoring
  As a Manager user
  I want to see overdue tasks with accurate counts
  So that I can prioritize completion

Scenario: Multiple overdue tasks assigned to user
  Given I am logged in as a "Manager" user
  And there are {X} tasks assigned to me with due dates before today
  And today's date is "{current_date}"
  And these tasks have status "Pending" or "In Progress"
  When I navigate to the Manage Engagements → Tasks page
  Then I should see the nudge "{@taskCount} tasks that were due earlier remain incomplete."
  And the nudge should display with dynamic value "@taskCount = {calculated_count}"

Example:
  Given I am logged in as a "Manager" user
  And there are 5 tasks assigned to me with due dates before today
  And today's date is "2025-11-28"
  And these tasks have status "Pending" or "In Progress"
  When I navigate to the Manage Engagements → Tasks page
  Then I should see the nudge "5 tasks that were due earlier remain incomplete."
  And the nudge should display with dynamic value "@taskCount = 5"

Calculation Formula:
  @taskCount = COUNT(tasks) 
              WHERE assigned_user_id = user.id
              AND due_date < CURRENT_DATE
              AND status IN ('Pending', 'In Progress', 'Not Started')
              AND task_active = true

Scenario: Task completion updates count in real-time
  Given I am on the Tasks page
  And I see the nudge "{X} tasks that were due earlier remain incomplete"
  When I mark 1 overdue task as "Completed"
  And the system processes the status change
  Then I should see the nudge update to "{X-1} tasks that were due earlier remain incomplete."
  And the nudge should display with dynamic value "@taskCount = {X-1}"

Example:
  Given I am on the Tasks page
  And I see the nudge "5 tasks that were due earlier remain incomplete"
  When I mark 1 overdue task as "Completed"
  And the system processes the status change
  Then I should see the nudge update to "4 tasks that were due earlier remain incomplete."
  And the nudge should display with dynamic value "@taskCount = 4"

Calculation Formula:
  @taskCount = COUNT(tasks) 
              WHERE assigned_user_id = user.id
              AND due_date < CURRENT_DATE
              AND status IN ('Pending', 'In Progress', 'Not Started')
              AND task_active = true
              AND task_id != just_completed_task_id
              [Real-time recalculation after task completion]
```

### **7.7 Cross-User Scenario Validation**

#### **Scenario 7.7.1: Role-Based Data Scope**
```gherkin
Feature: User Role and Data Scope Validation
  As a system administrator
  I want to ensure users only see data within their scope
  So that data privacy and role-based access is maintained

Scenario: Leadership sees organization-wide data with aggregated counts
  Given I am logged in as a "Leadership" user
  And there are opportunities across multiple teams/regions
  When I navigate to any page with nudges
  Then I should see nudges with counts including all data within my organizational scope
  And the dynamic values should reflect organization-wide metrics

Example:
  Given I am logged in as a "Leadership" user with org scope "Global"
  And there are 150 opportunities across all teams/regions
  And I have access to all organizational data
  When I navigate to the MY SO page
  Then I should see nudges reflecting all 150 opportunities within my scope
  And the @opportunityCount values should include organization-wide data

Calculation Formula:
  IF user.role = 'Leadership' THEN
    data_scope = organization_wide_access(user.org_id)
  ELSE
    data_scope = team_specific_access(user.team_id)

Scenario: Manager sees only team-specific data with filtered counts
  Given I am logged in as a "Manager" user for "{team_name}"
  And there are opportunities in multiple regions
  When I navigate to any page with nudges
  Then I should see nudges with counts only for "{team_name}"
  And the dynamic values should reflect only my team's data
  And I should not see data from other teams/regions

Example:
  Given I am logged in as a "Manager" user for "West Region Team"
  And there are 50 opportunities in "West Region Team"
  And there are 100 opportunities in other teams/regions
  When I navigate to the MY SO page
  Then I should see nudges with counts only for "West Region Team" (50)
  And the @opportunityCount should reflect only my team's 50 opportunities
  And I should not see the other 100 opportunities from other teams

Calculation Formula:
  @opportunityCount = COUNT(opportunities) 
                     WHERE assigned_team_id = user.team_id
                     OR assigned_manager_id = user.id
                     AND user_has_access(user.id, opportunity.team_id)
```

#### **Scenario 7.7.2: Real-Time Data Updates**
```gherkin
Feature: Real-Time Nudge Updates
  As any user
  I want nudge counts to update automatically
  So that I always see current business state

Scenario: Nudge updates when underlying data changes
  Given I am viewing any page with nudges showing "{X} {entity_type} require attention"
  And another user creates/updates records affecting my nudge counts
  When the data change is processed by the system
  Then I should see the nudge counts update automatically to reflect new state
  And the new values should be reflected within {update_time_sla} seconds
  And the @variableName values should show the updated counts

Example:
  Given I am viewing MY SO page with nudges showing "18 opportunities are stuck in Data Validation"
  And another team member moves 2 opportunities from "Data Validation" to "RFP Data Collection"
  When the data change is processed by the system
  Then I should see the nudge update to "16 opportunities are stuck in Data Validation"
  And the new values should be reflected within 30 seconds
  And the @opportunityCount should show the updated count of 16

Calculation Formula:
  [Real-time recalculation triggered by database change events]
  @opportunityCount = COUNT(opportunities) 
                     WHERE stage_name IN ('Data Validation', 'KDM Meeting')
                     AND user_has_access(user.id, opportunity.id)
                     [Recalculated when opportunity.stage_name changes]

Scenario: Zero-count nudges disappear appropriately
  Given I am viewing a page with a nudge showing "@{variableName} = {count}"
  When the last qualifying record is updated to no longer match the nudge criteria
  Then the nudge should disappear from the page
  And no nudge with "@{variableName} = 0" should be displayed

Example:
  Given I am viewing a page with a nudge showing "@opportunityCount = 1 opportunity stuck in Data Validation"
  When the last qualifying opportunity is moved from "Data Validation" to "RFP Data Collection"
  Then the "opportunities stuck in Data Validation" nudge should disappear from the page
  And no nudge with "@opportunityCount = 0" should be displayed

Calculation Formula:
  IF @variableName = 0 THEN
    hide_nudge = true
    remove_from_display = true
  END IF
```

---

## **8. User Stories & Acceptance Criteria**

### **Epic 1: Page-Specific Nudge Display Requirements**

**US-001: Dashboard Nudge Display**
```
As a Leadership/Manager user
I want to see all 10 mandatory dashboard nudges when I navigate to the Dashboard
So that I can get a complete overview of business performance issues and opportunities

Acceptance Criteria:
- All 10 nudges from IIRM-8064_Nudges_01_Dashboard_27-Nov-2025.csv MUST be displayed
- Each nudge shows exact title and description as specified in CSV
- Dynamic values are populated with real-time data
- Nudges update automatically when underlying data changes
- No nudges can be omitted or modified from the mandate list
```

**US-002: My Company Nudge Display**
```
As a Leadership/Manager user
I want to see all 10 mandatory company nudges when I navigate to My Company page
So that I can identify company data quality issues and relationship management needs

Acceptance Criteria:
- All 10 nudges from IIRM-8064_Nudges_02_Company_27-Nov-2025.csv MUST be displayed
- Company count and status values are calculated in real-time
- Red flag companies and incomplete profiles are accurately identified
- CTAs navigate to filtered company lists for immediate action
```

**US-003: My Contacts Nudge Display**
```
As a Leadership/Manager user  
I want to see all 10 mandatory contact nudges when I navigate to My Contacts page
So that I can maintain accurate contact information and relationship engagement

Acceptance Criteria:
- All 10 nudges from IIRM-8064_Nudges_03_Contacts_27-Nov-2025.csv MUST be displayed
- Contact profile completeness and interaction tracking are accurate
- Email validation status and reachability flags are current
- Decision maker identification gaps are properly highlighted
```

**US-004: MY SO Nudge Display**
```
As a Leadership/Manager user
I want to see all 13 mandatory sales opportunity nudges when I navigate to MY SO page
So that I can track sales pipeline progress and identify bottlenecks

Acceptance Criteria:
- All 13 nudges from IIRM-8064_Nudges_04_SO_27-Nov-2025.csv MUST be displayed
- TAT violations and stage progression delays are accurately calculated
- High-value opportunity identification (>₹50L) is correctly implemented
- Loss risk assessment and pricing issues are properly flagged
```

**US-005: My RO Nudge Display**
```
As a Leadership/Manager user
I want to see all 18 mandatory renewal opportunity nudges when I navigate to My RO page  
So that I can prevent renewal leakage and optimize renewal processes

Acceptance Criteria:
- All 18 nudges from IIRM-8064_Nudges_05_RO_27-Nov-2025.csv MUST be displayed
- RSR creation and KDM meeting scheduling are tracked accurately
- Renewal process stage completion is monitored at each step
- At-risk renewals and competitor pressure are properly identified
```

**US-006: Manage Policies Nudge Display**
```
As a Leadership/Manager user
I want to see all 16 mandatory policy nudges when I navigate to Manage Policies page
So that I can ensure policy lifecycle compliance and service quality

Acceptance Criteria:
- All 16 nudges from IIRM-8064_Nudges_06_Policy_27-Nov-2025.csv MUST be displayed
- Policy issuance status and document compliance are tracked
- Premium payment and commission tracking are accurate
- Renewal due dates and lapse risks are properly calculated
```

**US-007: Meetings Page Nudge Display**
```
As a Leadership/Manager user
I want to see all 10 mandatory meeting nudges when I navigate to Manage Engagements → Meetings
So that I can optimize meeting effectiveness and client engagement

Acceptance Criteria:
- All 10 nudges from IIRM-8064_Nudges_07_Meetings_27-Nov-2025.csv MUST be displayed
- Today's meetings and preparation status are accurately shown
- Meeting outcome tracking and documentation gaps are identified
- Client no-show and internal approval requirements are flagged
```

**US-008: Tasks Page Nudge Display**
```
As a Leadership/Manager user
I want to see all 15 mandatory task nudges when I navigate to Manage Engagements → Tasks
So that I can ensure task completion and workflow efficiency

Acceptance Criteria:
- All 15 nudges from IIRM-8064_Nudges_08_Task_27-Nov-2025.csv MUST be displayed
- Due dates, overdue status, and priority levels are accurately tracked
- Cross-department coordination and client dependency issues are identified
- Auto-generated and renewal-linked tasks are properly categorized
```

### **Epic 2: Dynamic Value Population**

**US-009: Real-time Business Data Updates**
```
As a Business User
I want all business alerts to reflect current information
So that I always see accurate business intelligence

Acceptance Criteria:
- All count values (leads, opportunities, policies, etc.) reflect latest business activity
- Percentage calculations update automatically when business data changes
- Date-based calculations (overdue, due soon, aging) are computed correctly
- Business rule violations and timeline issues are calculated against business standards
```

### **Epic 3: Future CSV Integration Framework**

**US-010: New CSV File Integration Support**
```
As a Product Owner
I want to easily add new CSV files and corresponding page nudges
So that the system can grow with business requirements

Acceptance Criteria:
- New CSV files following naming convention IIRM-8064_Nudges_[ID]_[PageName]_[Date].csv can be integrated
- Page mapping configuration supports new application pages
- CSV content structure (Nudge Title, Nudge, Dynamic Values) is preserved
- Future nudges maintain mandate display requirements for their assigned pages
```
```
As a Business Development Manager
I want to see company profile maintenance alerts
So that I can ensure accurate client information

Real Example:
Nudge: "5 companies have incomplete profiles. Add missing details to improve data quality."
Dynamic Values: {{incomplete_companies}}, {{quality_score}}
CTA: Navigate to company list with filter "Profile=Incomplete"

Acceptance Criteria:
- Shows count of companies with incomplete profiles
- Links data quality to business outcomes
- Suggests specific improvement actions
- Provides filtered view for immediate action
```

---

## **7. User Experience & Workflows**

### **7.1 Nudge Display Workflow**

```
1. User logs into application
2. System identifies user role and permissions
3. AI/System analyzes relevant data for user context
4. Nudges generated based on predefined conditions and AI analysis
5. Top-priority nudges displayed in notification section
6. User can view, dismiss, or interact with nudges
7. CTA click navigates to relevant page with applied filters
```

### **7.2 Nudge Creation Workflow**

```
1. Manager accesses nudge management interface
2. Selects nudge template or creates custom nudge
3. Defines target audience (team members)
4. Sets nudge conditions and timing
5. Previews nudge with sample data
6. Schedules or immediately publishes nudge
7. System sends notifications to target users
```

---

## **8. Business Integration Requirements**

### **8.1 Data Integration**
- **Business Data Sources**: Connect to all current business information systems
- **Real-time Processing**: Efficient data processing without impacting business operations
- **Business Intelligence**: Automated evaluation of business conditions for alert generation

### **8.2 AI Solution Integration**
- **AI Solution Selection**: To be determined based on business requirements and budget
- **Business Communication**: Seamless integration with AI solutions for business intelligence
- **Alert Generation**: AI-powered business alert generation system
- **Business Feedback**: User feedback integration for continuous improvement

### **8.3 Business Application Integration**
- **User Interface**: Business alert display components for all application pages
- **Navigation**: Smart navigation with relevant business page filters
- **Notification System**: Integration with existing business notification infrastructure

---

## **9. Business Release Plan**

### **Release-1 (Initial Launch)**
**Business Scope**: Leadership and Manager roles
**Timeline**: [To be determined]

**Business Features Included**:
- Complete business alert framework
- Excel-based business alert management
- Business alert templates
- Smart navigation to business pages
- Role-based business alert visibility

**Future Release Features**:
- Advanced AI integration
- Complex user-created nudges
- Advanced analytics and reporting
- Mobile application support

### **Future Releases**
- **Release-2**: Extended user roles, mobile support
- **Release-3**: Advanced AI integration, predictive nudges
- **Release-4**: Advanced analytics, nudge effectiveness tracking

---

## **11. Success Criteria & KPIs**

### **11.1 User Engagement Metrics**
- Nudge click-through rate > 40%
- Nudge dismissal rate < 60%
- Time spent on nudge-directed pages > 5 minutes average
- User return rate to nudge-suggested actions > 30%

### **11.2 Business Impact Metrics**
- Increase in opportunity conversion rate
- Reduction in missed deadlines/opportunities
- Improvement in key business KPIs influenced by nudges
- User productivity metrics improvement

### **11.3 Business Performance Metrics**
- Alert response time by users < 2 seconds
- System availability > 99.9% for business operations
- User satisfaction score > 4.0/5.0
- Business process completion rate improvement

---

## **12. Risk Assessment**

### **12.1 Business Implementation Risks**
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI Integration Complexity | High | Medium | Start with rule-based alerts, gradual AI enhancement |
| User Experience Impact | High | Medium | Thorough testing, phased rollout approach |
| Data Privacy Concerns | Medium | Low | Business compliance review, data protection measures |

### **12.2 Business Risks**
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low User Adoption | High | Medium | User training, gradual rollout, feedback collection |
| Alert Fatigue | Medium | High | Smart frequency management, relevance optimization |
| Incorrect AI Recommendations | Medium | Medium | Human oversight, user feedback system |

---

## **13. Dependencies & Assumptions**

### **13.1 Business Dependencies**
- AI solution selection and implementation
- Business process integration
- User interface enhancements
- User training and change management

### **13.2 Business Assumptions**
- Users will find business alerts valuable and actionable
- Current business data can support real-time analysis
- AI solution will be available and cost-effective
- Leadership team will drive user adoption

---

**Document Version Control**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 28, 2025 | Initial PRD creation | Product Team |

### **15.1 Dashboard Nudges Testing**

**Test Case 1: Lead Qualification Alert**
```
**Test Data Setup:**
- Create {X} leads with status "Unqualified" 
- Assign leads to test user's territory/team scope
- Login as {userRole} user

**Expected Alert:**
"{@leadCount} leads are unqualified. Schedule a review session to improve lead qualification rate?"

**Test Steps:**
1. Navigate to dashboard
2. Verify alert appears with dynamic count (@leadCount = calculated_value)
3. Click action button
4. Verify navigation to lead management page
5. Verify filter applied: Status = 'Unqualified' AND user_scope
6. Verify leads displayed match alert count

**Pass Criteria:** Alert shows correct calculated count, action button navigates properly with user-scoped filters

**Example Test:**
- Create 140 leads with "Unqualified" status
- Login as Leadership user
- Expected: "140 leads are unqualified. Schedule a review session to improve lead qualification rate?"

**Calculation Verification:**
@leadCount = COUNT(leads) WHERE status = 'Unqualified' AND user_has_access = true
```

**Test Case 2: Performance Target Nudge**
```
**Test Data Setup:**
- Set target mined business = {target_percentage}%
- Set actual mined business = {current_percentage}%
- Ensure current < target for below-target scenario

**Expected Alert:**
"Mined business is at {@currentPercentage}%, below the {@targetPercentage}% target. Review cross-sell opportunities with existing clients?"

**Test Steps:**
1. Verify alert displays correct calculated percentages
2. Verify gap calculation (@currentPercentage < @targetPercentage)
3. Click action button to navigate to opportunity analysis
4. Verify cross-sell filter applied

**Pass Criteria:** Accurate percentage calculation using real data, proper navigation

**Example Test:**
- Set target mined business = 75%
- Set actual mined business = 72% 
- Expected: "Mined business is at 72%, below the 75% target. Review cross-sell opportunities with existing clients?"

**Calculation Verification:**
@currentPercentage = (SUM(mined_business_premium) / SUM(total_business_premium)) * 100
@targetPercentage = business_targets.mined_business_target_percentage
```

### **15.2 Opportunity Management Testing**

**Test Case 3: Stuck Opportunities**
```
**Test Data Setup:**
- Create {X} opportunities in specified stages (Data Validation, KDM Meeting)
- Set stage_last_changed > expected TAT (configurable days)
- Assign to test user's team scope

**Expected Nudge:**
"{@opportunityCount} opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."

**Test Steps:**
1. Verify count accuracy (@opportunityCount = calculated_value)
2. Verify TAT calculation logic against database
3. Test CTA navigation to filtered opportunity list
4. Verify only TAT-exceeded opportunities shown for user scope

**Pass Criteria:** Accurate TAT tracking with real-time calculation, proper user-scoped filtering

**Example Test:**
- Create 18 opportunities in 'Data Validation' stage
- Set stage_last_changed > expected TAT (e.g., 10 days ago)
- Expected: "18 opportunities are stuck in Data Validation / KDM Meeting for over the expected TAT. Take action to push them forward."

**Calculation Verification:**
@opportunityCount = COUNT(opportunities) 
                   WHERE stage_name IN ('Data Validation', 'KDM Meeting')
                   AND DATEDIFF(CURRENT_DATE, stage_last_changed_date) > stage_expected_tat_days
                   AND user_has_access(user.id, opportunity.id)
```

### **15.3 Policy Management Testing**

**Test Case 4: Missing Policy Documents**
```
**Test Data Setup:**
- Create {X} policies with status = 'Issued'
- Set policy_document_uploaded = FALSE
- Assign to test user's management scope

**Expected Nudge:**
"{@policyCount} issued policies do not have policy document uploaded. Add documents for compliance."

**Test Steps:**
1. Verify nudge appears for appropriate user role
2. Check count accuracy (@policyCount = calculated_value)
3. Test CTA navigation to policy list with applied filters
4. Verify filter: Status = 'Issued' AND Documents = 'Missing' AND user_scope
5. Upload document for one policy
6. Verify real-time nudge count update (@policyCount -= 1)

**Pass Criteria:** Real-time count updates with proper user-scoped filtering

**Example Test:**
- Create 11 policies with status = 'Issued'
- Set policy_document_uploaded = FALSE
- Expected: "11 issued policies do not have policy document uploaded. Add documents for compliance."

**Calculation Verification:**
@policyCount = COUNT(policies) 
              WHERE policy_status = 'Issued'
              AND (policy_document_path IS NULL OR policy_document_uploaded = false)
              AND user_has_access(user.id, policy.id)
```

### **15.4 Contact & Company Testing**

**Test Case 5: Inactive Contacts**
```
**Test Data Setup:**
- Create {X} contacts with last_interaction_date > {Y} days ago
- Assign contacts to test user scope

**Expected Nudge:**
"{@contactCount} contacts have had no interaction for {@dayCount}+ days. Engage to maintain relationship."

**Test Steps:**
1. Verify nudge calculation logic for configurable day threshold
2. Check count accuracy (@contactCount = calculated_value)
3. Test CTA navigation to contact list with applied filters
4. Verify filter: Last Interaction > threshold_days AND user_scope
5. Log interaction for one contact
6. Verify real-time count update (@contactCount -= 1)

**Pass Criteria:** Date calculation accuracy with configurable thresholds, real-time updates

**Example Test:**
- Create 22 contacts with last_interaction_date > 45 days ago
- Expected: "22 contacts have had no interaction for 45+ days. Engage to maintain relationship."

**Calculation Verification:**
@contactCount = COUNT(contacts) 
               WHERE DATEDIFF(CURRENT_DATE, last_interaction_date) > @dayCount
               AND assigned_user_id = user.id
               AND status = 'Active'
```

### **15.5 Meeting & Task Management Testing**

**Test Case 6: Meetings Due Today**
```
**Test Data Setup:**
- Create {X} meetings scheduled for current date
- Assign meetings to test user
- Set meeting_status = 'Scheduled'

**Expected Nudge:**
"You have {@meetingCount} meetings lined up today. Ensure you are prepared."

**Test Steps:**
1. Verify nudge appears with accurate count
2. Check count matches user's scheduled meetings for today only
3. Test CTA navigation to today's meeting calendar
4. Verify only today's meetings displayed for current user
5. Add/remove meeting and verify real-time count updates

**Pass Criteria:** Accurate date-based filtering with user scope, real-time updates

**Example Test:**
- Create 5 meetings scheduled for current date
- Expected: "You have 5 meetings lined up today. Ensure you are prepared."

**Calculation Verification:**
@meetingCount = COUNT(meetings) 
               WHERE DATE(meeting_date) = CURRENT_DATE
               AND (assigned_user_id = user.id OR meeting_organizer_id = user.id)
               AND meeting_status NOT IN ('Cancelled', 'Completed')
```

**Test Case 7: High Priority Tasks**
```
**Test Data Setup:**
- Create {X} tasks with priority = 'High' and status IN ('Pending', 'Not Started')
- Assign tasks to test user

**Expected Nudge:**
"{@taskCount} critical tasks with high priority are still open."

**Test Steps:**
1. Verify priority-based filtering accuracy
2. Check count accuracy (@taskCount = calculated_value)
3. Test CTA navigation to task list with applied filters
4. Verify filter: Priority = 'High' AND Status IN ('Pending', 'Not Started') AND user_scope
5. Complete one task and verify real-time count update

**Pass Criteria:** Priority filtering works with user scope, real-time count updates

**Example Test:**
- Create 8 tasks with priority = 'High' and status = 'Pending'
- Expected: "8 critical tasks with high priority are still open."

**Calculation Verification:**
@taskCount = COUNT(tasks) 
            WHERE priority = 'High'
            AND status IN ('Pending', 'Not Started', 'In Progress')
            AND assigned_user_id = user.id
            AND task_active = true
```

### **15.6 Role-Based Access Testing**

**Test Case 8: Leadership vs Manager Nudges**
```
**Test Data Setup:**
- Create identical dataset for both user roles
- Login as Leadership user and Manager user separately
- Configure role-based data access permissions

**Expected Behavior:**
- Leadership sees organization-wide data in nudge calculations
- Manager sees team/territory-specific data only
- Role-appropriate nudge content and thresholds

**Test Steps:**
1. Compare nudge counts visible to each role with same underlying data
2. Verify role-appropriate content and data scope
3. Test CTA permissions and navigation for each role
4. Verify data scope matches user permissions (@variableName calculations)

**Pass Criteria:** Role-appropriate nudges with correct data scoping, proper access control

**Example Test:**
- Same dataset: 150 opportunities organization-wide, 50 in Manager's team
- Leadership user sees: "@opportunityCount = 150" 
- Manager user sees: "@opportunityCount = 50"

**Calculation Verification:**
IF user.role = 'Leadership' THEN
  @opportunityCount = COUNT(opportunities) WHERE org_id = user.org_id
ELSE  
  @opportunityCount = COUNT(opportunities) WHERE team_id = user.team_id
```

### **15.7 Performance Testing**

**Test Case 9: Large Dataset Performance**
```
**Test Data Setup:**
- Create large datasets: {X} opportunities, {Y} policies, {Z} contacts
- Login with user having access to all data
- Configure performance monitoring

**Performance Targets:**
- Nudge calculation: <{calc_time_sla} seconds
- Page load with nudges: <{page_load_sla} seconds total
- CTA navigation: <{navigation_sla} second

**Test Steps:**
1. Measure nudge generation time with large datasets
2. Test concurrent user load ({concurrent_users}+ users)
3. Verify no performance degradation under load
4. Monitor database query performance and optimization

**Pass Criteria:** All response times within defined SLAs regardless of data size

**Example Test:**
- Create 10,000 opportunities, 5,000 policies, 20,000 contacts
- Performance Targets: Nudge calculation <2 seconds, Page load <3 seconds, Navigation <1 second
- Test concurrent load with 100+ users

**Calculation Performance Verification:**
- All @variableName calculations must complete within SLA
- Database indexes optimized for COUNT queries with user_scope filters
- Query execution plans verified for performance
```
```
Test Setup:
- Create 10,000 opportunities
- Create 5,000 policies  
- Create 20,000 contacts
- Login with user having access to all data

Performance Targets:
- Nudge calculation: <2 seconds
- Page load with nudges: <3 seconds total
- CTA navigation: <1 second

Test Steps:
1. Measure nudge generation time
2. Test concurrent user load (100+ users)
3. Verify no performance degradation
4. Monitor database query performance

Pass Criteria: All response times within targets
```

### **15.8 Edge Case Testing**

**Test Case 10: Zero Count Scenarios**
```
Given a user role as {user_role}
And {data_type} count = {zero_or_null}
When the user views {page_name} page
Then {nudge_type} nudges should {display_behavior}

Example Test Data:
- user_role: "Manager", "Executive", "Agent"
- data_type: "overdue_tasks", "missing_documents", "follow_ups"
- zero_or_null: 0, null, undefined
- page_name: "dashboard", "opportunities", "policies"
- nudge_type: "action_required", "informational", "priority"
- display_behavior: "not_display", "show_placeholder", "hide_completely"

Calculation Verification:
- IF @taskCount = 0 THEN nudge.visible = false
- IF @documentCount IS NULL THEN @documentCount = 0
- IF COUNT(qualifying_items) = 0 THEN hide_nudge()

Test Steps:
1. Verify nudges don't appear when @variableCount = {zero_or_null}
2. Test boundary conditions with {edge_case_scenario}
3. Verify graceful handling of {data_state} data

Pass Criteria: Clean UI with no meaningless nudges displayed
```

---

**Document Version Control**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 28, 2025 | Initial PRD creation | Product Team |
