# BizDone Report — Summary-Insurer Classification Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and formulas.

Same shape as [Summary-Comp Classification](IIRM-5441_BizDone-Summary-Comp-Classification.md) and [Summary-Policy Classification](IIRM-5441_BizDone-Summary-Policy-Classification.md), grouped by insurer — with its own smaller labeling risk.

| Field | What it means | Formula / Source |
|---|---|---|
| Serial Number | Row index for this export. | `indexOffset` — not a stored business field. |
| Insurer | Which insurance company. | Grouping key: `insurer.name` — not `display_name`, see the warning below. |
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
> **This sheet's "Insurer" won't always textually match the "Insurer" column in Details-Policy Based or Details-Co-Insurer Based.** This sheet groups by `insurer.name`; every Details sheet displays `insurer.display_name` instead. Confirmed in the live database that these differ for 48 insurers — a name-based cross-reference between this sheet and either Details sheet fails for policies under any of those 48.

**Verified against the sample export**: this sheet's rows matched `SUM()` of the matching Insurer + SBU + Vertical rows in Details-Policy Based exactly.

## Change History

No changes recorded for this sheet since the PRD was first written (2026-08-08). The 2026-08-07/08 column changes described in the Details-Policy Based child PRD do not touch the Summary sheets.
