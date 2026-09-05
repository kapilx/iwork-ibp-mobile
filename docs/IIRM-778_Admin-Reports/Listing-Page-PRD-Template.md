# Listing / Report Page PRD — Structure Guide

How to document an iWork listing or report screen (Opportunities, Renewal Opportunities, Client Portfolio, Claims, and so on) so that the result is readable by a business owner and complete enough to generate a TRD from.

The worked example is the [BizDone Report PRD](IIRM-5441_BizDone/IIRM-5441_BizDone-PRD.md) and its seven child documents. Copy that structure; only the content changes.

## The Two-Level Split

**Parent PRD** — everything true across the whole screen, and nothing field-level:

| Section | What belongs in it |
|---|---|
| Opening paragraph | What the screen is, who opens it, and why — plain language, for someone reading cold. |
| Scope | The exact URL in scope, plus an explicit out-of-scope list naming the sibling screens you are *not* covering. |
| User Stories | `US-[MODULE]-NNN`, one per distinct job the screen does. |
| Business Rules | `BR-[MODULE]-NNN`. The heart of the document — every non-obvious behaviour, especially the silent ones. |
| Acceptance Criteria | `AC-[MODULE]-NNN`, each tracing to a user story, each stated Given/When/Then. |
| Data Contract | What the screen consumes, produces, and writes. Short. |
| The Screen | Every control in the order it appears: filters, KPI cards, result table, action buttons. |
| The Workbook / Output | What the screen produces, as a link table out to per-artifact child documents. |
| Open Questions | Only genuine engineering or product decisions — nothing answerable by reading the code. |
| Approval | Sign-off block. |

**Child documents** — one per exported sheet or output artifact, each with the same four parts: what it is, a `Field | What it means | Formula / Source` table covering *every* column, sheet-specific caveats, and a **Change History**.

The split exists because field tables crowd out behavioural rules. When both lived in one file on BizDone, the business rules became unfindable.

## Write for the Business Owner First

The primary reader is a business owner, not an engineer — but the document must still carry enough technical fact to generate a TRD. Resolve that tension by **layering, not omitting**:

- State each rule in business terms, in the main flow.
- Put supporting numbers in an indented block beneath it.
- Put code paths, function names, table and column names in that same block, marked *Technical:*, or in a collapsible at the end of the section.

A business reader should be able to read straight down the left margin and understand the screen. An engineer should be able to find every specific they need without leaving the document.

## Rules Worth Carrying Over

- **Name the source for every field.** "Raw, manually entered" is a real answer and belongs in the table — it tells the reader no formula exists, which is often exactly what they came to find out. Distinguish raw / live formula / one-time calculation / lookup rollup.
- **State what each claim rests on.** Code-verified, database-verified, and sample-observed are three different confidence levels. Say which, and give the numbers. A claim resting on a single sample row must say so.
- **Lead with the silent behaviours.** Filters that drop rows without warning, columns whose labels don't match their contents, figures that don't reconcile — these are what a reader cannot discover alone, and the main reason the document exists.
- **Separate label from field.** Where a display label differs from the underlying field name, or differs between screen and export, record both. Label drift is the most common source of confusion in these reports.
- **Verify UI labels against the code.** What the button says and what the code calls it diverge more often than expected. On BizDone, the PRD said "Download Report" for a button labelled "Generate Report", and "Me + Team" for a toggle labelled "Manager + Team".
- **Record change history in the child documents**, with dates and commit hashes, and distinguish *shipped* from *specified but not yet applied* — readers act on those differently.
- **When configuration is data rather than code, say so prominently.** Anything driven by a config table can change without a deploy, which means the code is not the authority and the document must name what is.

## Starting a New One

1. Copy the BizDone parent PRD's section skeleton; replace `BIZDONE` in all IDs with the new module key.
2. List the screen's controls from the live UI, then verify each against the code before writing.
3. Create one child document per output artifact. [Details-Policy Based](IIRM-5441_BizDone/IIRM-5441_BizDone-Details-Policy-Based.md) is the fullest worked example — two country variants and a three-state change history. [Applied Filters](IIRM-5441_BizDone/IIRM-5441_BizDone-Applied-Filters.md) is the example of a small, mechanism-heavy sheet.
4. Keep open questions genuinely open. Anything answerable from the code or the database should be answered and folded into the rules, not parked.
