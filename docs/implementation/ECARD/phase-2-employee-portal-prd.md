# E-Card — Employee Portal PRD (Phase 2)

**Module:** E-Card (employee-facing) · **Route:** `/e-card`
**Backend:** `ibp-service` (`company-employee` module) + `document-service` (`external-app` TPA SSO/magic-url)
**Created on:** 2026-07-20 · **Status:** Draft (documents current employee-facing behavior + one explicit requirement)
**Related:** [phase-1-product-spec.md](./phase-1-product-spec.md) — original admin/bulk-upload PRD · [phase-2-employee-portal-trd.md](./phase-2-employee-portal-trd.md) — technical design, code citations, decision log

---

## 1. Why a Phase 2 doc

The existing [Phase 1 PRD](./phase-1-product-spec.md) specs an **admin-side, pre-uploaded-PDF** model: TPAs bulk-upload PDF e-cards via the policy configurator, and the employee portal serves those stored files back. **That is not how the shipped employee-facing feature actually works.** The live `/e-card` page instead fetches each member's e-card **on demand, live, from the TPA's own portal** via an SSO "magic-url" integration (see TRD §3) — there is no persisted e-card PDF in our own storage. This Phase 2 PRD documents the **as-built employee experience** accurately, so it stops drifting from the Phase 1 document, and specifies the **expired-policy download requirement**.

## 2. Current Functionality (As-Is)

### 2.1 Page layout

- Two tabs: **"Current Policies (N)"** and **"Expired Policies (N)"** — counts reflect how many *policies* (not members) fall in each bucket. The Expired tab is disabled entirely when there are zero expired policies.
- **Left sidebar:** a search box ("Search policy or member…"), then a list grouped by policy — each policy shown as a mini-header (policy number / company name) followed by its members as selectable rows (radio indicator, name, relation, and a "Family Card"/"Individual Card" badge).
- **Right detail pane:** renders the selected member's e-card when available, or an empty state when not.

### 2.2 Current vs. Expired — client-computed, not a backend status

A policy is classified as expired purely by comparing its `policyTo` date against today, **in the frontend** — there is no backend "is this policy active/expired" flag for this feature (see TRD §2 for the exact comparison and its edge cases). This is a meaningful architectural difference from Phase 1's framing and should inform any future backend work on this page.

### 2.3 "Family Card" / "Individual Card" badge

This badge is inferred, not a real policy attribute: the primary employee ("Self") is always labeled "Family Card"; every dependent (spouse, son, daughter, etc.) is labeled "Individual Card." There is no underlying per-member "card type" field.

### 2.4 Per-row Download — already implemented for both tabs

**This is the key finding of this PRD update: a per-row "Download" icon already exists on every member row, in both the Current and Expired tabs, using identical code.** It is not a new feature to build — the requirement below is about closing real gaps in an existing implementation, not adding a missing button.

- The button appears next to each member row and downloads that member's e-card PDF directly, without needing to select the row first.
- It only renders when the member record has a `tpaId` (the identifier the TPA integration uses to look up that person's card). **Members without a `tpaId` show no download affordance at all — this is very likely why the button appeared to be "missing" in the reported screenshot:** the row shown selected ("Thaneesh") renders no download icon regardless of hover/selection state once `tpaId` is absent.
- Even when a `tpaId` is present, the button is only visually revealed on hover or when the row is selected (invisible otherwise) — a discoverability issue independent of the `tpaId` gate.
- The button's enabled/disabled state (and its tooltip: "Download E-Card" vs "E-Card not available") depends on a per-`tpaId` cache of whether that member's card resolved successfully the last time it was fetched — but this cache is **keyed differently** than the cache the detail pane itself uses, so the two can disagree about whether the same member's card is available (see TRD §5 D3).
- The Expired tab's "nothing selected / not available" empty state uses different copy ("No E-Card found") than the Current tab's ShieldCheck-style "E-Card Not Available" placeholder — an inconsistency, not a deliberate design choice as far as this investigation could determine.

## 3. Requirement: reliable expired-policy download

> "For expired policies we will get a download option on the left-side card."

Interpreting this against the as-is state above, the requirement is: **every member row under the Expired Policies tab must offer a working, discoverable download option**, without depending on hover, selection, or an incidental data gap.

### FR-1 — Download affordance must not depend on hover/selection state

The per-row download icon must be visible (not just hover/selected-reveal) for rows in the **Expired Policies tab**, since these are historical records a user may want to scan and bulk-save without individually selecting each one first.

### FR-2 — Download must not silently disappear when `tpaId` is missing

When a member record in the Expired tab has no `tpaId` (and therefore cannot be resolved via the live TPA integration), the row must still communicate *why* no download is available (e.g. a disabled button with an explanatory tooltip), rather than rendering no affordance at all. This directly addresses the apparent "missing button" in the reported screenshot.

### FR-3 — Consistent availability state between the row button and the detail pane

A member's "available"/"unavailable" status must be consistent whether learned via clicking the row's Download button or via selecting the row to view it in the detail pane — today these can disagree because they're tracked under different cache keys (TRD §5 D3).

**Acceptance criteria:**
- AC-3.1: Every member row in the Expired Policies tab shows a download control at all times (not only on hover/select).
- AC-3.2: A member row with no `tpaId` shows a disabled download control with a tooltip explaining why (e.g. "E-Card not available for this member"), instead of no control at all.
- AC-3.3: Clicking Download and selecting a row to preview report the same availability outcome for the same member.
- AC-3.4: Existing Current-tab behavior is unaffected (no regression) unless explicitly extended to match by product decision (open question, §5).

## 4. Non-Functional Requirements

- No new backend endpoints are required — the existing `eCards` (list), `policyTpaAppKey`, and `eCardExternalUrl` (magic-url) endpoints already service both tabs identically (TRD §3, §4).
- No change to the live-TPA-fetch architecture is in scope here — if a TPA's portal genuinely stops serving cards for a lapsed policy, that surfaces as the existing "unavailable" state, which is correct behavior, not a bug to fix.

## 5. Out of Scope / Follow-ups (flagged, not fixed this round)

- Adding a server-side "policy status" flag to replace the client-only `policyTo` date comparison (TRD §2) — a larger, cross-cutting backend change.
- Building a genuinely archival/static download path for expired policies (as opposed to the current live TPA magic-url call) — only relevant if TPAs are confirmed to decommission portal access for lapsed policies; not evidenced today.
- Removing the dead, unreachable duplicate `/e-card` route in `app.tsx` pointing at `WorkInProgress` (harmless today since route order makes it unreachable, but confusing to maintain).
- Aligning the Current tab's empty-state UI ("E-Card Not Available" ShieldCheck placeholder) with the Expired tab's ("No E-Card found" `NoDataPage`) — worth a product decision on which copy/UI should be the standard, rather than assuming one is "more correct."

## 6. Open Questions

- Should FR-1 (always-visible download icon) also apply to the **Current** tab for consistency, or is "always visible" specifically desired only for the archival/expired context? This PRD scopes it to Expired only per the literal request; extend on confirmation.
- For FR-2, what should the tooltip/disabled-state copy say exactly when `tpaId` is missing — is "not configured for this member" clearer to an employee than "not available"? Needs a product/copy decision before implementation.
