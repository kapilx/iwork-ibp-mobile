# HR Portal Dashboard V2 Design

## Summary

Build a new preview flow inside `apps/ui/ibp` that implements the Figma-aligned HR portal screens without changing the behavior of the existing non-`v2` HR portal routes.

The preview flow includes:

- `/hr-portal/dashboard-v2`
- `/hr-portal/enrolment-v2`
- `/hr-portal/claims-v2`

These three routes should share the same Figma-style shell treatment so they feel like one connected product flow. Existing HR portal pages, shared flows, and current dashboard components should remain functionally unchanged.

## Goals

- Add a side-by-side preview flow for the Figma-aligned dashboard, enrolment, and claims screens.
- Match the Figma layout closely using the existing React + MUI + styled pattern used by `apps/ui/ibp`.
- Keep the implementation isolated so existing pages are not visually or behaviorally affected.
- Use local mock data and local Figma assets for the first pass.
- Wire navigation between the preview routes so the flow can be reviewed end-to-end.

## Non-Goals

- Replacing the current `/hr-portal/dashboard` page.
- Refactoring existing HR portal shared components for reuse.
- Wiring the new page to backend APIs or existing dashboard hooks in the first pass.
- Modifying unrelated routes, services, or lockfiles.

## Target Area

- App: `apps/ui/ibp`
- Existing shell entry: `apps/ui/ibp/src/app/pages/HRPortal/index.tsx`
- New preview routes:
  - `/hr-portal/dashboard-v2`
  - `/hr-portal/enrolment-v2`
  - `/hr-portal/claims-v2`
- New page folders:
  - `apps/ui/ibp/src/app/pages/HRPortalDashboardV2`
  - `apps/ui/ibp/src/app/pages/HRPortalEnrolmentV2`
  - `apps/ui/ibp/src/app/pages/HRPortalClaimsV2`

## Proposed File Structure

```text
apps/ui/ibp/src/app/pages/HRPortalDashboardV2/
  index.tsx
  styles.ts
  types.ts
  constants.ts
  components/
    WelcomeHeader.tsx
    PolicyFilterBar.tsx
    PremiumKpiRow.tsx
    PoliciesSection.tsx
    ClaimsAnalysisSection.tsx
    MemberInsightsSection.tsx
    TopClaimsInsightsSection.tsx

apps/ui/ibp/src/app/pages/HRPortalEnrolmentV2/
  index.tsx
  styles.ts
  types.ts
  constants.ts
  components/
    EnrolmentSummaryRow.tsx
    EnrolmentFilterToolbar.tsx
    EnrolmentTable.tsx

apps/ui/ibp/src/app/pages/HRPortalClaimsV2/
  index.tsx
  styles.ts
  types.ts
  constants.ts
  components/
    ClaimsSummaryRow.tsx
    ClaimsFilterToolbar.tsx
    ClaimsTable.tsx
```

## Architecture

### Routing

Add three preview routes under the existing HR portal route tree:

- `path="dashboard-v2"` renders `HRPortalDashboardV2`
- `path="enrolment-v2"` renders `HRPortalEnrolmentV2`
- `path="claims-v2"` renders `HRPortalClaimsV2`

No existing non-`v2` route paths should change. The current dashboard route remains the default route for the HR portal.

### Page Composition

The new page will be a page-level orchestrator with narrowly-scoped section components. Each section should own one part of the Figma layout and accept typed props from local constants.

Sections:

1. `WelcomeHeader`

   - Welcome illustration
   - Welcome title and supporting copy

2. `PolicyFilterBar`

   - Policy type pills
   - Date range selector visual

3. `PremiumKpiRow`

   - Five top KPI cards:
     - Inception Premium
     - Addition Premium
     - Deletion Premium
     - Total Premium
     - Top-Up Premium

4. `PoliciesSection`

   - Section heading and helper text
   - Three policy summary cards
   - Per-card mini metrics and activity bars

5. `ClaimsAnalysisSection`

   - Section heading
   - Filter chips
   - Summary metrics
   - Claims bar visualization
   - Claim ratio visualization

6. `MemberInsightsSection`

   - Demographic and enrolment bars
   - Enrollment status cards

7. `TopClaimsInsightsSection`
   - Tab-like toggles
   - Horizontal claims chart

### Preview Flow Composition

`HRPortalEnrolmentV2` should include:

1. page heading row
2. KPI summary strip
3. horizontal secondary navigation for enrolment-related tabs
4. filter/search/export toolbar
5. enrolment table

`HRPortalClaimsV2` should include:

1. page heading row
2. KPI summary strip
3. horizontal secondary navigation for claims-related tabs
4. filter/search/export toolbar
5. claims table

### Styling Strategy

- Use MUI and the repo’s existing styled-component pattern.
- Create page-local styled primitives in `styles.ts`.
- Prefer local styles over editing shared `HRPortal` styles unless a route-level integration absolutely requires a small, non-breaking export.
- Keep section-specific visual rules close to the new page rather than generalizing early.

## Isolation Strategy

The implementation must minimize blast radius:

- New layout and styles live in the new page folder.
- Existing `HRPortalDashboard`, `ClaimsInsights`, `TopClaimsTable`, `KPIRow`, and similar dashboard components should not be modified for this first pass.
- Shared existing files may only receive:
  - route imports
  - route registration lines
  - route-scoped shell branching for `v2` pages
  - dashboard-v2 navigation wiring to the new preview routes
- If a shared helper becomes tempting, duplicate locally first unless reuse is clearly safe and trivial.

## Data Strategy

The first implementation uses local static data only for all three preview routes.

Data sources:

- Local constants in `constants.ts`
- Figma-derived icons and image assets from `apps/ui/ibp/src/app/assets/svgs` and `apps/ui/ibp/src/app/assets/pngs`

This includes:

- policy pill labels
- top KPI values
- policy card content
- claim metrics
- member insight values
- top claims chart labels and values
- enrolment summary cards
- enrolment table rows and toolbar controls
- claims summary cards
- claims table rows and toolbar controls

This avoids risk from:

- unstable API contracts
- shared dashboard hook regressions
- backend dependency changes

## Asset Strategy

- Use only the Figma-exported assets needed by the new page.
- Reference them from `apps/ui/ibp/src/app/assets/svgs` and `apps/ui/ibp/src/app/assets/pngs` inside the new page implementation.
- Do not replace or move existing assets used by other pages.

## Error Handling

Because the page is mock-data driven in the first pass, runtime error handling is limited:

- Keep components defensive around optional arrays and labels.
- Ensure charts and lists render empty-safe states if constants are absent.
- Avoid introducing async behavior in the first pass.

## Testing Strategy

Initial verification should focus on regression safety and route isolation:

1. Confirm `/hr-portal/dashboard` still renders as before.
2. Confirm `/hr-portal/dashboard-v2`, `/hr-portal/enrolment-v2`, and `/hr-portal/claims-v2` render independently.
3. Confirm the preview routes share the same Figma-style shell.
4. Confirm HR portal navigation still works for existing non-`v2` routes.
5. Confirm dashboard-v2 navigation leads into the preview enrolment and claims pages.
6. Confirm sidebar, topbar, and content layout render correctly on desktop widths.
7. Confirm the new pages remain readable on smaller widths without breaking the existing app shell.

If feasible in the environment, add targeted component or route tests only for the new page. Do not expand test scope to unrelated legacy dashboard behavior.

## Risks

### Figma fidelity vs. reuse tension

Reusing existing dashboard components would speed up implementation, but those components were designed for a different dashboard structure and could force visual compromises. This design intentionally favors new local sections for higher fidelity.

### Shared shell mismatch

The current HR portal shell differs from the Figma shell in spacing and details. Small route-level adjustments may be needed to host the new page cleanly, but these should be kept minimal and non-breaking.

### Large lower-page analytics sections

Some lower Figma sections were too large to fetch in a single design-context call. Implementation will rely on the full-screen screenshot plus the section-level context already retrieved, and may require one more targeted fetch during coding for exact chart details.

## Implementation Order

1. Extend the route-scoped Figma shell variant to all preview routes.
2. Add the new preview route scaffolds for enrolment and claims.
3. Implement `HRPortalEnrolmentV2`.
4. Implement `HRPortalClaimsV2`.
5. Wire `dashboard-v2` navigation to the preview routes.
6. Validate the three-page flow visually against the Figma screenshots.
7. Run formatting, linting, and available tests for affected UI code.

## Acceptance Criteria

- `/hr-portal/dashboard-v2`, `/hr-portal/enrolment-v2`, and `/hr-portal/claims-v2` exist and render successfully.
- Existing HR portal routes continue to behave as before.
- The preview pages visually reflect the approved Figma screen structure:
  - welcome header
  - policy filters
  - KPI cards
  - policy summary cards
  - claims analysis
  - member insights
  - top claims insights
- The enrolment preview includes summary cards, toolbar, and enrolment table.
- The claims preview includes summary cards, toolbar, and claims table.
- The three preview pages share the same Figma-style shell treatment.
- The implementation is primarily contained to the new `v2` page files plus minimal route and route-scoped shell wiring.
- No backend or shared business logic changes are required for the first pass.
