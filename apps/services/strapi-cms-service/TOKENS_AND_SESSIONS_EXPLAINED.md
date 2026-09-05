# 🎫 Strapi Tokens and User Data - Complete Explanation

## 📍 WHERE USER DETAILS COME FROM ON LOGOUT

### Question: Where do IIRM User ID and Email come from?

**Answer:** They come from **JWT tokens** stored in **browser cookies**.

---

## 🔑 ALL TOKENS IN THE SYSTEM

### 1. **enhancedAdminToken** (Cookie) ✅ HIGHEST PRIORITY
**Location:** Browser Cookie `enhancedAdminToken`  
**Created:** [admin-sso.ts](src/middlewares/admin-sso.ts) (lines 95-119)  
**Purpose:** Track real IIRM user when accessing Strapi admin panel

**Payload Structure:**
```json
{
  "id": 5,                          // Strapi admin ID (for Strapi functionality)
  "realUserId": 2,                  // ✅ REAL IIRM USER ID (for audit logs)
  "email": "admin@example.com",      // Strapi admin email
  "realUserEmail": "john@domain.com", // ✅ REAL IIRM USER EMAIL (for audit logs)
  "type": "admin-session",
  "userMapping": {
    "strapiAdminId": 5,
    "realIirmUserId": 2,             // ✅ REAL IIRM USER ID
    "realIirmEmail": "john@domain.com" // ✅ REAL IIRM USER EMAIL
  }
}
```

**Used For:**
- ✅ Logout audit logging with REAL user ID
- ✅ Admin panel access tracking
- ✅ Session management

---

### 2. **jwtToken** (Cookie)
**Location:** Browser Cookie `jwtToken`  
**Created:** Strapi session manager  
**Purpose:** Standard Strapi admin authentication

**Payload Structure:**
```json
{
  "id": 5,                          // Strapi admin ID
  "type": "access",
  "exp": 1234567890
}
```

**Used For:**
- Admin panel API calls
- Strapi internal authentication

---

### 3. **strapi_admin_refresh** (Cookie)
**Location:** Browser Cookie `strapi_admin_refresh`  
**Created:** Strapi session manager  
**Purpose:** Refresh token for admin session

**Payload Structure:**
```json
{
  "type": "refresh",
  "deviceId": "uuid-here",
  "exp": 1234567890
}
```

**Used For:**
- Refreshing expired access tokens
- Long-term session persistence

---

### 4. **SSO Token** (From iwork/IBP login)
**Location:** Query parameter `?ssoToken=...` OR Request body  
**Created:** iwork auth-service after user login  
**Purpose:** Initial authentication to Strapi

**Payload Structure:**
```json
{
  "userDetails": {
    "userId": 2,                    // ✅ REAL IIRM USER ID
    "emailId": "john@domain.com",    // ✅ REAL IIRM USER EMAIL
    "firstName": "John",
    "lastName": "Doe",
    "roleId": 3,
    "organisationId": 1
  },
  "type": "auth",
  "exp": 1234567890
}
```

**Used For:**
- Initial authentication to Strapi admin panel
- Creating enhanced admin token with real user mapping

---

## 💾 DATABASE STORAGE (Strapi PostgreSQL)

### Table: `user_sessions`
**Purpose:** Track active user sessions

**Columns:**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER          -- ✅ REAL IIRM USER ID (from token)
email           VARCHAR(255)     -- ✅ REAL IIRM USER EMAIL (from token)
session_token   TEXT             -- JWT token
session_id      VARCHAR(255)     -- Unique session identifier
expires_at      TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
ip_address      VARCHAR(45)
user_agent      TEXT
```

---

### Table: `user_audits`
**Purpose:** Audit trail for all user activities

**Columns:**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER          -- ✅ REAL IIRM USER ID (from token payload)
email           VARCHAR(255)     -- ✅ REAL IIRM USER EMAIL (from token payload)
activity        VARCHAR(50)      -- 'login', 'logout', 'access', etc.
description     TEXT
timestamp       TIMESTAMP
ip_address      VARCHAR(45)
user_agent      TEXT
metadata        JSONB            -- Additional data like logoutTime, logoutType
```

**Example Logout Record:**
```json
{
  "user_id": 2,                    // ✅ From token.realUserId
  "email": "john@domain.com",      // ✅ From token.realUserEmail
  "activity": "logout",
  "description": "User logged out",
  "timestamp": "2026-02-27 10:30:00",
  "ip_address": "192.168.1.100",
  "metadata": {
    "logoutTime": "2026-02-27T10:30:00Z",
    "logoutType": "admin_logout",
    "tokenExpired": false
  }
}
```

---

## 🔄 LOGOUT FLOW - WHERE USER DATA IS EXTRACTED

### File: [admin-logout-tracker.ts](src/middlewares/admin-logout-tracker.ts)

#### Step 1: Get Token (Lines 107-170)
```typescript
// Priority 1: Enhanced admin token cookie (has real user mapping)
const enhancedAdminToken = ctx.cookies?.get('enhancedAdminToken');

// Priority 2: SSO token from query/body
const ssoToken = ctx.request.query?.ssoToken;

// Priority 3: Standard Strapi cookies
const jwtTokenCookie = ctx.cookies?.get('jwtToken');
const strapiAdminJwt = ctx.cookies?.get('strapi-admin-jwt');
```

#### Step 2: Decode Token (Lines 220-243)
```typescript
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || "r97lUhAaTL";
const decoded = jwt.verify(token, secret);
```

#### Step 3: Extract User Info (Lines 276-315)
```typescript
let userId = null;
let email = null;

// OPTION 1: Enhanced admin token with userMapping
if (decoded.userMapping) {
  userId = decoded.userMapping.realIirmUserId;  // ✅ REAL IIRM USER ID
  email = decoded.userMapping.realIirmEmail;     // ✅ REAL IIRM USER EMAIL
}

// OPTION 2: Admin token with realUserId fields
else if (decoded.realUserId) {
  userId = decoded.realUserId;                   // ✅ REAL IIRM USER ID
  email = decoded.realUserEmail;                 // ✅ REAL IIRM USER EMAIL
}

// OPTION 3: Regular auth token
else if (decoded.userDetails) {
  userId = decoded.userDetails.userId;           // ✅ REAL IIRM USER ID
  email = decoded.userDetails.emailId;           // ✅ REAL IIRM USER EMAIL
}

// OPTION 4: Fallback to token id
else {
  userId = decoded.id || decoded.userId;         // Strapi admin ID (fallback)
  email = decoded.email;                         // Strapi admin email (fallback)
}
```

#### Step 4: Write to Database (Lines 330-345)
```typescript
await strapi
  .service("api::auth-integration.auth-integration")
  .trackUserSessionWithMetadata(
    userId,      // ✅ REAL IIRM USER ID (extracted from token)
    email,       // ✅ REAL IIRM USER EMAIL (extracted from token)
    token,
    'logout',
    {
      ipAddress,
      userAgent,
      logoutTime: new Date(),
      logoutType: 'admin_logout',
      tokenExpired: false
    }
  );
```

---

## 📊 SUMMARY: How Many Tokens?

| Token Type | Storage | Has Real User ID? | Priority | Used For |
|------------|---------|-------------------|----------|----------|
| **enhancedAdminToken** | Cookie | ✅ YES | 🥇 1st | Logout audit with real user |
| **ssoToken** | Query/Body | ✅ YES | 🥈 2nd | Initial SSO authentication |
| **jwtToken** | Cookie | ❌ NO | 🥉 3rd | Strapi admin access |
| **strapi_admin_refresh** | Cookie | ❌ NO | 4th | Token refresh |
| **strapi-admin-jwt** | Cookie | ❌ NO | 5th | Old Strapi sessions |

---

## ✅ FINAL ANSWER TO YOUR QUESTIONS

### Q1: "Where are you getting those user details (IIRM user ID and email)?"
**A:** From **JWT token payload** → specifically from `enhancedAdminToken` cookie which contains:
- `realUserId` (IIRM user ID: 2)
- `realUserEmail` (IIRM user email: john@domain.com)
- `userMapping.realIirmUserId`
- `userMapping.realIirmEmail`

### Q2: "In session token, what columns are in the database?"
**A:** `user_sessions` table has:
- `user_id` (IIRM user ID from token)
- `email` (IIRM email from token)
- `session_token` (full JWT)
- `session_id`
- `expires_at`
- `ip_address`
- `user_agent`

### Q3: "How many tokens and where?"
**A:** **5 main tokens:**
1. `enhancedAdminToken` (cookie) ← **This one has real user ID!**
2. `ssoToken` (query/body)
3. `jwtToken` (cookie)
4. `strapi_admin_refresh` (cookie)
5. `strapi-admin-jwt` (cookie)

### Q4: "What is there in other tokens (SSO token, other tokens)?"
**A:**
- **SSO Token:** Contains `userDetails.userId` and `userDetails.emailId` (real IIRM user data)
- **Enhanced Admin Token:** Contains `realUserId`, `realUserEmail`, and `userMapping` (real IIRM user data)
- **Standard Strapi Tokens:** Only contain Strapi admin ID (not real IIRM user data)

---

## 🎯 KEY TAKEAWAY

On logout, the system extracts **REAL IIRM user ID (2)** and **REAL IIRM email** from the **enhancedAdminToken cookie**, which was created during SSO login and contains a mapping between Strapi admin ID and the real IIRM user who logged in.

**Without this enhanced token, only Strapi admin ID would be logged (not useful for audit trails).**
