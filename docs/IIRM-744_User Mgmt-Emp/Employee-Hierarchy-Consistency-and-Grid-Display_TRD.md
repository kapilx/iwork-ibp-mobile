# Employee Hierarchy: Consistent Table + Reporting Hierarchy Column

## 1. Problem

iWork's Employee Management grid showed employee info but nothing about
reporting structure. Separately, `employee_hierarchy` (the precomputed
manager→report closure table used by policy-service/opportunity-service/
org-service scoping logic) could only ever be rebuilt by an admin manually
clicking a "Rebuild Hierarchy" button — nothing kept it fresh automatically,
and the incremental on-update maintenance that *did* exist had real gaps. If
HR changed someone's manager in the morning, the hierarchy silently drifted
out of date until someone remembered to click rebuild.

Three things were requested, to be done one at a time:
1. A visual representation of an employee's reporting chain, visible from the
   Employee Listing grid.
2. A nightly cron to rebuild `employee_hierarchy` automatically.
3. `employee_hierarchy` kept correct in near-real-time when an employee's
   manager changes, not just at the next nightly rebuild.

**Explicit scope guardrail:** this work does **not** touch the ~20+ call
sites in policy-service/opportunity-service/org-service/the shared
`ScopeService` (`libs/service-lib/src/lib/utils/scope.utils.ts`) that run
their own live recursive `WITH RECURSIVE` queries over `users` instead of
reading `employee_hierarchy`. That's a separate, larger, future task —
migrating those to read from `employee_hierarchy` is what would actually fix
their runtime cost, but it touches business-critical scoping/access-control
logic across three services and was deliberately kept out of this pass.

---

## 2. Phase A — Nightly rebuild cron

**File (new):** `apps/services/scheduler-service/src/app/scheduler/employee-hierarchy-rebuild.scheduler.ts`

Mirrors the existing `CompanyMigrationScheduler` pattern exactly (the
established convention in this service for "cron just fires an existing
endpoint on another service"):

- Registers a handler with `DynamicCronService` under the key
  `EMPLOYEE_HIERARCHY_REBUILD_DAILY` in `onModuleInit()`.
- The handler signs a short-lived system JWT and `axios.post`s org-service's
  already-existing `POST /employee/rebuild-hierarchy` endpoint (this endpoint
  already existed, wired to a manual "Rebuild Hierarchy" button on the
  Employee Listing page — the cron just automates clicking it).
- Schedule is entirely DB-driven via the `application_scheduler_configuration`
  table (not an env var), same as every other cron in this service — default
  `0 3 * * *` (3 AM UTC), deliberately after the 2:00/2:30 slots already used
  by other daily jobs so it doesn't pile onto the same minute.
- Re-throws on failure (rather than swallowing) so `DynamicCronService`'s
  wrapper correctly records `last_run_status = 'failed'`.

**JWT correction:** the token this scheduler signs includes a real
`userDetails.userId` (`DEFAULT_ADMIN_ID`), not just an `emailId` — `AuthGuard`
(`libs/service-lib/src/lib/auth.guard.ts`) resolves the acting user from
`userDetails.userId`, and a token without it would silently fail that check
if this route is ever routed through a guard. This was actually a
pre-existing gap in every other scheduler that self-signs one of these
tokens (`company-migration`, `policy-migration`, `generic-tpa-sync`,
`tpa-claims-worker` all have the same gap) — fixed here only, per an explicit
decision to leave the other four for a separate cleanup pass.

**Files:**
- New: `apps/services/scheduler-service/src/app/scheduler/employee-hierarchy-rebuild.scheduler.ts`
- Edited: `apps/services/scheduler-service/src/app/app.module.ts` (registered the new scheduler)
- New: `database-migrations/sql/employee-hierarchy-rebuild-scheduler-config.sql` — seed row for the cron config table. **Not yet run** — this is a hand-off script per the standing rule that DB-mutating SQL only ever gets executed by the user, never by the assistant directly. The cron does nothing until this is run.

---

## 3. Phase B — Hardened incremental refresh

Three real gaps found and fixed in `apps/services/org-service/src/app/employee/employee.repository.ts`, all the same shape: some ancestor chain (old branch or new branch) was never being passed into the existing `updateEmployeeHierarchy` / `addParentsToUpdateList` / `addToFlatHierarchy` helpers, so the closure table only got partially corrected.

| Function | Gap | Fix |
|---|---|---|
| `syncEmployeeHierarchy` (deactivation) | Only relabeled the deactivated user's *direct* closure rows in place; never rebuilt the new manager's own ancestor closure, and could leave stale/duplicate rows especially on cross-branch reassignment (`manualDeactivate`'s `reporteesNewManagerUserId` is admin-chosen, not constrained to the same branch) | Capture the deactivated user's ancestor ids *before* deleting their row, delete both their own row and every row still pointing at them, then re-derive the closure for `[...oldAncestorIds, newManagerUserId]` from live data — same recipe already used elsewhere |
| `updateEmployeeById` (manager reassignment) | Only walked the **new** manager's ancestor chain; never captured the employee's **old** manager chain, so old skip-level ancestors never got their downward closure recomputed | Read `employee.reportingUserId` before it's overwritten and also run `addParentsToUpdateList` on it |
| `activateEmployee` (reactivation) | Touched only `User`/`Employee` status columns; never rebuilt the reactivated user's own ancestor-chain row (deleted during their earlier deactivation) | After restoring active status, rebuild the reactivated user's own chain via the same helpers, if they have a manager |

Not touched (flagged only): `inceptionCreateEmployee`'s bulk-import path runs each new hire's `addEmployee` call concurrently via `Promise.all`, which can race when several new hires in a batch share a manager. It's self-healing (the last transaction to commit re-derives correct state from live data) and backstopped by Phase A's nightly rebuild — not fixed in this pass to keep it focused on gaps that produced outright incorrect data, not a transient race.

---

## 4. Phase C — "Reporting Hierarchy" grid column

### What it looks like

A new column on the Employee Listing grid, between "Last name" and "Email", showing each employee's ordered reporting chain (root manager → … → the employee) as a row of small initials avatars:

```
[SA] → [SR] → [RV]
 ^      ^      ^
 root   ...    this employee (highlighted, blue)
```

- Hovering any avatar shows that person's full name in a tooltip, positioned below the avatar.
- Chains of **10 or fewer** entries render fully inline.
- Longer chains compress to **first-5 → "…" → last-5** — hovering the "…" avatar shows the collapsed middle names as a plain list.
- The terminal avatar (the row's own employee, not an ancestor) is highlighted in blue so it's identifiable at a glance.

This went through two design iterations before landing here:
1. First pass: plain names separated by arrows, first-2/…/last-2. Rejected — looked cluttered, and long names got clipped by the cell's `overflow: hidden` (a real layout bug, not just a cosmetic one).
2. Switched to compact initials avatars (fixes both problems at once — much smaller footprint, plus a name that's cut off still shows fully on hover). Threshold raised to first-5/…/last-5 once avatars made room for it. Tooltip placement moved to below the avatar per feedback.

**File (new):** `apps/ui/iwork/src/app/pages/EmployeePage/EmployeeListing/ReportingHierarchyCellRenderer.tsx`

### How it's built (backend)

Reads **only** the precomputed `employee_hierarchy` table — never a live
recursive query over `users` — staying inside the scope guardrail in §1.

`employee_hierarchy` has no depth/level column, but ordering is still
derivable: for a given employee, their set of ancestors is a strict linear
chain (every user has exactly one direct manager), so for any two ancestors
A and B of the same employee, one is always an ancestor of the other. That
means `depth(A) = count of the employee's other ancestors that are
themselves ancestors of A` — 0 for the root, highest for the direct manager.
Computed with one self-join, batched across every employee in the query at
once (`employee.repository.ts`, `buildReportingChains`).

**API design decision — folded into the main listing response, not a separate call.**
The first implementation added a standalone `POST /employee/reporting-chain`
endpoint and had the frontend call it separately after loading each page of
the grid (two round trips per page load). On review this was unnecessary:
the SQL cost is identical either way (same batched self-join over the same
page of userIds), so splitting it into two calls only added a second HTTP
round trip for no benefit — if anything, folding it into the single listing
call is marginally *faster* end-to-end, not slower. `getEmployees`
(`employee.repository.ts`) now builds the reporting chains for its own page
of results **inside its existing transaction** and merges `reportingChain`
directly onto each returned `EmployeeDto`, so the frontend gets everything
in one response.

The standalone `POST /employee/reporting-chain` endpoint (and its DTO/
swagger metadata) were left in place, unused by the listing page now, in
case a future single-employee view (e.g. Employee Details) wants a chain
without pulling the whole list — flagged as dead-code-for-now rather than
silently removed; can be deleted if unwanted.

### Files

**Backend:**
- Edited `apps/services/org-service/src/app/employee/employee.repository.ts` — `buildReportingChains` (shared core logic, works with either a `DataSource` or an `EntityManager`), `getReportingChains` (standalone, now a thin wrapper), `getEmployees` (now merges `reportingChain` onto each row inside its own transaction)
- Edited `apps/services/org-service/src/app/employee/employee.service.ts` — `getReportingChains` wrapper
- Edited `apps/services/org-service/src/app/employee/employee.controller.ts` — `POST /employee/reporting-chain` (standalone, currently unused by the UI)
- Edited `apps/services/org-service/src/app/employee/employee.swagger.ts` — `reportingChainSwaggerMetadata`
- New `apps/services/org-service/src/app/employee/dto/get-reporting-chain.dto.ts`
- Edited `apps/services/org-service/src/app/employee/dto/employee.dto.ts` — added `reportingChain` field

**Frontend:**
- New `apps/ui/iwork/src/app/pages/EmployeePage/EmployeeListing/ReportingHierarchyCellRenderer.tsx`
- Edited `apps/ui/iwork/src/app/pages/EmployeePage/EmployeeListing/tableConfig.ts` — new column definition
- Edited `apps/ui/iwork/src/app/pages/EmployeePage/EmployeeListing/types.ts` — `ReportingChainEntry` type
- Edited `apps/ui/iwork/src/app/pages/EmployeePage/EmployeeListing/index.tsx` — no separate fetch needed; `rowData` already carries `reportingChain` from the main `GET /employee` response
- Edited `apps/ui/ui-lib/src/lib/constants/endPoints.ts` — `employeeReportingChain` (standalone endpoint, currently unused by the listing page)

---

## 5. Verification performed

- `npx nx run scheduler-service:build --skip-nx-cache` — clean (Phase A)
- `npx nx run org-service:build --skip-nx-cache` — clean (Phase B, Phase C backend, and the API-folding change)
- `npx nx run iwork:build --skip-nx-cache` — clean (Phase C frontend, through both design iterations)

## 6. Still outstanding

- **The cron does nothing until `database-migrations/sql/employee-hierarchy-rebuild-scheduler-config.sql` is run against the database.** This is a hand-off script, not auto-applied.
- The same missing-`userId` JWT gap flagged in Phase A exists in 4 other pre-existing schedulers (`company-migration`, `policy-migration`, `generic-tpa-sync`, `tpa-claims-worker`) — explicitly deferred, not fixed here.
- Migrating the ~20+ live-recursive-query call sites in policy-service/opportunity-service/org-service/`ScopeService` to actually read from `employee_hierarchy` (the change that would fix their runtime cost) — explicitly out of scope for this pass, per §1.

---

## 7. Appendix — how `rebuildFlatHierarchy` actually builds the table

This is the existing full-rebuild routine that both the manual "Rebuild
Hierarchy" button and the new nightly cron (§2) call —
`EmployeeRepository.rebuildFlatHierarchy` in
`apps/services/org-service/src/app/employee/employee.repository.ts`. It was
already there before this work; documenting it here since the explanation
was missing and everything else in this doc builds on top of what this
produces.

Runs inside a single DB transaction, in two steps:

**Step 1 — wipe the table.**
```ts
await entityManager.clear(EmployeeHierarchy);
```
A full truncate, not a selective delete — every existing row is gone before the rebuild starts.

**Step 2 — one bulk recursive-CTE insert, no per-user loop.**
```sql
WITH RECURSIVE hierarchy AS (
  -- Base: every valid IIRM user is the root of their own subtree
  SELECT
    u.id AS root_user_id,
    u.id AS user_id,
    u.reporting_user_id,
    1 AS lvl
  FROM users u
  WHERE u.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')

  UNION ALL

  -- Recursive: walk DOWN to every subordinate, carrying root_user_id forward
  SELECT
    h.root_user_id,
    u.id AS user_id,
    u.reporting_user_id,
    h.lvl + 1 AS lvl
  FROM users u
  JOIN hierarchy h ON u.reporting_user_id = h.user_id
  WHERE u.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
)
INSERT INTO employee_hierarchy (user_id, reporting_user_id, created_by, updated_by)
SELECT DISTINCT ON (root_user_id, user_id)
  user_id, root_user_id, <creator>, <creator>
FROM hierarchy
WHERE user_id != root_user_id
ORDER BY root_user_id, user_id, lvl;
```

Walking through what this actually does:

1. **Base case** — every user of a valid IIRM type (`USER_TYPE_IIRM_EMPLOYEE` or `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE`) starts a traversal rooted at themselves (`root_user_id = user_id`, `lvl = 1`). This runs once per user in the table, in parallel conceptually — there's no "start from the CEO and walk down" ordering, every valid user independently becomes a root.
2. **Recursive case** — for each root's traversal, join `users` to find everyone whose `reporting_user_id` equals the current node's id, i.e. their direct reports, and add them to that root's result set at `lvl + 1`. This repeats until no more subordinates are found for any branch, which is how the FULL transitive downline (not just direct reports) ends up attached to each root.
3. **Final `SELECT`** — flattens the CTE's output into `employee_hierarchy` rows. For a given `(root_user_id, user_id)` pair, `DISTINCT ON` keeps exactly one row (ordered by `lvl`, so the shortest path wins if a pair were ever reachable more than one way — in a strict single-manager hierarchy there's normally only one path, so this is more a safety net than something that fires in practice). `WHERE user_id != root_user_id` drops the trivial self-pair every root would otherwise generate as its own "level 1" row.
4. **Net effect** — for every valid user acting as `root_user_id`, one `employee_hierarchy` row gets inserted for every person in their entire downline, regardless of depth: `reporting_user_id = root_user_id`, `user_id = <descendant>`. This is exactly the "flattened closure table" semantics the rest of this document (and `libs/service-lib/src/lib/utils/scope.utils.ts`'s own comment) assumes: *for a given `userId`, every row where `reportingUserId = userId` is one of that manager's transitive reports — not just their direct ones.*

This bulk, set-based approach is also why the rebuild is a single SQL
statement rather than a per-employee loop — Postgres computes the entire
org's transitive closure in one pass, which is what makes it viable to run
as a nightly cron over the whole table rather than something that has to be
walked employee-by-employee.
