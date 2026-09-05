# BizDone Report — Details-Policy Based Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and formulas.

This is the richest sheet in the workbook: one row per policy or endorsement, carrying the full internal ownership chain and the complete premium/brokerage breakdown. It is also the sheet that changes most often — see [Change History](#change-history) at the end, which is the authoritative record of what moved when.

> [!important]
> **Confirmed against production on 2026-08-08.** Two dated exports in `Sample - BizDones/` bracket the change: the 23 July export has **57 columns and no Applied Filters sheet**; the 8 August export has **53 columns and an Applied Filters sheet**. This confirms the 2026-08-07 changes are live.
>
> It also confirms the **8 August resequencing spec has *not* been applied** — the production file still reads "Company Name", "Iirm Organisation", "Net Premium" and "Updated Via SQL", not the renamed "Customer Name", "IIRM Organisation", "Basic Premium" and "Ingested Mode" the spreadsheet specifies. The tables below describe what production produces today.

## Column Configuration Is Data, Not Code

Which columns this sheet contains, what they're labeled, and what order they appear in is **not hardcoded** — it's driven by rows in the `localization_report_fields_country_map` database table, keyed by country (`country_id`), report section (`bizdone`), and sheet (`activity_section = 'policyDetails'`). A second layer, `POLICY_REPORT_HEADER_OVERRIDES` in `service-lib/utils/file-management.utils.ts`, renames some fields at render time for acronyms and business-preferred labels that automatic camelCase-to-Title-Case conversion gets wrong.

Two consequences worth knowing before reading anything below:

- A column can be added, removed, reordered, or renamed **without a code deploy**, by changing that table.
- The same underlying field can therefore carry different labels on different surfaces (screen vs. download) and in different countries — which is exactly what causes several of the naming mismatches this document flags.

## India — Current Columns

**Identity — where this business sits**

| Field (as it appears in the file) | What it means | Formula / Source |
|---|---|---|
| Serial Number | A row index generated for this export. | `indexOffset` — not a stored business field. |
| Iirm Pol No | The unique policy number iWork assigns to this record. | Raw: `policyId`, the Policy record's own database ID. |
| Iirm Ref No | A secondary internal reference number for the same record. | Raw, stored column. |
| Iwork Unique Id | A system-level ID for internal record-linking. | Raw, stored column — not something you'd normally read directly. |
| Cust Id | The internal ID for the customer record. | Raw: `companyId` — iWork models a customer as a Company record, so this is the Company entity's own ID. |
| Company Name | The company or individual who bought the policy. | Raw, stored column. |
| Customer Category | How the customer is classified, e.g. corporate vs retail. | Raw lookup value. |
| Group Company | The parent or holding company this customer sits under. | Raw: `parentCompanyName`. |
| IIRM Category | The policy's category/classification. | Rollup, not a raw column: `policy.policyTypeLid → PolicyTypeSegregation.policyTypeLid → PolicyTypeSegregation.iirmPolicyTypeLid → lookup_data`, grouping detailed Policy Types into a smaller set of category buckets. Confirmed against the full database: 405 of 194,880 policies (0.21%) have no row in that segregation table and render this column blank. |
| Iirm Organisation | Which IIRM legal entity this business belongs to. | `empOrganisationName` — sourced from the policy's owning employee record (see note below). |
| SBU | The Strategic Business Unit this business is booked under. | `empSbuName` — owning employee's record. |
| Vertical | The IIRM industry vertical, one level below SBU. | `empVerticalName` — owning employee's record. |
| Department | The department within that vertical. | `empDepartmentName` — owning employee's record. |
| Iirm Branch | The branch office that owns this business. | `empBranchName` — owning employee's record. |

> [!note]
> Iirm Organisation, SBU, Vertical, Department, and Iirm Branch are all sourced from the policy's owning employee record, not an attribute stamped independently on the policy or company. Whether these reflect the owner's assignment at record-creation time or their current assignment is unconfirmed — worth a product decision, since it affects how the parent PRD's Business Rules 3 and 6 should be read.

**Who's accountable — the ownership chain**

Every policy carries an internal accountability chain. Some links are independent assignments stored on the Company record; others are computed at report time by walking the reporting-manager chain upward from Lead CRM.

| Field | What it means | Formula / Source |
|---|---|---|
| Created By | The employee who created this policy record. | Raw: `empFirstName`, relabeled from "Policy Owner" to "Created By" via `POLICY_REPORT_HEADER_OVERRIDES`. |
| Lead CRM | The senior CRM overseeing the client relationship. | Company's own `leadCrm` assignment. |
| CRM Manager | Lead CRM's own reporting manager. | **Computed** at report time. Note the label: the underlying field is `crmTeamLead`, relabeled to "CRM Manager" — see the naming warning below. |
| Account Manager | Owns the overall commercial relationship with the account. | Company's own `accountManager` assignment. |
| Central OPS Team Lead | Leads the centralised operations team servicing this policy. | Company's own `centralOpsTeamLeadId` assignment. |

> [!warning]
> **The ownership chain was cut from seven roles to five on 2026-08-07, and one surviving field was relabeled.** `associateCrm`, `crmManager`, and `centralOpsLead` were deactivated. The field still called `crmTeamLead` internally is now displayed as **"CRM Manager"** — so the column labeled "CRM Manager" today shows *Lead CRM's manager*, whereas before the change a differently-sourced column carried that same label. Anyone comparing an export from before 2026-08-07 against one after it should not assume the "CRM Manager" column means the same thing in both.

**When it happened**

| Field | What it means | Formula / Source |
|---|---|---|
| Income Month | The month IIRM's books recognise the income (parent PRD Business Rule 2). | Raw, stored column, governed by the cut-off rule. |
| Business Month | The month the policy or endorsement itself took effect (Business Rule 2). | Raw: `policy.businessMonth` / `endorsement.endorsementEffectiveDate`. |
| Date Of Business | The exact date behind Business Month. | Raw, stored column. |
| Date Of Income | The exact date behind Income Month. | Raw, stored column. |
| Policy From Date / Policy To Date | The policy's actual coverage start and end dates. | Raw, stored columns. |
| Entry In Iwork | When the row was inserted. | Raw: `createdAt` — the database row's own creation timestamp, not a separately tracked "data entry" event. |

**What was sold, and who insures it**

| Field | What it means | Formula / Source |
|---|---|---|
| Policy Type | The product sold, e.g. Group Mediclaim Policy. | Raw: `policy.policyName` (despite the "Type" label). |
| Income Type | Whether this row is a Policy, Endorsement, or Reward. | The `recordType` discriminator, set per query leg. |
| Ins Pol No | The insurer's own policy number. | Raw, stored column. |
| Ins End No | The insurer's own reference for an endorsement. | Raw, stored column. |
| Insurer | Which insurance company underwrote the policy. | Raw: `insurer.displayName`. |
| Ins Branch | The insurer's branch that issued it. | Raw, stored column. |
| Policy Status | The policy's current lifecycle state, e.g. Active. | Raw lookup value. |

**The money**

Brokerage is the fee IIRM earns from the insurer for placing a policy. Net Premium, Terrorism, Other, Service Tax, and Fees are all raw, manually entered or migrated values with no formula behind them — they're the inputs everything else below reconciles (or fails to reconcile) against.

| Field | What it means | Formula / Source |
|---|---|---|
| Share Percentage / Share Amount | IIRM's percentage share of the business, and the premium amount that share represents. | Share Amount = Basic Premium × Share Percentage / 100, computed once during the pre-policy negotiation activity and never revalidated afterward. Holds up well: of 740 populated values, 732 (98.9%) still match this formula. |
| Net Premium | Premium after statutory deductions — the portion insurers actually retain. | Raw, manually entered or migrated. |
| Terrorism / Other | Premium components tied to terrorism cover, and any other component outside the standard categories. | Raw, manually entered or migrated. |
| Total Net Premium | Net Premium plus Terrorism plus Other. | **Formula, computed only at report time** (Business Rule 7) — there is no `total_net_premium` column on the Policy record. |
| Gst Percentage / Gst | The GST rate applied to this policy, and the resulting GST amount. | Live formula (non-Sri Lanka): `Gst = Net Premium × Gst Percentage / 100` — populated on under 2% of rows (Business Rule 8). |
| Service Tax | A separate, older tax line, distinct from GST. | Raw, manually entered or migrated. |
| Gross Premium | The full premium the customer pays, before deductions. | Live formula (non-Sri Lanka): `Gross Premium = Net Premium + Gst Amount`. Matches Net Premium × 1.18 for 75.0% of organically-created and 79.77% of migrated policies (Business Rule 8). |
| Premium Collected | How much of the premium has actually been received in cash so far. | Raw, manually entered — except for migrated (`SQL_LOAD`) rows, where the migration job forced this equal to Gross Premium at load time (Business Rule 10). |
| Brokerage Percentage / Brokerage Amount | The reference brokerage rate, and the brokerage earned. | For organically-created policies with a non-zero rate, `Brokerage Amount = Net Premium × Brokerage Percentage / 100` holds 92.8% of the time (Business Rule 9). No formula ties them together in the migrated majority. |
| Terrorism Brokerage Amount / Terrorism Brokerage Percentage | A separate brokerage rate negotiated on top of the ordinary one — **not related to the Terrorism premium line item.** | Live formula (non-Sri Lanka): `Net Premium × Terrorism Brokerage Percentage / 100`. Rarely holds in stored data: only 3.5% of 62,605 populated values match it. **Renamed from "Terrorism Commission …" on 2026-08-07** — the underlying field is still `terrorismCommissionAmount` / `terrorismCommissionPercentage`. |
| Brokerage Collected | How much of the earned brokerage has actually been received. | Raw, manually entered — except for migrated rows, where the migration job forced this equal to Brokerage Amount at load time (Business Rule 10). |
| Fees | Any additional fee charged outside the premium itself. | Raw, manually entered. Populated on ~17% of migrated policies (avg ₹9,128) and rarely on organically-created ones (19 of 776), but far larger on average (₹106,685) when it is. |
| Brokerage Amount As Entered By Isg | A brokerage figure entered manually by the ISG team. | Raw, manually entered — independent of Brokerage Amount (~83% mismatch when both are populated). |
| Brokerage Amount As Per Iwork | A second, independently entered brokerage figure. | Raw, manually entered — independent of Brokerage Amount (~83% mismatch when both are populated). |
| Updated Via SQL | Whether this row was patched by a manual SQL script rather than through the application. | `COALESCE(lookup(policy.updated_via_sql_lid), 'No')` — added 2026-08-07. Deliberately surfaced so a hand-patched row is visible to whoever reads the numbers. Distinct from `ingested_mode`, which records how the row was originally *created* (see Business Rule 10). |

## The Totals Row

Both Details sheets end with a Totals row. It is a footer, not a policy — an importer should drop it (parent PRD BR-005). Each cell repeats its own label before the number, and those labels are **not** always the column header, which matters if anything parses this file. From the 8 Aug 2026 production export:

| Column | Totals cell reads |
|---|---|
| Serial Number | `Totals` |
| Net Premium | `Net Premium: 5836087232.83` |
| Total Net Premium | `Total Net Premium: 7391672917.16` |
| Gst | `GST Amount: 166414442.69` |
| Terrorism Brokerage Amount | `Terrorism Brokerage Amount: 1277774.83` |
| Brokerage Amount As Entered By Isg | `BrokerageAmtEnteredbyISG: 9573022.68` |
| Brokerage Amount As Per Iwork | `BrokerageAmtAsperIwork: 4223091063.79` |

Note the last three: the Gst column's total says "GST Amount", and the two ISG/iWork totals run their words together with no spaces. Non-money columns are left blank.

## Sri Lanka — Column Variant

Sri Lanka runs the same sheet with a materially different money breakdown, because its premium and tax structure differs from India's. The identity, ownership, timing, and product columns are the same as India's above; the differences are concentrated in the premium and brokerage columns.

**What Sri Lanka does not carry:** Terrorism / Terrorism Brokerage Amount / Terrorism Brokerage Percentage, Gst Percentage / Gst, Service Tax, and (per the 2026-08-08 spec) Deal Confirmed. Net Premium exists but is computed differently — see below.

**Sri Lanka's own premium and brokerage fields:**

| Field | What it means |
|---|---|
| Basic Premium | The base premium before any additional components. |
| SRCC Premium Amount | Premium for Strikes, Riots and Civil Commotion cover — priced separately in this market. |
| TC Premium Amount | Premium for Terrorism Cover, the Sri Lanka equivalent of India's Terrorism line. |
| Net Premium | Auto-calculated and locked from manual edit: Basic Premium + SRCC + TC (contrast India, where Net Premium is raw manual entry). |
| Admin Charges | Administrative charges levied on the policy. |
| Stamp Duty | Statutory stamp duty. |
| Cess Amount | Statutory cess levy. |
| Policy Fee | A fixed policy-issuance fee. |
| VAT Percentage / VAT Amount | Value Added Tax rate and amount — Sri Lanka's equivalent of India's GST. |
| Gross Premium | Auto-calculated and locked: the sum of Basic + SRCC + TC + GST/VAT + Fee + Other + Admin + Cess. |
| Basic Brokerage Amount | Brokerage earned on the basic premium component. |
| SRCC Brokerage Percentage / SRCC Brokerage Amount | Brokerage rate and amount on the SRCC component. |
| TC Brokerage Percentage / TC Brokerage Amount | Brokerage rate and amount on the Terrorism Cover component. |
| Total Brokerage Amount | The combined brokerage across all components. |

> [!note]
> Sri Lanka's Net Premium and Gross Premium are **system-calculated and read-only**, unlike India's, where both are manually entered and only weakly reconciled (Business Rule 8). This is the single biggest behavioural difference between the two countries' versions of this sheet.

## Change History

### 2026-08-07 — Shipped (commit `2ebae9f3d0`)

Author: Karan Agarwal. Merged into `docs/product-team`; live in the code that produces this sheet today.

| Change | Detail |
|---|---|
| **Added** "Updated Via SQL" column | New `updated_via_sql_lid` field on both the Policy and Endorsement entities, surfaced as the last column of both detail sheets. Renders "No" when unset. Deliberately country-agnostic — reaches Sri Lanka too. |
| **Removed** 5 columns | `companyVertical`, `policyGroup`, `associateCrm`, `crmManager`, `centralOpsLead` deactivated in the config table, report-section-wide (not country-filtered, so both detail sheets and all countries). |
| **Renamed** Terrorism Commission → Terrorism Brokerage | Affects both the column headers and the Totals-row labels in the Excel export. Underlying field names unchanged (`terrorismCommissionAmount` / `terrorismCommissionPercentage`). |
| **Relabeled** CRM hierarchy | `crmTeamLead` now displays as "CRM Manager" (the previous "CRM Manager" column, sourced from `crmManager`, was removed). "Policy Owner" now displays as "Created By". |
| **Screen** (on-screen table) | Policy Group and Company Vertical commented out; "Updated Via SQL" added. |
| **UI** (Report Sheet Select menu) | "Select all" checkbox moved below the individual sheet options. |

**Impact on this PRD:** the sample export files in this folder predate this commit, so they still show the old 57-column layout including Company Vertical, Policy Group, Associate CRM, and the old Terrorism Commission labels. Field definitions above reflect the post-commit state.

### 2026-08-08 — Specified, not yet confirmed shipped

Source: `BizDone - Columns_8-Aug-2026.xlsx`. A full resequence-and-rename pass for Details-Policy Based, specified for both India and Sri Lanka. This spreadsheet is the business-side spec; whether it has been applied to the config table was not verified for this document.

**Renames specified (India tab — "Current Labels" column shows what each is called today):**

| Current label | New label |
|---|---|
| Iirm Organisation | IIRM Organisation |
| Iirm Branch | Branch |
| Company Name | Customer Name |
| Ins Pol No | Insurer Policy No |
| Created By | Policy Created By |
| Ins End No | Insurer End No |
| Total Brokerage Amount | Total Income |
| Brokerage Percentage | Basic Brokerage Percentage |
| Brokerage Amount | Basic Brokerage Amount |
| Net Premium | Basic Premium |
| Terrorism | Terrorism Premium |
| Gst Percentage | GST Percentage |
| Gst | GST Amount |
| Other | Other Amount |
| Ins Branch | Insurer Branch |
| Share Percentage | Insurer Share Percentage |
| Share Amount | Insurer Share Amount |
| Iirm Pol No | IIRM Policy No |
| Iirm Ref No | IIRM Ref No |
| Updated Via SQL | Ingested Mode |

> [!warning]
> **"Ingested Mode" here is a display rename of the "Updated Via SQL" column, not the `ingested_mode` database column.** Confirmed with the product owner. The value shown remains `updated_via_sql_lid` — *was this row hand-patched via SQL* — and not the separate `ingested_mode` column (`APPLICATION` vs `SQL_LOAD`) that records how a row was originally created. Two different concepts, now sharing a name; anyone reading or building on this column should be explicit about which one they mean.

**Other India changes specified:** Service Tax flagged "Check and remove". Columns resequenced substantially — the money block moves ahead of the premium block, with Total Income / Basic Brokerage / Terrorism Brokerage / Fees appearing before Basic Premium and the tax lines.

**Sri Lanka changes specified:** removes Net Premium, Terrorism, Gst Percentage, Gst, Service Tax, Terrorism Brokerage Amount, Terrorism Brokerage Percentage, and Deal Confirmed (all marked "Not there for Sri Lanka"); removes a duplicate `Tcbrokerage Amount` column; renames `Policy Category` → `IIRM Category`, `Policy Name` → `Policy Type`, `Emp Name` → `Policy Created By`, and adds a new `TC Brokerage Percentage` field.

**Open item:** whether this spec has been applied to `localization_report_fields_country_map` yet, and whether the config-table changes and the `POLICY_REPORT_HEADER_OVERRIDES` code map are in sync after it. Since column config is data rather than code (see the section at the top of this document), a spec like this can be applied without a deploy — so the code will not necessarily reflect it.
