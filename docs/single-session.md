# Single-Session Login (iWork)

**Purpose**  
Enable a single active login per user in iWork when a feature flag is turned on, and preserve all existing behavior when the flag is off.

**Requirement Summary**  
Only one active login is allowed per user across all browser tabs/windows/devices when the feature flag is enabled.  
When a second login is attempted, it must be blocked with a clear message.  
If the active session is later revoked, the old session must be forced to log out with a friendly message.

**Feature Flags**  
Backend flag (auth-service and guards): `IWORK_SINGLE_SESSION=true`  
Frontend flag (iWork UI): `VITE_FF_IWORK_SINGLE_SESSION=true`  
When either flag is false, the system behaves exactly like the old flow.

**Non-Impact Guarantee (Flag Off)**  
1. Redis is not used for session enforcement.  
2. JWTs do not include session identifiers.  
3. Guards do not check session validity.  
4. Login, refresh, and logout behave exactly as before.  
5. UI does not add `clientScopeId` and does not show session-revoked messaging.

**Behavior (Flag On)**  
1. User logs in successfully in one browser or tab.  
2. Any new login attempt for the same user is blocked and shows a full-screen notice.  
3. If a session is revoked, the client is forced to log out and is redirected to `/login` with a full-screen notice.

**Backend Flow (Auth Service + Guards)**  
1. On login, the UI sends `clientScopeId`.  
2. `AuthSessionService.establishSession()` checks Redis for an active session.  
3. If an active session exists, login is blocked with a 403 and a friendly message.  
4. If no active session exists, a new session ID is stored in Redis and added to the JWT as `sid`.  
5. All authenticated requests validate the `sid` against Redis.  
6. If the session is invalid or revoked, the response includes code `SESSION_REVOKED` or `SESSION_INVALID`.

**Frontend Flow (iWork UI)**  
1. When the flag is on, the login payload includes `clientScopeId`.  
2. The Axios interceptor checks for `SESSION_REVOKED` and logs the user out.  
3. A full-screen notice is shown on the login screen explaining why access was lost.  
4. The notice appears for both “already signed in” and “signed out due to another browser.”

**Redis Keys**  
Active session mapping: `auth:{<userId>}:activeSession`  
Revoked session marker: `auth:{<userId>}:revokedSession:<sessionId>`  
Hash tags `{<userId>}` ensure both keys land on the same Redis Cluster slot, which is required for `WATCH/MULTI/EXEC` to work in cluster mode.  
TTL is based on `SESSION_TIMEOUT_MINUTES` (backend). It does **not** depend on refresh token expiry.

**Logout Behavior**  
1. Logout revokes the active session only if the current `sid` matches the stored session.  
2. This prevents older tokens from logging out newer sessions.

**Race Safety**  
Redis `WATCH/MULTI/EXEC` is used to ensure only one session becomes active for a user.  
Near-simultaneous logins deterministically result in a single active session.

**Error Contract**  
When a revoked session makes a request:  
`{ code: "SESSION_REVOKED", message: "Session ended due to a new login." }`

**Why This Approach**  
1. Redis provides low-latency, centralized session enforcement across microservices.  
2. A feature-flag protects existing users and flows.  
3. It avoids changes to persistent DB schemas.

**Troubleshooting**  
1. Verify `IWORK_SINGLE_SESSION=true` is loaded by auth-service.  
2. Verify `VITE_FF_IWORK_SINGLE_SESSION=true` is loaded by the UI.  
3. Check login request includes `clientScopeId`.  
4. Confirm Redis is reachable and `auth:{<userId>}:activeSession` keys are created after login.

**DevOps Checklist**  
1. Provision Redis/Valkey and confirm connectivity from services.  
2. Set backend env vars on **both auth-service AND api-gateway** (both run `AuthGuard` and `AuthSessionService`):  
   - `IWORK_SINGLE_SESSION=true`  
   - `STORAGE_TYPE=valkey`  
   - `VALKEY_HOST=<redis_host>`  
   - `VALKEY_PORT=<redis_port>`  
   - `VALKEY_TLS=true|false` (true only if Redis requires TLS)  
3. Set frontend env var at **build time** (Vite bakes this into the bundle — setting it as a runtime env var has no effect):  
   - `VITE_FF_IWORK_SINGLE_SESSION=true`  
4. Restart auth-service, api-gateway, and iWork UI after env changes.  
5. No DB migrations or queries required.  

> **Why api-gateway needs these vars too:**  
> The api-gateway uses `AuthGuard` from `service-lib` to validate every authenticated request. It calls `AuthSessionService.validateSession()` which reads revoked session keys from Redis. If `IWORK_SINGLE_SESSION` or `STORAGE_TYPE` is missing on api-gateway, it silently skips all session checks and Browser 1 is never kicked out even after a force-login from Browser 2.

**Files Touched (Core)**  
Backend:  
`apps/services/service-lib/src/lib/auth-session/auth-session.service.ts`  
`apps/services/service-lib/src/lib/auth.guard.ts`  
`apps/services/auth-service/src/guards/auth.guard.ts`  
`apps/services/auth-service/src/app/simple-auth/simple-auth.service.ts`  
Frontend:  
`apps/ui/iwork/src/app/components/SignIn/index.tsx`  
`apps/ui/ui-lib/src/lib/utils/axiosInterceptors.ts`
