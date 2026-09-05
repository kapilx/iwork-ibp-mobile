# HR Module — CRM Portal Redirect Changes
Date: 2026-05-25
Branch: feature/hr-module-updates-dev-v1.10

---

## Problem Summary
iWork CRM users clicking "HR Portal" on a company row were hitting multiple issues:
1. `ReferenceError: Cannot access 'handleHrPortalRedirect' before initialization` (TDZ crash)
2. `401 Access denied` on `POST /crm-redirect-token`
3. Redirect opened in same tab
4. Redirect went to wrong port (iWork 5017 instead of IBP 4201)
5. Double-slash URL (`//hr-portal/portfolio`) caused redirect to `/landing`
6. Company-specific portal URL not used (e.g. wih.teamlease.com)
7. Username showed "User" instead of logged-in CRM user's name
8. Portfolio showed only 1 company instead of all CRM-managed companies
9. User Management page had no sidebar (wrong route)

---

## Files Changed

### 1. `apps/services/auth-service/src/app/simple-auth/simple-auth.service.ts`
**What**: `generateCrmRedirectToken` method
- Fetches company name (`companyName`) and caller user's name (`firstName`, `lastName`, `emailId`)
- Includes all three in the JWT payload so frontend can display them without extra API calls
- Returns `portalUrl` from `company_portal_configuration` table (raw SQL to avoid TypeORM eager-relation conflict)

**Key change**:
```typescript
// Before
const payload = { userDetails: { userId, roles, organisationId }, portal, companyId, roleKey };

// After
const callerUser = await this.userRepository.findById(callerUserId);
const payload = {
  userDetails: { userId, firstName, lastName, emailId, roles, organisationId },
  portal, companyId,
  companyName: company.companyName,  // ← new
  roleKey,
};
return { accessToken, portalUrl };   // ← portalUrl new
```

---

### 2. `apps/services/service-lib/src/lib/acl.guard.ts`
**What**: Added `hr-module` and `/crm-redirect-token` to the ACL bypass list
```typescript
path.includes("hr-module") ||
path.includes("/crm-redirect-token") ||
```

---

### 3. `apps/ui/ui-lib/src/lib/environment.ts`
**What**: Added `ibpAppUrl` to the environment object
```typescript
VITE_IBP_APP_URL,   // added to destructure
ibpAppUrl: VITE_IBP_APP_URL || "https://ibp.divami.com",  // added field
```

---

### 4. `apps/ui/ui-lib/src/lib/constants/endPoints.ts`
**What**: Added `crmRedirectToken` and `hrUsersList` endpoints
```typescript
crmRedirectToken: environment.authUrl + "/crm-redirect-token",
hrUsersList: environment.ibpUrl + "/hr-module/hr-users",
```

---

### 5. `apps/ui/iwork/src/app/pages/CompanyPage/CompanyListing/index.tsx`
**What**: Added "Open HR Portal" button per company row
- Fixed TDZ crash: moved `handleHrPortalRedirect` declaration above `useMemo` that references it
- Calls `POST /crm-redirect-token` → gets `{ accessToken, portalUrl }`
- Strips trailing slash: `.replace(/\/$/, "")` — prevents `//hr-portal/portfolio` double-slash
- Opens new tab: `window.open(..., "_blank")`

```typescript
const portalBase = (res?.data?.portalUrl || environment.ibpAppUrl).replace(/\/$/, "");
window.open(`${portalBase}/hr-portal/portfolio?token=...&companyId=...`, "_blank");
```

---

### 6. `apps/ui/iwork/src/app/pages/CompanyPage/CompanyDetails/index.tsx`
**What**: Same HR Portal redirect button on the company details page
- Same trailing-slash strip and `window.open(_blank)` pattern

---

### 7. `apps/ui/iwork/src/app/pages/CompanyPage/CompanyListing/tableConfig.ts`
**What**: Added "Open HR Portal" action column button to the table config
- Button only visible when `currentUserId === row.leadCrm`

---

### 8. `apps/ui/ibp/src/app/app.tsx`
**What**: Removed duplicate `/hr-portal/user-management` standalone route
- Before: separate route rendered `HRPortalUserManagement` WITHOUT the `HRPortal` wrapper (no sidebar)
- After: removed it — falls through to `/hr-portal/*` → `HRPortal` → inner route `user-management` (WITH sidebar)

```tsx
// Removed:
<Route path="/hr-portal/user-management" element={<Box ...><HRPortalUserManagement /></Box>} />
```

---

### 9. `apps/ui/ibp/src/app/pages/HRPortal/index.tsx`
**What**: Token processing and CRM portal setup

#### a) Synchronous token processing (fixes redirect-to-landing race condition)
```typescript
// Before: useEffect (runs after paint — children saw empty sessionStorage → redirect to /landing)
// After: synchronous ref guard (runs during render — sessionStorage set BEFORE children mount)

const tokenHandled = useRef(false);
if (!tokenHandled.current) {
  tokenHandled.current = true;
  const token = searchParams.get("token");
  if (token) {
    sessionStorage.setItem("user", JSON.stringify({ ... }));
  }
}
```

#### b) Stores name + company in sessionStorage
```typescript
sessionStorage.setItem("user", JSON.stringify({
  userId, firstName, lastName, email,
  companyId: cid, organisationId: cid,
  companyName: cName,           // ← fixes "Insurance Management" static header
  crmOriginCompanyId: cid,      // ← used as default dashboard company
  roleKey: "PORTAL_CRM",
  isEmployee: false, isHR: false,
}));
```

#### c) Auto-load default dashboard company
```typescript
// For CRM users, use crmOriginCompanyId (token company) as dashboard default
// instead of fetching first portfolio company
const originCid = storedUser?.crmOriginCompanyId ?? null;
if (originCid) {
  setPortfolioCompanyId(originCid);
  if (originName) setPortfolioCompanyName(originName);
  return;
}
// Fallback: fetch with companyId:"" so backend uses crmUserId alone (not group-filtered)
apiRequest(..., { data: { companyId: "", crmUserId: String(uid), hrCompanyId: "" } })
```

---

### 10. `apps/ui/ibp/src/app/pages/HRPortalPortfolio/index.tsx`
**What**: Fixed portfolio to show ALL CRM-managed companies

#### a) SessionStorage fallback for role detection
```typescript
// employeeDetails API fails for PORTAL_CRM token (iWork user, not IBP employee)
.catch(() => {
  const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
  if (stored?.roleKey) {
    setUserRole(stored.roleKey);   // "PORTAL_CRM"
    setUserId(String(stored.userId ?? ''));  // "2"
    setUserCompanyId(String(stored.companyId ?? ''));
  }
})
```

#### b) CRM users: pass empty companyId/hrCompanyId to portfolio queries
```typescript
const isCrm = userRole === 'PORTAL_CRM';
const params = {
  companyId:   isCrm ? '' : String(companyId),   // ← empty for CRM
  hrCompanyId: isCrm ? '' : String(companyId),   // ← empty for CRM
  crmUserId: '',
  locationIds,
  ...roleParams,  // { crmUserId: "2" } for PORTAL_CRM
};
```

**Why**: When `hrCompanyId = '343048'` (old), the SQL `c.id = 343048` filtered to ONE company.
With `hrCompanyId = ''`, SQL skips company filter → CRM user sees all their companies.

---

### 11. `database-migrations/sql/fix_portfolio_crm.sql` *(new file)*
**What**: DB patch to fix the portfolio SQL policy-count filter

**Problem in SQL**:
```sql
AND (
  COALESCE(pc.lh_policy_count, 0) > 0                                -- LH only
  OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)  -- all IF hrCompanyId set
)
```
When `hrCompanyId = ''` (CRM mode), only Life & Health policy companies appeared.
Out of 53 companies for userId=2, only 4 had LH policies → 49 companies hidden.

**Fix** (add one line to both `portfolio_individual_companies` and `portfolio_group_companies`):
```sql
OR (###crmUserId### != '' AND COALESCE(pc.policy_count, 0) > 0)
```
Now CRM users see companies with ANY policy type.

**Run**:
```bash
psql -h localhost -p 5432 -U abhi -d "iirmpreprod-19052026" -f /tmp/fix_portfolio_crm.sql
```

---

## Services to Restart After These Changes

| Service | Why |
|---------|-----|
| `auth-service` | `portalUrl`, `companyName`, `firstName/lastName` in token |
| IBP dev server (`apps/ui/ibp`) | All IBP frontend changes |
| iWork dev server (`apps/ui/iwork`) | `VITE_IBP_APP_URL`, redirect fixes, TDZ fix |

---

## End-to-End Flow (After Fix)

1. CRM user in iWork → Companies tab → clicks "HR Portal" on a row
2. `POST /crm-redirect-token` returns `{ accessToken, portalUrl: "https://wih.teamlease.com/" }`
3. iWork strips trailing slash → opens `https://wih.teamlease.com/hr-portal/portfolio?token=...&companyId=343048`
4. IBP app loads — `HRPortal` decodes token synchronously, writes to sessionStorage:
   - `firstName: "Ramakrishna"`, `lastName: "Vurakaranam"`, `companyName: "Teamlease Services Ltd"`
   - `crmOriginCompanyId: 343048`, `roleKey: "PORTAL_CRM"`, `userId: 2`
5. `useEffect` strips token from URL → `/hr-portal/portfolio?companyId=343048`
6. Header shows: "Ramakrishna Vurakaranam / PORTAL CRM" + correct company name
7. Portfolio calls report API with `{ hrCompanyId: "", crmUserId: "2" }` → returns all CRM-managed companies
8. Dashboard tab → auto-loads company 343048 (Teamlease) — the one clicked from iWork
9. Clicking another company in portfolio → dashboard updates to that company
