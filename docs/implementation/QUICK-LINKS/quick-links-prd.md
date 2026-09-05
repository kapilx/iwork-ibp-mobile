# Quick Links (Floating Rail) — PRD

**Module:** Global navigation / IBP employee portal · **Component:** part of the global `Header`
**Created on:** 2026-07-20 · **Status:** Draft (documents current as-built behavior)
**Related:** [quick-links-trd.md](./quick-links-trd.md) — technical design, code citations, decision log

---

## 1. Overview

Quick Links is a floating side panel present on nearly every authenticated IBP page, giving employees one-click (or one-hover) access to the 6 destinations they need most often, without going back to the main nav or Dashboard. It renders as a **collapsed pill** flush against the right edge of the viewport by default, expanding into a **full rail** listing the links on hover (or tap of the collapsed handle).

It is not a separate page or route — it's part of the global `Header` component, so it appears wherever `Header` renders.

## 2. Current Functionality (As-Is)

### 2.1 Collapsed state

A narrow, rounded pill fixed to the right edge, vertically centered, showing:
- A left-pointing chevron ("‹") affordance.
- The vertical text **"Quick"** (not "Quick Links" — the fuller label only appears once expanded).

### 2.2 Expanded state

Hovering the collapsed pill (or clicking it) expands it into a rail showing:
- Header: **"Quick Links"**
- Six items, each with an icon and label:

| # | Label | Where it goes |
|---|---|---|
| 1 | **Hospital Network** | In-app page: Hospital Network directory |
| 2 | **My Documents** | In-app page: My Documents library |
| 3 | **Policy Features** | In-app page: Policy Features preview |
| 4 | **Life Events** | In-app page: Life Events landing/carousel |
| 5 | **TPA Login** | External: opens the employee's TPA portal in a **new browser tab**, via a backend-issued single-sign-on link. Shows "Redirecting…" and is temporarily disabled while that link is being fetched. |
| 6 | **Chat support** | Opens an in-app modal titled "Chat Support" showing a WhatsApp QR code image — the employee scans it with their phone to start a chat; there's no in-app chat window. |

Clicking any of the first four items navigates within the app and the rail closes. TPA Login and Chat support behave as described above and also close the rail afterward.

**Conditional item:** "Policy Features" is hidden from the rail specifically when every one of the employee's policies is in an "add-only-dependents" state (a policy configuration where the employee can only add dependents, not view policy features) — in that case only 5 items show.

### 2.3 Collapsing

There is currently **no explicit close/collapse control** in the expanded rail — moving the mouse away from the rail is what collapses it. There is nothing to click to collapse it (the "Quick Links" header text is not interactive). See Gap Register.

## 3. Known Gaps

| # | Gap | Impact |
|---|---|---|
| GAP-QL-01 | The floating rail has **no visible way to collapse it by clicking anything** — only moving the mouse away collapses it (a `mouseleave`-driven timer). On touch devices (no hover), there's no equivalent affordance to close it once opened via tap. | Once expanded on a touch device, a user may have no reliable way to dismiss the rail short of navigating away or tapping elsewhere on the page (untested but implied by the hover-only design). |
| GAP-QL-02 | The rail is present on pages the footer is explicitly hidden on (e.g. `/life-events/flow`, `/e-card`, `/my-documents`, `/policy-features*`, `/claims-intimation`, `/unified-enrollment`, `/activity-log-preview`) — the footer's hide-list and the header's hide-list have diverged, and the rail (being part of Header) inherits only the header's shorter list. | This is the direct cause of the rail visually overlapping page content on wizard/full-screen flows reported in earlier bug screenshots (e.g. overlapping a PDF toolbar's Download button, overlapping a ticket list's Status column). |
| GAP-QL-03 | Expand/collapse state is not persisted anywhere and resets on every page navigation (plain component `useState`, no storage). | Not necessarily a defect — may be intentional — but worth a product decision: should the rail remember it was left open across an in-app navigation, or is "always starts collapsed" correct? |
| GAP-QL-04 | Two other IBP mechanisms are named "quick links" but are unrelated to this feature: a dead `NAV_ITEMS` entry (`key: "quick-links"`) used only for nav-highlighting and explicitly filtered out of both desktop and mobile nav rendering, and an orphaned `/quick-links` route rendering a generic "Work In Progress" page that nothing links to. | Purely code-hygiene/confusion risk for future engineers grepping for "quick links" — not user-facing. |
| GAP-QL-05 | The rail's 6 items are fully hardcoded in the frontend — unlike two other nav items in the same `Header` component (Wellness, Policy Porting), which are gated by company/portal configuration flags, none of the 6 Quick Links items are configurable per company/portal. | If a future company wants to hide "TPA Login" (e.g. they have no TPA integration) or add/remove an item, that currently requires a code change, not a config toggle — inconsistent with the pattern already established elsewhere in the same component. |
| GAP-QL-06 | "Chat support" opens a static image of a WhatsApp QR code (a hardcoded external image URL), not an actual in-app chat widget or SDK integration. | Not necessarily wrong — but worth confirming this is the intended, final experience rather than a placeholder pending a real chat-widget integration (there's a separate, currently-disabled `AskEcho` component elsewhere in the app that suggests chat-widget work was considered previously). |

## 4. Functional Requirements (recommended, not yet actioned)

### FR-1 — Close the discoverability gap on collapse (GAP-QL-01)

Add an explicit close affordance to the expanded rail (e.g., make the header's chevron/back-arrow clickable to force-collapse), independent of hover, so touch/keyboard users have a reliable way to dismiss it.

### FR-2 — Align the rail's visibility with the footer's hide-list (GAP-QL-02)

The floating rail must not render (or must render in a way that doesn't overlap page content) on the same set of full-screen/wizard routes the footer is already hidden on.

**Acceptance criteria:**
- AC-2.1: On `/life-events/flow`, `/e-card`, `/my-documents`, `/policy-features` (and `/policy-features/:id`), `/claims-intimation`, `/unified-enrollment`, and `/activity-log-preview`, the Quick Links rail/pill does not overlap any interactive page content.
- AC-2.2: On every other authenticated page, the rail continues to behave exactly as it does today.

## 5. Out of Scope (flagged, not required this round)

- Making the 6 items company/portal-configurable (GAP-QL-05) — a larger change mirroring the existing Wellness/Policy Porting config pattern; worth a separate product decision on which companies would actually need this before building it.
- Removing the dead `NAV_ITEMS` "quick-links" entry and the orphaned `/quick-links` route (GAP-QL-04) — pure cleanup, no user-facing effect.
- Replacing the static WhatsApp QR modal with a real chat widget (GAP-QL-06) — depends on a product decision about the intended long-term support channel.

## 6. Open Questions

- Should the rail remember its expanded/collapsed state across navigation within a session (GAP-QL-03), or is "always collapsed on load" the intended behavior?
- Is the WhatsApp-QR-code "Chat support" experience final, or a placeholder for a future real-time chat widget?
- Should "TPA Login" and "Chat support" also be subject to the same company/portal config gating being considered for the other 4 items (GAP-QL-05), e.g. a company with no TPA integration hiding that item entirely rather than it always attempting the SSO fetch?
