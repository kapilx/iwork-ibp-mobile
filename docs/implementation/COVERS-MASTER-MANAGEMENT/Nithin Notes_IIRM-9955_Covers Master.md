# IIRM-9955: Policy Type & Covers Master Management
## Product Requirements Document — Frontend Screen Specification

> **📋 Implementation Documents:** For the standardized module-based product specification following Daksh framework, see: [Covers Master Management Implementation Docs](../../implementation/COVERS-MASTER-MANAGEMENT/)
>
> This document contains the original detailed screen specifications and data analysis. The implementation folder contains the structured PRD, TRD, and development tasks following industry standards.

---

## Table of Contents

- [IIRM-9955: Policy Type \& Covers Master Management](#iirm-9955-policy-type--covers-master-management)
  - [Product Requirements Document — Frontend Screen Specification](#product-requirements-document--frontend-screen-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Background and Context](#1-background-and-context)
    - [1.1 What is this feature?](#11-what-is-this-feature)
    - [1.2 The Three Screens](#12-the-three-screens)
    - [1.3 Cover Type Reference](#13-cover-type-reference)
    - [1.4 Input Type Reference](#14-input-type-reference)
  - [2. Screen A — Covers Master](#2-screen-a--covers-master)
    - [2.1 Who Uses This Screen](#21-who-uses-this-screen)
    - [2.2 Covers List](#22-covers-list)
    - [2.3 Add / Edit Cover](#23-add--edit-cover)
    - [2.4 View Cover Detail](#24-view-cover-detail)
  - [3. Screen B — Policy Type vs Covers Mapping](#3-screen-b--policy-type-vs-covers-mapping)
    - [3.1 Who Uses This Screen](#31-who-uses-this-screen)
    - [3.2 Select a Policy Type](#32-select-a-policy-type)
    - [3.3 Covers List for a Policy Type](#33-covers-list-for-a-policy-type)
    - [3.4 Add a Cover to a Policy Type](#34-add-a-cover-to-a-policy-type)
    - [3.5 Edit a Cover Assignment](#35-edit-a-cover-assignment)
    - [3.6 Retire a Cover from a Policy Type](#36-retire-a-cover-from-a-policy-type)
    - [3.7 Reorder Covers](#37-reorder-covers)
    - [3.8 Manage Sections](#38-manage-sections)
  - [4. Screen C — Policy Types Master](#4-screen-c--policy-types-master)
    - [4.1 Who Uses This Screen](#41-who-uses-this-screen)
    - [4.2 Policy Types List](#42-policy-types-list)
    - [4.3 Add / Edit Policy Type](#43-add--edit-policy-type)
    - [4.4 Activate / Deactivate a Policy Type](#44-activate--deactivate-a-policy-type)
  - [5. Bulk Upload via CSV](#5-bulk-upload-via-csv)
    - [5.1 Upload Covers](#51-upload-covers)
    - [5.2 Upload Policy Type vs Covers Mapping](#52-upload-policy-type-vs-covers-mapping)
  - [6. Business Rules](#6-business-rules)
    - [6.1 Cover Rules](#61-cover-rules)
    - [6.2 Cover Assignment Rules](#62-cover-assignment-rules)
    - [6.3 Policy Type Rules](#63-policy-type-rules)
    - [6.4 Upload Rules](#64-upload-rules)
    - [6.5 Access Rules](#65-access-rules)
  - [7. Screens Summary](#7-screens-summary)
  - [9. Acceptance Criteria](#9-acceptance-criteria)
    - [9.1 Covers Master](#91-covers-master)
    - [9.2 Duplicate Cover Name Check](#92-duplicate-cover-name-check)
    - [9.3 Cover Field Configuration](#93-cover-field-configuration)
    - [9.4 Policy Type vs Covers Mapping](#94-policy-type-vs-covers-mapping)
    - [9.5 Cover Assignment Override](#95-cover-assignment-override)
    - [9.6 Sections](#96-sections)
    - [9.7 Policy Types Master](#97-policy-types-master)
    - [9.8 Effective Dates](#98-effective-dates)
    - [9.9 Bulk Upload](#99-bulk-upload)
    - [9.10 Access Control](#910-access-control)
  - [Appendix A: Data Reference](#appendix-a-data-reference)
    - [A.1 Cover Input Types in Existing Data](#a1-cover-input-types-in-existing-data)
    - [A.2 Known Data Quality Issues](#a2-known-data-quality-issues)
    - [A.3 Options — All Unique Option Sets in Current Data](#a3-options--all-unique-option-sets-in-current-data)
    - [A.4 Policy Types Summary](#a4-policy-types-summary)
    - [A.5 Top 10 Policy Types by Cover Count](#a5-top-10-policy-types-by-cover-count)
    - [A.6 Active Policy Types per Organisation](#a6-active-policy-types-per-organisation)

---

## 1. Background and Context

### 1.1 What is this feature?

When an insurance broker creates a policy for a client, they fill in a set of standard questions and fields about what the policy covers. Each of these fields is called a **Cover**.

Right now, there is no user interface to manage covers or policy types — everything is done directly in the database. This feature creates three admin screens to manage that master data through the UI.

### 1.2 The Three Screens

| Screen | What It Does |
|--------|-------------|
| **Screen A — Covers Master** | Central catalogue of all covers. Add, edit, search, and retire individual covers. Each cover defines its name, type, input type, display options, and when it is active. |
| **Screen B — Policy Type vs Covers Mapping** | Assigns covers to policy types. For a selected policy type, you can see which covers are on it, add or remove covers, configure how each cover behaves specifically for that policy type, and group covers under section headings. |
| **Screen C — Policy Types Master** | Manages the list of policy types themselves — their names, codes, owning organisation, and whether they are active. |

### 1.3 Cover Type Reference

| ID | Label in UI |
|----|------------|
| 1601 | General / Add-On |
| 1602 | Extension |
| 1603 | Deductible |
| 1604 | Technical / Valuation |
| 1605 | Other |
| 1606 | Basic Information |
| _(blank)_ | Not Categorized |

### 1.4 Input Type Reference

| Label in UI | How It Renders on Policy Form |
|------------|------------------------------|
| Multi-line Text | Large text box (default 3 rows) |
| Single-line Text | Short text field |
| Dropdown | Select from a fixed list of options |
| Number | Numeric input field |

---

## 2. Screen A — Covers Master

### 2.1 Who Uses This Screen

Access depends on the permissions assigned to the user's role. Users without the required permission will not see the corresponding button or action.

| Action | Permission Required | Behaviour when missing |
|--------|--------------------|-----------------------|
| View covers list and detail | View permission | Screen is inaccessible — user is redirected to the unauthorised page |
| Add a new cover | Create permission | "+ Add New Cover" button is not shown |
| Edit an existing cover | Edit permission | "Edit" button is not shown; the form opens in read-only mode if accessed directly |
| Retire a cover | Edit permission | "Retire" action is not shown |
| Bulk upload CSV | Create permission | "Upload CSV" button is not shown |
| Download / export | View permission | "Download" button is visible to anyone with view access |

### 2.2 Covers List

```
[ Search by name or description...  ]  [Cover Type ▼]  [Input Type ▼]  [Status ▼]  [Show Duplicates ○]  [No Config ○]

                                                  [ + Add New Cover ]  [ Upload CSV ]  [ Download ]

 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 | Cover Name              | Description      | Cover Type      | Input Type       | Eff. From  | Eff. To    | Used In | Actions  |
 |─────────────────────────|──────────────────|─────────────────|──────────────────|────────────|────────────|─────────|──────────|
 | 24 Hours Cover          | 24 Hours Cover   | General         | Single-line Text | 01 Jan 2026| —          | 3       | Edit     |
 | 50:50 Clause          ⚠ |                  | Not Categorized | Multi-line Text  | 01 Jan 2026| 31 Mar 2026| 1       | Edit     |
 | Accidental Damage       | Accidental Damage| Extension       | Dropdown         | 15 Feb 2026| —          | 12      | Edit     |
 | Deductible - ROW        | ...              | Deductible      | Number           | 01 Jan 2026| —          | 5       | Edit     |
 | Limit of Liability    ✗ | ...              | General         | Single-line Text | 01 Mar 2026| 01 Apr 2026| 2       | Edit     |
 ─────────────────────────────────────────────────────────────────────────────────────────────────────────

 ⚠ = cover has no cover type set     ✗ = cover has a configuration error
 Covers where today is past the Effective To date are shown in a muted/strikethrough style to indicate they are retired.

 Showing 1–50 of 3,788 covers                     [ < 1  2  3 ... 76 > ]    Rows per page: [50 ▼]
```

**Columns:**

| Column | Description |
|--------|------------|
| Cover Name | Clickable — opens the cover detail view. Warning icon shown if no cover type is set. Error icon if the cover has a configuration error. |
| Description | Truncated; full text visible on hover |
| Cover Type | Category of the cover. "Not Categorized" when not set. |
| Input Type | How the broker interacts with the field on the policy form |
| Eff. From | The date from which this cover is active |
| Eff. To | The date this cover expires. Blank = no expiry. Row is visually dimmed once this date has passed. |
| Used In | Number of policy types this cover appears on. "0" means it has never been assigned. |
| Actions | Edit button |

**Filters:**

- **Search** — cover name and description (free text)
- **Cover Type** — all 6 types plus "Not Categorized"
- **Input Type** — all 4 input types
- **Status** — Active (effective from date has passed and no expiry set or expiry is in future), Upcoming (effective from date is in the future), Retired (expiry date has passed), All
- **Show Duplicates toggle** — shows only covers whose name appears more than once
- **No Config toggle** — shows only covers that have no field configuration set (643 covers from early data)

### 2.3 Add / Edit Cover

Shown as a side panel.

```
┌────────────────────────────────────────────────────┐
│  Add Cover                                          │
├────────────────────────────────────────────────────┤
│                                                     │
│  BASIC INFORMATION                                 │
│  Cover Name *    [ Accidental Damage          ]    │
│  Description     [ Cover for accidental...   ]    │
│  Cover Type *    [ Extension              ▼  ]    │
│                                                     │
│  ⚠  A cover with this name already exists:        │
│  ┌──────────────────────────────────────────────┐  │
│  │ Accidental Damage          ID: 482           │  │
│  │ Type: Extension  ·  Input: Dropdown          │  │
│  │ Options: Yes / No                            │  │
│  │ Used in: 12 policy types                     │  │
│  │ Status: Active (from 01 Jan 2026)            │  │
│  │                                              │  │
│  │ [ View & Re-use This Cover ]  [ Add New Anyway ] │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  EFFECTIVE DATES                                   │
│  Effective From *  [ 18 Mar 2026          📅 ]    │
│                    (defaults to today's date)       │
│  Effective To      [ ──────────────────── 📅 ]    │
│                    Leave blank = no expiry          │
│                                                     │
│  FIELD CONFIGURATION                               │
│  Input Type *    [ Dropdown               ▼  ]    │
│  Field Label *   [ Accidental Damage          ]    │
│                  (label shown on the policy form)   │
│  Required?       [ ● Required   ○ Optional   ]    │
│  Layout Width    [ Full Width              ▼  ]    │
│                                                     │
│  ── Only when Input Type = Dropdown ──             │
│  Options *       [ Yes    ] [×]                    │
│                  [ No     ] [×]                    │
│                  [ + Add Option ]                  │
│                                                     │
│  ── Only when Input Type = Multi-line Text ──      │
│  Hint Options    [ Market Value           ] [×]    │
│  (optional)      [ Reinstatement          ] [×]    │
│                  [ + Add Hint ]                    │
│                                                     │
│  Visible Rows    [ 3 ]                             │
│                                                     │
│  [ Save ]                         [ Cancel ]       │
└────────────────────────────────────────────────────┘
```

**Duplicate name detection — how it works:**

- Triggered **on blur** from the Cover Name field (not on every keystroke)
- If a cover with the same name already exists, an inline warning panel appears below the Cover Name field
- The panel shows, for each matching cover: name, cover type, input type, options (if dropdown), number of policy types it is used in, and active or retired status
- If more than 3 matches exist, the first 3 are shown with a "Show all N matches" link
- **The Save button is disabled** until the user explicitly clicks one of the two action buttons:

| Button | What Happens |
|--------|-------------|
| **View & Re-use This Cover** | The Add form closes. The existing cover's detail view opens. The user can add it to a policy type from there. |
| **Add New Anyway** | The warning panel is dismissed. Save is re-enabled. The user proceeds to create a new cover with the same name. |

- If the user clears the name field and types a unique name, the warning panel disappears automatically

**Validation on Save:**

| Rule | Message |
|------|---------|
| Cover Name is blank | "Cover Name is required" |
| Cover Type is not selected | "Cover Type is required" |
| Effective From is blank | "Effective From is required" |
| Effective To is set and is before Effective From | "Effective To must be after Effective From" |
| Input Type is not selected | "Input Type is required" |
| Dropdown with fewer than 2 options | "At least 2 options are required for a dropdown" |
| Cover Name matches an existing cover and user has not yet responded to the duplicate warning | Save button stays disabled — user must act on the warning first |

**Options and Hints — when they appear:**

The form shows different controls depending on the selected Input Type:

- **Dropdown** — an "Options" section appears where the user manages the list of selectable choices. Minimum 2 options required. Each option is a display label. Duplicate or blank labels are not allowed.
- **Multi-line Text** — a "Hint Options" section appears (optional). These are common values shown to the broker as quick-fill suggestions. The field remains free text — hints do not restrict what the broker types.
- **Single-line Text / Number** — no options or hints section is shown.

When the user switches input type away from Dropdown, a warning appears: "Existing options will be kept as hint options." The options are not deleted — they become hints instead.

**Layout Width:**

| Choice | How It Renders on the Policy Form |
|--------|----------------------------------|
| Full Width | Cover spans the full row |
| Half Width | Cover takes up half the row (two covers sit side by side) |

### 2.4 View Cover Detail

A read-only panel showing all cover fields plus a table of every policy type this cover is currently assigned to:

```
Used in 12 Policy Types
──────────────────────────────────────────────────────
| Policy Type          | Org | Display Sequence | Required |
|----------------------|-----|-----------------|----------|
| Group Mediclaim Policy |  1  |       6         |    Yes   |
| IAR                  |  1  |      48         |    Yes   |
| Marine Open Cover    |  1  |      22         |    No    |
──────────────────────────────────────────────────────
```

Also shows: Created by / at, Updated by / at.

---

## 3. Screen B — Policy Type vs Covers Mapping

### 3.1 Who Uses This Screen

Access depends on the permissions assigned to the user's role.

| Action | Permission Required | Behaviour when missing |
|--------|--------------------|-----------------------|
| View covers assigned to a policy type | View permission | Screen is inaccessible |
| Add a cover to a policy type | Create permission | "+ Add Cover" and "+ Add Section" buttons are not shown |
| Edit a cover's settings for a policy type | Edit permission | "Edit" button is not shown |
| Retire a cover from a policy type | Edit permission | "Retire" action is not shown |
| Reactivate a retired cover | Edit permission | "Reactivate" action is not shown |
| Reorder covers | Edit permission | "Reorder Mode" toggle is not shown |
| Manage sections | Edit permission | "Manage Sections" and "+ Add Section" buttons are not shown |
| Bulk upload CSV | Create permission | "Upload CSV" button is not shown |
| Download / export | View permission | Visible to anyone with view access |

> **Organisation scope:** The organisation selector appears only when the user has access to more than one organisation. Users with single-organisation access see their organisation's policy types directly — the selector is not shown.

### 3.2 Select a Policy Type

```
Policy Type vs Covers Mapping

  Organisation:  [ Org 1 ▼ ]     Policy Type:  [ Search by name or code... ▼ ]     [ Load ]
```

- Selecting an organisation filters the policy type list to that organisation's types only
- The policy type list shows: `Code | Display Name (N covers)` — for example: `GMC | Group Mediclaim Policy (82 covers)`
- Policy types that are currently inactive are shown in the list but greyed out with a label "(Inactive)"
- Policy types that have no covers assigned yet are shown with a label "(No covers set up)" in amber
- A **"No Covers Set Up" toggle** shows only the policy types that have no covers assigned — useful for bulk setup

> **Why the code is shown alongside the name:** Many policy type display names are not unique across the system. Showing the code alongside the name is the only way to distinguish between them reliably.

### 3.3 Covers List for a Policy Type

After selecting a policy type:

```
Policy Type vs Covers Mapping: [Policy Type Name]  (Org 1 · 82 covers)

  [ + Add Cover ]   [ + Add Section ]   [ Manage Sections ]   [ Upload CSV ]   [ Download ]   [ Reorder Mode: OFF ○ ]

 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 | Seq | Cover Name             | Type    | Input            | Required | Eff. From  | Eff. To    | Config  | Actions     |
 |─────|────────────────────────|─────────|──────────────────|──────────|────────────|────────────|─────────|─────────────|
 |     | ▶ SECTION: Basic Details                                                                                          |
 |  1  | Name of the Insured    |         | Single-line Text  |  ● Yes   | 01 Jan 2026| —          | Default | Edit Retire |
 |  2  | Nature of Packing      |         | Multi-line Text   |  ● Yes   | 01 Jan 2026| —          | Default | Edit Retire |
 |     | ▶ SECTION: Fire Perils                                                                                            |
 | 13  | 1. Fire, including...  |         | Single-line Text  |  ● Yes   | 01 Jan 2026| —          | Default | Edit Retire |
 | 14  | 2. Explosion...        |         | Single-line Text  |  ● Yes   | 01 Jan 2026| —          | Default | Edit Retire |
 |     | ▶ (No Section)                                                                                                    |
 | 26  | Additions, alterations |         | Single-line Text  |  ○ No    | 01 Jan 2026| —          | Default | Edit Retire |
 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 Config = "Default" means the cover's settings are used exactly as defined in the Covers Master
 Config = "Custom ⚠" means this policy type has its own settings for this cover (different from master)
 Retired rows (today is past the Effective To date) are shown dimmed. The action button changes to "Reactivate" for those rows.
 Section heading rows span the full width and are visually distinct (bold, shaded background).
 Covers not assigned to any section appear under a "(No Section)" group.
```

**When Reorder Mode is ON:** drag handles appear on each row, and a "Save Order" button appears. Saving updates all display sequence positions at once.

### 3.4 Add a Cover to a Policy Type

This is a two-step process.

**Step 1 — Find a cover from the Covers Master:**

```
Search Covers Master
────────────────────────────────────────────────────────────────
[ Search by name...                                          ]

Results:
  Accidental Damage  | Extension  | Dropdown  | Used in 12 policy types  [ Select ]
  Accidental Damage  | General    | Text      | Used in 8 policy types   [ Select ]
  Sum Insured      ✗ | General    | —         | Used in 0 policy types   [ Configure First → ]
```

- Covers that have no field configuration are shown in results but the **"Select"** button is replaced with a **"Configure First →"** link.
- Clicking "Configure First →" navigates the user to the Edit Cover form for that cover in the Covers Master, so they can complete the field configuration.
- The cover cannot be selected for assignment until its configuration is complete. There is no way to bypass this block.

**Step 2 — Configure how this cover appears on this policy type:**

```
Configure Cover: Accidental Damage

  Display Sequence  [ 7  ]    (auto-suggests the next available number)
  Section           [ Fire Perils ▼ ]    (choose a section or leave as "None")

  EFFECTIVE DATES
  Effective From *  [ 18 Mar 2026          📅 ]   (defaults to today's date)
  Effective To      [ ──────────────────── 📅 ]   (leave blank = no expiry)

  FIELD SETTINGS  (pre-filled from master — change only if this policy type needs different settings)
  Input Type      [ Multi-line Text          ▼  ]
  Field Label *   [ Accidental Damage          ]
  Required?       [ ● Required   ○ Optional   ]
  Layout Width    [ Full Width              ▼  ]
  Options         [ Yes  ] [×]
                  [ No   ] [×]
                  [ + Add Option ]

  ℹ  These settings differ from the master cover definition.
     This policy type will store its own settings for this cover.

  [ Save ]    [ Cancel ]
```

The informational note appears only when the user has changed any setting from the master's defaults.

### 3.5 Edit a Cover Assignment

Same form as Add, pre-filled with the current settings. If the cover has been customised for this policy type (settings differ from master), a **"Reset to Master Defaults"** button is shown.

Clicking "Reset to Master Defaults" restores all field settings and options back to what the Covers Master defines.

### 3.6 Retire a Cover from a Policy Type

Covers are not deleted. Clicking "Retire" opens a confirmation prompt:

```
Retire "Accidental Damage" from [Policy Type Name]?

  Set an expiry date:   [ 31 Mar 2026  📅 ]
  After this date, this cover will no longer appear on policy forms for this policy type.

  The cover itself will remain in the Covers Master and on any other policy types it is assigned to.

[ Confirm Retire ]   [ Cancel ]
```

- The date field defaults to today.
- The cover remains visible in the list in a dimmed/strikethrough style with the expiry date shown.
- The action button for a retired cover changes to **Reactivate**, which clears the expiry date and makes the cover active again.

### 3.7 Reorder Covers

When **Reorder Mode** is toggled ON:

- Drag handles appear on every cover row
- Covers can be dragged up or down within their section, or moved to a different section
- A "Save Order" button appears in the toolbar
- Saving commits all new sequence positions at once
- Reorder Mode can be cancelled (reverts to the last saved order)

### 3.8 Manage Sections

Sections are named headings that group related covers together on the policy form. For example, a Marine policy type might have "Basic Details", "Fire Perils", "Burglary Extensions", and "Money Insurance" as its sections.

**Where sections are managed:** A "Manage Sections" panel, accessed from the toolbar on the Policy Type vs Covers Mapping screen for a specific policy type.

**Manage Sections Panel:**

```
Sections for: [Policy Type Name]

  [ + Add Section ]

  ─────────────────────────────────────────────────────────────
  | Order | Section Name             | Covers | Actions        |
  |-------|--------------------------|--------|----------------|
  |  1    | Basic Details            |  12    | Edit  Delete   |
  |  2    | Fire Perils              |  13    | Edit  Delete   |
  |  3    | Burglary Extensions      |   7    | Edit  Delete   |
  |  4    | Additional Extensions    |   8    | Edit  Delete   |
  |  5    | Optional Add-ons         |  12    | Edit  Delete   |
  |  6    | Other Terms & Covers     |   2    | Edit  Delete   |
  |  7    | All Risks                |   6    | Edit  Delete   |
  |  8    | Money Insurance          |   8    | Edit  Delete   |
  ─────────────────────────────────────────────────────────────

  [ Close ]
```

- The **Covers** column shows how many covers are currently assigned to each section.
- **Delete** is blocked if the section has any covers assigned — the button is greyed out with a tooltip: "Remove all covers from this section before deleting."
- The display order can be changed by drag-and-drop or reorder arrows.

**Add / Edit Section:**

```
┌──────────────────────────────────────────┐
│  Add Section                              │
├──────────────────────────────────────────┤
│  Section Name *  [ Fire Perils         ] │
│  Display Order   [ 2                   ] │
│                                           │
│  [ Save ]                  [ Cancel ]    │
└──────────────────────────────────────────┘
```

| Validation Rule | Message |
|----------------|---------|
| Section Name is blank | "Section Name is required" |
| Section Name already exists for this policy type | "A section with this name already exists" |
| Display Order is not a number | "Display Order must be a number" |

**How sections appear in the covers list:**

When sections are defined, the covers list renders section heading rows inline, above the covers that belong to them:

```
 | Seq | Cover Name             | ...  | Actions      |
 |─────|─────────────────────────────────────────────|
 |     | ▶  BASIC DETAILS  (12 covers)               |  ← section heading (spans columns, shaded)
 |  1  | Name of the Insured    | ...  | Edit Retire  |
 |  2  | Communication Address  | ...  | Edit Retire  |
 |     | ▶  FIRE PERILS  (13 covers)                 |
 | 13  | 1. Fire, including...  | ...  | Edit Retire  |
 | 14  | 2. Explosion...        | ...  | Edit Retire  |
 |     | ▶  (No Section)                             |  ← covers not assigned to any section
 | 26  | Additions, alterations | ...  | Edit Retire  |
```

Section heading rows:

- Span all columns
- Visually distinct: bold text, light shaded background
- Show a pencil icon to edit the section name inline
- Show the cover count: "FIRE PERILS (13 covers)"

---

## 4. Screen C — Policy Types Master

### 4.1 Who Uses This Screen

Access depends on the permissions assigned to the user's role.

| Action | Permission Required | Behaviour when missing |
|--------|--------------------|-----------------------|
| View policy types list | View permission | Screen is inaccessible |
| Add a new policy type | Create permission | "+ Add Policy Type" button is not shown |
| Edit an existing policy type | Edit permission | "Edit" button is not shown |
| Activate / Deactivate a policy type | Edit permission | Status toggle is not shown |

> **Organisation scope:** Users with access to a single organisation see only that organisation's policy types. The organisation selector appears only for users with cross-organisation access.

### 4.2 Policy Types List

```
[ Search by name or code...  ]  [Organisation ▼]  [Status ▼]

                                               [ + Add Policy Type ]  [ Download ]

 ──────────────────────────────────────────────────────────────────────────────────────────────────────
 | Policy Type Name                     | Code               | Org | Covers | Eff. From  | Eff. To    | Status   | Actions         |
 |──────────────────────────────────────|────────────────────|─────|────────|────────────|────────────|──────────|─────────────────|
 | Group Mediclaim Policy               | GMC                |  1  |  82    | 01 Jan 2020| —          | Active   | Edit Deactivate |
 | Individual Accident Insurance        | IAR                |  1  | 188    | 01 Jan 2020| —          | Active   | Edit Deactivate |
 | Marine Open Cover Insurance          | MARINE_OPEN_COVER  |  1  |  82    | 01 Jan 2020| 31 Dec 2025| Inactive | Edit Activate   |
 | Burglary Insurance                   | BURGLARY_INSURANCE |  5  |   0    | 01 Mar 2026| —          | Active   | Edit Deactivate |
 ──────────────────────────────────────────────────────────────────────────────────────────────────────

 Showing 1–50 of 498 policy types                  [ < 1  2  3 ... 10 > ]    Rows per page: [50 ▼]
```

**Columns:**

| Column | Description |
|--------|------------|
| Policy Type Name | Display name. Clickable — opens the edit form. |
| Code | Short identifier (e.g. GMC, IAR). The same code may exist for different organisations. |
| Org | The organisation this policy type belongs to |
| Covers | Number of covers currently assigned to this policy type |
| Eff. From | The date from which this policy type is active |
| Eff. To | The date this policy type expires. Blank = no expiry. |
| Status | Active or Inactive |
| Actions | Edit, and either Activate or Deactivate depending on current status |

**Filters:**

- **Search** — policy type name and code (free text)
- **Organisation** — visible only to users with cross-organisation access
- **Status** — Active, Inactive, All

### 4.3 Add / Edit Policy Type

Shown as a side panel or modal.

```
┌──────────────────────────────────────────────────┐
│  Add Policy Type                                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  Policy Type Name *  [ Group Mediclaim Policy ] │
│  Code *              [ GMC                    ] │
│                      (short identifier, e.g. GMC) │
│  Organisation *      [ Org 1              ▼   ] │
│                                                   │
│  EFFECTIVE DATES                                 │
│  Effective From *  [ 18 Mar 2026        📅    ] │
│                    (defaults to today's date)     │
│  Effective To      [ ──────────────────  📅   ] │
│                    Leave blank = no expiry        │
│                                                   │
│  Status            [ ● Active  ○ Inactive     ] │
│                                                   │
│  [ Save ]                       [ Cancel ]       │
└──────────────────────────────────────────────────┘
```

**Validation on Save:**

| Rule | Message |
|------|---------|
| Policy Type Name is blank | "Policy Type Name is required" |
| Code is blank | "Code is required" |
| Code already exists for the same organisation | "A policy type with this code already exists for this organisation" |
| Organisation is not selected | "Organisation is required" |
| Effective From is blank | "Effective From is required" |
| Effective To is set and is before Effective From | "Effective To must be after Effective From" |

### 4.4 Activate / Deactivate a Policy Type

- **Deactivate** sets the policy type to Inactive. If an Effective To date is set, cover assignments for this policy type stop appearing on policy forms after that date. The policy type and all its cover assignments are retained — nothing is deleted.
- **Activate** sets the policy type back to Active. Clears the Effective To date if the user chooses to reactivate without an expiry.

A confirmation prompt is shown before the status change is applied:

```
Deactivate "Group Mediclaim Policy"?

  This policy type will no longer appear when creating new policies.
  Existing policies of this type are not affected.

  [ Confirm Deactivate ]   [ Cancel ]
```

---

## 5. Bulk Upload via CSV

### 5.1 Upload Covers

Accessible from the "Upload CSV" button on the Covers Master list.

**CSV Format:**

| Column | Required | Valid Values | Description |
|--------|----------|-------------|-------------|
| `cover_name` | Yes | Max 200 characters | The name of the cover |
| `description` | No | Free text | A description of the cover |
| `cover_type` | Yes | 1601, 1602, 1603, 1604, 1605, 1606 | The cover category. See Section 1.3 for labels. |
| `effective_from` | Yes | Date: YYYY-MM-DD | The date this cover becomes active |
| `effective_to` | No | Date: YYYY-MM-DD or blank | The date this cover expires. Leave blank = no expiry. |
| `input_type` | Yes | `text`, `textarea`, `dropdown`, `number` | How the broker interacts with the field. Drives which other columns apply. |
| `field_label` | No | Free text — defaults to `cover_name` if blank | The label shown on the policy form above this field |
| `required` | No | `Yes` or `No` — defaults to `Yes` | Whether the broker must fill this field in |
| `layout_width` | No | `full` or `half` — defaults to `full` | How wide the field appears on the policy form |
| `dropdown_options` | Required when `input_type=dropdown` | Pipe-separated labels: `Yes\|No` | The selectable choices for a dropdown field |
| `hint_options` | Optional — only for `input_type=textarea` | Pipe-separated: `Market Value\|Reinstatement` | Quick-fill suggestions shown to the broker. The field remains free text. |
| `visible_rows` | No — only for `input_type=textarea` | Integer 1–10, defaults to 3 | How many rows the multi-line text box displays by default |

**Upload Screen:**

```
Upload Covers
────────────────────
  [ Download CSV Template ]

  [ Choose File ]   [ Upload & Validate ]

After validation:
  ✓ 50 rows — will be created
  ⚠  1 warning — cover name already exists (will still be created)
  ✗  1 error — cover_type missing (will be skipped)

  [ Download Error Report ]    [ Confirm — Create 51 Covers ]    [ Cancel ]
```

**Validation rules:**

| Rule | Result |
|------|--------|
| `cover_name` is blank | Error — row is skipped |
| `cover_type` is blank or not one of 1601–1606 | Error — row is skipped |
| `effective_from` is blank or not a valid date | Error — row is skipped |
| `effective_to` is present but not a valid date | Error — row is skipped |
| `effective_to` is earlier than or equal to `effective_from` | Error — row is skipped |
| `input_type` is blank or not a valid value | Error — row is skipped |
| `input_type=dropdown` and `dropdown_options` is blank | Error — row is skipped |
| `dropdown_options` has fewer than 2 pipe-separated values | Error — row is skipped |
| Duplicate option labels within the same `dropdown_options` cell | Error — row is skipped |
| `visible_rows` is present but not an integer between 1 and 10 | Error — row is skipped |
| `hint_options` is present on a non-textarea row | Warning — column is ignored, row is still created |
| `dropdown_options` is present on a non-dropdown row | Warning — column is ignored, row is still created |
| `cover_name` already exists in the Covers Master | Warning — shown in the preview with the matching cover's name, type, and number of policy types it is assigned to. Row is still created on confirm. User must review all warnings before confirming. |

### 5.2 Upload Policy Type vs Covers Mapping

Accessible from the "Upload CSV" button on the Policy Type vs Covers Mapping page, with a policy type already selected.

**CSV Format:**

| Column | Required | Valid Values | Description |
|--------|----------|-------------|-------------|
| `cover_name` | Yes | Must exactly match the name of a cover in the Covers Master | Identifies which cover to assign |
| `display_sequence` | Yes | Positive integer | The order in which this cover appears on the policy form |
| `required` | Yes | `Yes` or `No` | Whether the broker must fill this field in for this policy type |
| `effective_from` | Yes | Date: YYYY-MM-DD | The date this cover becomes active on this policy type |
| `effective_to` | No | Date: YYYY-MM-DD or blank | The date this cover expires on this policy type. Leave blank = no expiry. |
| `cover_type` | Yes | 1601–1606 | The cover category |
| `input_type` | Yes | `text`, `textarea`, `dropdown`, `number` | How the broker interacts with the field. If this differs from the Covers Master definition, this policy type will store its own settings. |
| `field_label` | No | Free text — defaults to the master's label | The label shown on the policy form, for this policy type only |
| `layout_width` | No | `full` or `half` — defaults to the master's setting | How wide the field appears, for this policy type only |
| `dropdown_options` | Required when `input_type=dropdown` | Pipe-separated labels: `Yes\|No` | The selectable choices, for this policy type only |
| `hint_options` | Optional — only for `input_type=textarea` | Pipe-separated: `Market Value\|Reinstatement` | Quick-fill suggestions, for this policy type only |
| `visible_rows` | No — only for `input_type=textarea` | Integer 1–10 — defaults to the master's setting | How many rows the text box displays, for this policy type only |
| `display_category` | No | `Basic`, `Asset`, or blank | An optional grouping category for this cover on the policy form |
| `section` | No | Exact section name as defined for this policy type, or blank | Assigns the cover to a named section heading. Blank = ungrouped. Name match is case-insensitive. |

> **Note on overrides:** If any field settings differ from the Covers Master definition, this policy type will store its own settings for this cover. The list will show "Custom ⚠" in the Config column.

**Upload Screen:**

```
Upload Mapping
for: [Policy Type Name]   (Org 1)
──────────────────────────────────────────────────────
  [ Download Current Covers for This Policy Type ]
  [ Download CSV Template ]

  [ Choose File ]   [ Upload & Validate ]

After validation:
  ✓ 82 rows valid
  ⚠  1 update — cover already assigned to this policy type, will be updated
  ✗  1 error — cover name not found in Covers Master

  [ Download Error Report ]   [ Confirm — Apply 83 Assignments ]   [ Cancel ]
```

**Validation rules:**

| Rule | Result |
|------|--------|
| `cover_name` does not match any cover in the Covers Master | Error — row is skipped |
| `display_sequence` is blank or not a positive integer | Error — row is skipped |
| `required` is not `Yes` or `No` | Error — row is skipped |
| `effective_from` is blank or not a valid date | Error — row is skipped |
| `effective_to` is present but not a valid date | Error — row is skipped |
| `effective_to` is earlier than or equal to `effective_from` | Error — row is skipped |
| `cover_type` is blank or not one of 1601–1606 | Error — row is skipped |
| `input_type` is blank or not a valid value | Error — row is skipped |
| `input_type=dropdown` and `dropdown_options` is blank | Error — row is skipped |
| `dropdown_options` has fewer than 2 pipe-separated values | Error — row is skipped |
| Duplicate `display_sequence` values within the same file | Error — the second occurrence is skipped |
| `visible_rows` is present but not an integer between 1 and 10 | Error — row is skipped |
| `hint_options` is present on a non-textarea row | Warning — column is ignored, row is still applied |
| `dropdown_options` is present on a non-dropdown row | Warning — column is ignored, row is still applied |
| Cover is already assigned to this policy type | Warning — treated as an update |
| `section` value does not match any section defined for this policy type | Error — row is skipped |

---

## 6. Business Rules

### 6.1 Cover Rules

1. Cover Name is required.
2. Cover Type is required.
3. **Duplicate name handling:** When the user moves focus away from the Cover Name field, if a cover with the same name already exists, an inline warning panel appears inside the form showing the details of the matching cover(s). Save is blocked until the user explicitly clicks "View & Re-use This Cover" (navigates to the existing cover, closes the form) or "Add New Anyway" (dismisses the warning, re-enables Save). Name comparison is case-insensitive.
4. **Effective From defaults to today's date** when the Add form opens. The user may change it before saving.
5. **Backfill rule for existing records:** For covers that were created before this UI existed, Effective From is set to the date the cover was originally created. Effective To is set only for covers that are currently inactive — for those, it is set to the date the cover was last updated. Active covers have no Effective To.
6. If Effective To is set, it must be strictly after Effective From.
7. Input Type is required.
8. If Input Type is Dropdown, at least 2 options are required.
9. Covers are never deleted — they are retired by setting an Effective To date. The record remains in the system.
10. A cover whose Effective To date is in the past must not appear on policy forms.
11. A cover whose Effective From date is in the future must not appear on policy forms yet.
12. **Layout Width restrictions:** New covers can only be created with "Full Width" or "Half Width" layout options. The "Custom grouped layout" option is not available for new covers. Existing covers with custom grouped layout are preserved and continue to function normally.

### 6.2 Cover Assignment Rules

1. A cover assignment must reference a valid cover from the Covers Master.
2. Display sequence must be a positive integer.
3. Required must be stored as exactly "Yes" or "No". The system normalises any variation (e.g. "yes", "YES") on save.
4. Effective From is required.
5. **Effective From defaults to today's date** when the Add Cover to Policy Type form opens. The user may change it before saving.
6. **Backfill rule for existing assignments:** For assignments that existed before this UI, Effective From is set to the date the assignment was originally created. Effective To is set only if the corresponding master cover is currently inactive — for those, it is set to the date the assignment was last updated.
7. If Effective To is set, it must be strictly after Effective From.
8. An assignment whose Effective To date is in the past must not display that cover on the policy form.
9. An assignment whose Effective From date is in the future must not display that cover on the policy form yet.
10. "Retire" sets the Effective To date on the assignment. The record is not deleted.
11. The same cover cannot appear twice in the same policy type, regardless of effective date range.
12. If an assignment has different settings from the Covers Master (input type, label, required, options, layout, rows), the assignment stores its own settings independently. Changes to the master do not overwrite the assignment's custom settings.
13. A cover's section assignment must reference a section that belongs to the same policy type. Leaving it blank is valid — the cover appears ungrouped.
14. Deleting a section is blocked if it still has covers assigned to it. The message is: "Section has [N] covers. Reassign or remove them first."
15. **A cover with no field configuration cannot be assigned to a policy type.** In the search results during Step 1 of "Add a Cover to a Policy Type", such covers display a "Configure First →" link in place of the "Select" button. The link navigates the user to the Edit Cover form in the Covers Master. Assignment is only possible once Input Type and all required field settings have been saved on the cover.

### 6.3 Policy Type Rules

1. Policy Type Name is required.
2. Code is required.
3. A code must be unique within the same organisation. The same code may exist across different organisations.
4. Organisation is required.
5. Effective From is required.
6. **Effective From defaults to today's date** when the Add form opens.
7. If Effective To is set, it must be strictly after Effective From.
8. **Backfill rule for existing policy types:** For policy types that existed before this UI, Effective From is set to the date the record was originally created. Effective To is set only for inactive policy types — for those, it is set to the date the record was last updated.
9. Deactivating a policy type does not delete it or its cover assignments.

### 6.4 Upload Rules

1. CSV headers must match the template exactly (case-insensitive matching is acceptable).
2. File size limit: 5 MB.
3. Row limit: 1,000 rows per upload.
4. File encoding must be UTF-8.

### 6.5 Access Rules

1. All buttons and actions that make changes (add, edit, save, upload confirm) are only shown to users with the required permission. Controls are hidden — not just disabled — when permission is missing.
2. Any screen that includes write-capable forms must redirect users without view permission to the unauthorised page.
3. The read-only cover detail view is accessible to any user with view permission, regardless of whether they have edit or create permission.
4. Organisation scoping — which policy types a user may view and manage — is enforced by the system. The frontend must not attempt to implement org filtering based on role names.
5. If a user navigates directly to an edit URL without edit permission, the form must open in read-only mode — not show an error page.

---

## 7. Screens Summary

| Screen | What You Can Do | Write Access Required For |
|--------|----------------|--------------------------|
| Covers Master — List | View, search, and filter all covers. Export. | — |
| Covers Master — Add / Edit | Create new covers or update existing ones | Add: Create permission. Edit: Edit permission. |
| Covers Master — View Detail | Read-only view with policy type usage list | — |
| Covers Master — Upload CSV | Bulk create covers from a CSV file | Create permission |
| Policy Type vs Covers Mapping — List | View all covers assigned to a selected policy type, grouped by section | — |
| Policy Type vs Covers Mapping — Add Cover | Assign a cover to a policy type in two steps | Create permission |
| Policy Type vs Covers Mapping — Edit Assignment | Change how a cover behaves for a specific policy type | Edit permission |
| Policy Type vs Covers Mapping — Retire / Reactivate | Set or clear an expiry date on a cover assignment | Edit permission |
| Policy Type vs Covers Mapping — Reorder | Change the display order of covers | Edit permission |
| Policy Type vs Covers Mapping — Manage Sections | Add, rename, reorder, and delete section headings | Edit permission |
| Policy Type vs Covers Mapping — Upload CSV | Bulk assign covers to a selected policy type | Create permission |
| Policy Types Master — List | View, search, and filter all policy types. Export. | — |
| Policy Types Master — Add / Edit | Create new policy types or update existing ones | Add: Create permission. Edit: Edit permission. |
| Policy Types Master — Activate / Deactivate | Change the active status of a policy type | Edit permission |

---


## 9. Acceptance Criteria

### 9.1 Covers Master

```gherkin
Given I am on the Covers Master page
When I toggle "No Config"
Then I should see only the 643 covers that have no field configuration set

Given I toggle "Show Duplicates"
Then I should see only covers whose name appears more than once in the master

Given I search for "Accidental"
Then the list filters to show only covers whose name or description contains "Accidental"

Given I select Cover Type = "Extension" and Status = "Active"
Then only active Extension covers are shown
```

### 9.2 Duplicate Cover Name Check

```gherkin
Given I am on the Add Cover form
When I type "Accidental Damage" in the Cover Name field and move focus away
And a cover named "Accidental Damage" already exists
Then an inline warning panel appears below the Cover Name field
And the panel shows the existing cover's name, cover type, input type, options (if dropdown), number of policy types it is used in, and active or retired status
And the Save button is disabled

Given the duplicate warning panel is visible
When I click "View & Re-use This Cover"
Then the Add form closes
And the existing cover's detail view opens

Given the duplicate warning panel is visible
When I click "Add New Anyway"
Then the warning panel is dismissed
And the Save button becomes enabled
And I can complete and save the new cover

Given I typed a duplicate name and saw the warning
When I clear the Cover Name field and type a different unique name
Then the warning panel disappears automatically
And the Save button state is governed only by the remaining validation rules
```

### 9.3 Cover Field Configuration

```gherkin
Given I select Input Type = "Dropdown"
Then the Options section appears
And I cannot save with fewer than 2 options

Given I select Input Type = "Multi-line Text"
Then the Hint Options section appears (optional)
And a Visible Rows number input appears defaulting to 3

Given I change Input Type from "Dropdown" to "Multi-line Text"
Then a warning appears: "Existing options will be kept as hint options"
And the options are not deleted

Given I save a valid cover
Then the cover appears in the Covers Master list

Given a cover has no field configuration set
When I search for it in the "Add a Cover to a Policy Type" search step
Then the cover appears in the results
And the "Select" button is replaced with a "Configure First →" link
And I cannot select it for assignment

Given I click "Configure First →" on an unconfigured cover in the search results
Then I am navigated to the Edit Cover form for that cover in the Covers Master
And I can complete the field configuration and save

Given I have completed the field configuration for a previously unconfigured cover
When I return to the "Add a Cover to a Policy Type" search step and search for it
Then the cover now shows a "Select" button and can be assigned normally

Given I am on the Add Cover form
When I click on the Layout Width dropdown
Then I see only "Full Width" and "Half Width" options
And I do not see "Custom grouped layout" as an option

Given I am editing an existing cover that has custom grouped layout
When I view the Layout Width field
Then it shows "Custom grouped layout" as the current value
And I can change it to "Full Width" or "Half Width"
But I cannot select "Custom grouped layout" again if I change away from it
```

### 9.4 Policy Type vs Covers Mapping

```gherkin
Given I select an organisation and policy type
When I click Load
Then the covers assigned to that policy type are shown in display sequence order
And covers are grouped under their section headings where sections are defined
And covers with no section appear under a "(No Section)" group

Given Reorder Mode is OFF
When I toggle Reorder Mode ON
Then drag handles appear on each cover row
And a "Save Order" button appears in the toolbar

Given I drag a cover to a new position
When I click "Save Order"
Then the new sequence positions are saved
And the covers list refreshes showing the new order
```

### 9.5 Cover Assignment Override

```gherkin
Given I am adding a cover to a policy type
When I change the Field Label from the master's default
Then an informational note appears: "These settings differ from the master cover definition"

Given I am adding a cover that is "Single-line Text" in the master to a policy type
When I change the Input Type to "Multi-line Text"
Then the Options section updates to show Hint Options instead of dropdown options
And an informational note appears: "These settings differ from the master cover definition"
And the Visible Rows field appears with a default value of 3

Given I am adding a cover that is "Multi-line Text" in the master to a policy type
When I change the Input Type to "Dropdown"
Then the Hint Options section changes to Options section
And existing hints are converted to dropdown options
And a minimum of 2 options is required before saving

Given I am editing a cover assignment that has custom input type settings
When I click "Reset to Master Defaults"
Then the Input Type is restored to match the Covers Master definition
And all related field settings (options, hints, rows) are restored to master defaults
And the Config column shows "Default" for this cover

Given a cover assignment has a different input type from the master
When I view the covers list for this policy type
Then the Config column shows "Custom ⚠" for that cover
And the Input column shows the policy type's input type, not the master's

Given I upload a CSV with input_type different from the master cover
When the upload is processed
Then the assignment uses the CSV's input_type value
And the Config column shows "Custom ⚠" for that cover
And the assignment functions with the overridden input type
```

### 9.6 Sections

```gherkin
Given I am on the Policy Type vs Covers Mapping page for a policy type
When I click "Manage Sections"
Then I see all sections defined for this policy type
And each row shows the section name, display order, and number of covers assigned

Given I add a new section "Burglary Extensions"
Then it appears in the section list
And it is available in the Section dropdown when adding or editing a cover

Given a section has 7 covers assigned
When I try to delete that section
Then the Delete button is disabled
And the tooltip reads "Remove all covers from this section before deleting"

Given I assign a cover to the "Fire Perils" section
Then in the covers list, that cover appears under the "FIRE PERILS" section heading row

Given I upload a CSV where the `section` column contains "fire perils" (lowercase)
Then the system matches it to the "Fire Perils" section (case-insensitive)
And the cover is assigned to that section

Given I upload a CSV where the `section` column contains a name that does not exist for this policy type
Then that row shows an error: "Section not found for this policy type"
And the row is skipped
```

### 9.7 Policy Types Master

```gherkin
Given I am on the Policy Types Master page
When I search for "GMC"
Then the list shows only policy types whose name or code contains "GMC"

Given I click "+ Add Policy Type"
Then the Add Policy Type form opens
And the Effective From field is pre-filled with today's date

Given I fill in a code that already exists for the same organisation
When I try to save
Then I see a validation error: "A policy type with this code already exists for this organisation"

Given I click "Deactivate" on an active policy type
Then a confirmation prompt appears
When I confirm
Then the policy type status changes to Inactive
And the policy type and its cover assignments remain in the system

Given I click "Activate" on an inactive policy type
Then a confirmation prompt appears
When I confirm
Then the policy type status changes to Active
```

### 9.8 Effective Dates

```gherkin
Given I open the Add Cover form
Then the Effective From field is pre-filled with today's date
And the Effective To field is blank

Given I am adding a new cover
When I clear the Effective From field and try to save
Then I see a validation error: "Effective From is required"

Given I set Effective From to 01 Apr 2026 and Effective To to 31 Mar 2026
Then I see a validation error: "Effective To must be after Effective From"

Given I save a cover with Effective From set to 01 Apr 2026
When today's date is 25 Mar 2026
Then the cover appears in the list with status "Upcoming"
And the cover does not appear on any policy form

When today's date becomes 01 Apr 2026
Then the cover appears on policy forms normally

Given I open the Add Cover to Policy Type form (Step 2)
Then the Effective From field is pre-filled with today's date
And the Effective To field is blank

Given a cover assignment has Effective To set to 31 Mar 2026
When today's date is 01 Apr 2026
Then that cover does not appear on the policy form for that policy type
And the row in the mapping list is shown dimmed with an "Expired" label

Given a cover was created before this UI existed
When I view it in the Covers Master list
Then its Effective From shows the date the cover was originally created
And if the cover is active, its Effective To is blank
And if the cover was inactive at the time of migration, its Effective To shows the date it was last updated
```

### 9.9 Bulk Upload

```gherkin
Given I upload a Covers CSV with 50 rows where 2 have a blank cover_type
Then the preview shows 48 rows as valid and 2 rows as errors
And clicking Confirm creates only 48 covers
And I can download an error report listing the 2 failed rows with reasons

Given I upload a Covers CSV with input_type = "dropdown" and no dropdown_options
Then that row is shown as an error: "Dropdown options are required when input type is Dropdown"

Given I upload a Covers CSV where a cover name already exists in the master
Then that row is shown as a warning with the matching cover's details
And the row is still included in the Confirm action

Given I upload a Mapping CSV for a policy type
Where a row has a cover name that does not exist in the Covers Master
Then that row shows an error: "Cover not found in Covers Master"
And all other valid rows are applied on confirm

Given I upload a Mapping CSV where a cover is already assigned to this policy type
Then that row is shown as a warning: "Will update existing assignment"
And the sequence and required values are updated on confirm
```

### 9.10 Access Control

```gherkin
Given a user whose role has view permission but not create or edit permission
When they visit the Covers Master page
Then they see the covers list and can open the detail view
And the "+ Add New Cover" button is not shown
And the "Edit" button on each row is not shown
And the "Upload CSV" button is not shown

Given a user with edit permission navigates directly to an edit URL
Then the form renders in editable mode

Given a user with only view permission navigates directly to an edit URL
Then the form renders in read-only mode — no error page is shown

Given a user without view permission tries to visit the Covers Master page
Then they are redirected to the unauthorised page
```

---

## Appendix A: Data Reference

This appendix summarises the data analysis conducted on the three source files:

- `mstr_cover_data_18-Mar-2026_anon DB.csv` — 3,788 covers in the master catalogue
- `mstr_cover_template_data_18-Mar-2026_anon DB.csv` — 5,105 cover assignments across policy types
- `lookup_data_POLICY_TYPE_18-Mar-2025_anon DB.csv` — 498 policy types

All functional conclusions in the sections above are derived from this data.

---

### A.1 Cover Input Types in Existing Data

**Distribution of input types — Covers Master (3,788 covers):**

| Input Type | Master Count | Assignment Count |
|-----------|-------------|-----------------|
| Multi-line Text | 2,417 | 4,256 |
| Single-line Text | 624 | 780 |
| Dropdown | 95 | 65 |
| Number | 8 | — |
| _(data error — should be Single-line Text)_ | 1 | 4 |

**Layout width distribution:**

| Width | Count |
|-------|-------|
| Full | 2,988 |
| Half | 132 |
| Custom grouped layout | 25 |

The 25 custom grouped layout covers form a horizontal table layout on the policy form. See Open Question 3.

**Required vs Optional:**

| Setting | Count |
|---------|-------|
| Required | 2,762 |
| Optional | 295 |
| Has field config but no required setting | 88 |
| No field config at all | 643 |

**Assignment-level overrides (out of 5,105 total assignments):**

| Status | Count |
|--------|-------|
| Uses master settings unchanged | 4,669 |
| Has policy-type-specific settings | 428 |

What was changed in the 428 customised assignments:

| Setting Changed | Count |
|----------------|-------|
| Layout width | 220 |
| Required setting | 198 |
| Input type | 153 |
| Row count (multi-line text) | 152 |
| Dropdown options | 34 |

---

### A.2 Known Data Quality Issues

| Issue | Count | Detail |
|-------|-------|--------|
| Configuration marked as "test" type (should be Single-line Text) | 1 master, 4 assignments | Cover: "Limit of Liability" |
| Input type is "Multiple Text" but field config says Multi-line Text | 34 | Type mismatch — "Multiple Text" is the input type but the form renders as Multi-line Text |
| Input type is Dropdown but field config says Single-line Text | 4 | Data entry error |

---

### A.3 Options — All Unique Option Sets in Current Data

190 covers in the master catalogue have options defined. Of these, 95 are Dropdown covers (options are enforced choices) and 95 are Multi-line Text covers (options are hint suggestions).

**All 18 unique option sets found:**

| # | Option Labels | Used by N Covers |
|---|--------------|-----------------|
| 1 | No, Yes | 110 |
| 2 | Market Value, Reinstatement, New Replacement Value, Reinstatement & New Replacement Value | 25 |
| 3 | Others, Voluntary, Compulsory | 18 |
| 4 | Gender, Emp Code, Location, Designation | 18 |
| 5 | Open Godown, Closed Godown | 3 |
| 6 | Book value, Replacement value, Market Value Basis, Reinstatement Value Basis | 2 |
| 7 | Floater Policy, Standard Policy, Declaration Policy, Floater Declaration Policy | 2 |
| 8 | Etc, Factory, Residence | 2 |
| 9 | CIF, CIF + 10%, Specify | 1 |
| 10 | All Risk (A), B, C | 1 |
| 11 | India, Worldwide | 1 |
| 12 | Air, Sea, Rail, Road, ALL or any | 1 |
| 13 | FG, RM, Others, Fragile, Hazardous, Machinery, Non Hazardous | 1 |
| 14 | Low Risk, High Risk, Medium Risk | 1 |
| 15 | Floater Policy, Standard Policy, First Loss Policy, Declaration Policy | 1 |
| 16 | Brand New, Second Hand | 1 |
| 17 | PPD, PTD, TTD, Death | 1 |
| 18 | Voluntary Deductibles, Standard as per Fire Tariff | 1 |

Options count per cover: 116 covers have 2 options, 49 have 4 options, 23 have 3 options, 1 has 5, 1 has 7.

---

### A.4 Policy Types Summary

**Overall counts:**

| Metric | Count |
|--------|-------|
| Total policy types | 498 |
| Active | 420 |
| Inactive | 78 |
| Active with cover assignments | 301 |
| Active with no cover assignments | 119 |

**By organisation:**

| Org | Total | Active | Inactive | Active with Covers |
|-----|-------|--------|----------|--------------------|
| 1 | 303 | 234 | 69 | ~234 |
| 2 | 39 | 30 | 9 | 30 |
| 3 | 120 | 120 | 0 | ~1 |
| 5 | 36 | 36 | 0 | 36 |

> Org 3 is the primary candidate for bulk cover assignment upload — almost all of its 120 active policy types have no cover assignments.

**Cover count distribution across policy types:**

| Covers per Policy Type | Number of Policy Types |
|------------------------|----------------------|
| 1–10 | 197 |
| 11–25 | 34 |
| 26–50 | 35 |
| 51–100 | 32 |
| 101–188 | 3 |

Median: 2 covers. Average: 17. Highest: 188 (IAR, Org 1).

**Policy types with the same code shared across organisations (sample):**

| Code | Organisations |
|------|--------------|
| GMC | 1, 2 |
| FIRE_INSURANCE | 1, 2 |
| GTL | 1, 2 |
| MACHINERY_BREAKDOWN | 1, 2, 3 |
| MARINE_ANNUAL_POLICY | 1, 2, 3 |
| TERM_PLAN | 1, 2, 3 |
| FIDELITY_GUARANTEE_INSURANCE | 1, 3, 5 |
| GROUP_PERSONAL_ACCIDENT_POLICY | 1, 3, 5 |
| HEALTH_FAMILY_FLOATER_POLICY | 1, 3, 5 |
| MONEY_INSURANCE | 1, 3, 5 |

Each organisation has its own independent record — cover assignments are independent per organisation even when the code is shared.

**Policy types with duplicate codes within the same organisation (10 cases in Org 1 — sample):**

| Code | Policy Type IDs |
|------|----------------|
| MARINE_SPECIFIC | 15058, 4641 |
| MARINE_OPEN_POLICY | 15059, 4640 |
| PUBLIC_LIABILITY | 15073, 3217 |
| MARINE_OPEN_COVER | 15079, 4639 |
| CLINICAL_TRIAL | 3213, 15093 |
| _(5 more)_ | |

---

### A.5 Top 10 Policy Types by Cover Count

| Policy Type Name | Org | Covers |
|-----------------|-----|--------|
| Individual Accident / Personal Accident Insurance (IAR) | 1 | 188 |
| Industrial All Risk Insurance | 1 | 174 |
| Marine cum Erection Policy (MCE) | 1 | 154 |
| Package Policy | 1 | 90 |
| Commercial Fire | 2 | 88 |
| Property All Risk | 2 | 85 |
| Surgical & Hospital Insurance | 2 | 84 |
| Marine Open Cover Insurance | 1 | 82 |
| Fire Insurance | 1 | 82 |
| Marine Cargo Insurance | 1 | 82 |

---

### A.6 Active Policy Types per Organisation

**Organisation 1 (234 active, first 30 by display order):**

| Code | Display Name |
|------|-------------|
| ALL_RISK | All Risk Policy |
| AVIATION_HULL_ALL_RISK | Aviation Hull All Risk Insurance |
| BHARAT_LAGHU_BLUS | Bharat Laghu Udyam Suraksha (BLUS) |
| BHARAT_SOOKSHMA_BSUS | Bharat Sookshma Udyam Suraksha (BSUS) |
| BURGLARY | Burglary & Theft Insurance |
| CLINICAL_TRIAL | Clinical Trial Insurance |
| CLUB_EVEXIA | Club Evexia Membership |
| CREDIT_INSURANCE | Credit Insurance |
| CRIME_INSURANCE | Crime Insurance / Fidelity & Crime Insurance |
| CYBER_INSURANCE | Cyber Insurance |
| CYBER_LIABILITY_INSURANCE | Cyber Liability Insurance |
| D_AND_O | Directors and Officers Liability Insurance (D&O) |
| EDLI | Employees' Deposit Linked Insurance Scheme (EDLI) |
| FIRE_INSURANCE | Fire Insurance |
| GMC | Group Mediclaim Policy |
| GMC_TOP-UP | Group Mediclaim Top-Up Policy |
| GPA | Group Personal Accident Policy |
| GRATUITY | Group Gratuity Insurance |
| GTL | Group Term Life Insurance (GTL) |
| HOUSE_HOLDER | Householder Insurance |
| IAR | Individual Accident / Personal Accident Insurance (IAR) |
| INDIVIDUAL_MEDICLAIM | Individual Health / Mediclaim Insurance |
| KEY_MAN | Keyman Insurance |
| LEAVE_ENCASHMENT | Group Leave Encashment Scheme |
| LIA_STAGE_PAY | LIA Stage Pay |
| MARINE | Marine Cargo Insurance |
| MARINE_OPEN_COVER | Marine Open Cover Insurance |
| MARINE_OPEN_POLICY | Marine Open Policy |
| MARINE_SPECIFIC | Marine Specific Policy |
| MARINE_SALES_TURNOVER | Marine Sales Turnover |
| _(+204 more)_ | |

**Organisation 2 (30 active):**

| Code | Display Name |
|------|-------------|
| COMMERCIAL_FIRE | Commercial Fire |
| DWELLING_HOUSE | Dwelling House |
| BUSINESS_INTERRUPTION | Business Interruption |
| ELECTRONIC_ALL_RISK | Electronic All Risk |
| MACHINERY_ALL_RISK | Machinery All Risk |
| MACHINERY_BREAKDOWN | Machinery Breakdown |
| CONTRACTORS_PLANT_MACHINERY | Contractors Plant & Machinery |
| BOILER_PRESSURE_VESSELS | Boiler & Pressure Vessels |
| GLASS_POLICY | Glass Policy |
| MONEY_IN_TRANSIT | Money In Transit |
| WORKMAN_COMPENSATION | Workman Compensation |
| PERSONAL_ACCIDENT | Personal Accident |
| DETERIORATION_OF_STOCK | Deterioration of Stock |
| CONTRACTORS_ALL_RISK_INSURANCE | Contractors All Risk Insurance |
| DIRECTORS_OFFICERS_LIABILITY | Directors & Officers Liability |
| ERECTION_ALL_RISK | Erection All Risk |
| FIDELITY_GUARANTEE | Fidelity Guarantee |
| FREIGHT_FORWARDERS_LIABILITY | Freight Forwarders Liability |
| GOOD_IN_TRANSIT | Good In Transit |
| GROUP_LIFE_INSURANCE | Group Life Insurance |
| MARINE_OPEN_COVER | Marine Open Cover |
| MOTOR_INSURANCE | Motor Insurance |
| PRODUCT_LIABILITY | Product Liability |
| PROFESSIONAL_INDEMNITY | Professional Indemnity |
| PROPERTY_ALL_RISK | Property All Risk |
| PUBLIC_LIABILITY | Public Liability |
| STOCK_THROUGHPUT | Stock Throughput |
| SURGICAL_HOSPITAL_INSURANCE | Surgical & Hospital Insurance |
| TOUR_OPERATORS_LIABILITY | Tour Operators Liability |
| WAREHOUSE_LEGAL_LIABILITY | Warehouse Legal Liability |

**Organisation 5 (36 active):**

| Code | Display Name |
|------|-------------|
| MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS | Machinery Breakdown Consequential Loss |
| PLATE_GLASS | Plate Glass |
| STANDARD_FIRE_AND_SPECIAL_PERILS_POLICY | Standard Fire & Special Perils Policy |
| BURGLARY_INSURANCE | Burglary Insurance |
| ELECTRONIC_EQUIPMENT_INSURANCE_EEI | Electronic Equipment Insurance (EEI) |
| ALL_RISK_POLICY | All Risk Policy |
| MACHINERY_BREAKDOWN_INSURANCE_MBD | Machinery Breakdown Insurance (MBD) |
| INDUSTRIAL_ALL_RISK_INSURANCE | Industrial All Risk Insurance |
| CONTRACTORS_ALL_RISK_INSURANCE_CAR | Contractors All Risk Insurance (CAR) |
| CONTRACTORS_PLANT_MACHINERY_INSURANCE_CPM | Contractors Plant & Machinery Insurance (CPM) |
| POLITICAL_VIOLENCE_AND_TERRORISM | Political Violence and Terrorism |
| MONEY_INSURANCE | Money Insurance |
| DOMESTIC_PACKAGE | Domestic Package |
| GOODS_IN_TRANSIT | Goods in Transit |
| MARINE_OPEN_COVER_INSURANCE | Marine Open Cover Insurance |
| FIDELITY_GUARANTEE_INSURANCE | Fidelity Guarantee Insurance |
| WIBA | WIBA |
| WIBA_PLUS | WIBA PLUS |
| COMMERCIAL_GENERAL_LIABILITY_INSURANCE_CGL | Commercial General Liability Insurance (CGL) |
| GROUP_PERSONAL_ACCIDENT_POLICY | Group Personal Accident Policy |
| PUBLIC_LIABILITY_INSURANCE | Public Liability Insurance |
| PROFESSIONAL_INDEMNITY_INSURANCE_PI | Professional Indemnity Insurance (PI) |
| MOTOR_PRIVATE_COMPREHENSIVE_INSURANCE | Motor Private Comprehensive Insurance |
| MOTOR_COMMERCIAL_VEHICLE_INSURANCE | Motor Commercial Vehicle Insurance |
| MOTOR_TWO_WHEELER_INSURANCE | Motor Two Wheeler Insurance |
| CUSTOMS_BOND | Customs Bond |
| HEALTH_FAMILY_FLOATER_POLICY | Health Family Floater Policy |
| GROUP_TRAVEL_INSURANCE | Group Travel Insurance |
| GROUP_TERM_LIFE_INSURANCE_GTL | Group Term Life Insurance (GTL) |
| PERFORMANCE_SECURITY_BOND_INSURANCE | Performance Security Bond Insurance |
| ADVANCE_PAYMENT_BOND | Advance Payment Bond |
| GROUP_INSURANCE_AND_PENSION | Group Insurance & Pension |
| DIRECTORS_AND_OFFICERS_LIABILITY | Directors and Officers Liability |
| AVIATION_HULL_AND_LIABILITY | Aviation Hull and Liability |
| STOCK_FLOATER | Stock Floater |
| EMPLOYERS_LIABILITY | Employers Liability |

---

*Analysis conducted: 18 March 2026. Source files: `mstr_cover_data_18-Mar-2026_anon DB.csv`, `mstr_cover_template_data_18-Mar-2026_anon DB.csv`, `lookup_data_POLICY_TYPE_18-Mar-2025_anon DB.csv`.*
