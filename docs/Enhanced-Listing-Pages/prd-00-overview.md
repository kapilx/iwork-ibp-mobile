# Enhanced Listing Pages — Platform Overview PRD

**Module:** Enhanced Listing Pages (Manage SO · My RO · Biz Done · My Client Portfolio)
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-08-08
**Author:** Pushyami Divami

---

## 0. Revision Log

### 2026-08-08 — post-launch corrections

Eight behaviour changes landed between 2026-07-31 and 2026-08-08. They are folded into the body of this document; this section exists so a reader who reviewed the 2026-07-30 draft knows exactly what moved.

| # | Change | Sections touched |
|---|---|---|
| R-01 | **Auto-drill removed.** A level with one card, or one card holding all the data, is no longer selected for the user. Every card is picked by hand. | §4.1, §6.1, §7 |
| R-02 | **Self-owner prefill removed.** Selecting a Branch no longer auto-selects the logged-in user as owner. The Owner accordion opens empty. | §4.5, §6.2, §7 |
| R-03 | **Nothing auto-applies.** A report exists only after **View Report** is clicked — completing the path or picking an owner no longer applies on its own. | §4.2, §6.2, §7 |
| R-04 | **A stale scope hides the report.** Previously the table stayed on the old scope with an amber hint; now the whole report area collapses until View Report is clicked again. | §4.2, §7 |
| R-05 | **Owner no longer re-scopes the cards above it.** The applied owner is fed to the listing only, never to the Organisation / SBU / Branch aggregates. | §4.5, §6.2 |
| R-06 | **Vertical is a drawer filter on all four pages.** It was configured-but-unreachable; it is now the first field in each drawer, multiselect, scoped to the applied SBU. Resolves Q-ENH-01. | §4.6, §10 |
| R-07 | **Branch multi-select is built but parked.** The whole path — cards with checkboxes, CSV query params, union-of-branches owner list, `IN` filtering server-side — is in place behind one `multiSelect: true` flag, commented out in all four scope configs on 2026-08-06. | §4.1, §6.1, §8 |
| R-08 | **Biz Done export went asynchronous.** "Download Report" became "Generate Report": a sheet-picker modal, a background job, and a Downloads tray. | prd-03 |

---

## 1. Why These Pages Exist

iWork's four highest-traffic listing screens — Manage SO, My RO, Biz Done Report and My Client Portfolio — all answered the same question badly: *"show me my organisation's book, sliced the way I think about it."*

Each had grown its own filter panel: a flat `SmartSearch` form with Organisation, SBU, Vertical, Branch, Owner and a period range as ordinary dropdowns among a dozen others. Three problems followed from that shape.

**The hierarchy was invisible.** Organisation → SBU → Branch is a *tree*, but a row of independent selects cannot express that. Users picked an SBU that had no relationship to the branch they then picked, got an empty table, and had no way to see why. Nothing showed them what volume sat under each node before they committed to drilling into it.

**There was no sense of "where am I".** After applying six filters, the only record of the current scope was the filter panel itself — which was usually collapsed. Navigating into a record and coming back lost the scope entirely.

**Numbers had no context.** A table of 40 rows tells you nothing about whether that is all of Bangalore or one person's desk.

The Enhanced pages replace that flat panel with a **drill-down scope widget**: an accordion of hierarchy levels where every node shows its own KPIs *before* you select it, a period popover, and an Owner level that appears once you reach a Branch. Everything that is not hierarchy or period moves into an additional-filters drawer, leaving a two-field toolbar. The result is that choosing a scope and understanding a scope are the same action.

This document is the product behaviour contract for the **shared platform** all four pages sit on. Each page's own scope, columns, filters and quirks are in its sibling document:

| Page | Document |
|---|---|
| Manage SO Enhanced | [prd-01-manage-so-enhanced.md](prd-01-manage-so-enhanced.md) |
| My RO Enhanced | [prd-02-my-ro-enhanced.md](prd-02-my-ro-enhanced.md) |
| Biz Done Enhanced | [prd-03-biz-done-enhanced.md](prd-03-biz-done-enhanced.md) |
| My Client Portfolio Enhanced | [prd-04-my-client-portfolio-enhanced.md](prd-04-my-client-portfolio-enhanced.md) |

It does not describe implementation decisions — those belong in the TRD (stage 40b).

---

## 2. Scope

### In scope

- A shared org-hierarchy drill-down widget (`OrgFinancialFilter`) with per-node KPI cards, used identically by all four pages
- A financial-period popover (FY / quarter / month / custom range) as the single period channel
- An Owner level with a Manager / Manager + Team view-by toggle
- Role-gated org access: every user starts pinned to their own organisation; only leadership and super users may move it or see the group-wide roll-up
- A two-part filter surface per page: an always-visible toolbar plus an additional-filters drawer, with an applied-filter chip row
- Vertical as the first drawer filter on every page — multiselect, options scoped to the applied SBU *(R-06)*
- Report gating: the table and KPI area appear only for a report the user has explicitly applied, and only while it still matches the current scope
- Per-page Save View that persists both the ordinary filters and the applied scope, isolated from the legacy screen's saved view
- Scope restoration when navigating into a record and back
- Multi-select support at any level the config marks (built end-to-end; currently parked for Branch — see §4.1)

### Out of scope (deferred)

- Retiring the original four screens — every Enhanced page runs **alongside** its predecessor, which remains untouched and reachable
- Vertical as a visible accordion level — the fork's second member is sliced out of the rendered stack; Vertical is served as a drawer filter instead *(R-06)*
- Branch multi-select **as shipped behaviour** — the implementation is complete but the `multiSelect: true` flag is commented out in all four scope configs (2026-08-06) *(R-07)*
- A `premium` metric on the SO and RO scope cards (present in config but commented out)
- Cross-page scope sharing — each page keeps its own scope and saved view
- Any change to the legacy screens' filter behaviour, endpoints or saved views

---

## 3. User Personas

| Persona | Role on these pages |
|---|---|
| Relationship Manager / BD Executive | Works their own book; lands on their own branch and owner card by default |
| Branch Manager | Uses Manager + Team to see their whole branch; compares owner cards within it |
| SBU / Vertical Head | Drills Organisation → SBU to compare branches before opening a table |
| Leadership | The only persona that can change Organisation and see the group-wide roll-up header |
| Super User | Same org reach as Leadership; typically diagnosing or supporting |
| Super User (Read Only) | Same visibility, no write actions |
| Central OPS / ISG | Uses Biz Done Enhanced for income and brokerage reconciliation |

---

## 4. The Shared Filter Architecture

### 4.1 The org drill-down widget

The widget renders **every already-selected level plus the first unselected one** — so it grows as the user drills and never shows a wall of empty accordions.

A **collapsed** level header reads `{Level}: {node name}` followed by that node's KPI trio. An **expanded** level shows a grid of cards, one per node, each carrying the node name and the same KPI set. This is the core idea: *the numbers are on the cards, so the user chooses where to drill based on where the volume is.*

Selecting a card clears every descendant level and auto-advances to the next level. Re-clicking the selected card deselects it and re-opens that level.

**Every card is picked by the user.** *(R-01)* There is no auto-drill: a level that renders exactly one card, or where only one card carries non-zero metrics, still waits for a click. The earlier behaviour saved a click but made the resulting scope something the user had never consciously chosen — and once the report gating below became explicit, an invisible selection was the only thing on the page moving on its own.

**Multi-select levels.** A level may be configured `multiSelect`, in which case its cards carry a checkbox and clicking toggles membership rather than replacing the pick. Behaviour at such a level:

- the level stays **open** after a pick, so several nodes can be added without reopening it; it closes as soon as the user touches a deeper level
- the collapsed header folds all picks into one row — names joined by commas, metrics **summed** (every metric on these pages is a count or an amount, so summing is the correct roll-up; a ratio metric would need its own rule)
- the "Currently viewing" chip joins the selected names
- descendant levels are cleared on every toggle, because their node lists are derived from this selection — the Owner list, for instance, widens to the **union** of the chosen branches' downlines
- the ids go to the backend as CSV (`branchId=12,15`) and are filtered with `IN`

Branch is the only level this was designed for, and it is **parked**: `multiSelect: true` is commented out in all four scope configs as of 2026-08-06. Every consumer accepts a scalar, so the pages behave as single-select today; re-enabling is a one-line change per config. *(R-07)*

Collapsed levels keep their numbers **live**: each selected level runs its own aggregate query, so changing the period re-fetches every visible row rather than freezing older values. A spinner shows in place of a stale figure while a refresh is in flight.

Below the stack, a **"Currently viewing:"** chip row names each selected node in path order. Clicking a chip jumps back to that level. A **Reset** link returns to the user's own organisation — not to empty — clears the period back to the current FY and quarter, and hides the report again.

### 4.2 Report gating — `hasReport`

The KPI cards and tables are hidden until a scope has actually been **applied**. This is deliberate: picking an Organisation alone is not a report, and firing an unscoped query on page load was the old behaviour these pages exist to replace.

**A report exists only after View Report is clicked.** *(R-03)* Nothing auto-applies — not completing the path, not selecting an owner, not picking a branch. The earlier auto-apply rules were removed because they made the same click mean different things at different depths: a user who picked a branch got a report, a user who stopped at SBU got a button, and neither could predict which.

The **View Report** button is shown whenever there is something left to apply — no report yet, or the current scope has drifted from the applied one — and only once the root level (Organisation) is selected, so the button never offers a report on nothing.

If the user changes the scope after a report exists, the draft is **stale**, and the entire report area — KPI cards, table, its toolbar and drawer — **collapses** until View Report is clicked again *(R-04)*. An amber "Scope changed. View Report to update." hint says what to do. The previous behaviour left the table on screen showing the old scope, which is the one failure mode worth engineering against: a number on screen that no longer matches the filters above it will be read as current.

Two things still take effect without a View Report click, because neither changes *which* records are in scope by hierarchy:

- **Period** — changing it while a report is showing retunes cards, KPIs and table at once
- **Manager / Manager + Team** — same

Restoring a scope from navigation state or a saved view applies its report directly, with the whole accordion stack collapsed — the user already confirmed that scope once.

### 4.3 The period popover

A pill button in the widget header shows the current period — `2026-2027 · Q2`, `2026-2027 · April`, `2026-2027`, or a date range. The popover offers Organisation (leadership only), Financial Year, Period (All, Q1–Q4), Month, and From/To dates. Quarter and Month are mutually exclusive — setting one clears the other.

Resolution precedence, on the Indian financial year (1 Apr – 31 Mar):

1. A custom From/To range wins outright
2. Otherwise Month → that calendar month
3. Otherwise Quarter → its three months
4. Otherwise the whole FY — and in this case the request sends `financialYear` **instead of** `from`/`to`, so the backend resolves the window exactly as the legacy listings do

Default on load is the current FY and current quarter. Nothing takes effect until **Apply**; re-opening the popover discards an un-applied draft.

### 4.4 Role gating

The Organisation accordion is **locked for every role**. Org changes go through the period popover instead, and that control is read-only for anyone who is not leadership or a super user. A locked level still shows its pinned node and live KPIs but cannot be expanded, and its chip is inert.

The group-wide roll-up header (the "IIRM Holdings" grand total) is shown to **leadership and super users only**. Everyone else sees the level accordions flat, with no grand total.

Locks are enforced in state as well as UI: a saved view or restored scope **cannot** override a locked level, so a view saved under a broader role cannot unlock another organisation for a narrower one.

### 4.5 The Owner level

The Owner accordion appears only once a **Branch** is selected. Its cards are the **logged-in viewer's** own row plus their reporting downline — never the clicked owner's downline, so re-opening the accordion after selecting someone still shows everyone. Where Branch multi-select is enabled, the card list is the **union** of the selected branches' members.

**The owner is picked by hand.** *(R-02)* The level opens with nothing selected. Earlier it prefilled the logged-in user the moment it joined the path, which — combined with the old auto-apply rule — meant selecting a Branch silently produced a "my own book" report the user had not asked for.

A **View by** toggle offers *Manager* (individual contribution) and *Manager + Team* (subtree roll-up). Product default is **Manager + Team**. Flipping it retunes both the owner cards and the listing immediately, with no View Report click.

**An applied owner scopes the listing only — never the cards above it.** *(R-05)* The Organisation, SBU and Branch cards stay at their hierarchy totals throughout the drill. Feeding the owner into those aggregates (as the first build did) re-scoped every upper card *as that person*, collapsing them to one desk's numbers the instant View Report was clicked — destroying the very cards the user had just chosen from. The Owner level carries its own Manager/Team scoping through a separate aggregate channel.

The Owner accordion is the **single owner channel** on these pages. The legacy Owner and View-by form fields are deliberately removed from the drawer so a second control cannot fight the accordion.

### 4.6 Toolbar, drawer and applied chips

Filters split three ways:

| Surface | Contents | Applies |
|---|---|---|
| Org widget | Organisation, SBU, Branch, Owner, period | On **View Report** (per §4.2) |
| Toolbar | Company name (all four pages) | Immediately on selection |
| Drawer | Vertical + everything else | Only on **Apply** |

**Vertical lives in the drawer.** *(R-06)* The accordion's Vertical step is sliced out of the rendered stack, so Vertical was configured but unreachable in the 2026-07-30 build. It is now the **first field in every drawer**, reusing the non-Enhanced listings' shared field config verbatim: multiselect, options scoped to the applied SBU, and names (not ids) on its applied-filter chips.

That reuse has a consequence worth stating, because it explains two otherwise-invisible fields: Vertical's option list hangs off `sbuId`, and these pages have no visible SBU control — the accordion owns it. So each page registers hidden `organisationId` and `sbuId` fields on the shared form and syncs the applied scope into them. They render nothing; they exist so the Vertical lookup has something to read. The accordion's own scope still reaches the query through its normal channel.

The drawer is a right-anchored panel, one field per row, with **Reset** and **Apply** in a pinned footer. Reset clears **only the drawer's own fields** — never the toolbar's Company selection, and never the accordion-owned scope — and resets to *system* defaults rather than the saved view, so a saved value can actually be cleared.

Below the table header, an **Applied filters:** chip row names every active drawer filter, with a `×` per chip and a **Clear all** link. Multi-select filters emit one chip per selected item. The row disappears entirely when nothing is applied. **Clear all** and the drawer's **Reset** run the same code path but surface different toasts — Clear all confirms "Filters updated successfully".

### 4.7 Save View

**Save view** persists two things per page: the committed filter values *plus the applied scope* (`selection`, `selectedNodes`, `timeline`, `grouping`, `ownerViewBy`), and the current column order.

Each Enhanced page saves under its **own isolated entity key** — `SALES_OPPORTUNITY_ENHANCED`, `RENEWAL_OPPORTUNITY_ENHANCED`, `BIZ_DONE_REPORT_ENHANCED`, `CLIENT_PORTFOLIO_ENHANCED`. This is a hard requirement, not tidiness: the Enhanced pages persist scope keys that the legacy screens forward verbatim to their own queries, so a shared key would leak scope into the legacy screen's request.

**System** defaults are read from the *legacy* key so admin-configured org-wide filter templates are still inherited — but org, owner and company fields are stripped from them defensively, because one administrator's own selection must never become every user's default.

On restore, the saved scope is applied, every accordion collapses, and the user lands directly on their report. Navigation state takes precedence over the saved view, so returning from a record restores what you left rather than what you saved.

---

## 5. Shared User Stories

**US-ENH-001**
As any user, I want to land on my own organisation already selected so that I never have to identify my own org before starting work.

**US-ENH-002**
As a user, I want to see each SBU's and branch's volume *before* I drill into it, so that I can go where the business is instead of guessing.

**US-ENH-003**
As a user, I want the table to stay hidden until I have actually chosen a scope, so that I am never shown an unscoped result set I did not ask for.

**US-ENH-004**
As a user, I want changing my scope after a report is showing to warn me rather than silently re-query, so that I control when the numbers move.

**US-ENH-005**
As a user, I want a single period control covering financial year, quarter, month and a custom range, so that I stop hunting for date fields among unrelated filters.

**US-ENH-006**
As a branch manager, I want to switch between my own contribution and my whole team's in one click, and have both the cards and the table follow it.

**US-ENH-007**
As a user, I want to see which filters are currently applied as removable chips, so that an unexpected result set is self-explaining.

**US-ENH-008**
As a user, I want to drill into a record and come back to exactly the scope and filters I left, so that a detour does not cost me my place.

**US-ENH-009**
As a user, I want to save my scope and filters as a view and land on it next time, so that a daily routine takes one page load.

**US-ENH-010**
As a non-leadership user, I must not be able to change the organisation or see the group-wide roll-up, so that visibility rules hold even via a shared saved view.

**US-ENH-011**
As a user of the original screens, I want them to keep working exactly as before, so that adoption of the Enhanced pages is my choice and not forced.

---

## 6. Shared Business Rules

### 6.1 Org scope

- Every user's organisation is pre-selected from their session and **locked**. Only the period popover can change it, and only for leadership / super users.
- Selecting a level clears all descendant selections. Stale combinations are impossible by construction.
- **No level is ever auto-selected**, however few options it offers. *(R-01)*
- A `multiSelect` level toggles membership per click, stays open across picks, clears its descendants on every toggle, and sends its ids as CSV. Configured for Branch, currently parked. *(R-07)*
- Reset returns to the user's own org, not to empty.

### 6.2 Owner scope

- The Owner level exists only under a selected Branch.
- **No owner is pre-selected.** The level opens empty and waits for a click. *(R-02)*
- Owner cards always enumerate the **viewer's** downline, independent of which owner is selected — and the union of the selected branches' members where Branch multi-select is on.
- Default view-by is **Manager + Team**.
- An explicitly selected owner scopes the listing server-side even for leadership roles — a leader who picks a person sees that person's book, not the whole org.
- The applied owner is **never** passed to the org-hierarchy aggregates. Organisation / SBU / Branch cards always show hierarchy totals. *(R-05)*
- Selecting an owner does not apply a report; View Report does. *(R-03)*

### 6.3 Period

- One period applies to the whole page — cards, KPIs and table.
- A whole-FY selection sends `financialYear` alone; narrower selections send `from`/`to`.
- Quarter and Month are mutually exclusive.

### 6.4 Filter precedence

1. Navigation state (returning from a record) wins over
2. the user's saved view, which wins over
3. system/admin defaults, which are stripped of org, owner and company fields, which wins over
4. the page's own hard defaults

Locked levels override all four.

### 6.5 Save View isolation

- Each Enhanced page writes to its own entity key and never to the legacy key.
- Each reads system defaults from the legacy key, stripped of viewer-specific fields.

### 6.6 Legacy screens

- The four original screens are **not modified**. Where an Enhanced page and its predecessor share a backend endpoint, any behavioural change must be opt-in per request so the legacy caller keeps its existing behaviour by default.

---

## 7. Shared Acceptance Criteria

**Scope widget**
- On first load, the user's own organisation is selected and locked; no table or KPI cards are visible
- Each accordion level shows one card per node, each card carrying that level's configured metrics
- Selecting a card collapses the level, shows `{Level}: {name}` with its metrics, and opens the next level
- Re-clicking a selected card deselects it and re-opens that level
- Selecting a level clears every level below it
- A level offering exactly one card still requires a click — nothing is auto-selected
- Changing the period re-fetches metrics for every visible level, not just the open one
- The "Currently viewing" row lists selected nodes in path order; clicking a chip re-opens that level; locked-level chips do nothing
- Reset returns to the user's own org, current FY and quarter, and hides the report

**Report gating**
- No report appears until View Report is clicked — not on completing the path, not on selecting an owner
- The View Report button is shown whenever a report is missing or the scope has drifted, and only once Organisation is selected
- Changing scope with a report showing displays "Scope changed. View Report to update." and **hides** the KPI cards, table, toolbar and drawer until it is clicked
- Changing period or Manager/Manager + Team with a report showing updates cards and table immediately, with no click
- A scope restored from navigation state or a saved view shows its report immediately, with all accordions collapsed

**Role gating**
- The Organisation accordion is not expandable for any role
- The popover's Organisation select is read-only for non-leadership, non-super users
- The group-wide roll-up header is visible only to leadership / super users
- A saved view carrying a different organisation does not unlock it for a non-privileged user

**Owner**
- The Owner accordion appears only under a selected Branch, with no owner pre-selected
- Cards show the logged-in user plus their downline, unchanged by which owner is selected
- View-by defaults to Manager + Team
- Flipping view-by updates cards and table immediately
- Selecting an owner changes the listing only; the Organisation, SBU and Branch card metrics do not move

**Filters**
- Company in the toolbar applies on selection, without opening the drawer
- Vertical is the first drawer field on all four pages, multiselect, with its options scoped to the applied SBU
- Vertical chips read node names, not ids
- Drawer edits do not change the table until Apply
- Apply closes the drawer and re-queries
- Reset clears only drawer fields and preserves the toolbar Company and the accordion-owned scope
- Applied-filter chips reflect every active drawer filter, one chip per multi-select item
- Removing a chip re-queries immediately; Clear all behaves as Reset and confirms with "Filters updated successfully"

**Save View**
- Save view persists filters, scope and column order under the page's own entity key
- Reloading lands on the saved scope with accordions collapsed and the report showing
- Returning from a record restores the scope that was active on leaving, not the saved one
- The legacy screen's saved view is unaffected

---

## 8. Data Contract

### 8.1 Shared inputs

| Item | Source | Used for |
|---|---|---|
| Session user (id, name, organisationId, roles) | session storage | base org preselection, role gating |
| Organisation master | `/master/organisation` | root level cards |
| SBU master | `/master/org_sbu?searchBy=organisationId` | SBU level cards |
| Vertical master | verticals by SBU | fork member (configured, not rendered) |
| Branch master | branches by organisation | Branch level cards |
| Employee hierarchy | `/employee/hierarchy` | Owner cards (viewer + downline) |
| Scope aggregate | per-page endpoint (see page PRDs) | the KPI numbers on every card |
| System filter defaults | `systemDefaultConfig.smartSearchValues[<legacy key>]` | inherited admin templates |
| User saved view | `userDefaultConfig.smartSearchValues[<enhanced key>]` | restore on load |

### 8.2 Shared outputs

| Item | Consumer |
|---|---|
| Applied scope (`selection`, `selectedNodes`, `timeline`, `grouping`, `ownerViewBy`) | saved view, navigation state |
| Column order per page | saved view |
| Scope query params (`organisationId`, `sbuId`, `verticalId`, `branchId`, owner id + view-by, period) | the page's listing endpoint |

A level marked `multiSelect` contributes a **list**, not a scalar: the listing's search string renders it as `branchId:[12,15]` and the aggregate endpoints receive CSV (`branchId=12,15`). Query DTOs on the receiving end must accept both shapes — `@IsInt` alone rejects the CSV form with a 400. `GetPolicyScopeSummaryDto.branchId` is the reference implementation: a transform that splits on commas, drops non-integers, and returns a scalar for a single id. *(R-07)*

One further rule the accordion→drawer merge depends on: **unselected non-root levels are omitted from the scope filter object, never set to `undefined`**. That object is spread over the drawer's filters, so an `undefined` entry would wipe a drawer field sharing the key — which is exactly `verticalId`'s situation now that Vertical is a drawer field and the accordion's Vertical step is hidden. The root level still falls back to `0`.

### 8.3 Owner-scope parameter naming (important)

The owner parameter is **not** named consistently across the two backend families, and the difference is load-bearing:

| Consumer | Owner id param | View-by param |
|---|---|---|
| Scope-summary endpoints | `userId` | `owner` |
| Opportunity listing | `ownerId` | `viewBy` |
| Policy portfolio listing | `ownerId` | `viewBy` |

Sending the wrong pair silently produces an unscoped or double-scoped result rather than an error.

---

## 9. Page Comparison Matrix

| | Manage SO Enhanced | My RO Enhanced | Biz Done Enhanced | My Client Portfolio Enhanced |
|---|---|---|---|---|
| Route | `/opportunities-enhanced` | `/renewal-opportunities-enhanced` | `/biz-done-report-enhanced` | `/my-client-portfolio-enhanced` |
| Scope aggregate | `/opportunity/scope-summary` `type=SO` | `/opportunity/scope-summary` `type=RO` | `/policy/scope-summary` | `/policy/portfolio/scope-summary` |
| Card metrics | Total SOs, Brokerage | Total ROs, Brokerage | Policies, Total, SO/RO Brokerage, Fee, Reward | Policies, Premium, Brokerage |
| Listing endpoint | `/opportunity` | `/opportunity` | `/policy/policy-report-list` | `/policy/portfolio/companies` |
| Primary table | Companies | Companies | Companies | Companies |
| Secondary table | SO records | RO records | Policy records | Policies + RO list + SO list + service score |
| Owner default view-by | implicit team | config default | `team` (explicit) | `team` (explicit) |
| Export | — | — | Generate Report — async, sheet picker + Downloads tray | — |
| Companies table sorting | server-side | server-side | server-side (enabled 2026-08-06) | — |
| Default status filter | Active + Lost | Active + Lost | — | — |
| Bulk edit | records table | records table | — | — |
| Shares endpoint with legacy screen | no (different grain param) | no | yes (`policy-report-list`) | **yes** (`/policy/portfolio/companies`) |

---

## 10. Open Questions & Known Gaps

Recorded during reverse engineering. These are observations from code, not agreed requirements — each needs a product decision or a TRD item.

**Q-ENH-01 — Vertical is configured but never shown.** *(Resolved 2026-08-06)*
Vertical stays out of the accordion and is served as the first drawer filter on all four pages, reusing the non-Enhanced listings' field config. The fork entry remains in the scope configs because `pathLevels` still needs a two-member fork; it renders nothing. See §4.6.

**Q-ENH-02 — `premium` metric commented out on SO and RO cards.**
Both configs carry a commented-out Premium metric. Deliberate (card width) or unfinished?

**Q-ENH-03 — Metric key `totalRos` is used for SO counts.**
Manage SO Enhanced's card metric reads `totalRos` and labels it "Total SOs" because the backend never renamed the field. Cosmetic today, but a trap for anyone reading the API.

**Q-ENH-04 — Owner default view-by is inconsistent.**
Biz Done and Client Portfolio set `defaultViewBy: "team"` explicitly; SO and RO rely on an implicit fallback. Should all four be explicit?

**Q-ENH-05 — Scope-card and KPI-card reconciliation is per-page.**
Whether a page's scope cards tie out to its KPI cards depends on whether both are computed by the same engine. This is *only* guaranteed on My Client Portfolio Enhanced, which has a purpose-built aggregate. On the other pages the cards are indicative of scope volume. Should exact reconciliation be a requirement for all four?

**Q-ENH-06 — No shared "leadership" role definition.**
`getOrgScopeAccess` decides privilege by matching role **names** for "LEADERSHIP" or "SUPER USER", because session roles carry no role key. A renamed role silently loses or gains org access. Should this move to a permission key?

**Q-ENH-07 — Two sources of truth for the reporting hierarchy.**
`employee_hierarchy` (direct edges) and `users.reporting_user_id` (walked recursively) both describe reporting lines and can disagree. Which is canonical?

**Q-ENH-08 — `Manager + Team` means different depths in different places.**
Historically the listings expand *direct reports only* while scope cards expand the whole subtree. My Client Portfolio Enhanced now opts into whole-subtree for both; the other three pages still use direct reports. Should the definition be unified product-wide?

**Q-ENH-09 — Branch multi-select is parked, not removed.** *(New, 2026-08-06)*
The full path is implemented and dormant behind one commented-out flag per scope config. Two open items: (a) is it coming back, or should the code be removed before it rots — dead-but-live code is the most expensive kind; (b) if it returns, every query DTO on every endpoint these pages touch needs the CSV-tolerant transform, not just the ones already fixed. A missed DTO fails as a 400, not a wrong number, which is the better failure — but it is still a per-endpoint audit.

**Q-ENH-10 — The report now disappears on any scope edit.** *(New, 2026-08-06)*
Hiding the stale report is unambiguous, but a user who nudges one card loses the table they were reading and must re-click View Report. Is the trade right, or should a *narrowing* edit (drilling deeper) be allowed to keep the previous table on screen?

**Q-ENH-11 — Explicit View Report costs the common case a click.**
With auto-apply and self-owner prefill both gone, the shortest path to a report is now Organisation → SBU → Branch → Owner → View Report. Users who only ever look at their own book pay four clicks for what used to be one. Worth a "my book" shortcut?

**Q-ENH-12 — Biz Done's Reset now wipes the persisted scope and owner.** *(New)*
Reset used to write the applied scope back into the user config alongside the reset filters. It now persists neither the scope nor `userId`/`owner`. Defensible (Reset should mean reset) but it means a Reset silently discards a saved view's scope, which the user may have intended to keep. Confirm the intent.

---

## 11. Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |
| Client | | | Pending |
