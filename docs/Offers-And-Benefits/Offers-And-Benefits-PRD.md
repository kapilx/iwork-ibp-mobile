# PRD — Offers & Benefits (Company Configuration)

| | |
|---|---|
| **Feature** | Offers & Benefits |
| **Status** | Draft |
| **Screen** | `CompanyPage → Portal Configuration` (`apps/ui/iwork/.../PortalConfiguration`) |
| **Services** | `config-service` (`company-config` module) |
| **Related docs** | [Offers-And-Benefits-TRD.md](./Offers-And-Benefits-TRD.md) |

---

## 1. Background

Portal Configuration already lets an insurer admin configure a company's login/branding, dashboard sections, policy settings, and per-domain scope. There is no way today to advertise ad-hoc **offers and benefits** (e.g. a partner discount, a wellness perk, a limited-time promotion) on a company's portal without a code change. This feature adds an admin-managed **Offers & Benefits** section to Portal Configuration so each offer/benefit item (image + title + description + redirection URL) can be created, edited, reordered, enabled/disabled, and deleted per company — and optionally per domain, consistent with how Login & Authentication already supports company-level defaults with per-domain overrides.

## 2. Goals

- Let an admin add one or more Offers & Benefits items to a company's portal configuration without engineering involvement.
- Each item carries an **image**, **title**, **description**, and a **redirection URL** (where the offer/benefit leads to when clicked/tapped).
- Support the same **company-level default vs. domain-level override** model already used elsewhere in Portal Configuration (e.g. Login & Authentication), so a company with multiple domains/portals can show different offers per domain if needed.
- Fit the existing Portal Configuration UX (tabs, edit/view split, Drawer-based CRUD) so the feature feels native, not bolted on.

## 3. Non-goals (out of scope for this phase)

- Rendering/consumption of Offers & Benefits on the employee-facing IBP dashboard/portal. This PRD covers the **admin configuration** surface only; a follow-up spec will cover the display component on IBP (there are existing analogs — `DashboardBenifitsSection`, `WellnessBanner` — that a future display integration can model after).
- Scheduling (start/end dates) or audience targeting for offers. Can be added later without a breaking schema change (see TRD open questions).
- Click/impression analytics on offers.

## 4. Users

- **Insurer/Company admin (iwork user)** with Portal Configuration edit permission — creates, edits, reorders, enables/disables, and deletes Offers & Benefits items.
- **Approver** (existing Portal Configuration approval flow) — reviews Offers & Benefits changes as part of the existing submit-for-approval workflow, no new approval mechanism needed.

## 5. Functional Requirements

### FR-1 — List view
Portal Configuration gets a new **"Offers & Benefits"** tab/section listing all items for the active company (and active domain, if domain-level overrides are used), showing thumbnail, title, redirection URL, enabled/disabled state, and display order.

### FR-2 — Create / Edit item
Admin can add a new item or edit an existing one via a form (Drawer, consistent with FAQs/Hospital listing patterns) with fields:
- **Image** — upload (required). Reuses the existing file-upload component/pattern used by Company Logo.
- **Title** — required, short text (recommend max 100 chars).
- **Description** — required, longer text (recommend max 500 chars).
- **Redirection URL** — required, must be a valid absolute URL (`https://...`).
- **Enabled** toggle — default on.

### FR-3 — Reorder
Admin can control the display order of items (drag-to-reorder or up/down controls), persisted as a `displayOrder` value per item.

### FR-4 — Enable/disable
Admin can toggle an item on/off without deleting it (hides it from consumption without losing the content).

### FR-5 — Delete
Admin can delete an item; deletion also removes/orphans the associated uploaded image per the existing file-upload delete flow.

### FR-6 — Company-level vs. domain-level scope
By default, items are company-level (visible across all of a company's domains/portals). If the company has multiple domain tabs (as Login & Authentication already supports), the admin can optionally add a domain-specific override set of items for a given domain, following the same `configId` nullable-override pattern already used for authentication mapping.

### FR-7 — Validation & limits
- Redirection URL validated as a well-formed URL before save.
- Image constrained to standard web image formats (png/jpeg/webp/svg), consistent with existing logo upload constraints.
- A reasonable cap on number of items per company (e.g. no hard cap required for v1, but the UI should handle 0–20 gracefully).

## 6. UX requirements

- New tab in the existing Portal Configuration tab bar (alongside Company, Login & Authentication, Dashboard, Policy, etc.).
- List/table + Drawer-form CRUD pattern (matches `FaqsListing`/`HospitalListing` — closest existing analogs for "list of items with a create/edit drawer").
- Image preview in both the list row (thumbnail) and the edit drawer (like the Company Logo preview/upload/replace/delete controls in Branding).
- Summary card for Offers & Benefits added to the read-only `CompanyConfigurationView` (the aggregated view already used for Login & Authentication).

## 7. Success criteria

- Admin can create, edit, reorder, enable/disable, and delete an Offers & Benefits item for a company, and the change persists and reloads correctly.
- Redirection URL and required-field validation prevent invalid data from being saved.
- Feature respects existing Portal Configuration permissions (view vs. edit vs. approve).

## 8. Open questions

- Should Offers & Benefits changes go through the existing submit-for-approval workflow, or save immediately (like Branding)? *Recommendation: treat like other Portal Configuration sections — included in the existing save/submit/approve flow.*
- Is a per-company item cap needed? *Recommendation: none for v1.*
- Do we need scheduling (start/end date) in v1? *Recommendation: no, defer — see TRD for how the schema accommodates this later without migration pain.*
