# BizDone Report — Rewards Sheet

Child document of the [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) — see that document for scope, user stories, business rules, and acceptance criteria. This file documents only this sheet's columns, meanings, and sources.

Every reward payout in the filtered period, listed on its own rather than attached to the policy or endorsement that earned it. Rewards are insurer incentive payouts — money IIRM receives from an insurer for volume or performance across a period, not brokerage on any single policy.

| Field | What it means | Formula / Source |
|---|---|---|
| Serial Number | Row index for this export. | Not a stored business field. |
| Insurer | The insurance company the reward relates to. | Raw, joined from the insurer record. |
| Reward Category | Which reward programme category this payout falls under. | Raw lookup value. |
| Business Months | The business month(s) this reward covers, as a comma-separated list. | One row per selected month in `reward_business_month`, joined and concatenated. Confirmed against every reward in the database: never exceeds 2 months in practice. |
| Income Month / Date Of Income | When this reward counts toward IIRM's books (parent PRD Business Rule 2). | Raw, stored columns. |
| Reward Amount | The amount paid out. | Raw, manually entered. |
| Remarks | Free-text notes on the payout. | Raw, manually entered. |

## Two Filtering Behaviours That Surprise People

This sheet does not behave like the rest of the workbook, in two distinct ways. Both are documented as business rules in the parent PRD; they are repeated here because this is the sheet where they actually bite.

**It ignores most filters entirely** (parent PRD Business Rule 12). The sheet is built by a separate function, `getRewardsForReport`, with a much narrower parameter list than every other sheet — only Organisation, Insurer, and the period range narrow it. There is no SBU, Vertical, Department, Branch, Insurer Branch, Policy Type, Group Company, Broker Agent, or Income Type parameter at all, because the underlying reward tables don't carry those attributes. In practice: filter a download to one Branch, and this sheet still shows the whole organisation's rewards for the period, while every other sheet honours the branch filter.

**It can vanish entirely when dimension filters are active** (parent PRD Business Rule 11). If any of SBU, Vertical, Department, Branch, Insurer Branch, Policy Type, Group Company, Broker Agent, or a free-text company search is applied, rewards are excluded from the report altogether — regardless of the Income Type selection, including "Rewards" or "All". Rewards carry no owner or company hierarchy, so a filter on any of those attributes has nothing to match against and silently drops every reward row rather than erroring.

Read together: with a dimension filter active, this sheet is empty; without one, it may show more than the rest of the workbook is scoped to. Neither state is signalled to the user in the file.

> [!note]
> **Currently low-impact, but structural.** The one organisation in the live data with multiple branches/verticals/departments (9 branches, 30 verticals, 50 departments) has exactly one reward row that the Business Rule 12 gap would affect, worth ₹100 total. The mechanism is real and will resurface as reward volume grows; today it would not visibly distort anyone's numbers.

## Never Merged Into the Details Sheets

Rewards are deliberately never unioned into [Details-Policy Based](IIRM-5441_BizDone-Details-Policy-Based.md) or [Details-Co-Insurer Based](IIRM-5441_BizDone-Details-Co-Insurer-Based.md) — they exist only here. This is intentional, specifically to avoid double-counting a reward once in a Details sheet and again in this one.

## Change History

No changes recorded for this sheet. The 2026-08-07 column changes (commit `2ebae9f3d0`) and the 2026-08-08 resequencing spec both target the Details sheets and do not touch Rewards.
