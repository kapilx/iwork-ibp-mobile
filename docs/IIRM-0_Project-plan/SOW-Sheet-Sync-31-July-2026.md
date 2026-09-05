# SOW Sheet Sync — 31-July-2026 (main file <- _Old)

Sheet: `SOW, Feedbacks-Bug & CR_Items`. Compared row-by-row against `_Old.xlsx` 
(which has no Jira ID column) and patched the main file's columns A-J with the newer 
values, keeping the Jira ID column (K) untouched. 59 rows updated.

One structural note: found a row (`IIRM-10799` / Application Performance, row 343) that 
exists only in the main file, not in `_Old` at all — this caused a 1-row misalignment 
for rows 344-352 which was corrected before comparing. That orphan row was left untouched 
(not deleted) since it's unclear whether `_Old` predates it or dropped it intentionally.

## Changes applied (59 rows)

| Row | Jira ID | Feature | Field | Old | New |
|---|---|---|---|---|---|
| 71 | — | Archived Oppurtunity, Policy Mgmt {Archived Biz Data and Retrieval on need} - DPDP | ETA | 07-Aug-2026 | 31-Jul-2026 |
| 78 | IIRM-763 | Accessibility | ETA | — | 07-Aug-2026 |
| 106 | IIRM-4473 | NFR_Usability | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 115 | — | Country Handling {Data Source Mgmt} | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 116 | — | View Service Score | Functionality | My Client Portfolio: Service Score - Single Table (drillable) to calculate an overall score ⏎ Dashboard - Service Score - Widget | My Client Portfolio: Service Score - Single Table (drillable) to calculate an overall score ⏎ Dashboard - Service Score - Widget ⏎ |
| 126 | — | Wellness Discount List Management | ETA | — | 31-Jul-2026 |
| 127 | IIRM-793 | Upload from Partner of services bought on Partner site | ETA | — | 31-Jul-2026 |
| 147 | — | Premium Range Calculator | Remarks | — | Retail Business |
| 147 | — | Premium Range Calculator | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 148 | — | Multiple 3rd Party Service Mgmt | Remarks | — | Retail Business |
| 148 | — | Multiple 3rd Party Service Mgmt | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 148 | — | Multiple 3rd Party Service Mgmt | Resource | Abhilash | — |
| 149 | — | Claims Mgmt | Remarks | — | Retail Business |
| 149 | — | Claims Mgmt | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 149 | — | Claims Mgmt | Resource | Manjusha | — |
| 150 | IIRM-788 | Individual Insurance Plan Mgmt | Remarks | — | Retail Business |
| 162 | IIRM-794 | End User Portal Configurator | Module | IBP | IBP/iWork |
| 163 | — | Benefits Summary | Remarks | Pending: Retail Insurance | — |
| 167 | — | My Insurance | Remarks | Retail insurance(facility to load user insurance policies) | Retail Business |
| 167 | — | My Insurance | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 168 | IIRM-784 | Basic Wellness Hub | Remarks | wellness | Wellness |
| 169 | IIRM-785 | Wellness HR View | Status | Dev - WIP | Yet to start |
| 169 | IIRM-785 | Wellness HR View | Remarks | wellness | Wellness |
| 169 | IIRM-785 | Wellness HR View | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 170 | — | Wellness Partner View | Remarks | wellness | Wellness |
| 171 | IIRM-788 | Individual Plans | Remarks | Pending: Retail insurance | Retail Business |
| 172 | — | Individual Plan Summary | Remarks | Pending: Retail insurance | Retail Business |
| 174 | — | Profile Migration | Remarks | — | Retail Business |
| 175 | — | Profile Migration | Remarks | — | Retail Business |
| 178 | IIRM-785 | Wellness IIRM View | Remarks | — | Wellness HR View |
| 178 | IIRM-785 | Wellness IIRM View | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 178 | IIRM-785 | Wellness IIRM View | Resource | Ravi | Manjusha |
| 182 | — | Insurer Integration Mgmt | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 183 | — | Reports | Remarks | — | Linked with Reconciliation Management & Commission |
| 183 | — | Reports | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 190 | — | Reconciliation Management ⏎ Upload Commission Statement | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 191 | — | Reconciliation Mgmt | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 192 | — | HRMS Integration Mgmt | Feature | HRMS Integration Mgmt | HRMS Integration Mgmt ⏎  ⏎ Framework provided to link the HRMS portal in Risk Watch |
| 192 | — | HRMS Integration Mgmt | Status | Yet to start | Dev - WIP |
| 198 | — | Policy Configuration | ETA | — | 07-Aug-2026 |
| 202 | IIRM-9443 | Policy Configuration | ETA | — | 07-Aug-2026 |
| 204 | — | Claim Intimation & Submission | ETA | — | 03-Aug-2026 |
| 206 | — | Opportunity - Validate uploaded documents | ETA | — | 07-Aug-2026 |
| 211 | — | End-2-End: Automation of IBP Go-live Setup | Status | Yet to start | Delivered |
| 211 | — | End-2-End: Automation of IBP Go-live Setup | ETA | 31-Jul-2026 | 17-Jul-2026 |
| 214 | — | SSO - MS AD Account | Status | Dev - WIP | DEV - WIP |
| 238 | — | VRK - PROD Feedback: 9-Jun-2026 | ETA | 30-Jul-2026 | 31-Jul-2026 |
| 260 | — | Export to Excel | ETA | — | 07-Aug-2026 |
| 261 | IIRM-10667 | IIRM-10667 | ETA | — | 07-Aug-2026 |
| 262 | IIRM-10668 | IIRM-10668 | ETA | — | 07-Aug-2026 |
| 263 | — | Discuss with Madhav | ETA | — | 07-Aug-2026 |
| 265 | — | Installment & Fee Requirements | ETA | — | 07-Aug-2026 |
| 269 | IIRM-9988 | Claims Corner | ETA | 28-Jul-2026 | 07-Aug-2026 |
| 274 | — | VRK - PROD Feedback: 23-Jun-2026 | ETA | 31-Jul-2026 | 30-Jul-2026 |
| 286 | — | VRK - PROD Feedback: 23-Jun-2026 | ETA | — | 07-Aug-2026 |
| 288 | — | AI | ETA | — | 07-Aug-2026 |
| 289 | — | AI | ETA | — | 07-Aug-2026 |
| 290 | — | Inception/Endorsement | ETA | — | 07-Aug-2026 |
| 291 | — | BizDone | ETA | — | 07-Aug-2026 |
| 294 | — | Service Flow - Upload Employee Details | ETA | — | 31-Jul-2026 |
| 296 | IIRM-10764 | No Policy Config - Enrolment Journey | ETA | 31-Jul-2026 | 07-Aug-2026 |
| 302 | — | Toast Message - UI | ETA | — | 07-Aug-2026 |
| 322 | — | IBP - Welcome Emails | ETA | — | 07-Aug-2026 |
| 324 | — | iWork - Report | Status | Yet to start | Delivered |
| 324 | — | iWork - Report | ETA | — | 18-Jul-2026 |
| 325 | — | Help Info - Field formulaes or field values | ETA | — | 07-Aug-2026 |
| 334 | — | BizDone | Status | Yet to start | Delivered |
| 334 | — | BizDone | ETA | — | 21-Jul-2026 |
| 344 | — | IBP - Email Communication | Status | Dev - WIP | DEV - WIP |
| 344 | — | IBP - Email Communication | Remarks | — | API is ready. Need to add into Notification framework |
| 344 | — | IBP - Email Communication | ETA | — | 04-Aug-2026 |
| 345 | — | Personal Line Data Integrations | ETA | — | 07-Aug-2026 |
| 346 | — | ISG Flow Changes | ETA | 30-Jul-2026 | 31-Jul-2026 |
| 348 | — | My Client Portfolio | Functionality | My Client Portfolio: issues - company search and brokerage | My Client Portfolio: issues - company search and brokerage ⏎ |
| 351 | — | Enrolment Journey - EMI's | ETA | — | 04-Aug-2026 |
| 352 | — | Enrolment Journey - Component - Notes | ETA | — | 04-Aug-2026 |

## Orphan row — resolved, kept as-is

| Row | Jira ID | Area | Feature | Functionality | Status | Requested Date |
|---|---|---|---|---|---|---|
| 343 | IIRM-10799 | Production - Bug | Application Performance | IIRM-10799_Performance (Database & Infra) | Yet to start | 24-Jul-2026 |

This row is in the main file but absent from `_Old` — `_Old` was exported before this
item was added. Confirmed by Nithin (2026-07-28): **stays in the file, no change made.**
