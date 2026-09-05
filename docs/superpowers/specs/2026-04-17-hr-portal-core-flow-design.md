# HR Portal Core Flow Design

## Goal

Implement the HR portal core flow to match the Figma file `HR-Portal-IIRM` and its prototype as closely as possible for the following connected screens:

- Dashboard
- Policy detail
- Enrollment
- Claims

All screens should render within the fixed `1366x768` framed HR portal shell, including the sidebar and top bar.

## Source Of Truth

- Figma design file: `https://www.figma.com/design/GoWPwWRXCah5JwCniCndUs/HR-Portal-IIRM?m=dev`
- Figma prototype entry: `https://www.figma.com/proto/GoWPwWRXCah5JwCniCndUs/HR-Portal-IIRM?node-id=1-16118&starting-point-node-id=1%3A16118`

The prototype is the source of truth for layout, visual hierarchy, interaction flow, navigation order, and screen transitions in this phase.

## In Scope

### 1. Dashboard

- Use the Figma dashboard as the landing screen.
- Match the KPI strip, policy cards, claims insights, member insights, quick insights, page header, tabs, selectors, and shell layout to the Figma design.
- Clicking `View Details` on a policy card routes to the policy detail page for that policy.

### 2. Policy Detail

- Implement the policy detail page as a dedicated route.
- Match the Figma detail screen closely:
  - back button
  - policy name and status chip
  - policy selector context
  - KPI strip
  - policy sub-components table
  - enrollment progress section
  - monthly claim trend
  - claim utilisation card
  - quick insights cards
- Back navigation should return the user to the previous portal screen state.

### 3. Enrollment

- Implement the enrollment page according to the prototype’s layout and interaction model.
- Preserve the earlier enrollment filter behavior where useful, but restyle controls to match the Figma visuals and placement.
- Keep the same portal shell, top bar, sidebar, and frame sizing.

### 4. Claims

- Implement the claims page according to the prototype’s layout and navigation model.
- Preserve the earlier claims filter behavior where useful, but restyle them to look like the Figma controls.
- Include the prototype’s claims navigation/tab structure where applicable.

## Out Of Scope For This Phase

- Reports deep implementation
- Hospitals deep implementation
- Finance deep implementation
- Settings deep implementation
- Non-core flows beyond what is required to preserve shell navigation

These routes can remain existing implementations or placeholders unless needed for shared shell consistency.

## Visual Fidelity Rules

- Match the Figma screen composition as literally as practical.
- Prefer Figma-faithful layout over existing page-specific styling.
- Maintain the same content density, spacing rhythm, card grouping, tab treatment, and header hierarchy as the prototype.
- Keep the whole HR portal experience within one fixed `1366x768` artboard-style frame.
- Sidebar, top bar, and page body should all appear as part of the same framed design.
- Existing interactive logic may be reused when it does not conflict with the prototype.
- When reuse conflicts visually, preserve the behavior but reskin the control to match Figma.

## Route Model

Use dedicated routes for the core flow:

- `/hr-portal/dashboard`
- `/hr-portal/policies/:policyId`
- `/hr-portal/enrollment`
- `/hr-portal/claims`

## Interaction Model

### Dashboard -> Policy Detail

- `View Details` routes to `/hr-portal/policies/:policyId`.
- The selected policy should drive the policy detail header, KPI values, sub-components, and insight data.

### Sidebar Navigation

- Sidebar items switch between the core flow pages with active-state styling matching the prototype.
- Shared shell should remain stable while page content changes.

### Policy Detail -> Back

- The back button returns the user to the previous portal screen rather than forcing a hard reset to dashboard.

### Shared Selectors

- Policy and date selectors should appear where the prototype places them.
- These selectors should maintain consistent visual treatment across dashboard, policy detail, enrollment, and claims.

## Reuse Strategy

- Reuse the current `HRPortal` shell and route structure where possible.
- Reuse existing dashboard and detail code only where it helps reach Figma parity.
- Reuse earlier enrollment and claims filters for behavior, but reskin and reposition them to match Figma.
- Prefer replacing approximate layouts with Figma-faithful structures over layering more visual patches on top of old markup.

## Technical Notes

- The portal frame remains fixed at `1366x768`.
- The implementation should continue using the existing React, MUI, and `lucide-react` stack already present in the app.
- Mock data can be used to mirror the prototype content where backend integration is not yet part of scope.
- Route-based screens are preferred over local component swapping so the prototype flow behaves like a real product.

## Risks And Constraints

- The Figma file is large, so implementation should continue screen by screen using targeted node reads instead of trying to translate the entire file at once.
- Exact prototype parity may require replacing more of the existing page markup than a light reskin would.
- Enrollment and claims may require careful adaptation because behavior is being reused while visuals must change significantly.

## Success Criteria

- Dashboard, policy detail, enrollment, and claims all exist as routed screens in the HR portal shell.
- The visual structure of these screens closely matches the Figma prototype.
- The sidebar and top bar remain consistent across the core flow.
- `View Details` routes into a policy detail page that matches the prototype.
- Enrollment and claims retain usable filters with Figma-matching presentation.
- The whole flow remains inside the fixed `1366x768` framed portal experience.
