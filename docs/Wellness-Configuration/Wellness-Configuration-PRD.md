# Wellness Configuration — Product Requirements Document

**Module:** Wellness Configuration (new tab on "Configure IBP Portal")
**Product:** Insurance Wellness Hub — iWork (admin) → IBP (employee portal)
**Created on:** 2026-07-28
**Status:** Draft — pending open questions (see Section 9)

---

## 1. Overview

Today, the "Wellness Hub" shown on the IBP employee dashboard (Health assessment, Benefits from your organisation, Explore by need, Explore more programmes) is **hardcoded** — every company/domain sees identical, mocked content, and there is no way for an ops user to change it without a code change.

This feature adds a **"Wellness Configuration"** tab to the existing **Configure IBP Portal** screen in iWork (alongside Company Configuration, Policy Configuration, Upload Policy Feature Document, Additional Documents), scoped **per domain** exactly like its sibling tabs. An iWork user fills in a form (thumbnail, heading, subheading, tags, links) for each wellness card, sees a **live card preview** rendered next to the form as they type, and saves. The saved JSON — one blob per section, per domain — flows through the same **Draft → Under Review → Active** approval flow already used by the other tabs, and once Active, IBP renders the real Wellness Hub from that JSON instead of the mock data.

| | Wellness Configuration |
|---|---|
| Where | New tab inside iWork's existing "Configure IBP Portal" screen |
| Scope | Per domain (same sub-tabs: teamleasemidland, teamleaseoriental, ...) |
| Sections | 4 fixed: Health Assessment, Benefits from our Organisation, Explore by Need, Explore More Programmes |
| Cards per section | Fixed for Health Assessment (chrome only) and Explore by Need (4 fixed tiles); variable, admin-managed list for Benefits and Explore Programmes |
| Storage | New jsonb column on the existing per-domain config detail row |
| Approval | Same Draft → Under Review → Active lifecycle as Company/Policy/Dashboard Configuration |
| Consumer | IBP employee dashboard, reading the **Active** config only |

---

## 2. Scope

**In scope (v1):**
- New "Wellness Configuration" tab in iWork's Configure IBP Portal screen, using the same domain sub-tab header and Draft/Submit-for-Approval chrome as the existing tabs.
- Four fixed sections (A/B/C/D below), each with a **form on the left, live card preview on the right**.
- Skeleton/placeholder card shown by default in the preview pane before any field is filled; preview updates live as the admin types/uploads.
- Per-card fields: thumbnail upload, heading, subheading, tags (chips), and a link (direct URL or SSO-vendor redirect — see open question in §9).
- Add / remove / reorder cards within Benefits (Section B) and Explore More Programmes (Section D).
- Save as Draft; Submit for Approval; approve/reject reuses the existing config-company workflow (no new approval UI).
- IBP Wellness Hub renders Sections B, C, D entirely from the Active JSON, replacing `mockData.ts`. Section A renders its live per-user data (score, report count, activity) overlaid with the admin-configured chrome (label + CTA) — see §5.
- Thumbnail upload reuses the existing generic file-upload flow already used by "Upload Policy Feature Document."

**Deferred (later phase):**
- Admin-defined new sections, or new field types beyond what's listed here (full dynamic form-builder).
- Per-employee-segment targeting within a domain (one config per domain only, v1).
- Multi-language card content.
- Section A's underlying live-data source/API itself (assumed to already exist or be built separately — this feature only adds the config chrome and the merge point).
- Independent approval of individual sections (the whole domain config — company/policy/dashboard/wellness — approves as one unit, matching current behavior).

---

## 3. Screen Design Reference

### 3.1 iWork — Wellness Configuration tab

Follows the **Configure IBP Portal** pattern already on screen: domain sub-tabs at the top (status chip per domain: Draft/Under Review/Active/Rejected), then the new "Wellness Configuration" tab body below.

Inside the tab, sections are stacked (or sub-tabbed — see open question §9.4), each with a **two-pane layout**:

```
┌───────────────────────────────┬──────────────────────────────┐
│  FORM (left)                   │  LIVE PREVIEW (right)         │
│                                 │                                │
│  Card 1  [Edit] [Delete] [↕]   │  ┌──────────────────────────┐  │
│   Thumbnail: [Upload]          │  │  [thumbnail]              │  │
│   Heading:   [___________]     │  │  Heading text              │  │
│   Subheading:[___________]     │  │  Subheading text            │  │
│   Tags:      [+ tag] [+ tag]   │  │  [tag] [tag]                │  │
│   Link type: (Direct / SSO)    │  │  [View benefit >]          │  │
│   URL / Vendor: [___________]  │  └──────────────────────────┘  │
│                                 │                                │
│  [+ Add card]                   │  (skeleton shown here until   │
│                                 │   fields are filled)          │
└───────────────────────────────┴──────────────────────────────┘
```

Before any field is filled, the right pane shows a **skeleton card** (grey placeholder blocks in the same layout) so the admin always sees exactly where their input will land.

### 3.2 Sections (fixed, in this order)

| Key | Label in iWork | Card list type | Fields |
|---|---|---|---|
| A | Health Assessment | Fixed (up to 3 tiles: Health assessment, Health check-up, Your wellness activity) | Heading, subheading, link — **no thumbnail/tags** (see §5) |
| B | Benefits from our Organisation | Variable, admin-managed | Thumbnail, heading, subheading, tags, link |
| C | Explore by Need | Fixed (4 tiles: Health assessments, Diet & healthy habits, Consultations, Fitness & movement) | Heading, subheading, link — **no thumbnail** (icon/color is fixed per tile, not admin-editable) |
| D | Explore More Programmes | Variable, admin-managed | Thumbnail, heading, subheading, tags, link |

### 3.3 Field specification (Benefits/Programmes — the full field set)

| Field | Input type | Notes |
|---|---|---|
| Thumbnail | Image upload (drag/drop or browse) | Stored via existing file-upload service; preview shows the uploaded image immediately |
| Heading | Single-line text | Card title, e.g. "Full body health profile"; suggested max 60 characters |
| Subheading | Multi-line text area | Card description, e.g. "Blood test at home covering key preventive health parameters."; suggested max 150 characters |
| Tags | Repeatable chip input | Rendered as grey chips on the card, e.g. "10 sessions", "30% subsidised" |
| Link | Direct URL, or SSO-vendor redirect | See open question §9.2 — determines whether this is one text field or a type toggle + two sub-fields |

Health Assessment (A) and Explore by Need (C) use the same field set **minus Thumbnail and Tags** (no photo/chips in the current visual design for those two sections).

### 3.4 Card management (Sections B & D)

- "+ Add card" appends a new card with a skeleton preview.
- Each existing card has Edit / Delete / reorder (drag handle or up/down) controls.
- No fixed maximum card count in v1 (open question §9.3 if a cap is wanted).

---

## 4. User Stories

### US-WELLCFG-001 — Access Wellness Configuration tab
As an iWork user with access to Configure IBP Portal,
I want a "Wellness Configuration" tab alongside the existing Company/Policy/Dashboard tabs, scoped to the domain I'm currently viewing,
so that I can configure wellness content per company domain the same way I already configure everything else.

### US-WELLCFG-002 — Fill a card and see it live
As an iWork user configuring the Benefits or Explore Programmes section,
I want to upload a thumbnail, type a heading/subheading, add tags, and set a link, and see a live card preview update as I type — starting from a skeleton placeholder,
so that I know exactly what employees will see before I save.

### US-WELLCFG-003 — Manage a variable list of cards
As an iWork user,
I want to add, remove, and reorder cards within Benefits and Explore Programmes,
so that I can match however many benefits/programmes this company actually offers, in whatever order I want them shown.

### US-WELLCFG-004 — Configure the fixed Health Assessment and Explore by Need tiles
As an iWork user,
I want to edit the label/subheading/link of the fixed Health Assessment stat tiles and the fixed Explore-by-need tiles (without needing to add/remove them, since their count is fixed),
so that I can customize their copy and destination link per domain without breaking the underlying live-data or icon/color logic those tiles depend on.

### US-WELLCFG-005 — Save as Draft and submit for approval
As an iWork user,
I want to save my in-progress wellness configuration as a Draft, and later submit it for approval,
so that changes go through the same review gate as the rest of the domain's portal configuration before going live.

### US-WELLCFG-006 — Employees see the configured wellness hub
As an employee viewing the IBP dashboard,
I want to see the wellness content (benefits, programmes, explore-by-need tiles) that my company's admin actually configured for my domain — with my own real health-assessment score/reports/activity still shown accurately in Section A,
so that the content is relevant to my employer's actual offerings rather than generic placeholder content.

---

## 5. Business rules

| # | Rule |
|---|---|
| BR-001 | Wellness configuration is scoped per domain, exactly like Company/Policy/Dashboard Configuration — no cross-domain sharing unless explicitly copied by the admin. |
| BR-002 | Draft edits are never visible to employees. IBP renders only the domain's **Active** wellness config. |
| BR-003 | Submitting/approving wellness config is part of the same domain-level submission/approval action as the other tabs — there is no independent "approve wellness only" action. |
| BR-004 | Section A's numeric values (score %, report count, session count) are **never** stored in the admin-authored JSON — they are always computed live per employee at render time. The JSON only carries label/subheading/link chrome for each stat tile. |
| BR-005 | Section C's four tiles are fixed in identity (icon, gradient, category) — admin edits their copy/link only; admins cannot add a 5th tile or remove one of the 4 in v1. |
| BR-006 | Sections B and D support an unbounded, admin-ordered list of cards (no fixed count). |
| BR-007 | A card with an empty heading cannot be saved as part of a submission (draft-save may allow partial/incomplete cards; submit-for-approval should validate required fields — see open question §9.5). |

---

## 6. Out of scope / explicitly deferred

- Dynamic section/field authoring (a general form-builder engine) — v1 ships 4 fixed sections with fixed field schemas only.
- Per-segment/per-employee-group targeting.
- Localization of card content.
- Building the actual live health-data API behind Section A's scores — assumed to exist/be delivered separately.

---

## 7. Dependencies

- Existing "Configure IBP Portal" screen, domain sub-tab header, and Draft/Under-Review/Active approval workflow (iWork + `config-service`).
- Existing generic file-upload endpoint (`org-service`) for thumbnails.
- Existing per-domain config-fetch path IBP already uses (`GET /auth-config/company?subdomain=...`) — needs one additional field in its response.
- Whatever live data source currently/eventually backs Section A's actual score/report/activity numbers (today: mocked; integration point only, not built here).

---

## 8. Success criteria

- An iWork user can configure all 4 sections for a given domain, submit for approval, and — once approved — see the exact configured content (not mock data) rendering on that domain's IBP dashboard.
- The card preview shown while filling the form in iWork visually matches the card as rendered in IBP (no drift between "preview" and "production" component).
- No regression to Section A's live per-employee data — real scores/counts continue to render correctly, only wrapped in admin-configured chrome.

---

## 9. Open questions (must resolve before/while building)

1. **Section A field set** — confirmed treatment is "chrome only" (heading/subheading/link, no thumbnail/tags), values live at render time. Confirm this matches intent, or if a thumbnail/icon-per-tile is also wanted (Architecture §5).
2. **"Service organiser URL" semantics** — is this always a plain external URL, or (as the current Alyve integration suggests) an SSO vendor handshake that returns a redirect URL at click time? This determines whether the link field is a single text box or a type-toggle + vendor selector (Architecture §7).
3. **Card count cap** — should Sections B/D have a maximum number of cards, or is an unbounded admin-managed list acceptable?
4. **Tab layout for the 4 sections** — stacked on one scrollable page, or sub-tabbed within "Wellness Configuration" (mirroring how domain sub-tabs work today)?
5. **Validation on submit** — which fields are hard-required before "Submit for Approval" can be clicked (e.g. heading required, thumbnail required for B/D, link required)? Can a Draft be saved with incomplete cards?
6. **Thumbnail URL freshness** — if the file-upload service returns signed/expiring URLs, a URL cached inside the jsonb at save time could go stale by the time IBP renders it months later (Architecture §10). Needs a storage-side answer (public path vs. non-expiring proxy) before thumbnails are wired up.

---

## 10. IBP — Employee Wellness Hub (as-built)

> This section documents what actually shipped on the **employee (IBP)** side. Where it differs from the design-time plan in §5 (Section-A live-data merge) it reflects the built behavior.

### 10.1 What the employee sees
On the IBP dashboard, the Wellness Hub renders **purely from the domain's saved wellness config** (resolved by the employee's subdomain). There is no mock data in the shipped render path. Each configured section becomes a row of cards:

| Section | Card look |
|---|---|
| Health assessment (A) | Coloured tiles (soft gradient) — heading, subheading, link |
| Benefits from your organisation (B) | Image card + tags + **partner logo** in the footer + "View benefit" |
| Explore by need (C) | Coloured tiles (vivid gradient) — heading, subheading |
| Explore programmes (D) | Image card + **price / struck original** + tags + "View details" |
| Wellness Library (E) | Media card — thumbnail with **▶ play overlay** (Video/Webinar/Audio), a **format · duration** badge, a `⋯` menu, and **no "View" button** |

The page header ("Wellness Programmes" + "View all wellness options") is static chrome; the section content is all config-driven. **"View all"** links appear on Benefits / Explore programmes / Wellness Library and open the SSO wellness portal.

### 10.2 Enable / disable
The employee sees the wellness section **only when the admin's master toggle is on**. If the admin disabled it (`enabled === false`), the **entire** wellness section is hidden on the dashboard (nothing renders).

### 10.3 Per-domain
What renders is scoped to the employee's domain/subdomain — two domains of the same company can show different wellness content (the admin configures each domain tab separately).

### 10.4 Images
Card thumbnails and partner logos are the ones the admin uploaded; IBP fetches them by file id at render time (so a link never goes stale). A card with no thumbnail simply renders without an image; a card with no heading is not shown; a section with no cards is hidden.

### 10.5 Not on the employee side yet (deferred)
- The bottom **promotional banner carousel** (in the design, not configurable/rendered yet).
- **Live per-user KPI data** in the top cards (real score %, report count, scheduled activity) — v1 shows the admin-authored cards only, not per-employee live numbers.

### 10.6 IBP success criteria
- Employees see exactly the content their company's admin configured for their domain — or nothing, if wellness is disabled.
- Colours, prices, partner logos, media badges and play icons match what the admin set (and match the iWork preview).
- No cross-domain bleed.

---

## 11. iWork — as-built additions (beyond the §1–§9 design)

> The §1–§9 content above is the original 4-section design. The build shipped these **additions** on the admin side:

| Addition | What it does |
|---|---|
| **Master toggle** | A "Wellness section" enable/disable switch at the top of the tab (`enabled` flag). Off → IBP hides the whole wellness section. Does **not** lock the sub-section forms. |
| **Section E — Wellness Library** | A 5th section (image cards) with a **media type** dropdown (Video/Article/QuickBytes/Webinar/Audio) + a **duration** text field, instead of tags. |
| **Price fields** | Explore Programmes cards add **price** + **original price** (₹, struck original on IBP). |
| **Partner logo** | Benefits cards add a second **partner-logo upload**. |
| **Colour templates** | Health Assessment (A) & Explore by Need (C) tiles pick a colour by template; the save **persists the resolved values** (hex swatch + section gradient + text colour) so IBP needs no palette. A uses the soft gradient, C the vivid. |
| **Domain-correct save** | The save payload carries **`configId`** so it writes to the domain being edited (fixes save→reload prefill round-trip per domain). |
| **Prefill** | Reopening the tab pre-fills every section from the saved config (via the existing portal-config GET). A "prefill defaults from a sample JSON when empty" scaffold was added and **reverted** (the sample file remains, unwired, for a future default-GET). |

**Known open issue:** some saves return an **HTTP 502** from the backend. Wellness is stored as opaque jsonb (nothing on the server iterates it), so this is a backend crash/timeout, not the wellness payload — needs the config-service log to resolve.
