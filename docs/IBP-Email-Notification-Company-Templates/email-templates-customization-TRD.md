# TRD — Customise Email Templates

Technical companion to [email-templates-customization-PRD.md](email-templates-customization-PRD.md).
Builds on the data model already specified in [implementation-plan.md](implementation-plan.md)
(§1 schema, §5 change-log table) — unchanged. This revision is scoped entirely to **relocating
the UI entry point** from a Portal Configuration tab to a drill-down inside Template
Management, and the small amount of new API surface that relocation needs.

> **Revision note (2026-08-08):** the previous version of this TRD specced the entry point as
> a new tab on `PortalConfigurationScreen`, with a `TemplateContentEditor` (ReactQuill-based)
> shared with the standalone `TemplateEditor`. What actually shipped diverged from that in two
> ways worth recording as-built, since both carry forward into this revision unchanged:
> 1. **No category selector.** The category taxonomy (`GET /templates/categories`,
>    `categoryLid` filtering) was cut during implementation as unnecessary scope — the
>    shipped picker is a single searchable dropdown over all allow-listed templates for a
>    config, no category grouping. Carries forward as-is; this revision does not reintroduce
>    categories.
> 2. **GrapesJS, not ReactQuill.** The body editor went through two further iterations after
>    this TRD was first written — HTML-source-editor-with-preview, then a visual WYSIWYG
>    editor — settling on GrapesJS (`grapesjs` + `grapesjs-preset-newsletter`) with a
>    Handlebars-token protection pass (`handlebarsHtmlProtection.ts`) so `{{...}}` template
>    variables survive round-tripping through a DOM-based editor untouched. This is the
>    component being relocated in §2 below; it is not being rebuilt or swapped again.

## 1. Where the pieces live today (before this change)

- Tab wiring: `apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/index.tsx` — a
  `TAB_KEYS.EMAIL_TEMPLATES` entry rendering `<DomainTabsHeader>` +
  `<EmailTemplatesTab companyId configId canEdit>`, gated behind
  `FF_IWORK_EMAIL_TEMPLATE_CUSTOMIZATION`.
- Feature folder: `apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/EmailTemplatesTab/`
  - `index.tsx` — template picker (searchable Autocomplete over `GET /templates/effective`),
    subject field, Save/Reset/History, wires the editor + preview panes together.
  - `GrapesJsEmailEditor.tsx` — the visual body editor (GrapesJS wrapper, imperative
    `getHtml()` handle).
  - `handlebarsHtmlProtection.ts` — `protectHandlebarsHtml`/`restoreHandlebarsHtml`, the
    Handlebars-token round-trip-safety logic.
  - `styles.ts`, `types.ts` — styled components (`SplitView`, `SourcePane`, `PreviewFrame`,
    etc.) and DTO-shaped TS types.
- Backend (all unchanged by this revision, still `apps/services/notification-service/src/app/template/`):
  `GET /templates/effective?configId=&channelType=`, `PUT /templates/:id/override`,
  `DELETE /templates/:id/override?configId=`, `GET /templates/:id/change-log?configId=`
  (`template.controller.ts`/`template.service.ts`/`template.repository.ts`), plus the
  `IBP_EMAIL_TEMPLATE_EVENT_TYPES` allow-list constant in `template.repository.ts`.

## 2. What moves, what's reused as-is

**Relocate** (move, don't duplicate) into a new folder
`apps/ui/iwork/src/app/pages/TemplatePage/TemplateCustomisation/`:
- `GrapesJsEmailEditor.tsx` — verbatim.
- `handlebarsHtmlProtection.ts` — verbatim.
- The styled components actually used by the editor pane (`SplitView`, `SourcePane`,
  `PaneLabel`, `PreviewFrame`, `EditorPanel`) from the old `styles.ts` — verbatim.
- The **bottom two-thirds of `EmailTemplatesTab/index.tsx`** — everything from the subject
  field down through Save/Reset/History and the `SplitView` JSX — extracted into a new,
  narrower component:
  ```tsx
  interface TemplateOverrideEditorProps {
    defaultTemplateId: number;
    configId: number;
    companyId: number;      // for display context (company name in the header) only
    canEdit: boolean;
    onSaved?: () => void;   // lets the parent detail view refresh its "existing overrides" list
  }
  ```
  This is the same dirty-tracking (`isSubjectDirty`/`isBodyDirty`), the same
  `getCurrentBodyHtml()`/preview-debounce logic, the same Save/Reset/History wiring already
  shipped — **only the top third changes**: the old component derived `selectedTemplate` from
  a searchable dropdown over *all* effective templates for a `configId`; the new component
  is handed `defaultTemplateId` + `configId` directly (the drill-down already picked both) and
  fetches the single matching row (see §3.1) instead of a whole list.

**Delete** once relocation is verified working:
- `EmailTemplatesTab/index.tsx`'s template-picker/dropdown logic (superseded — template
  selection now happens by clicking a row in Template Management, not by searching a
  dropdown).
- The tab entry in `PortalConfiguration/index.tsx` (`TAB_KEYS.EMAIL_TEMPLATES` block) and the
  `FF_IWORK_EMAIL_TEMPLATE_CUSTOMIZATION` feature-flag check around it — see §7 for the exact
  removal steps.

**Reused with zero changes:**
- All four existing backend endpoints (§1).
- `IBP_EMAIL_TEMPLATE_EVENT_TYPES` allow-list — now also drives the new
  `isCompanyCustomizable` flag (§3.2), not just the `findEffectiveTemplates` filter it already
  gated.

## 3. New/changed API surface

### 3.1 `GET /templates/effective?configId={configId}` — reused, not extended

The new `TemplateOverrideEditor` needs one specific event type's effective row (subject/body/
isOverride) for a `(defaultTemplateId, configId)` pair. Rather than adding a new narrower
endpoint, reuse this existing one as-is and select the matching row client-side by
`defaultTemplateId` — it already returns the full allow-listed set for a config in one query,
and the response is small (≤16 rows). Avoids a second, near-duplicate backend endpoint for a
marginal fetch-size saving.

### 3.2 `GET /templates` — add `isCompanyCustomizable` to each row

Extend the existing list response (`TemplateDashboard`'s data source,
`template.repository.ts` `findAll`/`applyFilters`) with one computed boolean per row:
```ts
isCompanyCustomizable: boolean; // true iff row.eventTypeName is in IBP_EMAIL_TEMPLATE_EVENT_TYPES
```
Computed in the repository (it already has the allow-list constant in scope) by checking the
joined `eventType.name` against the same `IBP_EMAIL_TEMPLATE_EVENT_TYPES` array already used
by `findEffectiveTemplates`. No new query — one extra field on the existing row mapping.
`TemplateActionsCell` (`TemplateDashboard/index.tsx`) uses this to conditionally render the
new **Customise** menu item (§4).

### 3.3 `GET /templates/:defaultTemplateId/overrides` — new

Lists every company/domain that currently has a customization of this specific default
template — this is what populates the "existing customizations" list in the new detail view.
```ts
interface TemplateOverrideSummaryDto {
  configId: number;
  companyId: number;
  companyName: string;      // Company.companyName, joined via ConfigCompany.company
  subDomain: string | null;
  subject: string;          // the override's own subject, for the list row
  updatedAt: string;
  changedByName?: string;   // resolved the same way change-log entries already resolve actor names
}
// response: TemplateOverrideSummaryDto[], newest-updated first
```
Repository (`template.repository.ts`): resolve the default row's `event_type_id`/
`channel_type_id` (same lookup `resolveDefaultTemplateId` already does), then query all
sibling rows with `config_id IS NOT NULL` sharing that `event_type_id`+`channel_type_id`,
`leftJoin`-ing `ConfigCompany` on `config_id` and `ConfigCompany.company` for the name
(`relations: ['company']` — confirmed working despite the dangling inverse-side property on
`Company`, see note below). Controller/service follow the existing
try/catch-and-log/rethrow pattern already used by every other method in this module.

> **Note on the entity relation**: `ConfigCompany.company` (`@ManyToOne` → `Company`,
> `@JoinColumn({ name: 'company_id' })`) is a real, usable relation for this query — but its
> declared inverse side, `company.configCompanies`, does not actually exist on the `Company`
> entity (introduced already-broken in commit `a6a49b84fc`, not something this feature is
> introducing). Query from the `ConfigCompany` side only (`configCompanyRepository.find({
> where: {...}, relations: ['company'] })`); do not attempt to navigate from `Company` to its
> configs via a relation — use a plain `where: { companyId }` query against `ConfigCompany`
> instead, exactly like `CompanyConfigRepository.findAllByCompanyId` already does (§3.4).

### 3.4 Company + domain picker — no new backend needed

Both pieces already exist and are reused as-is:
- **Company search**: `GET /company/companyList?page=&limit=&search=` (org-service,
  `company.controller.ts:317`), already wired to the generic `selectFieldByApi` field type
  (`apps/ui/ui-lib/.../FormComponent/Fields/SelectFieldByApi.tsx`) elsewhere in this app (e.g.
  `OpportunitiesForm/formConfig.ts`). The new picker uses the same `type: "selectFieldByApi"`
  + `endPoints.companiesListInSelectField` pattern rather than building a new autocomplete.
- **Domains for the picked company**: `GET /config-company/portal/list/:companyId`
  (config-service, already exposed as `endPoints.companyPortalConfigList(companyId)` and
  already consumed independently by `PortalConfiguration/index.tsx` today) — returns
  `PortalConfigListItem[]` (`{configId, subDomain, ...}`). The "+ Add customisation" domain
  step calls this directly, then **filters out** any `configId` already present in the §3.3
  overrides list for this template, so a domain that already has a customization only ever
  appears in the existing-overrides list, never duplicated into the add-new picker.

### 3.5 Save / Reset / History — unchanged

`PUT /templates/:defaultTemplateId/override`, `DELETE /templates/:defaultTemplateId/override?configId=`,
`GET /templates/:defaultTemplateId/change-log?configId=` — identical contracts, identical
implementation. `TemplateOverrideEditor` calls them exactly as `EmailTemplatesTab` did.

## 4. Frontend structure (new)

```
apps/ui/iwork/src/app/pages/TemplatePage/
  TemplateDashboard/index.tsx        <- existing table; TemplateActionsCell gets one new
                                         conditional menu item, "Customise", visible iff
                                         row.isCompanyCustomizable, navigates to
                                         /template-management/customise/:id
  TemplateCustomisation/
    index.tsx                         <- NEW: detail/drill-down view for one default template
    AddCustomisationDialog.tsx        <- NEW: company picker -> domain picker (2-step)
    TemplateOverrideEditor.tsx        <- RELOCATED (extracted from old EmailTemplatesTab):
                                          subject field + GrapesJsEmailEditor + live preview
                                          + Save/Reset/History, parameterized by
                                          (defaultTemplateId, configId, canEdit)
    GrapesJsEmailEditor.tsx           <- RELOCATED verbatim
    handlebarsHtmlProtection.ts       <- RELOCATED verbatim
    styles.ts                         <- RELOCATED subset (editor/preview styles only)
    types.ts                          <- TemplateOverrideSummaryDto, EffectiveTemplate, etc.
```

Route addition, `apps/ui/iwork/src/app/routes/template-management.route.tsx`: one new child
route, `customise/:defaultTemplateId`, rendering `TemplateCustomisation/index.tsx`.

### 4.1 Data flow

```
TemplateDashboard row -> Customise (only if isCompanyCustomizable)
  -> navigate to /template-management/customise/:defaultTemplateId

TemplateCustomisation mounts (defaultTemplateId from route param)
  -> GET /templates/:defaultTemplateId                (existing endpoint — name/subject header)
  -> GET /templates/:defaultTemplateId/overrides       (NEW — existing-customizations list)
  -> render list; each row -> set { configId, companyId } -> render TemplateOverrideEditor
  -> "+ Add customisation" -> AddCustomisationDialog
       -> selectFieldByApi company search -> pick companyId
       -> GET /config-company/portal/list/:companyId -> domain dropdown,
          excluding any configId already in the overrides list
       -> pick configId -> render TemplateOverrideEditor (starts from the default,
          since no override exists yet for this configId)

TemplateOverrideEditor(defaultTemplateId, configId, canEdit)
  -> GET /templates/effective?configId=<configId>          (existing — pick matching row by
                                                              defaultTemplateId, §3.1)
  -> edit subject / body (GrapesJS) exactly as before
  -> Save -> PUT /templates/:defaultTemplateId/override { configId, subject, body }
       -> on success: onSaved?.() so the parent detail view's overrides list refetches
  -> Reset -> DELETE /templates/:defaultTemplateId/override?configId=
       -> on success: onSaved?.()
  -> History -> GET /templates/:defaultTemplateId/change-log?configId=
```

## 5. Permissions

Still the open item carried over from the original phase (PRD §6): restricting the
**Customise** action, the new detail route, and the underlying save/reset endpoints to a
Super-User-only permission was never finished being wired when this lived on the Portal
Configuration tab. That work now applies to the new entry point instead — same requirement,
different surface:
- UI gate: hide the **Customise** menu item and block direct navigation to
  `/template-management/customise/:id` for non-Super-User roles.
- Backend defense-in-depth: `PUT /templates/:id/override` and
  `DELETE /templates/:id/override` should reject non-Super-User callers even if the UI gate
  is bypassed, since (per the existing gap analysis) the api-gateway's `AclGuard` cannot
  isolate these sub-routes from the rest of `templates`' general access, and auth-service's
  `RolesGuard` is dead code (reads `user.userDetails.role` singular, never populated).
  Resolving this requires deriving the correct DB-backed permission/role model first — not
  guessed — before wiring a guard. Still unresolved; tracked as an explicit follow-up, not
  silently assumed safe by omission.

## 6. Edge cases to handle explicitly

- **Template with zero existing customizations**: detail view shows an empty state
  ("No company has customized this yet") plus the **+ Add customisation** action — not a
  broken/blank list.
- **Company with zero domains configured**: the domain step of `AddCustomisationDialog` shows
  an empty state; picking that company is a dead end until it has at least one portal config,
  which is expected (there's nothing to scope an override to yet).
- **Company where every domain already has a customization of this template**: the domain
  picker step is empty after filtering (§3.4) — surface this explicitly ("All of this
  company's domains already have a customization — edit one from the list above") rather
  than showing a silently-empty dropdown.
- **Concurrent edit** (two admins editing the same company/domain's override): last-write-wins,
  unchanged from the original decision — the change-log makes a bad overwrite recoverable.
- **Reset when no override exists**: unreachable from this UI (Reset only renders inside
  `TemplateOverrideEditor` when `isOverride` is true), but the DELETE endpoint still 404s
  defensively regardless.
- **Company/config deleted while an override exists**: unchanged — `config_id` FK is
  `ON DELETE CASCADE`, override + change-log rows disappear with the config, no orphan cleanup
  needed. The new §3.3 overrides-list query naturally reflects this (a deleted config's row
  is simply gone).
- **`ConfigCompany.company` join returning null** `companyName` (e.g. a config row whose
  `company_id` was nulled by the `ON DELETE SET NULL` behavior on that relation, or a company
  row missing `companyName`): show a fallback label (`"Company #<companyId>"`) in the
  overrides list rather than a blank cell.

## 7. Migration / removal plan (old placement)

1. Confirm the new flow (§4) is fully working and independently verified against real
   templates (same "test with real complex existing templates before finalizing" bar as the
   original GrapesJS rollout) before removing anything from Portal Configuration.
2. Remove from `apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/index.tsx`: the
   `TAB_KEYS.EMAIL_TEMPLATES`/`TAB_LABELS.EMAIL_TEMPLATES` tab entry, its
   `FF_IWORK_EMAIL_TEMPLATE_CUSTOMIZATION`-gated block, and the `EmailTemplatesTab` import.
3. Remove `TAB_KEYS.EMAIL_TEMPLATES`/`TAB_LABELS.EMAIL_TEMPLATES` from
   `PortalConfiguration/constants.ts` (only if nothing else references them — confirm via
   grep before deleting, not by assumption).
4. Delete the `EmailTemplatesTab/` folder entirely once §2's relocation is confirmed complete
   (its reusable pieces now live under `TemplatePage/TemplateCustomisation/`, and its
   picker-specific logic has no home to move to — it's genuinely superseded, not relocated).
5. Retire `VITE_FF_IWORK_EMAIL_TEMPLATE_CUSTOMIZATION` / `featureFlag.FF_IWORK_EMAIL_TEMPLATE_CUSTOMIZATION`
   (`environment.ts`) once the tab referencing it is gone — confirm no other reference first.
6. No backend removal — every endpoint the old tab called is still called by the new flow.

## 8. Acceptance criteria / test plan

- [ ] `Customise` appears on a template's Actions menu in Template Management iff its event
      type is in the IBP allow-list; does not appear for internal/workflow templates
      (`Dual_Approval_Request`, `Cut_Off_Override_Raised`, etc.).
- [ ] Clicking `Customise` on a template with existing overrides lists every company/domain
      that has one, with correct company name (via the `ConfigCompany.company` join) and
      domain.
- [ ] Clicking an existing entry opens the edit view pre-filled with that company/domain's
      actual override content (not the default).
- [ ] `+ Add customisation` → picking a company whose domains all already have an override
      shows the explicit empty state, not a silently-empty dropdown.
- [ ] `+ Add customisation` → picking a company + a domain without an override opens the edit
      view pre-filled from the shared **default**, and Save creates a new override (visible
      immediately after in the overrides list without a page reload).
- [ ] Saving an override for one company/domain does not change what any other company/domain
      or the platform default show.
- [ ] Sending the actual notification for that event/company/domain uses the customized
      content — already proven end-to-end for OTP/password-reset/enrollment/life-event/claim/
      support-ticket sends (2026-08-08 domain-forwarding audit); re-verify specifically through
      this new entry point's save path, not just the old tab's.
- [ ] Reset to Default removes the override; the overrides list drops that entry; the next
      send uses the default again.
- [ ] Change-log/History shows correct old→new content and actor, scoped to the correct
      company/domain, reachable from the new edit view.
- [ ] Old Portal Configuration tab is gone; no dangling route, feature flag, or dead import
      left behind (§7).
- [ ] Non-Super-User roles cannot reach `/template-management/customise/:id` directly by URL,
      once the permission wiring in §5 lands (tracked separately if not done in the same pass).

## 9. Sequencing

- No dependency on anything new in implementation-plan.md — the schema, send-path fix, and
  audit table this relies on are already shipped and verified (2026-08-08 domain-forwarding
  audit).
- §5's permission wiring can ship after the relocation itself, but should not be dropped —
  it was already an open item before this revision and stays open until actually done.
