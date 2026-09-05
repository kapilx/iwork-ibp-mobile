# File Password Protection Feature

## Overview

When a user downloads a file, the system optionally wraps it in a password-protected format before streaming it back. The feature is controlled at:

1. **Global flag** — environment variable `ENABLE_FILE_PASSWORD_PROTECTION`


Both must be enabled for a file to be protected. If either is off, the raw file is returned as-is.

---

## Services Involved

| Service | Role |
|---|---|
| **org-service** | Handles on-demand file downloads and bulk ZIP downloads |
| **document-service** | Stores and serves module-level enable/disable config (`password_protection_config`) |
| **scheduler-service** | Applies protection to scheduled report CSV exports |
| **service-lib** | Shared utility library — all encryption logic lives here |

---

## Environment Variable

```env
ENABLE_FILE_PASSWORD_PROTECTION=true
```

- Defined in `environments/.env.dev` (and equivalent per-environment files).
- Read in `service-lib` via `ENV.ENABLE_FILE_PASSWORD_PROTECTION`.
- When `"true"`, the global flag is on. Any other value (including absent) disables the feature globally.
- **Only used in backend services.** No frontend (`VITE_`) equivalent.

## Decision Flow (Download)

```
User requests file download
        │
        ▼
isPasswordProtectionEnabled()?  ──No──▶  Return raw file
        │ Yes
        ▼
Infer moduleKey from file metadata
        │
        ▼
getModulePasswordConfig(moduleKey)?  ──No──▶  Return raw file
        │ Yes
        ▼
Fetch FilePasswordConfig from DB
        │
        ▼
generatePasswordFromConfig(config, userDetails)
        │
        ▼
applyPasswordProtection(buffer, fileName, password)
        │
        ▼
Return encrypted file stream to client
```

---