# BizDone Report — Summary-Policy Classification Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and formulas.

Same shape as [Summary-Comp Classification](IIRM-5441_BizDone-Summary-Comp-Classification.md), grouped by product name instead of customer — **and mislabeled**, per the warning below.

| Field | What it means | Formula / Source |
|---|---|---|
| Serial Number | Row index for this export. | `indexOffset` — not a stored business field. |
| Policy Category *(header label)* | Intended to be the product's category. | Grouping key is actually `policy.policyName`, aliased `"policyCategory"` in the query — see the warning below. |
| Net Premium | Total Net Premium across every policy in this group. | `SUM(policy.netPremium)`. |
| Gross Premium | Total Gross Premium across the group. | `SUM(policy.grossPremium)`. |
| Premium Collected | Total premium actually received. | `SUM(policy.premiumCollected)`. |
| Brokerage Amount | Total brokerage earned. | `SUM(policy.basicBrokerageAmount)`. |
| Brokerage Collected | Total brokerage actually received. | `SUM(policy.brokerageCollected)`. |
| Terrorism Commission Amount | Total terrorism-specific brokerage. | `SUM(policy.commissionTerrorism)`. |
| Iirm Organisation | Which IIRM legal entity. | Grouping key: `organisation.name`. |
| SBU | Which Strategic Business Unit. | Grouping key: `sbu.name`. |
| Vertical | Which IIRM vertical. | Grouping key: `vertical.name`. |

> [!warning]
> **This sheet groups by raw product name, not by category.** Confirmed directly in code: the query's `GROUP BY` is `policy.policyName`, simply aliased as `"policyCategory"` in the output — it never touches the actual IIRM Category rollup (`policy_type_segregation`, used by Details-Policy Based's IIRM Category field). In real data this is a big difference: "Motor" alone covers 608 distinct policy names, "Health & Accident" 187, "Reinsurance" 170 — a reader expecting one row per category instead gets dozens to hundreds of rows per true category, one per specific product name.

**Verified against the sample export**: this sheet's rows matched `SUM()` of the matching **Policy Type** (not IIRM Category) + SBU + Vertical rows in Details-Policy Based exactly — empirically confirming the mislabeling above, independently of the code reading.

## Change History

No changes recorded for this sheet since the PRD was first written (2026-08-08). The 2026-08-07/08 column changes described in the Details-Policy Based child PRD do not touch the Summary sheets.
