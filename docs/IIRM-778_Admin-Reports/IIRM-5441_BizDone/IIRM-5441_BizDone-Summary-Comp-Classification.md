# BizDone Report — Summary-Comp Classification Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and formulas.

The business rolled up by customer — one row per Customer Name **and** SBU **and** Vertical combined, not by customer alone (see the parent PRD's Business Rule 6).

| Field | What it means | Formula / Source |
|---|---|---|
| Serial Number | Row index for this export. | `indexOffset` — not a stored business field. |
| Customer Name | The customer this row rolls up. | Grouping key: `policy.companyName`. |
| Net Premium | Total Net Premium across every policy in this group. | `SUM(policy.netPremium)`. |
| Gross Premium | Total Gross Premium across the group. | `SUM(policy.grossPremium)` — see the parent PRD's Business Rule 8 for how reliable the underlying Gross Premium is. |
| Premium Collected | Total premium actually received. | `SUM(policy.premiumCollected)`. |
| Brokerage Amount | Total brokerage earned. | `SUM(policy.basicBrokerageAmount)` — see the parent PRD's Business Rule 9 for what this figure is and isn't tied to. |
| Brokerage Collected | Total brokerage actually received. | `SUM(policy.brokerageCollected)`. |
| Terrorism Commission Amount | Total terrorism-specific brokerage. | `SUM(policy.commissionTerrorism)` — not related to the Terrorism premium line; see the Details-Policy Based child PRD for the formula it rarely matches. |
| Iirm Organisation | Which IIRM legal entity. | Grouping key: `organisation.name`. |
| SBU | Which Strategic Business Unit. | Grouping key: `sbu.name`. |
| Vertical | Which IIRM vertical. | Grouping key: `vertical.name`. |

**Verified against the sample export** (`Sample - BizDones/BizDone_Summary-Comp Classification.csv` cross-checked against `Sample - BizDones/BizDone_Details-Policy Based.csv`): for every sample row checked, this sheet's Net Premium, Gross Premium, and Brokerage Amount matched `SUM()` of the matching Customer Name + SBU + Vertical rows in Details-Policy Based exactly.

## Change History

No changes recorded for this sheet since the PRD was first written (2026-08-08). The 2026-08-07/08 column changes described in the Details-Policy Based child PRD do not touch the Summary sheets.
