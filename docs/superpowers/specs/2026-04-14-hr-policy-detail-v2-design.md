# HR Policy Detail V2 Design

## Summary

Add a new preview route at `/hr-portal/policy-detail-v2/:policyId` that renders a Figma-aligned policy detail screen inside the existing `v2` HR portal shell. Update the `dashboard-v2` policy cards so each `View Details` button navigates to the matching policy detail route instead of the enrolment preview page.

This work must remain isolated to the preview flow:

- Keep all existing legacy HR portal routes unchanged.
- Keep existing `v2` preview routes unchanged except for dashboard navigation updates and the new route registration.
- Use page-local mock data for the policy detail page in the first pass.

## Goals

- Provide a dedicated preview detail page for each policy card on `dashboard-v2`.
- Match the Figma policy detail screen structure for node `415:6028`.
- Support direct linking and refresh-safe routing by encoding the selected policy in the URL.
- Reuse the same page layout for all supported policies with policy-specific data.

## Non-Goals

- Replacing legacy policy or enrolment pages.
- Wiring the page to real backend data in this pass.
- Changing the sidebar navigation model.
- Refactoring unrelated preview pages.

## Route Design

Add one reusable route:

- `/hr-portal/policy-detail-v2/:policyId`

Supported policy ids:

- `ghi`
- `gtl`
- `gpa`

Route behavior:

- If `policyId` matches a supported preview policy, render the policy detail page with that policy’s dataset.
- If `policyId` is missing or unsupported, redirect to `/hr-portal/dashboard-v2`.

The route must be treated as a preview route so it inherits the existing Figma-style `v2` shell styling in `HRPortal`.

## Navigation Design

Update `dashboard-v2` policy card CTAs so they navigate as follows:

- `Group Health Insurance` -> `/hr-portal/policy-detail-v2/ghi`
- `Group Term Life` -> `/hr-portal/policy-detail-v2/gtl`
- `Group Personal Accident` -> `/hr-portal/policy-detail-v2/gpa`

The button interaction should be driven by the clicked card’s policy identity, not by the currently selected dashboard filter alone. This ensures the detail destination always matches the specific card the user opened.

## Page Structure

Create a new page module under `apps/ui/ibp/src/app/pages/HRPortalPolicyDetailV2`.

Recommended files:

- `index.tsx`
- `styles.ts`
- `constants.ts`
- `types.ts`

The page should follow the Figma screen structure:

1. Top policy identity strip with back action, policy title, and status badge.
2. Top KPI area with policy-level summary cards.
3. Secondary KPI row with focused operational metrics.
4. Inner section tabs such as overview, claims analytics, member analytics, and financial insights.
5. Main detail content area with:
   - policy sub-components table
   - enrolment progress card
   - claim utilisation card
   - monthly claim trend panel
   - top hospitals used panel
   - disease category breakdown panel

The first implementation should default to the overview tab visually. The non-overview tabs may remain presentational unless the existing code already supports more without widening scope.

## Data Design

Keep the data local to the new page for now, keyed by `policyId`.

Suggested shape:

- policy header metadata
- primary KPI cards
- secondary KPI cards
- policy sub-component rows
- enrolment progress values
- claim utilisation values
- monthly trend series
- top hospitals dataset
- disease category dataset

The page should read `policyId` from the URL, select the matching mock dataset, and render the shared layout with policy-specific values.

## Component Boundaries

- `HRPortal/index.tsx`
  - Add the new route.
  - Extend preview-route detection so the new page gets the Figma shell.

- `HRPortalDashboardV2/components/PoliciesSection.tsx`
  - Change `View Details` navigation from the enrolment preview route to the new policy detail route.

- `HRPortalPolicyDetailV2/*`
  - Implement the new reusable policy detail screen and its local data/types/styles.

This keeps changes limited to one route integration point, one dashboard CTA integration point, and one new isolated page module.

## Error Handling

- Unsupported `policyId` values should redirect to `/hr-portal/dashboard-v2`.
- Missing policy-specific mock data should be treated the same as an unsupported route parameter.

## Validation

Run narrow checks only on touched files:

- `prettier --write` on the new page files and touched route/dashboard files
- direct `eslint` on the same file set

Do not expand validation into unrelated repo-wide fixes as part of this task.

## Risks And Mitigations

- Risk: the Figma page has more detailed sub-sections than the first implementation pass.
  - Mitigation: reproduce the visual structure and data hierarchy first, while keeping inner tabs presentational if needed.

- Risk: dashboard filter state and clicked card identity could conflict.
  - Mitigation: route from the clicked card’s policy id directly so the destination is explicit and deterministic.

- Risk: preview-shell logic might miss the new route.
  - Mitigation: extend the existing preview-route matcher in `HRPortal/index.tsx`.
