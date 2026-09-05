# Activity History — TRD

**Frontend:** `apps/ui/ibp/src/app/components/ActivityLogSection/`, `apps/ui/ibp/src/app/pages/ActivityLogPreview/`
**Backend:** `ibp-service` (`company-employee` module) · Entity: `UserActivityLog` (`service-lib`)
**Status:** Draft (as-is architecture documented; the PRD's core screen and most listed activity types are unbuilt) · **Last updated:** 2026-07-20
**Related:** [phase-1-product-spec.md](./phase-1-product-spec.md) — product requirements (written in an idealized/aspirational style — see §1 for how far the real implementation diverges)

---

## 1. Headline finding: this is mostly write-side infrastructure with a minimal, un-filterable read affordance

The PRD describes a dedicated "Activity History" screen with type/date-range filters and a retrieval contract `GET /activity-history?userId=&type=&from=&to=`. **None of that exists.** What's actually built:

- **No standalone `/activity-history` route.** `ActivityLogSection` (a component, not a page) is embedded inside the **Profile page** (`ProfilePage/index.tsx:1-23`, mounted below `ProfileSection`, route `/profile`). Activity History today is a passive sub-section of Profile, not a discoverable screen of its own.
- **No filters** — no type dropdown, no date-range picker, anywhere in the UI.
- **No pagination** — the backend hard-caps at the 10 most recent rows (confirmed: `take: 10` at `company-employee.repository.ts:4000`), with no way to see older activity.
- A secondary page, `ActivityLogPreview` (route `/activity-log-preview`), exists but is a **single-item** HTML/PDF viewer for one activity (mainly `*_EMAIL_SENT` types) — not a browsable list.

So: the write path is real and broadly used; the read path exists but is minimal (unfiltered "my last 10"); the PRD's filterable, dedicated screen is aspirational.

## 2. Entity and endpoints

**Entity** — `apps/services/service-lib/src/lib/entities/user-activity-log.entity.ts`, table `user_activity_log`:
```ts
id                bigint, PK
user_id           bigint, nullable
activity_key      varchar(50), not null
activity_category varchar(50), not null
action_date       timestamp, default now()
reference_id      varchar(100), nullable
reference_type    varchar(50), nullable
metadata          jsonb, nullable
created_at        timestamp, default now()
deleted_at        timestamp, nullable (soft delete)
```
Confirmed directly against the source — column-for-column. **No migration file was found** for this table (searched `.sql`/migration folders across `apps/services`) — flagged as a gap to confirm before relying on it further in production; it likely relies on TypeORM schema sync rather than a tracked migration.

**Write:** `POST /company-employee/user-activity-log` → `company-employee.controller.ts:2733-2788` (`createUserActivityLog`, requires a `userid` header) → DTO `CreateUserActivityLogDto` (`activityKey` required max 50 chars, `activityCategory?`, `referenceId?`, `referenceType?`, `metadata?`) → `company-employee.service.ts:8868-8877` → `company-employee.repository.ts:4033-4059` (plain `.create()`/`.save()`).

**Read:** `GET /company-employee/user-activity-log` → `company-employee.controller.ts:2853-2905` (`getUserActivityLogs`), accepting only `employeeId` and `activityKey` query params — **no `type`, no `from`/`to` date range**, contrary to the PRD's contract. Two code paths:
- If `employeeId` is given: `getMailActivityLogsByEmployeeId` (`company-employee.repository.ts:4108-4136`) — a query-builder scoped to `referenceType = 'NOTIFICATION_INFO'` and `metadata->>'employeeId'` — i.e. it only returns email-notification activities for a given employee. This is an **HR/admin lookup path**, not a general feed.
- Otherwise: `getUserActivityLogs` (`company-employee.repository.ts:3991-4031`) — `find({ where: {userId, activityKey}, order: {actionDate desc, createdAt desc}, take: 10 })`. This is what `ActivityLogSection` actually calls (with no params at all, per §3), returning the caller's own last 10 rows.

## 3. Consumers of the read endpoint

Three, none matching the PRD's filterable employee-facing screen:

1. **`ActivityLogSection`** (`apps/ui/ibp/src/app/components/ActivityLogSection/index.tsx:28-32`) — the one real employee-facing read. Calls the endpoint with **no query params**, so it's always "my last 10, unfiltered."
2. **`HRPortalEmployeeProfile`** (`apps/ui/ibp/src/app/pages/HRPortalEmployeeProfile/index.tsx:235-236`) — `?employeeId=...&activityKey=CONFIRMATION_EMAIL_SENT`. HR-portal admin tooling to look up one specific employee's past enrolment-confirmation email — not a general timeline, and not employee-facing.
3. **`hr.repository.ts:945-949`** — raw SQL directly against `user_activity_log` (`SELECT DISTINCT user_id ... WHERE activity_key='LOGGED_IN'`) to compute a "not logged in" count for an HR reporting dashboard — bypasses the controller entirely, not a retrieval API in the PRD's sense.

## 4. Write call sites — what's actually logged today

All POST to the same endpoint (`endPoints.getActivityLogs`). Frontend-triggered:

| activityKey | activityCategory | Call site |
|---|---|---|
| `LOGGED_IN` | `AUTH` | `SignIn/index.tsx:1797-1806`, `OTPAuth/index.tsx:290-299`, `CustomEmailOTP/index.tsx:~289`, `OAuthCallback/index.tsx:61-71` |
| `LOGGED_OUT` | `AUTH` | `Header/index.tsx:342-352`, `ProfileSection/index.tsx:269-279`, `TermsAndConditionsPopup/index.tsx:66-76`, `utils/index.tsx:18-28` (401-triggered), `HRPortal/index.tsx:478-488` (HR-portal logout, same table) |
| `DOCUMENT_VIEWED` / `DOCUMENT_DOWNLOADED` | `DOCUMENT` | `MyDocuments/PolicyFeatureDocTab.tsx:381-413` (`createDocumentActivityLog`), plus `DOCUMENT_DOWNLOADED` also from `ActivityLogPreview/index.tsx:98-138` |
| `ECARD_VIEWED` / `ECARD_DOWNLOADED` | `DOCUMENT` | `ECardPage/index.tsx:214-240` (`createEcardActivityLog`); `ECARD_VIEWED` auto-fires once per session (line 242-246) |
| `TICKET_RAISED` | `SUPPORT` | `SupportPage/index.tsx:85-99`, `HRPortalComplaints/index.tsx:443-459` (HR-initiated on behalf of employee) |
| `SUBMITTED_ENROLLMENT` | `ENROLLMENT` | `MultiEnrollment/index.tsx:2666-2674` (via `logEnrollmentActivity`, a generic helper only ever called with this one key) |
| `LIFE_EVENT_ADDITION_SUBMITTED` / `LIFE_EVENT_DELETION_SUBMITTED` | `LIFE_EVENT` | `LifeEvents/index.tsx:1496-1530` (`logLifeEventActivity`) |

Backend-triggered (email-lifecycle hooks, bypass the controller entirely via `UserActivityLogService.createActivityLog()` directly, `service-lib/company-employee-activity-log.service.ts:25-50`, called from `onboarding.service.ts`):

| activityKey | Trigger |
|---|---|
| `INITIAL_ONBOARDING_EMAIL_SENT` | `onboarding.service.ts:722-731` |
| `CONFIRMATION_EMAIL_SENT` | `onboarding.service.ts:~1188` |
| `LIFE_EVENT_CONFIRMATION_EMAIL_SENT` | `onboarding.service.ts:1453-1469` |
| `ENROLLMENT_START_EMAIL_SENT` | `onboarding.service.ts:2218` |
| `ENROLLMENT_REMINDER_EMAIL_SENT` | `onboarding.service.ts:3321` |

**Notable dead spot:** `LIFE_EVENT_CONFIRMATION_EMAIL_SENT` is written but has no `case` in the frontend's rendering switch (`apps/ui/ibp/src/app/utils/map-activity-log.ts`) and carries no `activityText` in its metadata — it silently falls into the `default` branch (returns `null`, lines 339-343) and is **logged to the DB but never rendered** anywhere.

## 5. PRD's 14 activity types vs. reality

| PRD type | Status |
|---|---|
| Signed in | **Not built** — no distinct key from "Logged in" |
| Logged in | **Built** — `LOGGED_IN`, 4 write sites |
| Dependents saved | **Phantom** — UI render case exists (`map-activity-log.ts:99-106`), zero writers |
| Choices saved | **Phantom** — render case exists (`:108-115`), zero writers |
| Enrolment submitted | **Built** — `SUBMITTED_ENROLLMENT` |
| Documents viewed | **Built** — `DOCUMENT_VIEWED` |
| Documents downloaded | **Built** — `DOCUMENT_DOWNLOADED` |
| Claim initiated | **Phantom** — render case exists (`:173-180`), zero writers, no claim page references this endpoint at all |
| Claim submitted | **Phantom** — render case exists (`:182-189`), zero writers |
| Claim tracking view | **Phantom** — render case exists (`:191-198`), zero writers |
| Scheduled Callback request | **Not built at all** — the underlying "Schedule Call Back" UI feature itself is commented-out JSX in `SupportPage/index.tsx:298-307`; there's no feature to attach logging to |
| Contacted support | **Built, as a proxy** — `TICKET_RAISED` (ticket-raise, not literally "contacted support") |
| Enrolment status viewed | **Phantom** — render case exists (`:200-207`), zero writers |
| Claim Summary viewed | **Phantom** — render case exists (`:241-248`), zero writers; `ClaimsCorner` page never calls this endpoint |

**Net: 3 of 14 PRD-listed types are actually logged** (Logged in; Enrolment submitted; Documents viewed/downloaded, counted as one capability). **"Phantom" entries** — `ONBOARDED`, `DEPENDENT_ADDED`, `CHOICES_SELECTED`, `CLAIM_INITIATED`, `CLAIM_SUBMITTED`, `CLAIM_TRACKING_VIEWED`, `ENROLMENT_STATUS_VIEWED`, `CLAIM_SUMMARY_VIEWED` — have rendering logic already written in `map-activity-log.ts` with no corresponding write call site anywhere in the repo. This strongly suggests the display layer was built speculatively against this PRD, while the corresponding instrumentation in the Claims and Enrolment-status flows was never completed.

**activityKey values logged today that aren't in the PRD's list at all:** `LOGGED_OUT`, `ECARD_VIEWED`/`ECARD_DOWNLOADED`, `LIFE_EVENT_ADDITION_SUBMITTED`/`LIFE_EVENT_DELETION_SUBMITTED`, and a whole "system email sent" category (`INITIAL_ONBOARDING_EMAIL_SENT`, `CONFIRMATION_EMAIL_SENT`, `ENROLLMENT_START_EMAIL_SENT`, `ENROLLMENT_REMINDER_EMAIL_SENT`, `LIFE_EVENT_CONFIRMATION_EMAIL_SENT`) that's more sophisticated (previewable/downloadable as PDF via `ActivityLogPreview`) than anything the PRD describes.

## 6. Decisions — path to closing the gap between PRD and reality

### D1 — Extend the read endpoint to support the PRD's filter contract

**Change:** add `activityCategory` (or a `type` param matching the PRD's wording), `from`, and `to` query params to `getUserActivityLogs` (controller + service + repository), replacing the hard `take: 10` with real pagination (`limit`/`offset` or cursor-based). This is the single highest-leverage change — without it, no amount of frontend work can deliver the PRD's "filter by activity type and date range" requirement (US-ACTIVITY-HISTORY-001).

### D2 — Promote Activity History to its own screen

**Change:** give `ActivityLogSection`'s content a real route (e.g. `/activity-history`), reachable from the nav (or from Profile via a "View all" link, if keeping it profile-adjacent is intentional) — rather than only ever showing an un-filterable last-10 snippet embedded in Profile.

### D3 — Close the phantom-mapping gap by instrumenting the missing writers, or remove the dead render cases

For each of `DEPENDENT_ADDED`, `CHOICES_SELECTED`, `CLAIM_INITIATED`, `CLAIM_SUBMITTED`, `CLAIM_TRACKING_VIEWED`, `ENROLMENT_STATUS_VIEWED`, `CLAIM_SUMMARY_VIEWED`: either (a) add the missing write call site in the corresponding flow (Enrollment's dependent/choice-save handlers, the Claims flows, the enrolment-status view), matching the pattern already proven for `SUBMITTED_ENROLLMENT`/`DOCUMENT_VIEWED`, or (b) if these are no longer planned, remove the dead `case`s from `map-activity-log.ts` so the codebase doesn't carry speculative UI for logging that will never arrive. **Recommend (a) for `Dependents saved`/`Choices saved`** specifically, since Life Events already has a near-identical pattern (`logLifeEventActivity`) to model the enrollment-side equivalent against.

### D4 — Add a write call site for `LIFE_EVENT_CONFIRMATION_EMAIL_SENT`'s missing render case

Either add a `case` + `activityText` to `map-activity-log.ts` matching the pattern of the other `*_EMAIL_SENT` types (which do render via `ActivityLogPreview`), or confirm this is intentionally suppressed and document why — right now it's an inconsistency (logged, never shown) with no clear intent recorded.

### D5 — Confirm the missing migration

Locate or write the migration for `user_activity_log` before treating schema sync as a safe long-term source of truth for this table, consistent with whatever migration convention the rest of `service-lib`'s entities follow.

## 7. Testing plan

- **D1:** query the extended endpoint with a date range spanning known activity and confirm only in-range rows return; query with a `activityCategory`/`type` filter and confirm only matching rows return; confirm pagination returns rows beyond the old 10-row cap.
- **D2:** navigate to the new dedicated route and confirm the same data renders as today's embedded section, with the added filters from D1 wired to real UI controls.
- **D3:** for each newly-instrumented writer, perform the corresponding user action (save dependents without submitting, initiate a claim, etc.) and confirm the row appears with the pre-existing `map-activity-log.ts` rendering — no frontend rendering change should be needed if the phantom cases were built correctly.
- **D4:** trigger a life-event confirmation email and confirm it now renders in the Activity History list (or confirm intentional suppression, if that's the decision instead).

## 8. Rollout / risk

- D1 is additive (new optional query params, replacing a hard cap with real pagination) — no breaking change to the two existing HR-portal consumers, which use narrower, unaffected query shapes.
- D2 is routing-only for a component that already works — low risk.
- D3/D4 each add net-new writes to existing, already-shipped flows (dependents/choices save, claims, enrolment status view) — verify none of those flows have performance-sensitive hot paths where an extra fire-and-forget POST would matter; the existing `TICKET_RAISED`/`ECARD_VIEWED` writers already establish this is an accepted, low-overhead pattern elsewhere.
