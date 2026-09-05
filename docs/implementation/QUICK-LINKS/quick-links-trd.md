# Quick Links (Floating Rail) — TRD

**Component:** `apps/ui/ibp/src/app/components/Header/index.tsx` (no separate file — lives entirely inside the global `Header` component)
**Status:** Draft (as-is architecture documented; GAP-QL-01/02 fixes speced, not yet implemented) · **Last updated:** 2026-07-20
**Related:** [quick-links-prd.md](./quick-links-prd.md) — product requirements and acceptance criteria

---

## 1. Where it lives

Not a route, not a standalone component file — it's a block of JSX/state inside the global `Header` component, mounted once from `app.tsx:175`:
```tsx
{!hideHeader && <Header />}
```
`hideHeader` (`app.tsx:148-154`) is `true` only for `/login`, `/reset-password`, `/auth/callback`, `/landing`, `/hr-portal`, and `/hr-portal/*`. On every other route, `Header` — and therefore the Quick Links rail — renders.

**Root cause of the overlap bugs (GAP-QL-02):** a separate `hideFooter` flag (`app.tsx:155-167`) has a much longer route list — it additionally hides on `/unified-enrollment`, `/e-card`, `/my-documents`, `/my-documents/preview`, `/policy-features`, `/policy-features/*`, `/activity-log-preview`, `/life-events/flow`, `/claims-intimation`. The Quick Links rail, being part of `Header` and gated only by `hideHeader`, has **no equivalent hide-list** — so it stays mounted and visually floating on top of every one of those pages, which is exactly where earlier bug screenshots showed it overlapping a PDF toolbar's Download button and a ticket list's Status column.

## 2. State and interaction model

```tsx
// Header/index.tsx:91
const [isQuickLinksExpanded, setIsQuickLinksExpanded] = useState(false);
```
Plain component state — not persisted to Redux/localStorage/sessionStorage anywhere (confirmed via repo-wide grep). Resets to collapsed on every mount (i.e., every full navigation, since `Header` remounts with the route tree rather than living above the router).

**It is hover-driven, not click-toggle-driven**, despite the collapsed pill's chevron affordance suggesting a click interaction:
- `handleQuickLinksMouseEnter` (372-378): on `mouseenter`, after an 80ms debounce, `setIsQuickLinksExpanded(true)`.
- `handleQuickLinksClose` (380-386): on `mouseleave`, after a 190ms debounce, `setIsQuickLinksExpanded(false)`.
- The collapsed handle's `onClick` (706-713) also forces expand immediately, bypassing the hover delay — this is the *only* click-based entry point.
- **There is no click-based exit.** `FloatingQuickLinksHeader` (743-747) renders as a `<button>` but has no `onClick` — clicking "Quick Links" does nothing. The rail only collapses via `onMouseLeave` (line 741) or implicitly after a link click (`handleQuickLinksClose()` inside each item's `onClick`, 754-758). This confirms PRD GAP-QL-01 exactly: no click/tap-based collapse exists.
- Cleanup: `useEffect` (389-393) clears the pending debounce timer on unmount, preventing a stray `setState` after the component is gone.

## 3. The 6 items — `quickRailItems` (`Header/index.tsx:395-448`, `useMemo`)

```tsx
const quickRailItems = useMemo(() => [
  { key: "hospital-network", label: "Hospital Network", icon: hospitalNetworkIcon,
    onClick: () => navigate("/hospital") },                                      // 403
  { key: "documents", label: "My Documents", icon: documentsIcon,
    onClick: () => navigate("/my-documents") },                                  // 410
  { key: "policy-features", label: "Policy Features", icon: policyFeatureIcon,
    onClick: () => navigate("/policy-features") },                               // 416
  { key: "life-events", label: "Life Events", icon: lifeEventsIcon,
    onClick: () => { /* ...; */ navigate("/life-events"); } },                    // 424-426
  { key: "tpa-login", label: isSsoFetching ? "Redirecting..." : "TPA Login", icon: tpaLoginIcon,
    onClick: handleTpaPortalClick, disabled: isSsoFetching },                     // 433-434
  { key: "chat-bot", label: "Chat support", icon: whatsappIcon,
    onClick: () => setIsQrModalOpen(true) },                                      // 440
].filter((item) => !(addOnlyDependents && item.key === "policy-features")),        // 442-446
[hasGMCPolicy, hasAnyPolicyForLifeEvents, isEnrollmentCompleted, hasAnyEditablePolicy,
 navigate, shouldOpenSummary, isSsoFetching, handleTpaPortalClick, addOnlyDependents]); // 447
```

Confirmed directly against the source: all 6 `navigate(...)`/handler calls, and the `addOnlyDependents` filter, match the lines above exactly.

**Dead conditional gating:** the memo's dependency array includes `hasGMCPolicy` and `hasAnyPolicyForLifeEvents`, implying "Hospital Network" and "Life Events" were originally meant to be individually gated on policy type/eligibility — but that gating logic is commented out in the array itself (dead code at lines 398, 405, 418-420, 428). Today, only the "Policy Features" item is actually filtered (by `addOnlyDependents`); the other 5 always render regardless of the policy flags still sitting in the dependency array. Not necessarily wrong (it may be intentionally rolled back), but worth flagging to whoever next touches this file, since the dependency array currently implies more conditional behavior than the code actually performs.

### 3.1 TPA Login — external SSO redirect

```tsx
// Header/index.tsx:226-240 (handleTpaPortalClick)
const { data } = await fetchTpaPortalSso();  // endPoints.employeeTpaPortalSso(employeeId)
const redirectUrl = data?.redirectUrl;
window.open(redirectUrl, "_blank", "noopener,noreferrer");
```
`endPoints.employeeTpaPortalSso` → `apps/ui/ui-lib/src/lib/constants/endPoints.ts:132-133` → `GET {ibpUrl}/company-employee/employee/:employeeId/tpa-portal-sso`. This is a **backend-issued SSO URL opened in a new tab**, not an in-app route. On fetch failure, a Redux `setToastMessage` error is dispatched. While in flight, `isSsoFetching` disables the rail item and swaps its label to "Redirecting...".

### 3.2 Chat support — static QR modal, not a chat SDK

```tsx
// Header/index.tsx:769-814 (CustomModal, title="Chat Support")
<img src="https://goodhealthtpa.com/wp-content/uploads/2024/09/I4A2FPAGJM4UC1.png" ... />
// "Need help? Scan the QR code and start chatting instantly."
```
Confirmed: no chat widget SDK, no third-party script, no `window.open` — a static externally-hosted image inside a `CustomModal`, with the actual conversation happening entirely outside the app (WhatsApp, via the employee's own phone scanning the QR code).

## 4. Styled components (`Header/styles.ts`)

| Component | Lines | Key properties |
|---|---|---|
| `FloatingQuickLinksRail` | 415-452 | `position: fixed; right: 0; top: 52%; width: 240px` (220px tablet / 200px mobile), `transform: translate(0,-50%)` open ↔ `translate(100%,-50%)` closed, `transition: transform 390ms cubic-bezier(0.22,1,0.36,1)`, gradient `linear-gradient(180deg,#1F4EA8 0%,#1A84A3 100%)`, **`zIndex: 120`**. |
| `FloatingQuickLinksHandle` | 462-505 | `position: fixed; right:0; top:52%; width:36px; height:130px`, **`zIndex: 119`** (a code comment at line 480 confirms this is deliberately one below the rail), opacity 0.6 → 1 on hover. |
| `FloatingQuickLinksHandleLabelBox` / `Label` | 511-539 | Vertical text via `writing-mode: vertical-rl; transform: rotate(180deg)`; font-size 12px, with a comment explicitly noting this is a documented exception to the app's 15px minimum font-size convention. |
| `FloatingQuickLinksHeader`, `List`, `Item`, `Label` | 541-638 | Animate height/opacity/max-width/gap on the `expanded` prop; 200-390ms transitions. |

**Evidence this z-index has already caused real collisions:** `apps/ui/ibp/src/app/pages/HRPortalPolicySummary/index.tsx:6874` carries a comment — "Floating back-to-top — fixed bottom-right, above quick links rail (z:120)" — showing a separate fixed element was explicitly z-index-tuned to sit above this rail. `apps/ui/ibp/src/app/common/BottomFooter/styles.ts:97-100` reserves `paddingRight: 52px` on mobile specifically to keep the collapsed 48px-wide handle from overlapping footer content. Both are workarounds around individual elements; neither addresses the root cause (§1).

## 5. Config-driven vs. hardcoded (GAP-QL-05)

The 6 items are a hardcoded array literal — no backend/portal config drives them. By contrast, this **same** `Header` component already has a config-driven pattern for two *other* nav items:
```tsx
// Header/index.tsx:108-116, isNavItemVisible
portalDashboardConfig?.wellnessBanner?.enabled
portalDashboardConfig?.portingBanner?.enabled
```
(from `useCompanyConfig()`, line 104-105). None of the 6 Quick Links items are wired through this same `portalDashboardConfig` gating mechanism — if a future requirement needs per-company visibility control (e.g. hide "TPA Login" for companies without a TPA integration), the established pattern to extend is `isNavItemVisible`/`portalDashboardConfig`, not a new bespoke mechanism.

## 6. Two unrelated "quick links" — do not conflate (GAP-QL-04)

1. `NAV_ITEMS` entry `{ key: "quick-links", path: ["/hospital","/my-documents","/policy-features","/work-in-progress"] }` — `apps/ui/ibp/src/app/constants/index.ts:198-207`. Used only for nav-active-highlighting; explicitly filtered out of both desktop (`Header/index.tsx:508`) and mobile drawer (`Header/index.tsx:661`) rendering via `item.key !== "quick-links"`. Does not include "TPA Login," "Life Events," or "Chat support" — it predates and does not describe the current floating rail.
2. Route `/quick-links` (`app.tsx:263-270`) rendering a generic `WorkInProgress` placeholder. Orphaned — nothing in the app links to it.

Both appear to be leftovers from an earlier, Popover-based "quick links" implementation (a commented-out block at `Header/index.tsx:816-819+` is labeled "Legacy quick-links behavior"). Safe to remove independently of any other Quick Links work; flagged here only so a future engineer doesn't confuse either with the actual floating rail this TRD describes.

## 7. Decisions — proposed fixes for the PRD's requirements

### D1 (→ FR-2, GAP-QL-02) — Hide the rail on the same routes the footer already hides on

**Change:** in `app.tsx`, either (a) reuse `hideFooter`'s exact route list as a new `hideQuickLinks` flag and conditionally suppress rendering the rail/handle (requires passing a prop into `Header` or lifting the route check into `Header` itself via `useLocation`), or (b) simplest: since the rail is the only part of `Header` causing the overlap (the top nav bar itself is presumably fine to keep showing on these pages — confirm this assumption during implementation), thread a `hideQuickLinks` boolean prop into `Header` computed from the same route list already backing `hideFooter`, and conditionally render `FloatingQuickLinksRail`/`FloatingQuickLinksHandle` on it, leaving the rest of `Header` untouched.

**Recommendation: option (b)** — narrower blast radius, since it's specifically the rail (not the whole header) that's been reported overlapping content; no evidence the top nav bar itself causes the same problem on these routes.

### D2 (→ FR-1, GAP-QL-01) — Add a click-based collapse control

**Change:** give `FloatingQuickLinksHeader`'s `onClick` (currently absent, line 743-747) a handler that calls `setIsQuickLinksExpanded(false)` directly (bypassing the debounce), or repurpose the chevron icon in the collapsed handle as a persistent, always-visible close affordance inside the expanded rail as well. Either approach gives touch/keyboard users a way to dismiss the rail without relying on `mouseleave`, which never fires on touch devices.

### D3 (deferred, no action this round) — Config-driven item visibility (GAP-QL-05)

Not implemented in this pass per the PRD's Out of Scope — flagged here only to note the extension point (`portalDashboardConfig`, §5) for whenever it's prioritized.

## 8. Testing plan

- **D1:** navigate to each route in `hideFooter`'s list (`/life-events/flow`, `/e-card`, `/my-documents`, `/policy-features`, `/policy-features/:id`, `/claims-intimation`, `/unified-enrollment`, `/activity-log-preview`) and confirm neither the collapsed handle nor the expanded rail renders/overlaps content; confirm every other authenticated route is unaffected (rail still appears and behaves as before).
- **D2:** open the rail (hover or click-to-expand), then use the new close control without moving the mouse away — confirm it collapses. Repeat via touch/tap emulation in devtools to confirm a non-hover dismissal path now exists.
- **Regression:** confirm all 6 items' navigation targets (or TPA/chat behaviors) are unaffected by either change; confirm the `addOnlyDependents` filtering of "Policy Features" still applies.

## 9. Rollout / risk

- D1 and D2 are both frontend-only, scoped to `Header/index.tsx`/`styles.ts` and the route-list constant in `app.tsx` — no API/backend change.
- D1's blast radius is limited to visibility timing of the rail on a known, already-enumerated route list (the same list `hideFooter` already uses safely) — low risk.
- D2 is purely additive (a new way to close something that already closes via hover) — no risk of regressing existing hover-based collapse.
