# BizDone Report — Details-Co-Insurer Based Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and formulas.

When a policy's risk is shared across more than one insurer, this sheet restates the business one row per insurer's share rather than one row per policy. Most fields mean exactly what they mean in [Details-Policy Based](IIRM-5441_BizDone-Details-Policy-Based.md); the section below covers what differs.

> [!important]
> **Confirmed against production on 2026-08-08.** This sheet went from **45 columns to 44**: it lost Company Vertical and Policy Group, gained Updated Via SQL, and had Terrorism Commission renamed to Terrorism Brokerage. That is the same commit (`2ebae9f3d0`) that changed Details-Policy Based, applied here because its column changes were deliberately written report-section-wide rather than per-sheet.
>
> In the same production export this sheet holds **27 rows against Details-Policy Based's 43,903** — expected, since only a handful of policies are genuinely shared across insurers, not a sign of over-filtering.

## What Makes This Sheet Different

Share Percentage, Share Amount, Brokerage Percentage, Brokerage Amount, and Brokerage Collected are sourced **per insurer share** from `policy_insurer_map`, not from the Policy record directly — unlike Details-Policy Based's policy-level versions of the same field names.

Per the parent PRD's Business Rule 13, summing this sheet's Brokerage Amount back up to the policy level agrees with Details-Policy Based's own Brokerage Amount for only **0.34%** of policies. Whether the remaining money fields (Net Premium, Gross Premium, etc.) are prorated per share or simply repeat the full policy-level figure on every co-insurer row was not confirmed at code or database level — the one co-insured policy in the sample data suggested "repeats in full," but a single sample row isn't a reliable basis for that claim. A database check comparing Net Premium/Gross Premium across `policy` and `policy_insurer_map` for the same policy, across all 12 genuinely co-insured policies, would settle it.

| Field | What it means | Formula / Source |
|---|---|---|
| Emp Name | The IIRM employee credited with this business. | A single owner field, in place of Details-Policy Based's multi-role ownership chain (parent PRD Open Question 1). |
| Status | A secondary lifecycle status — **currently a duplicate, not a separate concept.** | Populated from the exact same source value as Policy Status; the two always show the same thing today (Open Question 1). |
| Deal Confirmed | Whether the underlying deal has been finally confirmed. | Raw lookup value — carries almost no information: "Yes" for over 99.8% of all rows regardless of Policy Status or ingestion mode. Marked for removal in the Sri Lanka 2026-08-08 spec. |
| Policy Name / Policy Category | The product sold and its broader classification. | Same underlying values as Details-Policy Based's Policy Type (`policyName`) and IIRM Category (`policyCategory`) — shown here as two adjacent columns rather than one relabeled field elsewhere in the table. |
| Share Percentage | IIRM's percentage share of the business. | Per-insurer-share value from `policy_insurer_map`, not the Policy record. |
| Share Amount | The premium amount this insurer's share represents. | Per-insurer-share value from `policy_insurer_map` = Basic Premium × Share Percentage / 100 (98.9% match). |
| Brokerage Percentage | The reference brokerage rate for this insurer's share. | Per-insurer-share value from `policy_insurer_map`. |
| Brokerage Amount | The brokerage earned on this insurer's share. | Per-insurer-share value from `policy_insurer_map` — sums back to Details-Policy Based's policy-level figure for only 0.34% of policies (Business Rule 13). |
| Brokerage Collected | How much of the earned brokerage has been received, for this share. | Per-insurer-share value from `policy_insurer_map`. |
| Updated Via SQL | Whether this row was patched by a manual SQL script rather than through the application. | Added 2026-08-07, same as Details-Policy Based. Renders "No" when unset. |

## Fields Shared With Details-Policy Based

These carry the same meaning and source as documented in the [Details-Policy Based child PRD](IIRM-5441_BizDone-Details-Policy-Based.md): Serial Number, Iirm Pol No, Iirm Ref No, Ins Pol No, Ins End No, Income Type, Entry In Iwork, Income Month, Date Of Income, Policy From Date, Policy To Date, Cust Id, Customer Name, Customer Category, Insurer, Ins Branch, Iirm Organisation, Iirm Branch, Vertical, Department, SBU, Net Premium, Terrorism, Other, Service Tax, Gross Premium, Premium Collected, Brokerage Amount As Entered By Isg, Brokerage Amount As Per Iwork, Fees, Terrorism Brokerage Amount / Percentage, and Policy Status.

## Fields This Sheet Does Not Carry

Business Month, Date Of Business, Group Company, the full ownership chain (beyond Emp Name), Total Net Premium, Gst Percentage, Gst, and Iwork Unique Id.

## Change History

### 2026-08-07 — Shipped (commit `2ebae9f3d0`)

This sheet was affected by the same commit as Details-Policy Based, because Steps 7–8 of `bizdone_policy_details_resequence_columns.sql` were written **deliberately country-agnostic and not filtered by sheet** — the comment in that script notes this was the only way to reach Sri Lanka's config rows, which exist in the database but have no seed script in source control.

| Change | Detail |
|---|---|
| **Added** "Updated Via SQL" | Appended as the last column of this sheet, same as Details-Policy Based. |
| **Removed** | `companyVertical`, `policyGroup`, `associateCrm` (this sheet's share of the five columns deactivated report-section-wide). |
| **Renamed** Terrorism Commission → Terrorism Brokerage | Column headers and Totals-row labels. |

### 2026-08-08 — Specified, not yet confirmed shipped

`BizDone - Columns_8-Aug-2026.xlsx` specifies changes for **Details-Policy Based only** — it contains no tab or section for this sheet. Whether the resequencing and renaming specified there is intended to apply to this sheet as well, or whether Details-Co-Insurer Based is deliberately being left on its current layout, is unconfirmed and worth clarifying before the spec is applied — particularly since the 2026-08-07 precedent shows column changes in this area have historically been applied report-section-wide rather than per-sheet.
