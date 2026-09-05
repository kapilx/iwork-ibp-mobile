# BizDone PRD — Database Verification Results

All 17 originally-proposed queries have been run against the live database. This file records what each one found and where the result landed. Nothing further is pending from this round — any new database question should start a fresh list rather than reopening this one.

> [!note]
> **Where these findings now live.** When this round was run, the PRD was a single document. It has since been split into a parent [BizDone Report PRD](IIRM-5441_BizDone-PRD.md) holding scope, business rules and acceptance criteria, plus one child document per sheet holding field-level detail. Business-rule references below still resolve against the parent; field-level findings now live in the relevant child document ([Details-Policy Based](IIRM-5441_BizDone-Details-Policy-Based.md), [Details-Co-Insurer Based](IIRM-5441_BizDone-Details-Co-Insurer-Based.md), [Rewards](IIRM-5441_BizDone-Rewards.md), and the three Summary sheets).

> [!warning]
> **These results predate the 2026-08-07 column changes** (commit `2ebae9f3d0`) and the 2026-08-08 resequencing spec. Findings about *values* (match rates, population counts, reconciliation gaps) remain valid — the underlying columns did not change. Findings that reference a *column label* may now name a column that has been renamed or removed; see the Change History in the relevant child document before quoting one.

## Findings that changed or added to the PRD

**1. Rewards sheet filter gap (Business Rule 12)** — real, but currently tiny: the one organisation with real branch/vertical/department breadth (9/30/50) has exactly one affected reward row, worth ₹100.

**2. Manager + Team downline reach (Business Rule 3)** — confirmed material, with an important caveat added after this round. Several manager IDs have 100–392 indirect reports (2+ levels down) who alone own large numbers of finalized policies. **Two of the largest results turned out not to be real users:** IDs `-1` and `342395` are IT's own system/debugging accounts. ID `2` is the founder's real account but was also used for the go-live data load, so its number mixes genuine hierarchy position with migration attribution. The cleaner evidence is the ordinary-manager cases — `331` (199 indirect, 102,245 policies), `2168` (112 indirect, 75,158), `5950` (93 indirect, 75,035). The behaviour is real and structural; the headline numbers from the system accounts are not. See Business Rule 3 for the full reading.

**3. Brokerage Amount vs. ISG vs. iWork mismatch rate (now Open Question 3)** — both pairs disagree ~83% of the time whenever both figures are populated (16,796 of 20,337 for iWork; 16,811 of 20,337 for ISG). Strong evidence these track genuinely different things, not drifted copies of each other.

**4. Gross Premium ≈ Net Premium × 1.18, split by ingested_mode (Business Rule 8)** — 75.0% match for organically-created policies (772 eligible), 79.77% for migrated legacy policies (188,000 eligible). Unlike the brokerage split, current and legacy data are *not* meaningfully different here — the "legacy artifact, not enforced going forward" framing doesn't hold as cleanly for Gross Premium as it does for Brokerage Amount.

**5. Share Amount formula match (Share Percentage / Share Amount field)** — 732 of 740 populated values (98.9%) match Basic Premium × Share Percentage / 100 exactly. The co-insurance shares-sum-to-100% half of this check was superseded by Query 6's broader reconciliation result below.

**6. Details-Policy Based vs. Details-Co-Insurer Based brokerage reconciliation (new Business Rule 13, and a caveat on Acceptance Criterion 4)** — the single most material finding of this round. Across 188,811 policies with at least one insurer-map row, Details-Co-Insurer Based's per-insurer-share brokerage sums back to Details-Policy Based's policy-level Brokerage Amount for only 648 of them — **0.34%**. Brokerage Amount does not reconcile with its own per-insurer breakdown at any meaningful rate.

**7. Is the "finalized" gate (`enabled_for_performance_lid`) global or per-organisation?** — resolved safely: exactly one `TOGGLE_TYPE_YES` lookup row exists, with `organisation_id = 0` (a global sentinel, not org-scoped). No ambiguity, no bug — noted as a parenthetical on Acceptance Criterion 2.

**8. Co-insurer ownership-chain data availability (Open Question 3)** — only 12 policies in the whole database are genuinely co-insured. For those 12, ownership-chain data mostly already exists on the company record (9/12 Associate CRM, 12/12 Lead CRM, 11/12 Account Manager) — confirming the Details-Co-Insurer Based sheet's missing ownership chain is a reporting omission, not a data-availability limit, but one affecting at most 12 policies today.

**9. Terrorism Commission formula match + column-ceiling check (Terrorism Commission Amount field)** — only 3.5% of populated values (2,198 of 62,605) match the Net Premium × rate formula, an even lower match rate than ordinary Brokerage Amount. The originally-hypothesized numeric(7,4) column ceiling is **refuted**: the real maximum value found is 357,406 — far beyond what a numeric(7,4) column could ever store, so that specific column-type concern was dropped rather than carried into the PRD.

**10. Summary-Policy Classification's real grouping key (new warning callout on Sheets 1–3)** — confirmed both in code (`GROUP BY policy.policyName`, aliased as `"policyCategory"`) and in data: "Motor" alone spans 608 distinct policy names, "Health & Accident" 187, "Reinsurance" 170. The sheet groups by raw product name, not by the true IIRM Category rollup, despite its label.

**11. `insurer.name` vs. `insurer.display_name` (note on Summary-Insurer Classification)** — 48 insurers have a different `name` (used for this sheet's grouping) than `display_name` (shown as "Insurer" in every Details sheet) — a real cross-sheet label mismatch for those 48 insurers.

**12. Deal Confirmed correlation (Details-Co-Insurer Based field description)** — carries almost no information: "Yes" for over 99.8% of all rows regardless of Policy Status or ingestion mode.

**13. Reward "Business Months" maximum span (Rewards sheet field description)** — confirmed: never exceeds 2 months across every reward in the database.

**14. Fees population and magnitude (Details-Policy Based field description)** — a real, non-trivial charge line: ~17% of migrated legacy policies carry it (avg ₹9,128), rarely populated on organically-created policies (19 of 776) but at a much higher average (₹106,685) when it is.

**15. `policy_type_segregation` completeness (Open Question 1)** — 405 of 194,880 policies (0.21%) have no segregation row at all, meaning IIRM Category renders blank for them. Small but real.

**16. AC-005 real-world testability** — confirmed genuinely exercised: 10 users have saved a column layout for the main report, 1 for Rewards mode.

**17. AC-005 duplicate-default check** — returned zero rows, i.e. no user has more than one simultaneously-active default layout for either entity. Clean pass, folded into Acceptance Criterion 5.

## Note on query correctness

Every query above used `COUNT(*) FILTER (WHERE col IS NOT NULL AND col <> 0)` rather than plain `COUNT(col)`, so a stored `0` was never miscounted as a populated value — the mistake that made the very first, unfiltered Brokerage Percentage check misleading earlier in this investigation.
