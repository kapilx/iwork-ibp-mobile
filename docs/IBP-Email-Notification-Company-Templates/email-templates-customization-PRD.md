# PRD — Customise Email Templates

> **Revision note (2026-08-08):** this document originally specced the feature as a tab
> inside a company's Portal Configuration screen (§3 argued explicitly *against* the
> standalone Template Management module as the entry point). That shipped, was tested
> end-to-end, and worked. This revision **reverses that placement decision** and moves the
> entry point to Template Management instead, per direct product direction — the reasoning
> for the reversal is in §3 below. The underlying data model (config-scoped override,
> on-the-fly fallback, dedicated audit log) is unchanged and still lives in
> [implementation-plan.md](implementation-plan.md); only *where an admin starts this task* and
> *how they pick which company/domain* has changed. The Portal Configuration tab is being
> removed, not kept as a second entry point (confirmed decision — see §3).

Scope: giving a platform admin a way to view and customize a company/domain's own copy of an
email template, scoped to one of that company's IBP portal configs (`config_id`), starting
from the template's own row in Template Management rather than from inside a company's page.

## 1. Problem

Every company's Welcome/Confirmation/Reminder/Raise-Ticket/Other emails currently use the
exact same shared template unless a `config_id`-scoped override exists. The mechanism for
creating that override exists (see implementation-plan.md), but the entry point admins used
to reach it — a tab buried inside one company's Portal Configuration screen — meant:
- An admin had to already know which company to open before they could even see whether a
  given template had any customizations at all.
- There was no way to see, *starting from the template*, which companies/domains already
  have their own version of it and which don't — you'd have to check company-by-company.
- It duplicated a chunk of the existing Template Management mental model (this *is* a
  template-management task) inside an unrelated screen.

## 2. Goal

An internal admin, starting from the **Template Management** module (`iwork` →
`/template-management`), can:
1. See, on each row of the existing template table, a **Customise** action — but only for
   templates that are actually company/domain-facing (the IBP allow-list — see §3.2); every
   other template (internal workflow notifications like `Dual_Approval_Request`,
   `Cut_Off_Override_Raised`) does not get this action at all, since per-domain scoping is
   meaningless for them.
2. Click **Customise** on a template and land on a detail view that lists every
   company + domain that **already** has its own customized copy of this template.
3. Click any of those existing entries to jump straight into editing it (subject + visual
   body editor + live preview, exactly the experience already built and shipped).
4. Or, if the company/domain they need isn't in that list yet, use **+ Add customisation** to
   pick a company, then one of that company's domains, and land in the same edit view,
   pre-filled from the shared default (since no override exists there yet) — saving creates
   a brand-new override for that company/domain, exactly like editing an existing one.
5. Reset any customization back to the shared default from the same edit view.
6. See a simple history of who changed a given company/domain's copy of this template, and
   when.

## 3. Why this screen now, reversing the earlier decision

### 3.1 What changed

The original PRD rejected the standalone Template Management module as the entry point
because "that screen's mental model is manage the global catalog of templates... a
platform-admin tool, not a per-company task." That's still true of the screen *as a whole* —
but the actual ask here isn't to redesign the whole screen around companies; it's to add one
targeted, template-scoped action (**Customise**) that drills from "this specific template" down
to "which companies/domains have their own version of it." That framing doesn't fight the
screen's existing mental model — a platform admin looking at a template's row and asking "who
has customized this, and can I add one more?" is still a template-centric question, not a
company-centric one. The earlier objection doesn't apply to this narrower design.

The concrete win this reversal buys: **starting from the template**, an admin can now see
*every* company/domain with a customization in one place — something the Portal Configuration
tab placement could never offer (it only ever showed one company/domain's state at a time).
That's a real capability gap the old placement had no answer for.

### 3.2 Scope of the Customise action — IBP allow-list only

`Customise` only appears for templates whose event type is in the same allow-list already
enforced server-side for the override feature (`IBP_EMAIL_TEMPLATE_EVENT_TYPES` in
`template.repository.ts` — OTP/password-reset, onboarding, enrollment start/reminder/
confirmation/bulk-confirmation, life event, added dependents, claim intimation, support
ticket raised/status-changed, client confirmation, welcome-apology). Every other row in the
table (internal workflow templates, approval-request notifications, etc.) shows no
Customise action — those aren't sent to a specific company/domain's employees under a
`config_id`, so "customize per domain" has no meaning for them.

### 3.3 What's explicitly *not* changing

- The data model: still `config_id`-scoped override rows on
  `notification_channel_event_template_mapping`, on-the-fly fallback at send time, no
  physical cloning. Unchanged from implementation-plan.md.
- The editing experience itself: subject field + visual (GrapesJS) body editor + live preview
  pane, Save / Reset to Default / History — this is the exact component already built and
  verified against real templates; it is **relocated**, not rebuilt, into the new entry point
  (see TRD §2).
- The audit trail: same dedicated change-log table, same actions
  (`CREATED_OVERRIDE`/`UPDATED_OVERRIDE`/`DELETED_OVERRIDE`).

## 4. User stories

- As a platform admin, I want to open a template in Template Management and immediately see
  which companies/domains already have their own version of it, without checking company by
  company.
- As a platform admin, I want to add a customization for a company/domain that doesn't have
  one yet, picking the company and domain directly from this same screen.
- As a platform admin, I want editing an existing company/domain's customization and creating
  a brand-new one to feel like the same action — pick a company+domain, edit, save — whether
  or not an override already existed there.
- As a platform admin, I want templates that aren't company/domain-facing (internal workflow
  notifications) to simply not offer this option, so I'm not tempted to "customize" something
  that has no per-domain meaning.
- As a platform admin, I want to undo a company/domain's customization and go back to the
  default without hunting for the original wording.
- As a platform admin, I want to know who last changed a given company/domain's copy of a
  template, and when.

## 5. UX flow

1. Admin opens **Template Management** (`/template-management`) and finds a template row.
2. If that template's event type is company/domain-facing (§3.2), its row's Actions menu
   includes **Customise** alongside the existing Edit/Preview/History/etc. actions.
3. Clicking **Customise** opens the template's customisation detail view:
   - Header: template name/subject, its event type.
   - A list of every company + domain that already has a customization of this template
     (company name, domain, last-updated, a quick link into edit). Empty state ("No company
     has customized this yet") when none exist.
   - **+ Add customisation** — opens a two-step picker: pick a company (typeahead search,
     same mechanism already used elsewhere in this app for company search), then pick one of
     that company's domains (only domains that don't already have a customization of this
     template are offered — a domain that already has one shows up in the list above
     instead, to avoid two ways to reach the same override).
4. Picking an existing entry, or completing the add-new picker, opens the edit view:
   - Status badge: **Default** (about to become an override) or **Customized for this
     company** (editing an existing one).
   - Subject field + the existing visual body editor + live preview pane, pre-filled with
     whichever is currently effective for that company/domain.
   - **Save** — creates or updates the override for that specific company/domain. Never
     touches the shared default.
   - **Reset to Default** — visible only when this company/domain currently has an override;
     deletes it, with a confirmation prompt.
   - **History** — the same change-log panel as before, scoped to this company/domain's
     copy of this template.

## 6. Roles / permissions

Carries forward the still-open decision from the original phase: the **Customise** action
(and the save/reset endpoints behind it) should be restricted to a Super-User-only permission,
not to every user who can reach Template Management. This was never finished being wired for
the Portal Configuration tab placement and remains an open task now applying to the new
entry point instead — see TRD §5. Until that lands, treat this as internal/platform-admin
tooling behind whatever access already gates `/template-management` itself.

## 7. Non-goals for this phase

- Approval workflow for overrides (unchanged from the original PRD — overrides save
  immediately; the existing draft→approve flow on Template Management continues to apply
  only to editing the shared default, not to per-company/domain overrides).
- Bulk customisation (applying the same override text to many companies/domains at once) —
  the "+ Add customisation" flow is explicitly one company+domain at a time.
- Self-serve company-admin access — this is internal `iwork`-app tooling only.
- Seeding/cloning defaults — still not needed, per the on-the-fly fallback decision.
- Redesigning Template Management's own approval workflow, filters, or table columns beyond
  adding the Customise action and the new detail view.

## 8. Migration from the previous placement

- The **Customise Email Templates** tab on the company Portal Configuration screen is
  **removed** — not kept as a second entry point. One place to do this task, not two.
- No data migration needed: the override rows and audit log this tab wrote to are exactly
  what the new entry point reads/writes. Removing the tab only removes a UI path to the same
  data, nothing underneath changes.
- See TRD §7 for the exact file-level removal/relocation plan.

## 9. Success criteria

- From a template's row in Template Management, an admin can see every company/domain that
  has customized it, in one place, without visiting any company's own page.
- Adding a customization for a new company/domain and editing an existing one feel like the
  same flow, differing only in whether the edit view starts from the default or from the
  current override.
- Sending a notification for that event/company/domain actually uses the customized content
  (unchanged verification requirement from the original PRD — already proven end-to-end for
  the OTP/password-reset/enrollment/life-event/claim/support-ticket paths, see the
  domain-forwarding audit in chat, 2026-08-08).
- Reset to Default removes the override and the next send uses the shared default again.
- Every save/reset is visible in the change-history panel with correct old→new content and
  actor, scoped to the correct company/domain.
- Templates outside the IBP allow-list show no Customise action at all.
