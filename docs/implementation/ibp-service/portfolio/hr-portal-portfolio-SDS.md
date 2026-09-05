# HR Portal – Portfolio Page – Software Design Specification (SDS)

**Document Version:** 1.1
**Date:** 2026-05-07
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-PORTFOLIO
**Related Documents:**
- PRD: `hr-portal-portfolio-PRD.md`
- TRD: `hr-portal-portfolio-TRD.md`

> **Document scope.** This SDS owns *how the Portfolio page looks and behaves on screen* — layout, section structure, component types, chart/widget selection, rendering rules, navigation flow, and frontend interaction details. Business requirements are owned by the PRD. API design and SQL are owned by the TRD.

---

## 1. Navigation and Entry Point

| Step | Action | Result |
|---|---|---|
| 1 | User logs into the HR Portal | Lands directly on the Portfolio page (`/hr-portal/portfolio`) — it is the default/root view |
| 2 | User clicks "Portfolio" in the left sidebar from any other page | Navigates back to the Portfolio page |

No prior navigation context or company selection is required. All data is scoped server-side to the authenticated broker organization's JWT `companyId`.

---

## 2. Information Architecture

### 2.1 Routes

| Route | Screen | Entry |
|---|---|---|
| `/hr-portal/portfolio` | Portfolio Overview (this page) | Default landing / sidebar "Portfolio" |
| `/hr-portal/dashboard?companyId={id}` | Company Dashboard | Click company name from Portfolio |
| `/hr-portal/policy-summary/{policyId}` | Policy Detail | Click policy row from Portfolio |

### 2.2 Sidebar Context

The Portfolio page is the **first item** in the left sidebar navigation. When the user is on the Portfolio page, "Portfolio" is highlighted as the active nav item. No sub-navigation or breadcrumb is shown on this page.

---

## 3. Page Layout

The page is a single vertically-scrolling surface composed of three stacked zones.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER (always visible while scrolling)                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Portfolio Overview                                                │    │
│  │ Manage and track all client group companies and their policies    │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │ ┌──────────┐ ┌──────────────────────────┐ ┌────────┐ ┌────────┐ │    │
│  │ │Companies │ │Policies        46        │ │Total   │ │Total   │ │    │
│  │ │    18    │ │  ●36 Active  ●10 Inactive│ │Lives   │ │Premium │ │    │
│  │ └──────────┘ └──────────────────────────┘ │ 14.7L  │ │₹3722Cr│ │    │
│  │                                            └────────┘ └────────┘ │    │
│  └──────────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│  ZONE 2: GROUP CLIENTS ──────────────────────────── [6]                  │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ > [TG] Tata Group     Conglomerate  3 co · 7 pol · 1.5L    ₹357Cr│   │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │ > [IN] Infosys        Info Tech     2 co · 6 pol · 3.5L    ₹938Cr│   │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │ …                                                                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────┤
│  ZONE 3: INDIVIDUAL CLIENTS ─────────────────────── [3]                  │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ > [🏢] Zomato Ltd  INDIVIDUAL  Food Tech  Gurugram  RM: Pooja    │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │ > [🏢] Nykaa (FSN) INDIVIDUAL  Beauty     Mumbai   RM: Ananya    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Section 1 — KPI Cards (Sticky Header)

### 4.1 Component Type

Four **Stat Cards** in a horizontal flex row inside a sticky container. The header is pinned to the top (`position: sticky`) with a bottom border and subtle box-shadow to indicate depth when content scrolls underneath.

### 4.2 Card Layout

Each stat card:
```
┌────────────────────────────────────┐
│  [Icon]  Value                     │
│          Label                     │
└────────────────────────────────────┘
```

- Icon: Lucide icon in a rounded square tile, using a tinted background matching the card's accent colour.
- Value: Large bold number (font-size ~20px, weight 700).
- Label: Small muted text below the value.

| Card | Icon | Accent colour |
|---|---|---|
| Companies | `Building2` | Blue (#1D4ED8) |
| Policies | `Shield` | Teal (#0F766E) |
| Total Lives | `Users` | Amber (#B45309) |
| Total Premium | `TrendingUp` | Orange-red (#C2410C) |

### 4.3 Policies Card — Interactive Filter Chips

**Widget type:** Two clickable pill chips embedded below the policy count value.

```
┌──────────────────────────────────────┐
│  [Shield]  46                        │
│            Policies                  │
│   ● 36 Active    ● 10 Inactive       │
└──────────────────────────────────────┘
```

Each chip is a small rounded pill with a coloured dot indicator. Chip behaviour:

| State | Active chip appearance | Inactive chip appearance |
|---|---|---|
| Default (none selected) | Neutral border, grey dot | Neutral border, grey dot |
| "Active" selected | Green border, green background, green dot, bold text | Unchanged |
| "Inactive" selected | Unchanged | Amber border, amber background, amber dot, bold text |

**Interaction:** Click to toggle. Clicking the already-selected chip deselects it and restores the full list. Both chips cannot be selected simultaneously (mutually exclusive toggle).

**Effect:** The filter is applied client-side. No new API call is made. Both the Group Clients and Individual Clients sections update their rendered list simultaneously. Section count badges (pill next to section label) recalculate based on filtered results.

### 4.4 Display Formatting Rules

| Field | Value range | Formatted output |
|---|---|---|
| `totalLives` | ≥ 1,00,000 | `{n/100000}L` (e.g., 14.7L) |
| `totalLives` | ≥ 1,000 | `{n/1000}K` (e.g., 14K) |
| `totalLives` | < 1,000 | Raw integer |
| `totalPremium` (₹) | ≥ 1,00,00,000 | `₹{n/10000000} Cr` (e.g., ₹3722 Cr) |
| `totalPremium` (₹) | < 1,00,00,000 | `₹{n/100000}L` (e.g., ₹50L) |

---

## 5. Section 2 — Group Clients

### 5.1 Section Divider Component

```
GROUP CLIENTS ────────────────────────────────── [6]
```

A horizontal rule with a label on the left (uppercase, muted) and a count pill badge on the right. The count reflects the number of currently visible groups (updates when filter is active).

### 5.2 Group Row Layout

**Widget type:** Collapsible accordion card (primary tier).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  > [TG]  Tata Group                                          ₹357 Cr     │
│          Conglomerate │ 3 companies · 7 policies · 1.5L lives   AUM      │
└──────────────────────────────────────────────────────────────────────────┘
```

Visual specs:
- Background: subtle gradient (`linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)`)
- Border: thin light border with elevated box-shadow
- Group logo tile: 38×38px rounded square, coloured background with white 2-letter initials (font-weight 800)
- Chevron icon (`ChevronRight` → `ChevronDown` on expand): positioned left of the logo
- AUM badge: right-aligned pill with the group's logo colour as a tinted background

**Hover state:** Box-shadow increases slightly to communicate interactivity. Cursor: pointer.

**Expand/collapse:** Click anywhere on the group row card. The chevron icon rotates from right to down. Default: all groups collapsed.

**Animation:** Smooth height transition on expand/collapse (CSS transition on max-height or use a height animation via MUI collapse).

### 5.3 Company Row Layout (visible when group is expanded)

**Widget type:** Collapsible accordion card (secondary tier), indented under the group.

```
  ┌────────────────────────────────────────────────────────────────────┐
  │  > [🏢]  Tata Consultancy Services                  RM: Arjun Mehta  3 Policies │
  │          Information Technology  📍 Mumbai, Maharashtra  👥 92,000 employees│
  └────────────────────────────────────────────────────────────────────┘
```

Visual specs:
- Background: light (#F8FAFC), with border
- Company icon: 30×30px rounded square with building icon (generic, not branded)
- Company name: clickable link styled in blue, underlined on hover
- Metadata row: industry icon (`Briefcase`), location icon (`MapPin`), shown in muted text
- RM label: "RM: **Name**" right-of-center
- Policy count badge: right-aligned pill in blue tint

**Interaction:**
- Click on company name → navigate to Dashboard (uses `e.stopPropagation()` to prevent row toggle)
- Click anywhere else on the row → toggle policy table expand/collapse

### 5.4 Policy Table Layout (visible when company row is expanded)

**Widget type:** Inline table (not a dialog/modal — renders directly below the company row).

```
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ NAME              TYPE    INSURER                  POLICY NO.   PREMIUM  VALIDITY    STATUS  │
  ├──────────────────────────────────────────────────────────────────────────────┤
  │ Group Medical Cover  [GMC]  Star Health Insurance  TCS-GMC-001  ₹184Cr  31 Mar 2026  Active  │
  │ Group Term Life      [GTL]  LIC of India           TCS-GTL-001  ₹46Cr   31 Mar 2026  Active  │
  │ Group Personal Acc   [GPA]  New India Assurance    TCS-GPA-001  ₹18Cr   31 Mar 2026  Active  │
  └──────────────────────────────────────────────────────────────────────────────┘
```

**Table header row:** Background `#F8FAFC`, uppercase column labels in small muted text. Fixed column widths to ensure alignment across all company expansions.

**Policy type badge widget:** Small rounded rectangle with coloured border and fill:

| Type | Background | Text colour | Border |
|---|---|---|---|
| GMC | `#EFF6FF` | `#1D4ED8` | `#BFDBFE` |
| GTL | `#F0FDF4` | `#15803D` | `#BBF7D0` |
| GPA | `#FFFBEB` | `#B45309` | `#FDE68A` |
| GPC | `#FAF5FF` | `#7E22CE` | `#E9D5FF` |

**Status badge widget:** Small rounded rectangle:

| Status | Background | Text colour | Border |
|---|---|---|---|
| Active | `#ECFDF5` | `#065F46` | `#A7F3D0` |
| Renewal Due | `#FFF7ED` | `#C2410C` | `#FED7AA` |
| Expired | `#FEF2F2` | `#B91C1C` | `#FECACA` |

**Policy No. column:** Rendered in monospace font for readability.

**Hover state on policy row:** Row background lightens to `#EBF3FF`. Cursor: pointer.

**Click interaction:** Navigates to `/hr-portal/policy-summary/{policyId}` using the policy database ID (integer), not the type code.

---

## 6. Section 3 — Individual Clients

### 6.1 Section Divider

Same component pattern as Group Clients (§5.1), label "INDIVIDUAL CLIENTS".

### 6.2 Individual Company Card Layout

**Widget type:** Collapsible accordion card — same collapse/expand behaviour as group company rows but used as a top-level card (not nested under a group).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ > [🏢] Zomato Ltd   [INDIVIDUAL]                    RM: Pooja Reddy  2 Policies │
│        Food Tech & Delivery  📍 Gurugram, Haryana  👥 8,200 employees   │
└──────────────────────────────────────────────────────────────────────────┘
```

Differences from group company rows:
- Card sits at the top level (no group parent indentation)
- An **INDIVIDUAL** pill badge appears next to the company name
- Styling: slightly different gradient/border to visually separate from group-scoped companies (e.g. `#F8FAFF` background, blue-tinted border `#E0E9F8`)
- Company icon: `Building2` in blue (`#1D4ED8`) on a blue-tinted tile background

**Policy table on expansion:** Identical to §5.4.

---

## 7. Navigation Flow

```
Portfolio Overview
│
├─ Click company name (group OR individual)
│    └─► Dashboard  →  pre-scoped to that company
│              │
│              └─ Click a policy card on Dashboard
│                   └─► Policy Detail page
│
└─ Click policy row (in expanded policy table)
     └─► Policy Detail page  /hr-portal/policy-summary/{policyId}
```

**Key navigation rules:**
1. Company name click on Portfolio goes to Dashboard with `?companyId={id}` query param. The Dashboard must read this param and pre-select the company on mount.
2. Policy row click from Portfolio navigates directly to the policy detail page using the policy's integer database ID. This bypasses the Dashboard.
3. Clicking the company name does NOT toggle the company row expand state (`e.stopPropagation()` required).
4. Clicking the policy row does NOT have any effect on the accordion state — pure navigation.

---

## 8. Interaction Details

### 8.1 Expand / Collapse Logic

| Element | Click target | Toggle scope | Default state |
|---|---|---|---|
| Group row | Entire card area | Shows/hides member companies | Collapsed |
| Company row | Card area except company name | Shows/hides policy table | Collapsed |
| Individual company card | Card area except company name | Shows/hides policy table | Collapsed |

State is stored in component-local React state (`useState` / `useReducer`). Group and company expand states are independent dictionaries keyed by ID.

When the Active/Inactive policy filter chip is toggled:
- Groups/companies that no longer match the filter disappear from the list.
- Any previously expanded groups/companies that are filtered out lose their expand state (no need to preserve it for hidden items).
- When the filter is cleared, the list is restored but expand states return to default collapsed (not the previous override state).

### 8.2 Filter Chip Interaction

1. User clicks "Active" chip → `statusFilter` state sets to `'Active'` → both Group and Individual lists re-render filtered
2. User clicks "Active" chip again → `statusFilter` resets to `'All'` → full lists re-render
3. User clicks "Inactive" chip → `statusFilter` sets to `'Inactive'`
4. Chips are mutually exclusive — selecting one clears the other

### 8.3 Sticky Header Scroll Behaviour

The sticky header (KPI cards + page title) has `position: sticky; top: -1px` and a bottom border with box-shadow. Content in the Group Clients and Individual Clients zones scrolls under the sticky header. The header does not collapse or transform on scroll (no shrink animation).

### 8.4 Loading State (per section)

Each of the three data-fetch results (KPI, companies, policies) renders independently:
- While `kpiRes` is pending: KPI cards show skeleton placeholders (grey animated rectangles of appropriate size)
- While `companiesRes` or `policiesRes` is pending: Each section (Group, Individual) shows a skeleton list (3–4 skeleton rows of group/company card shape)
- Sections do not block each other — they render as soon as their respective API call resolves

### 8.5 Error State (per section)

If an individual API call fails:
- The affected section renders an inline error state:
  - An error icon
  - A short message: "Failed to load — [Retry]"
  - Clicking "Retry" re-fires only the failing API call
- Other sections that loaded successfully are unaffected

### 8.6 Empty State

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     [Search icon]                            │
│              No results found                                │
│        Try adjusting your search or filters                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Shown when:
- Both Group and Individual sections have zero visible rows after filter is applied, OR
- No data at all from API (both sections empty)

The empty state renders in the main content area below the sticky header.

---

## 9. Implementation Assumptions

1. **Frontend grouping only — no backend hierarchy call:** The `portfolio_companies` report returns flat rows with a `groupId` field. The frontend groups them client-side using a `reduce` keyed by `groupId`. Groups where `groupId` is null go to the Individual Clients section. No second API call is made for hierarchy.

2. **Policies loaded upfront — no lazy-load per company:** The `portfolio_policies` report loads all policies across all companies in one call on page mount. When a company row is expanded, its policies are filtered from the already-loaded `policies` state by `companyId`. This means the first page load may be heavier but subsequent expand interactions are instant.

3. **No ICR chart on portfolio page:** The ICR bar widget visible on the Group Clients section in the current `HRPortalPortfolio` component (showing ICR % with a coloured bar) is scoped to the *group company policy row* level. ICR data is sourced from the `portfolio_policies` report response. If `icr` is not a field available from the report framework at this stage, the ICR column can be omitted until a dedicated `portfolio_icr` report is added. Do not block the portfolio release on ICR.

4. **Policy name derivation:** The full policy type name (e.g., "Group Medical Cover") is derived from the `policyTypeName` field returned by the API (sourced from `lookup_data.lookup_value`). The frontend also maintains a local fallback map `{ GMC: 'Group Medical Cover', GTL: 'Group Term Life', GPA: 'Group Personal Accident', GPC: 'Group Personal Cover' }` for cases where the API field is null.

5. **Company navigation — Dashboard param support required:** The Dashboard page at `/hr-portal/dashboard` must be updated to read the `?companyId` query parameter on mount and pre-scope its data fetch to that company. This is a Dashboard-side change, not a Portfolio-side change. The Portfolio team must coordinate with the Dashboard team.

6. **Policy status mapping:** The API returns raw DB status values (`ACTIVE`, `RENEWAL_DUE`, `EXPIRED`). The frontend must map these to display labels:

   | DB value | Display label |
   |---|---|
   | `ACTIVE` | Active |
   | `RENEWAL_DUE` | Renewal Due |
   | `EXPIRED` | Expired |

7. **Group logo and colour:** `groupLogo` (2-letter initials) and `groupLogoColor` (hex) are stored as data fields in the `client_group` table. If these fields are missing for a group, the frontend derives initials from the first two letters of `groupName` and falls back to a neutral colour (`#64748B`).

8. **No search bar on Portfolio page:** Global search (in the top nav bar) is the mechanism for searching companies. There is no local search input on the Portfolio page itself.

9. **`data.ts` deletion:** The current hardcoded mock file at `apps/ui/ibp/src/app/pages/HRPortalPortfolio/data.ts` must be deleted after live API wiring is complete and verified in dev. It should not be retained as a fallback.

---

## 10. Data Contracts and Null Handling

| Field | Source | Null treatment |
|---|---|---|
| `groupLogo` | `portfolio_companies.groupLogo` | Derive 2-letter initials from `groupName`; never blank |
| `groupLogoColor` | `portfolio_companies.groupLogoColor` | Fall back to `#64748B` |
| `rmName` | `portfolio_companies.rmName` | Display "Unassigned" — never blank or "null" |
| `premiumAmount` | `portfolio_policies.premiumAmount` | Display "—" |
| `endDate` | `portfolio_policies.endDate` | Display "—" |
| `policyNumber` | `portfolio_policies.policyNumber` | Display "—" |
| `insurerName` | `portfolio_policies.insurerName` | Display "—" |
| `employeeCount` | `portfolio_companies.employeeCount` | Display 0 |
| `industry` | `portfolio_companies.industry` | Display "—" if null |
| `city`, `state` | `portfolio_companies.city/state` | Omit null part; display "—" if both null |
| `policyTypeName` | `portfolio_policies.policyTypeName` | Fall back to local map using `policyTypeCode` |
| All currency amounts | — | Displayed in ₹; zero shown as "₹0", not blank |

---

# END OF SDS
