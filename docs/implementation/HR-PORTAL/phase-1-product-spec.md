# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Provide HR teams a centralized portal to monitor policy usage, manage member enrollments and endorsements, initiate and track claims, and access policy information and documents.
- **Business Value:** Reduces HR operational overhead and turnaround time by enabling self-service claim tracking, enrollment management, and bulk data operations, improving employee support quality and compliance.
- **User Value:** Gives HR rapid visibility into member status, claims lifecycle, enrollment progress, and access to downloadable artifacts (E-cards, forms, reports) with robust search, filters, and bulk utilities.
- **Module Type:** Core
- **Phase 1 Scope:** Dashboard KPIs and analytics, claims listing and detail views, HR-initiated claim actions, member search and listings with core actions, enrollment utilities and dashboard, policy information access, contact matrix, and documents/downloads.

## 2. Objective

- **Operational Efficiency:** Enable HR to perform day-to-day insurance administration tasks (claims, enrollment, endorsements) with minimal friction and fewer back-and-forths with TPA/insurer.
- **Visibility & Control:** Provide near-real-time visibility into claims, enrollment statuses, and member data, with drill-downs and downloadable reports.
- **Data Accuracy:** Support validated bulk uploads and error reporting to maintain clean member records and reduce processing errors.
- **Employee Support:** Equip HR to act on behalf of employees (initiate claims, upload shortfall documents, corrections) to ensure timely resolution.

## 3. In Scope

- **Dashboard (HR Landing Page):**
    - Sticky header cards for totals (active/inactive members, contact matrix).
    - Analytics: claims totals split by employee/dependent, cashless vs reimbursement, enrollment done vs not done, claim settled vs rejection rate with drill-down CTA.
    - Visual graphs: claims utilization, total enrolled, employee vs dependent, enrolled vs not enrolled.

- **Claims Module:**
    - Claims listing with filters (type, status, policy year, employee ID/UHID, claim number, relation, hospital, admission date).
    - Search (name, UHID, claim number) and download list (Excel/PDF).
    - Claim details: TPA details, status timeline, shortfall tracking, upload missing docs, download all claim docs, settlement letter, bill/discharge summary view, TPA comments/notes.
    - Claim initiation by HR: reimbursement claim, pre-authorization (cashless), capture required documents and editable ICD codes.

- **Members Module:**
    - Member search (name, employee ID, UHID, phone, relation).
    - Employee and dependents listing with key attributes (name, UHID, relation, DOB, policy eligibility, previous year UHID mapping).
    - Artifacts: E-card download, member summary, TPA card details.
    - Member-level actions: addition (mid-term endorsement), deletion, correction requests (name, DOB, gender, relation), endorsement status tracker.
    - Bulk uploads: addition, deletions, corrections with automated error files.

- **Enrollment Module (HR side):**
    - Enrolment on behalf of employee: add dependents, select policy/top-up options, auto-calculate premium, track status.
    - Enrollment dashboard: totals for members, enrolled, pending.
    - Bulk enrollment utilities: import employee master, bulk dependent addition file, validation and error reports.
    - Approval workflow (if applicable): employee submission, HR review, insurer/TPA confirmation.

- **Policy Information Module:**
    - Policy summaries (GMC, GPA, GTL, OPD, top-up), inclusions/exclusions, waiting periods, disease-wise sub-limits.
    - Policy documents: wording, bare acts, brochures, FAQs, hospital network list, downloadable TPA forms.

- **Contact Matrix:**
    - Customer care details for TPA and dedicated coordinator info.

- **Documents & Downloads:**
    - Claim forms, reimbursement checklist, employee handbook, policy brochures, hospital network list (PDF/Excel), enrollment master reports, claim utilization reports, E-card downloads.

## 4. Functional Requirements

- **FR-HR-PORTAL-001: HR Dashboard KPIs and Analytics**
    - Provide sticky header cards for total active/inactive members and contact matrix.
    - Display analytics: claims totals by employee vs dependent; cashless vs reimbursement; enrollment done vs not done; settled vs rejection rate.
    - Offer drill-down CTA from analytics/graphs to relevant detail pages.

- **FR-HR-PORTAL-002: Claims Listing and Search**
    - List claims with filters: claim type, status, policy year, employee ID/UHID, claim number, relation, hospital, admission date.
    - Enable search by name, UHID, claim number.
    - Support export to Excel and PDF.

- **FR-HR-PORTAL-003: Claim Details View**
    - Show TPA details, claim status timeline, shortfall tracking.
    - Allow upload of missing/shortfall documents by HR.
    - Provide downloads: all claim documents and settlement letter.
    - Render hospital bill and discharge summary.
    - Show TPA comments/notes.

- **FR-HR-PORTAL-004: Claim Initiation by HR**
    - Allow HR to initiate reimbursement claims and pre-authorization (cashless) requests.
    - Capture required documents and editable ICD codes.

- **FR-HR-PORTAL-005: Member Search and Listing**
    - Search by name, employee ID, UHID, phone, relation.
    - Display member attributes: name, UHID, relation, DOB, policy eligibility, previous year UHID mapping.
    - Provide downloads: E-card and member summary; show TPA card details.

- **FR-HR-PORTAL-006: Member-Level Actions and Tracking**
    - Process endorsements: additions, deletions, corrections (name, DOB, gender, relation).
    - Track endorsement statuses.

- **FR-HR-PORTAL-007: Bulk Uploads for Members**
    - Support bulk addition, deletion, correction via templates.
    - Generate automated error files for mismatches and validation failures.

- **FR-HR-PORTAL-008: Enrollment on Behalf of Employee**
    - Add dependents, select policy/top-up options.
    - Auto-calculate premiums and track enrollment status.

- **FR-HR-PORTAL-009: Enrollment Dashboard and Bulk Utilities**
    - Show totals for members, enrolled, pending.
    - Import employee master and bulk dependent addition files.
    - Validate data and produce error reports.

- **FR-HR-PORTAL-010: Approval Workflow (Conditional)**
    - If configured, implement stages: employee submission, HR review, insurer/TPA confirmation.

- **FR-HR-PORTAL-011: Policy Information Access**
    - Present summaries (GMC/GPA/GTL/OPD/top-up), inclusions/exclusions, waiting periods, sub-limits.
    - Provide access to policy documents (wording, acts, brochures, FAQs, network list, TPA forms).

- **FR-HR-PORTAL-012: Contact Matrix**
    - Maintain and display TPA customer care and coordinator contact information.

- **FR-HR-PORTAL-013: Documents & Downloads**
    - Offer downloads for claim forms, reimbursement checklists, employee handbook, policy brochures, hospital network lists (PDF/Excel), enrollment master reports, claim utilization reports, and E-cards.