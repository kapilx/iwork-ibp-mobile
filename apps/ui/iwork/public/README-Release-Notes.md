<details>
<summary><strong> Version 1.0.1 – Initial Release </strong> &emsp; Release Date : 15-June-2025</summary>

### Overview

This release introduces a comprehensive set of features designed to streamline operations, improve user experience, and empower users with intelligent assistance across the **SO / RO Management lifecycle**.  
The platform caters to various roles including Executives and Managers from **BD & ISG wings**, the management hierarchy of these roles, and admin staff, with powerful, integrated functionality.

---

####  Features

1. **Wizard-Driven Company, Company Contact, and SO Creation**

   Users are guided through step-by-step wizards for creating Companies, their associated Contacts, and Sales Opportunities (SOs), ensuring data completeness and consistency. The wizard helps search for a company and pick it up for further processing (like adding contacts or creating SOs), or create a new Company or Contact if not found.

2. **AI-Assisted Company & Company Contact Creation from Business Card**

   A smart utility to create company records by uploading a business card image using AI. It collects the data and business intelligence available on the web and auto-populates it. If the Company already exists, it automatically proceeds to adding the Contact to that Company.

3. **Managing Brokers, Insurers, and TPAs**

   Dedicated modules for adding, editing, and managing records for Brokers, Insurers, and TPAs. These entities can be linked to various Companies, SOs, and ROs.

4. **Managing Contacts for Companies, Brokers, Insurers, and TPAs**

   Ability to link and maintain multiple contact points for each Company, Broker, Insurer, and TPA organization. Contacts no longer associated with an organization can be marked as _Inactive_.

5. **Managing Approvals and Assignments**

   Built-in workflow to track approvals and assignments, with automated notification triggers and emails.

6. **Managing Tasks, Meetings, and Notes**

   Robust calendar and activity tracking capabilities to log and follow up on tasks, schedule meetings, and maintain notes. Users can also log meeting outcomes for future analysis.

7. **Managing SOs and ROs**

   Dedicated view of all SOs and ROs for owners to manage them effectively from creation to closure, with traceability. Users can plan and track all SO-related activities within the same module.

8. **Pre-fill Information from Existing Policies**

   Users can fetch and prefill existing information from previous policies by uploading the policy document within certain activities.

9. **Progress Indicators for SOs and ROs**

   Visual trackers and progress bars indicate the current stage and completion status of each SO and RO.

10. **Broking Slips and QCR**

    Users can create multiple versions of Broking Slips and compare them later against proposals and quotes from various insurers.

11. **Smart Search Functionality**

    Advanced, intuitive search bar to quickly locate Companies, Contacts, SOs, TPAs, and more using specific columns.

12. **Dynamic Filters and KPIs**

    Interactive filters and key performance indicators (KPIs) available on dashboards and list pages for real-time insights based on search/filter results.

13. **Customization of Table Settings**

    Users can adjust table views by choosing which columns to display and their order.

14. **Notifications**

    Timely in-app and email notifications for task reminders, approval requests, and activity updates.

15. **Knowledge Central**

    Centralized document repository where admins can upload and manage a wide range of documents, including FAQs, how-to guides, marketing collaterals, and other user support materials.

16. **Smart Adds**

    AI features to make the application more user-friendly:

    - Reading business card information
    - Adding company data like industry intelligence and potential opportunities through AI
    - Adding covers using old policy documents through AI

17. **Smart Assistant**

    An always-active Smart Assistant helps perform frequently used operations at the click of a button.

18. **Secure Login**

    Secure login mechanism with password reset workflows. Admins can configure granular access rights to ensure users access only data and functionality relevant to their roles.

#### Improvements & Fixes – Pending

- AI enhancement for populating Industry Intelligence, Potential Opportunities, and other details
- CD transaction data to be maintained
- Excel Reading for Covers Data (currently available only from PDF)
- Saving activity data as draft
- Maintaining context across activity accordions
- URL Route masking

#### Known Issues

- AI-assisted business card reader may occasionally misread stylized fonts and may bring the closest match for the given company based on web search results.
- Multi-Select Dropdown Enhancements
- Enhanced Log Data Information
- Backlog Items Captured (_Backlog & Known Issues Reference_)

</details>

<details>
    <summary><strong> Version 1.0.2 – Enhance Release </strong> &emsp; Release Date : 19-June-2025</summary>
</details>

<details>
<summary><strong> Version 1.0.3 – Enhance Release </strong> &emsp; Release Date : 03-July-2025</summary>
    
- Build Number : 46_202507040204
- Version : V1.0.3

#### Features
- Added responsiveness for login page (#1806)
- Handle installment schedules on placement slip (#1822)
- Add file drag and drop handling to FileField component (#1837)
- Added countryId in tpa insurer broker module (#1839)
- Feat/opportunity activity search (#1846)
- Implemented Remarks field in Meeting feedback form (#1824)
- RO Creation 

#### Fixes
- Priority field ALL changed to Low
- Failed to Save RFP Details , Showing the error charter too long 250 
- When clicked Task creation for deviation giving opportunity_id must be a number
- In the TPA, TPA conatcts are duplicated
- Select asignee for ISG activities should restrict to org
- Unable to select decimal in placement slip, Broking Percentage
- Filed to create Opportunity  - for Marine Open cover 

</details>

<details>
<summary><strong> Version 1.0.4 – Hot Fixes Release </strong> &emsp; Release Date : 09-July-2025</summary>

- Build Number : 49_202507092320
- Version : V1.0.4

#### Fixes
- Added filter for active user status while assigning ISG-AssignmenT tasks 
- Updated cron job timings 
- All crons set to execute between 1:00AM to 5:00 AM 

</details>

<details>
<summary><strong> Version 1.0.5 – Hot Fixes Release </strong> &emsp; Release Date : 24-July-2025</summary>

- Build number : 51_202507240255
- Version : V1.0.5

#### Features 
- Quick company , contact , opportunity create
- Activity Reports 
- Admin Module (Only for super users)

#### Fixes
- SO & RO Filters
- Branch Filter Data    
- Broking slip excel download enhancements
- Covers and Assets Populate Enhancement 
- Multi select Checkboxes enhancements 


</details>

<details>
<summary><strong> Version 1.0.6 – Enhance Release </strong> &emsp; Release Date : 24-July-2025</summary>

- Build Number   : 52_202507241745 
- Version : V1.0.6

#### Enhancements Implemented 
- RO/SO List Enhancements
  - Policy_id column is -   InsurerPolicyNumber 
  - RO/SO Expiry Date  Column - need to be displayed by default , not after selecting from table settings 
  - Date format (DD-MM-YYYY)
  - Hide Columns - Contact (Can be selected from table settings)
  - Hide and arrange order the default columns as per Screenshot 
  - Smart Filters - Activity Filter style iss 
    - Activity filter is showing as disabled
    - Reset - not clearing the hierarchy 
    - Period filter order is added 
      - 3 months 
      - 6 months 
      - 1 year
    - Policy type filter - Data to be alphabetical order 
    - Remove the filter 
  - KPI Cards Updated
    - Sum Insured - Replace the KPI with Brokerage (in RO list)
    - Always display the aggregation of hierarchy in the metrics (Me + My Reportees)
</details>

<details>
<summary><strong> Version 1.0.7 – Enhance Release </strong> &emsp; Release Date : 12-Aug-2025</summary>

- Build#  : 68_202508122134 
- Version : V1.0.7

#### Enhancements 
- SO & RO Performance Fixes 
- Removed auto logout when unauthorised API is triggered {Unwanted logout on a link click, Fixed}
- Resolved permission issue for the entities in sidebar (ex: policies, companies. Etc)
- Resolved retrieving Reporting manager list in employee page (Admin Section)
- Updated RO activity and stages name changes
- Fix for User not being listed in Activities Section, assignee selection 

</details>

<details>
<summary><strong> Version 1.0.8 – Hot Fixes Release </strong> &emsp; Release Date : 15-Aug-2025</summary>

- Build#  : 70_202508150109
- Version : V1.0.8

#### Fixes 
- Change the labels for as My Portfolio, My Companies, My Contacts, My RO, My SO, My Calendar
  - (should show my companies and link to display all companies)
    - Hide other sidebar links
- Hidden SBU Filter as Data unavailable 
- Quick cards: Total Companies | Total RO's | Total Premium amount | Total Commission amount
- Menu order/role specific (Rale based menu display)
- Quick create: Meeting should have a text box
  - (Textbox need to add  at Quick meeting section )
- New Dashboard Implementation 
</details>

<details>
<summary><strong> Version 1.0.9 – Hot Fixes Release </strong> &emsp; Release Date : 22-Aug-2025</summary>

- Build#: 81_202508220604
- Version: V1.0.9

#### Fixes 
- RO Generation for newly loaded policies (Saferisk) - Now ROs are being generated
- Date filters issue in Policies listing screen is fixed
- Date Format across the screens made consistent to DD/MM/YYYY
- Organisation filter is now available in Policies, RO and SO listing screens
- Biz Done Report has a screen with filters. Download can be done with filtered information
- Search Filter options can be chosen for the need and then applied via Run action in all the listing screens

#### Known Issues
- Org filter is yet to come to Company and Contact listing screen. 
- BizDone Report when downloaded for all the organizations together its taking more time than earlier. 
- SBU as a filter is not yet available in applicable filter sections. 
- Making all the filter sections consistent and contextual all across the listing screens. This we will have a discussion, agreement and pick up for implementation

</details>

<details>
    <summary><strong> Version 1.0.10 – Enhance Release </strong> &emsp; Release Date : 01-Sep-2025</summary>
</details>

<details>
<summary><strong> Version 1.0.11 – Enhance Release </strong> &emsp; Release Date : 02-Sep-2025</summary>

- Build # : 85_202509021405
- Version : V1.0.11

#### Features 
- Added opportunityContactMap and contact field in OpportunityRepository.
- Increased employee query limit and improved LoaderOverlay component.
- Included endorsement brokerage in performance metrics.

#### Fixes 
- Added financial year filter to policy list.
- Updated smart search config to use verticalsBySbu.
- Updated business performance data endpoint to new dashboard URL.
- Fixed Biz Done Report to include policy and endorsement data across sheets.

</details>

<details>
<summary><strong> Version 1.0.12 – Enhance Release </strong> &emsp; Release Date : 10-Sep-2025</summary>

- Build # : 88_202509021405
- Version : V1.0.12

#### Features 

- New Dashboard Changes with quarterly performances
- Manage Company Screen Enhancements (Added company profile page)
- Bizdone report 
    - Bizdone report link needs to be out of the Admin module 
    - Need to be visible based on privilege (Download is only for Chairman and System Admin)
    - Binzdone Report grid - Drill downs need to be enabled 
- Business Performances
    - Total Dial graphs which is clickable(2 graphs - 1 is at Business performance , 2 is at Quarterly Outcomes)
- Brokerage Collected  graph introduced
    
- In Manage Policy: removed the links for the priority and Insurer
- Once clicked on SO/RO Funnel, it should navigate to manage the opportunity of SO/RO respectively, and if KDM is clicked, an automatic filter should be applied on that
- Manage Company Quick Cards update

</details>

<details>
<summary><strong> Version 1.0.13 – Hot Fixes  Release </strong> &emsp; Release Date : 11-Sep-2025</summary>

- Build # : 89_2025092041
- Version : V1.0.13
#### Features 

- Documents tab introduced in company details page 

#### Fixes 
- Deviation Handling at Opportunity Activities 
  - Policy Held Cover note
  - Policy Hard Copy Receipt 
  - Policy Confirmation 
- Default Selection of Manager + Team  In Dashboard  
- CD account changes - when Cheque for Payment Option is selected 

</details>
