# My Companies — Module PRD

**Module:** IIRM-774 · My Companies  
**Product:** iWork — IIRM Insurance CRM  
**Stage:** 40a · Product Requirements  
**Mode:** Reverse-engineered from production code  
**Last updated:** 2026-06-24  
**Author:** Daksh · Nithin Sirigiri

---

## 1. Why This Module Exists

Every entity in iWork — contacts, policies, sales opportunities, renewal opportunities, claims, and the IBP (Risk Watch) employee portal — is anchored to a company record. "My Companies" is the root CRM entity. Before a policy can be placed, a contact linked, or an opportunity created, a company must exist in the system.

The module serves two personas simultaneously: the CRM team (who originate, enrich, and own company records) and the operations/admin team (who configure the employee-facing IBP portal that each company's HR will use). This dual purpose is the central design tension in the module's information architecture — the same record drives both a sales workflow and a product-delivery workflow.

This document is the product behavior contract for the My Companies module. It is read by developers, QA, and the client before sign-off. It does not describe implementation decisions — those belong in the TRD (stage 40b).

---

## 2. Scope

### In scope

- Company listing page with smart search, KPI cards, column management, and pagination
- Company creation flow: duplicate-check wizard → full 4-step form wizard
- AI-assisted quick creation via Smart Assist (SmartAssistForm)
- Company edit flow (same form, edit mode)
- Company detail page with all active tabs: Profile, More info, Contacts, KYC, Overview, Strategy, Documents, Employee Detail Config
- Company detail navigation from listing (RO premium click → renewal opportunities tab; SO premium click → sales opportunities tab)
- Bulk reassignment of Account Manager / CRM across multiple companies
- IBP portal configuration per company: URL & domain, branding, login & authentication, dashboard configuration, policy configuration, policy feature documents, additional documents, policy locations
- Portal status lifecycle: Draft → Pending → Active / Rejected
- Risk Watch redirect from listing (only for the company's Lead CRM user)
- Permission-gated access: VIEW, CREATE, EDIT, BULK_EDIT

### Out of scope (deferred)

- Portfolio / Our portfolio tab in company details (commented out; deferred)
- Brokerage column in listing (commented out; deferred)
- Company bulk-delete or bulk-status-change
- Company merge or deduplication after creation
- Automated portal activation (approval is always manual by an IIRM admin)

---

## 3. User Personas

| Persona | Role in this module |
|---|---|
| CRM Executive | Creates and enriches company records; owns sales & service strategy sections |
| Account Manager | Assigned to companies; visible in listing and detail; drives Lead CRM derivation |
| Lead CRM | The account's primary CRM contact; sees the Risk Watch redirect button in the listing |
| Central OPS | Configures the IBP portal per company; manages enrollment and policy settings |
| IIRM Admin / Super-Admin | Approves or rejects portal configurations submitted for review |
| HR Admin (IBP user) | End-consumer of the portal config; does NOT operate in iWork |

---

## 4. User Stories

Each story traces to a specific feature observed in the codebase.

### 4.1 Company Listing

**US-MYCO-001**  
As a CRM user with VIEW_COMPANY permission, I want to see a paginated list of companies with a KPI summary so that I can quickly assess the portfolio state before diving into individual records.

**US-MYCO-002**  
As a CRM user, I want to filter the company list by company type, priority, industry, city, status, account manager, and a date range (company created) so that I can focus on the subset I am responsible for.

**US-MYCO-003**  
As a CRM user, I want the company list to default to "Active" status so that inactive or prospect companies don't clutter my default view.

**US-MYCO-004**  
As a CRM user, I want to reorder and persist column visibility in the company table so that my preferred view is restored on my next visit.

**US-MYCO-005**  
As a Lead CRM user, I want to see a "Risk Watch" button on rows where I am the assigned Lead CRM so that I can launch the company's IBP HR portal in one click without navigating away.

**US-MYCO-006**  
As a CRM user, I want to click on the RO Premium cell to navigate directly to the renewal opportunities tab for that company, so that I don't have to open the detail page and hunt for the right tab.

**US-MYCO-007**  
As a CRM user, I want to click on the SO Premium cell to navigate directly to the sales opportunities tab for that company, for the same reason.

### 4.2 Company Creation

**US-MYCO-008**  
As a user with CREATE_COMPANY permission, I want the system to check for duplicate company names before I start filling in the full form so that I don't accidentally create a second record for an existing client.

**US-MYCO-008a**  
As a CRM user, I want to see existing companies that partially match what I've typed (displayed as a parent–child hierarchy tree) so that I can either select an existing company to link my contact or opportunity to, or confirm there is no match and proceed to create a new record.

**US-MYCO-009**  
As a CRM user, I want to upload a business card image during the creation check so that the company name is pre-filled automatically, and when I proceed to the full form, the system further pre-fills display name, website, number of employees, industry segment, company type, and address from the scanned card and AI enrichment.

**US-MYCO-010**  
As a CRM user, I want to use the AI-assisted "Quick Create" path to generate a minimal company record from the name alone so that I can create a shell record quickly and enrich it later.

**US-MYCO-011**  
As a CRM user, I want to fill in company details across a 4-step wizard (Basic → KYC → Profile → Strategy) so that the data entry is chunked and progressive, reducing cognitive load.

**US-MYCO-012**  
As a CRM user, I want the Display Name field to auto-populate from the Company Name when I blur the Company Name field so that I don't have to type the same thing twice.

**US-MYCO-013**  
As a CRM user, I want the Lead CRM field to auto-derive from the selected Account Manager so that CRM hierarchy is maintained without manual double-entry.

**US-MYCO-014**  
As a CRM user, I want the Parent Company Name field to appear only when I indicate the company is part of a group so that the form surface stays minimal for standalone companies.

**US-MYCO-015**  
As a CRM user, I want to add multiple GST entries (state + category + GST number) for companies with multi-state registrations so that compliance information is complete.

### 4.3 Company Edit

**US-MYCO-016**  
As a user with EDIT_COMPANY permission, I want to edit all company fields except Company Name (which is locked after creation) so that enrichment is possible while preserving the audit identity of the record.

### 4.4 Company Detail View

**US-MYCO-017**  
As a CRM user, I want to view company details across tabs (Profile, More info, Contacts, KYC, Overview, Strategy, Documents, Employee Detail Config) so that all information about an account is reachable from one place.

**US-MYCO-017a**  
As a CRM user, I want the company detail header to show the company's priority, Associate CRM name, industry, and sentiment at a glance so I can assess account health without opening a tab.

**US-MYCO-017b**  
As a CRM user, I want a "Tracxn" button on the company detail page so I can open the company's Tracxn profile in a new tab for market intelligence without leaving iWork.

**US-MYCO-017c**  
As a Central OPS user, I want a "Configure IBP Portal" button on the company detail page so I can jump directly to portal configuration without navigating through the listing.

**US-MYCO-017d**  
As a Lead CRM user, I want a "Risk Watch" button on the company detail page so I can launch that company's IBP HR portal in a new tab from anywhere within the detail view.

**US-MYCO-017e**  
As an admin user, I want an "Open Strapi CMS" button on the company detail page so I can manage content for this company in the Strapi CMS without manually navigating to it.

**US-MYCO-018**  
As a CRM user, I want to see all contacts linked to a company displayed as cards (name, primary email, primary phone, designation) so I can quickly identify and reach stakeholders.

**US-MYCO-018a**  
As a CRM user, I want an "Add contact" button on the Contacts tab so I can create a new contact and have it pre-linked to this company in a single flow.

**US-MYCO-019**  
As a CRM user, I want to see the company's KYC details (registration no, TAN, PAN, date of incorporation, currency, annual premium, and GST records) in a dedicated tab so that regulatory information is auditable.

**US-MYCO-020**  
As a CRM user, I want to see the full sales and service strategy sections (why this account, competition, targeting reason, weaknesses, action plan, potential opportunities, industry intelligence, sales pitch, service plan, acquisition history, business profile, service performance) so that account context is captured alongside identity data.

### 4.5 Bulk Operations

**US-MYCO-021**  
As a user with BULK_EDIT_WRITE permission, I want to select multiple companies and reassign the Account Manager / Lead CRM in one action so that CRM ownership changes from org restructuring don't require individual record edits.

### 4.6 Portal Configuration

**US-MYCO-022**  
As a Central OPS user, I want to configure the IBP portal for a company (URL, branding, authentication method, dashboard features, policy settings) so that the company's HR Admin gets a branded, correctly configured employee portal.

**US-MYCO-023**  
As a Central OPS user, I want to submit the portal configuration for review so that an IIRM admin can validate it before it goes live.

**US-MYCO-024**  
As an IIRM Admin, I want to approve or reject a submitted portal configuration so that only validated configs reach employees.

**US-MYCO-025**  
As a Central OPS user, I want to configure policy-level enrollment settings (start/end dates, employer contribution, confirmation requirement, auto-lock rules) per policy type (GMC, GTL, GPA) so that each company's benefit enrollment window is correctly controlled.

---

## 5. Business Rules

### 5.1 Duplicate Prevention

**BR-MYCO-001**  
A company with a name that exactly matches an existing company (case-insensitive, after trim) cannot be created. The "Create" and "Quick Create" buttons on the duplicate-check wizard are disabled when an exact match is found. When similar-but-not-exact matches exist, the buttons remain **enabled** — the user is shown a warning but may proceed.

**BR-MYCO-002**  
The duplicate check fires after a 300 ms debounce when the typed name reaches 3 or more characters. Input shorter than 3 characters clears the search results and does not trigger a lookup.

**BR-MYCO-002a**  
The duplicate-check wizard search displays three distinct UI states:

| Condition | UI |
|---|---|
| No companies found | "No company found" message + no-data image; Create button enabled |
| Similar (partial) match found | "Similar companies found" message + results tree; Create button **enabled** |
| Exact name match found | "Company already exists" message + results tree; Create button **disabled** |

**BR-MYCO-002b**  
Search results are rendered as a parent–child hierarchy tree (group company structure). A user may select an existing company node from the tree to associate a contact or opportunity with that company instead of creating a new record. Selecting an existing company routes to the Contact Selection step (`/create2`), not to the company creation form.

**BR-MYCO-003**  
Company Name cannot be changed after creation (the field is disabled in edit mode). Display Name can be changed at any time.

### 5.2 Field Constraints

**BR-MYCO-004**  
Company Name: required, max 200 characters.  
Display Name: max 100 characters.

**BR-MYCO-005**  
Date of Incorporation cannot be set to today or any future date.

**BR-MYCO-006**  
PAN Card Number: max 10 characters, stored uppercase.

**BR-MYCO-007**  
GST Number: stored uppercase; must match Indian GST format (e.g., `27ABCDE1234F1Z5`). All three GST sub-fields (State, Category, GST Number) must be filled together or left entirely empty — partial entry is blocked.

**BR-MYCO-008**  
Currency is non-editable after it is set (always disabled). It is pre-populated from the user's organisation settings.

**BR-MYCO-009**  
Company website must match URL format validation.

### 5.3 Company Detail Header Actions

**BR-MYCO-035**  
The company detail page header always shows: display name, priority chip (with dot), Associate CRM chip (with image, "Led by" prefix), industry, and sentiment.

**BR-MYCO-036**  
**Tracxn button** — always visible in the company detail header. Clicking it opens the `TRACXN_URL` constant value in a new browser tab. It is not company-specific (same URL for all companies).

**BR-MYCO-037**  
**Configure IBP Portal button** — always visible in the company detail header. Clicking it navigates to `/companies/:id/configure-portal` and appends a breadcrumb entry "Configure IBP Portal" to the breadcrumb trail.

**BR-MYCO-038**  
**Risk Watch button on detail page** — visible only when `companyData.leadCrmInfo.id === currentUserId` (same rule as the listing). On click, calls `crmRedirectToken` API and opens the IBP HR portal in a new tab.

**BR-MYCO-039**  
**Open Strapi CMS button** — always visible in the company detail header. Clicking it opens Strapi CMS in a new tab. The button requires no company-specific permissions currently (open to all users who can view company detail).

**BR-MYCO-040**  
**Edit button** — visible only when the user has `EDIT_COMPANY` permission AND `companyData.editable` is `true` or `undefined`. When `companyData.editable` is explicitly `false`, the Edit button is hidden regardless of permission.

### 5.4 Contacts Tab

**BR-MYCO-041**  
Contacts in the company detail Contacts tab are displayed as **cards**, not a table. Each card shows:
- Contact name: salutation + firstName + lastName (clickable — navigates to `/contact/:id`)
- Primary email (identified by `communicationType = "email"` and `isPrimary = true`)
- Primary phone (identified by `communicationType = "phone"` and `isPrimary = true`)
- Designation (shown at the card footer; displays `-` when not set)

**BR-MYCO-042**  
When no contacts are linked to the company, the Contacts section shows a no-data image with the message "No Contacts for {companyName}!". The "Add contact" button is still visible.

**BR-MYCO-043**  
**Add contact button** — navigates to `/contact/new` and passes `{ companyId, activeTabKey: "contacts" }` as route state. This creates a **new** contact pre-linked to the current company. It does not provide a flow to link an existing contact.

### 5.5 More Info Tab

**BR-MYCO-044**  
The More info tab shows company details in a structured section (see Section 4, "More info" tab definition), followed by:
- **Company logo** — fetched by `companyLogoFileId` and rendered as a preview image. Clicking the logo opens it full-size in a new browser tab. When no logo exists, shows a "No logo available" placeholder.
- **Address section** — all addresses from `companyData.companyAddresses` rendered via the AddressSection component.
- **Policy configuration locations** — `companyData.policyLocations` rendered as an additional AddressSection when the array is non-empty.

### 5.6 CRM Hierarchy

**BR-MYCO-010**  
Lead CRM is derived automatically when an Account Manager is selected; the Lead CRM field is always read-only in the form. A user cannot manually set a Lead CRM.

**BR-MYCO-011**  
The "Risk Watch" button is visible in the company listing only to the user whose `userId` matches the company's `leadCRMId`. All other users see no button on that row.

### 5.4 Group Company

**BR-MYCO-012**  
When "Is group company" is set to any value other than the "No" lookup ID (48), the "Parent Company Name" field becomes mandatory and visible. When "Is group company" is set to "No", the Parent Company field is hidden and its value is cleared.

### 5.5 Status Defaults

**BR-MYCO-013**  
The company listing defaults to filtering by `status = Active`. Users can change this in the smart search filters.

**BR-MYCO-014**  
"Untapped companies" in the KPI card is defined as companies whose status is Prospect (i.e., companies identified as potential clients but not yet converted to active clients).

### 5.6 Bulk Edit

**BR-MYCO-015**  
The bulk edit action (row selection) is available only to users with BULK_EDIT_WRITE permission. The operation reassigns Account Manager / Lead CRM across the selected set of companies.

### 5.7 Portal Configuration

**BR-MYCO-016**  
Portal configuration status transitions: Draft → Pending (submitted for review) → Active (approved by IIRM Admin) or Rejected (rejected by IIRM Admin). A rejected config can be revised and resubmitted.

**BR-MYCO-017**  
Only an IIRM internal admin / super-admin role can move a portal config from Pending to Active or Rejected.

**BR-MYCO-018**  
Supported authentication methods for IBP portal: `EMAIL_OTP`, `PHONE_OTP`, `SIMPLE_AUTH`, `GOOGLE_OAUTH`, `MICROSOFT_OAUTH`. Exactly one method is active per company portal at a time.

**BR-MYCO-019**  
For the `SIMPLE_AUTH` method, the following sub-configurations are available: password policy (min length, character composition requirements), password expiry days, account lockout (failed attempt limit + lockout duration), session timeout, 2FA (OTP delivery method, OTP length, OTP validity, resend cooldown, retry limit), change password on first login, enrollment reminder days.

**BR-MYCO-020**  
Policy configuration is per-policy-type (GMC, GTL, GPA). Enrollment start/end dates, employer contribution, require-confirmation, auto-lock-enrollment, auto-lock-after-confirmation, and disclaimer text are configured independently for each policy type linked to the company.

### 5.8 Business Card Scan

**BR-MYCO-022**  
The duplicate-check wizard (`/create`) exposes a business card upload field. Accepted formats: `.jpg`, `.jpeg`, `.png`, `.webp`. The uploaded card is sent to the `businessCard` API endpoint, which extracts structured card data.

**BR-MYCO-023**  
When a business card is uploaded and a company name is successfully extracted, the company name field on the duplicate-check wizard is pre-filled automatically. The user can edit the extracted name before proceeding.

**BR-MYCO-024**  
When the user proceeds from the duplicate-check wizard to the full company creation form (`/companies/new`) with a company name (whether typed or extracted from a card), an AI enrichment call (`companySearch` endpoint) is triggered **automatically** in the background. On success, the following form fields are pre-filled without user action:

| Field | Source |
|---|---|
| Company name | Typed / card `companyName` |
| Display name | AI enrichment `companyBasicInfo.displayName`, fallback to card `companyName` |
| Number of employees | AI enrichment `companyBasicInfo.noOfEmployees` |
| Website | Card `website`, fallback to AI enrichment `companyBasicInfo.website` |
| Industry segment | AI enrichment `companyBasicInfo.industrySegment.value` |
| Company type | AI enrichment `companyBasicInfo.companyType.value` |
| Address (address1, area, pinCode) | Card `address[0]` via `buildAddressLine1` |

All pre-filled values are editable. Fields for which no data is available remain blank.

**BR-MYCO-025**  
The duplicate-check wizard also offers a separate **Policy Document** upload (`.pdf` format, sent to `pdfAnalyzer` endpoint). This is a distinct document-scanning use case, not part of the business card scan flow.

### 5.10 KPI Card Formulae

All four KPI values are computed by the backend and returned in the `/company` API response alongside the paginated rows. The frontend performs no aggregation — it only formats and displays what the API returns. All four values are **filter-aware**: they reflect the currently applied smart search filters, not a global all-company total.

**BR-MYCO-027**  
**Total companies** = count of company records matching the current smart search filter set (equivalent to the pagination total). Displayed as a plain integer.

**BR-MYCO-028**  
**Untapped companies** = count of companies with status = Prospect within the current filter set. A company is "untapped" when it has been identified as a potential client but has not yet been converted to an active client.

**BR-MYCO-029**  
**Total RO premium (#count)** = sum of all renewal opportunity expected premiums across companies in the current filter set, displayed as a formatted currency value (e.g., `1,053.7Cr`), followed by the total count of renewal opportunities in parentheses (e.g., `(20,660)`). Both the premium sum and count are zero if no matching ROs exist.

**BR-MYCO-030**  
**Total SO premium (#count)** = sum of all sales opportunity expected premiums across companies in the current filter set, displayed as a formatted currency value, followed by the total count of sales opportunities in parentheses. Same format as RO.

### 5.11 Listing Column Formulae

These columns appear per company row in the listing table. Values are returned per row by the API; the frontend only formats them.

**BR-MYCO-031**  
**Policy premium (#count)** per company row = `policyPremium` displayed as currency, followed by `policyCount` in parentheses prefixed with `#`. Displays `--` when `policyPremium` is null.  
**Underlying calculation (backend):** `policyPremium` = SUM of `policy.premiumAtInception` across all active policies linked to this company. `premiumAtInception` is the full policy premium at the time the policy was incepted (neither net premium after deductions nor commission-based; it is the inception-time total premium amount stored on the policy record).

**BR-MYCO-032**  
**RO premium (#count)** per company row = `roPremium` displayed as currency, followed by `renewalOpportunityCount` in parentheses. This cell is **clickable** — clicking it navigates to the company detail page with the Renewal Opportunities tab pre-selected.  
**Underlying calculation (backend):** `roPremium` = for each active RO linked to this company, sum the referenced policy's `premiumAtInception` plus the sum of all related endorsements' `premiumAtInception`. This gives a "gross expected renewal premium" = original policy premium + all endorsement amendments.

**BR-MYCO-033**  
**SO premium (#count)** per company row = `soPremium` displayed as currency, followed by `salesOpportunityCount` in parentheses. When `salesOpportunityCount` is null the count defaults to `0`. This cell is **clickable** — clicking it navigates to the company detail page with the Sales Opportunities tab pre-selected.  
**Underlying calculation (backend):** `soPremium` = SUM of `opportunity.premiumPaid` across all active SOs linked to this company. Unlike Policy/RO which use `premiumAtInception`, SO uses the `premiumPaid` field on the opportunity record (i.e. the premium actually committed/paid for that sales opportunity, not an inception estimate).

### 5.12 Rich Text Limits

**BR-MYCO-034**  
All rich text fields (company history, major products, key customers, business processes, remarks, and all strategy fields) enforce a character count limit defined by the `RICH_TEXT_LIMIT` constant. Exceeding this limit produces a validation error.

---

## 6. Acceptance Criteria

### Company Listing

**AC-MYCO-001** — KPI Cards on load  
Given the user lands on `/companies`,  
When the page loads with default filters (status = Active),  
Then four KPI cards are visible with the following values sourced from the API response:  
- Total companies = count of companies matching current filters  
- Untapped companies = count of Prospect-status companies within current filters  
- Total RO premium (#count) = sum of RO premiums formatted as currency + total RO count in parentheses  
- Total SO premium (#count) = sum of SO premiums formatted as currency + total SO count in parentheses

**AC-MYCO-001a** — KPI Cards update with filters  
Given the user applies or changes smart search filters,  
When the table data refreshes,  
Then all four KPI values update to reflect the new filter set (not a cached global total).

**AC-MYCO-001b** — Column aggregates per row  
Given the listing is loaded,  
When a company row is rendered,  
Then:  
- Policy premium (#count) shows the sum of that company's policy premiums as currency + policy count as `(#N)`; shows `--` when premium is null  
- RO premium (#count) shows the sum of that company's RO premiums as currency + RO count as `(#N)`; cell is clickable  
- SO premium (#count) shows the sum of that company's SO premiums as currency + SO count as `(#N)`; defaults SO count to `0` when null; cell is clickable

**AC-MYCO-002** — Default filter  
Given no stored smart search preferences exist,  
When the listing loads,  
Then company status filter defaults to "Active" and only active companies are shown.

**AC-MYCO-003** — Smart search filters  
Given the user opens the smart search panel,  
When filters are applied (company type, priority, industry, city, status, account manager, date range),  
Then the table updates to reflect the intersection of all applied filters.

**AC-MYCO-004** — Risk Watch button visibility  
Given a company row where `leadCRMId = currentUserId`,  
When the listing renders,  
Then a "Risk Watch" button is visible on that row.  
Given a row where `leadCRMId ≠ currentUserId`,  
Then no button is rendered in the action column.

**AC-MYCO-005** — Risk Watch redirect  
Given the user clicks "Risk Watch" on a company row,  
When the API call to `crmRedirectToken` succeeds,  
Then the IBP portal opens in a new browser tab with the access token embedded in the URL.

**AC-MYCO-006** — RO/SO premium navigation  
Given the user clicks the RO Premium cell for a company,  
When navigation completes,  
Then the user is on `/companies/:id` with `activeTabKey = "renewalOpportunities"`.  
Given the user clicks the SO Premium cell,  
Then `activeTabKey = "salesOpportunities"`.

### Company Creation

**AC-MYCO-007** — Exact duplicate blocked  
Given the user types a company name that exactly matches an existing record (case-insensitive, trimmed),  
When the debounced search returns results,  
Then an "exact match" message is shown, the existing company appears in the tree, and both "Create" and "Quick Create" buttons are disabled.

**AC-MYCO-007a** — Similar match allows creation  
Given the user types a company name that returns partial/similar results but no exact match,  
When the search returns results,  
Then a "similar companies found" message is shown with the results tree, and the "Create" and "Quick Create" buttons remain **enabled**.

**AC-MYCO-007b** — No results allows creation  
Given the user types a company name (≥ 3 chars) that matches no existing record,  
When the search returns no results,  
Then a "no company found" message and a no-data image are shown, and the "Create" and "Quick Create" buttons are enabled.

**AC-MYCO-007c** — Select existing company from tree  
Given similar or exact results are shown in the tree,  
When the user clicks a company node in the tree,  
Then the selection is recorded and the user is routed to the Contact Selection step (`/create2`) to associate a contact or opportunity with the existing company (not to the new company form).

**AC-MYCO-008** — Duplicate check minimum length  
Given the user has typed fewer than 3 characters,  
When the input changes,  
Then no API call is made, results are cleared, and the result area shows the default empty state.

**AC-MYCO-008a** — Debounce  
Given the user is typing in the company name field,  
When the user pauses for less than 300 ms between keystrokes,  
Then no search API call is fired until the 300 ms debounce elapses.

**AC-MYCO-009** — Business card scan: name pre-fill  
Given the user uploads a business card image (`.jpg`, `.jpeg`, `.png`, or `.webp`),  
When the `businessCard` endpoint processes the file,  
Then the company name field on the duplicate-check wizard is pre-populated from the extracted `companyName`.

**AC-MYCO-009a** — Business card scan: rejected file format  
Given the user attempts to upload a file that is not `.jpg`, `.jpeg`, `.png`, or `.webp`,  
When the file picker processes the selection,  
Then the file is rejected and a helper-text error is shown.

**AC-MYCO-009b** — Business card scan: form pre-fill via AI enrichment  
Given the user proceeds from the duplicate-check wizard to the full form with a company name sourced from a business card,  
When the `companySearch` AI enrichment call completes,  
Then the following fields are pre-filled (if data is available): Display name, Number of employees, Website, Industry segment, Company type, and Address (address1, area, pinCode). All pre-filled values remain editable.

**AC-MYCO-010** — Form wizard steps  
Given the user clicks "Create" on the duplicate-check page,  
When the form opens,  
Then a 4-step progress wizard is shown with steps: Basic, KYC, Profile, Strategy.

**AC-MYCO-011** — Display name auto-fill  
Given the Company Name field has a value and the user tabs away,  
When the blur event fires,  
Then the Display Name field is populated with the same value (if it was empty).

**AC-MYCO-012** — Lead CRM derivation  
Given an Account Manager is selected,  
When the selection is confirmed,  
Then the Lead CRM field displays the derived lead name and remains read-only.

**AC-MYCO-013** — Parent company conditional  
Given "Is group company" is set to any value other than "No" (lookup ID 48),  
When the form renders,  
Then the Parent Company Name field is visible and mandatory.  
Given "Is group company" is set to "No",  
Then the Parent Company Name field is hidden and its value is cleared.

**AC-MYCO-014** — GST partial entry blocked  
Given the user fills in only one or two of the three GST fields (State, Category, GST Number),  
When the form is submitted,  
Then a validation error is shown on the unfilled GST field(s) indicating all three must be filled together.

**AC-MYCO-015** — Date of incorporation  
Given the user picks today's date or any future date,  
When the form validates,  
Then an error message "Date of Incorporation cannot be in the future" is shown.

### Company Edit

**AC-MYCO-016** — Company name locked  
Given the user navigates to `/companies/:id/edit`,  
When the form loads,  
Then the Company Name field is rendered as disabled (not editable).

### Company Detail — Tabs

**AC-MYCO-017** — Company detail header actions  
Given the user opens any company detail page (`/companies/:id`),  
When the page loads,  
Then the header shows: display name, priority chip, Associate CRM chip ("Led by" prefix), industry, sentiment; and the action bar shows: "Tracxn" button, "Configure IBP Portal" button, "Open Strapi CMS" button (always), "Edit" button (only with EDIT_COMPANY permission and `editable !== false`), "Risk Watch" button (only when current user is the Lead CRM).

**AC-MYCO-017a** — Tracxn button  
Given the user clicks "Tracxn" on the company detail header,  
When clicked,  
Then the Tracxn URL opens in a new browser tab.

**AC-MYCO-017b** — Configure IBP Portal button  
Given the user clicks "Configure IBP Portal" on the company detail header,  
When clicked,  
Then the user is navigated to `/companies/:id/configure-portal` with "Configure IBP Portal" appended to the breadcrumb trail.

**AC-MYCO-017c** — Contacts tab: card layout  
Given the user opens the Contacts tab,  
When contacts exist,  
Then contacts are rendered as cards (not a table). Each card shows: full name (salutation + first + last, clickable — navigates to `/contact/:id`), primary email (with mail icon), primary phone (with phone icon), and designation (shows `-` if not set). The "Add contact" button is visible in the section header.

**AC-MYCO-017d** — Contacts tab: empty state  
Given the user opens the Contacts tab and no contacts are linked,  
When the tab renders,  
Then a no-data image and the message "No Contacts for {displayName}!" are shown. The "Add contact" button remains visible.

**AC-MYCO-017e** — Add contact  
Given the user clicks "Add contact" on the Contacts tab,  
When clicked,  
Then the user is navigated to `/contact/new` with `companyId` and `activeTabKey: "contacts"` in route state, so the new contact is pre-linked to this company and the return breadcrumb lands back on the Contacts tab.

**AC-MYCO-018** — KYC tab  
Given the user opens the KYC tab,  
When the tab loads,  
Then two sections are shown: "Regulatory details" (Registration number, TAN number, PAN card number, Date of incorporation, Currency, Annual premium) and "GST" (one card per GST entry showing State, GST Number, Category).

**AC-MYCO-019** — Strategy tab  
Given the user opens the Strategy tab,  
When the tab loads,  
Then two sections are shown: "Sales strategy" and "Service strategy", each with all rich text fields populated from the stored data.

### Bulk Edit

**AC-MYCO-020** — Row selection visibility  
Given the user has BULK_EDIT_WRITE permission,  
When the listing loads,  
Then checkboxes are visible on each row for multi-select.  
Given the user does NOT have BULK_EDIT_WRITE,  
Then no checkboxes are rendered.

**AC-MYCO-021** — Bulk reassign  
Given the user selects one or more companies and triggers bulk edit,  
When the Account Manager / CRM is changed and confirmed,  
Then all selected companies are updated with the new Account Manager and the derived Lead CRM.

### Portal Configuration

**AC-MYCO-022** — Config status lifecycle  
Given a portal config exists in Draft state,  
When the Central OPS user submits it for review,  
Then the status changes to Pending.  
When an IIRM admin approves it,  
Then the status changes to Active.  
When an IIRM admin rejects it,  
Then the status changes to Rejected.

**AC-MYCO-023** — Auth method selection  
Given the portal config is in Draft or Rejected state,  
When the user selects an auth method (EMAIL_OTP, PHONE_OTP, SIMPLE_AUTH, GOOGLE_OAUTH, MICROSOFT_OAUTH),  
Then only the configuration sub-sections relevant to that method are shown.

**AC-MYCO-024** — Policy enrollment dates  
Given the user configures a policy type (GMC / GTL / GPA),  
When they set enrollment start and end dates,  
Then those dates are saved against the specific policy config record (not shared across policy types).

---

## 7. Data Contract

This section describes what the My Companies module consumes and produces. Implementation shapes belong in the TRD.

### 7.1 Inputs (consumed by this module)

| Source | Data |
|---|---|
| Lookup service (`COMPANY_TYPE`, `PRIORITY`, `INDUSTRY_SEGMENT`, `COMPANY_STATUS`, `SENTIMENT_TYPE`, `COMPANY_SOURCE_TYPE`, `GROUP_COMPANY`, `TAX`) | Dropdown options for company fields |
| Employee hierarchy API | Account Manager and Lead CRM selection tree |
| Master data — city, currency, country, state | Address and financial field options |
| Session storage (`user.userId`) | Determines Risk Watch button visibility |
| Parent companies list API (`/company/group-company`) | Options for "Parent Company Name" field |
| Business card upload processor | Pre-fills company name on creation |
| AI / SmartAssist service | Generates quick company record from name |
| Industry intelligence AI service | Generates industry intelligence rich text (on-demand, triggered by button) |

### 7.2 Outputs (produced / written by this module)

| Consumer module | What it uses from company |
|---|---|
| **Contacts** | `companyId` — contacts are linked to a company at creation; company detail Contacts tab lists all linked contacts |
| **Sales Opportunities (SO)** | `companyId` — SOs are created against a company; SO Premium cell in listing aggregates `soPremium + salesOpportunityCount` |
| **Renewal Opportunities (RO)** | `companyId` — ROs are created against a company; RO Premium cell aggregates `roPremium + renewalOpportunityCount` |
| **Opportunity Activities** | `companyId` — all SO/RO workflow activities (RFP, quote, negotiations, placement, policy docket, etc.) carry the company context from the linked opportunity |
| **Policies** | `companyId` — policies are placed under a company; Policy Premium cell aggregates `policyPremium + policyCount` |
| **Endorsements** | `companyId` — endorsement listing and endorsement details reference the company via the linked policy |
| **Claims** | `companyId` — claims are linked to a company; claims can be reached from Company Details breadcrumb state |
| **Tasks** | `companyId` — when creating a Task, the user links it to a company; company dropdown is a first-level field in the Task form |
| **Meetings** | `companyId` — when creating a Meeting, the user links it to a company; changing the company clears the linked opportunity and contact fields |
| **Notes** | `companyId` — when creating a Note, the user links it to a company; same pattern as Tasks and Meetings |
| **IBP Portal (Risk Watch)** | `companyId` + portal config — the entire IBP portal is company-scoped; portal config drives branding, auth, dashboard, and policy enrollment for that company's HR portal |
| **Employee Detail Config** | `companyId` — employee data upload and configuration is scoped per company |
| **Biz Done Report** | `companyId` — breadcrumb state carries company context to biz-done report navigation |
| **Client Portfolio** | `companyId` — my-client-portfolio navigates back to company detail with filter state |
| **CRM Redirect (Risk Watch)** | Issues a token via `crmRedirectToken` API for the Lead CRM user; uses `portalUrl` from the API response to open the IBP app |

### 7.3 Cross-module contract items for stage 40b

The following must be resolved in the TRD:

- Shape of the `overallData` object returned by `/company` (fields: `count`, `untappedCompanies`, `totalRoCount`, `totalRoPremium`, `totalSoCount`, `totalSoPremium`)
- Contract for the `crmRedirectToken` endpoint (request: `{ userId, companyId }`, response: `{ accessToken, portalUrl }`)
- Industry intelligence AI API contract (input: company name / industry; output: structured JSON mapped to `sectionMap` keys)
- Portal config API contracts for `/config-company/portal/{id}` and `/auth-config/company/{id}`

---

## 8. Downstream Impact Summary

The company record is the single root entity. A company being created, edited, or deactivated has cascading downstream effects across the following areas.

### 8.1 After Creation — what becomes possible

Once a company record exists, it unlocks the following operations across the platform:

| Area | What company enables |
|---|---|
| **Contacts** | Contacts can be created and linked to this company |
| **Sales Opportunities (SO)** | SOs can be raised against this company |
| **Renewal Opportunities (RO)** | ROs can be tracked under this company |
| **Opportunity Activities** | All SO/RO workflow steps (RFP entry, quote, negotiation, placement slip, policy docket, etc.) carry the company context from the linked opportunity |
| **Policies** | Policies can be placed under this company |
| **Endorsements** | Endorsements can be processed against policies tied to this company |
| **Claims** | Claims can be filed and tracked under this company's policies |
| **Tasks** | Tasks can be logged and linked to this company directly |
| **Meetings** | Meetings can be scheduled and linked to this company; linked opportunity and contact fields cascade from the selected company |
| **Notes** | Notes can be recorded against this company |
| **IBP Portal (Risk Watch)** | A portal configuration can be created and eventually activated for this company's HR portal |
| **Employee Detail Config** | Employee data upload and config is possible once the company record exists |

### 8.2 Status change (Active → Inactive / Prospect)

The company no longer appears in the default "Active" filter on the listing. Existing linked records (contacts, SOs, ROs, policies, claims, tasks, meetings, notes) are not automatically deactivated — they remain in their respective modules but the company is no longer surfaced in normal workflow views.

### 8.3 CRM / Account Manager reassignment (bulk or individual)

Changes `leadCRMId` on affected companies. The Risk Watch button disappears from the previous Lead CRM's listing view and appears for the new Lead CRM on next page load.

### 8.4 Portal config going Active

The company's employees gain access to the IBP portal with the configured branding, auth method, dashboard features, and enrollment settings. A rejected config returns to Rejected state; Central OPS must revise and resubmit for re-approval by an IIRM Admin.

---

## 9. Open Questions

The following items are unresolved and must be answered before or during stage 40b.

| # | Question | Owner | Impact |
|---|---|---|---|
| OQ-01 | The SO and RO tabs (`salesOpportunities`, `renewalOpportunities`) are commented out in `detailsConfig.ts` but navigation to them is wired in the listing. What is the reactivation plan and timeline? | Product | Tab visibility in company detail |
| OQ-02 | What fields are editable in the Bulk Edit action? The permission (`BULK_EDIT_WRITE`) enables row selection, but the actual bulk-edit form/modal UI was not found in the current codebase. Does it exist as a separate component? | Tech | TRD scope |
| OQ-03 | The Employee Detail Config tab renders an `EmployeeDetailConfig` component — the product behavior for this tab is not documented. What does it configure? | Product | Tab PRD coverage |
| OQ-04 | "Portfolio / Our portfolio" tab is commented out. Is it deferred or permanently removed? | Product | Scope clarity |
| OQ-05 | Is there a notification mechanism when a portal config is submitted for review (e.g., email to IIRM Admin)? If yes, what triggers it and what does it contain? | Product | Portal config workflow |
| OQ-06 | Can a company be deleted, or only deactivated (status change)? There is no delete endpoint visible in the current code — confirm this is by design. | Product / Tech | Data integrity |
| OQ-07 | The "Brokerage" column in the listing is commented out. Is it deferred or removed? | Product | Table column scope |
| OQ-08 | What is the full list of company statuses beyond Active and Prospect? The lookup key is `COMPANY_STATUS` — the full value set is not hardcoded in the PRD-facing code. | Product | BR-MYCO-014 precision |

---

## 10. Approval

*To be completed by the client after review.*

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
