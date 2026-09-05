# Business Targets — Business Requirements (BRD)

_Status: Draft · Owner: Karan · Last updated: 2026-08-18_

## 1. Background

Targets that drive the Business Performance dashboard live in `business_target` and are
maintained by editing the database directly. This is error-prone (bad enum values break
the dashboard silently) and invisible to the business. This BRD covers moving target
maintenance into the product and exposing targets as a filterable, downloadable report.

## 2. Stakeholders

- **Leadership / SBU heads** — set and revise targets; consume the report.
- **Finance / Ops** — reconcile targets vs achieved (report download feeds this).
- **Engineering** — owns the write-path and report, must preserve dashboard read contract.

## 3. Business rules

- **BR-1**: A target is uniquely identified for editing by
  `(user_id, month, entity_type, kpi, type_of_target)`. Saving the same tuple updates,
  never duplicates.
- **BR-2**: Only the fixed enum values may be stored (`BUSINESS_TARGET_ENTITY_TYPE`,
  `POLICY_PERFORMANCE_FIELDS`). The write-path must reject anything else — the dashboard
  read-path matches on these exact strings (`policy.repository.ts:11611`).
- **BR-3**: `value_of_target` is a non-negative number. Currency = org country context
  (targets are amounts, not localized strings).
- **BR-4** (REVISED — privilege-based, admin module): Access is gated by **privilege**,
  not role/hierarchy. `BUSINESS_TARGET`/`READ_001` grants report view+download;
  `WRITE_001` grants create/edit/delete. Enforced at the api-gateway `AclGuard`
  (seeded by `business-target-acl.sql`) and on the frontend via `PermissionGuard`.
  A privileged user operates **org-wide**; there is no hierarchy restriction inside the
  feature (UI filters narrow the data). Org-level scoping is a future option (OQ-2).
- **BR-5**: SBU, Vertical, and Team Member on the report are **derived** from the target's
  owning user at query time (`employee.sbu_id`, `employee.vertical_id`, name) — they are
  **not** stored on `business_target`. If a user's SBU/Vertical changes, historical report
  rows reflect the **current** mapping (known limitation; see §7).
- **BR-6**: The report's "Target" value is scoped to a selected Entity Type + KPI and
  aggregated per Team Member per Month (see PRD OQ-1).
- **BR-7**: Every create/update stamps `updated_at`; owner audit via existing
  `created_at`/`updated_at`. No soft-delete column exists on `business_target` — deletes
  are hard deletes (flag if audit trail is required → then add `deleted_at`, needs
  migration).

## 4. Scope & granularity

- Targets remain **monthly** and **per-user**. No org/SBU/quarter columns are added.
- The report **presents** SBU/Vertical by joining through the user; it does **not** change
  where a target is stored or scoped.

## 5. Data sources & joins

```
business_target.user_id
  → employee.user_id           Team Member  = employee.first_name + ' ' + employee.last_name
  → org_sbu.id (employee.sbu_id)       SBU      = org_sbu.name
  → org_vertical.id (employee.vertical_id)  Vertical = org_vertical.name
Month  = business_target.month
Target = SUM(business_target.value_of_target)  [filtered by entity_type + kpi]
```

## 6. Compliance / risk

- **Data integrity**: enum validation at the DTO boundary is the single most important
  control — a typo'd `entity_type` silently zeroes a dashboard number. Non-negotiable.
- **Access control**: scope enforcement reuses the existing, already-audited
  `ScopeService` path. No new auth surface invented.
- **Reversibility**: hard delete is irreversible; leadership-only + confirm dialog. If the
  business needs undo, we add `deleted_at` (migration) — deferred until asked.

## 7. Known limitations (accepted)

- **L-1**: Report SBU/Vertical reflect the user's *current* org mapping, not the mapping at
  the time the target was set (targets carry no org snapshot). Accepted; matches how the
  dashboard already resolves scope through the current user.
- **L-2**: No approval workflow — a save is immediately live to the dashboard.
- **L-3**: Multiple metric rows per user/month mean "Target" is only meaningful once an
  entity_type + kpi filter is chosen; the report defaults these to avoid double-counting.

## 8. Acceptance criteria

- Editing a target in-app changes the corresponding dashboard figure with no other change.
- Invalid enum / negative value / out-of-scope user is rejected with a clear error.
- Report rows match the DB join for a given filter set; Excel export equals the on-screen
  filtered rows plus an Applied Filters sheet.
