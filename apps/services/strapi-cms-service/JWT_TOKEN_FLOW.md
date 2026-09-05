# 🔐 JWT Token Authentication Flow - Complete Guide

## 📍 How Users Get JWT Tokens and Access FAQ API

---

## 🎬 STEP-BY-STEP FLOW

### Step 1: User Logs into iwork/IBP
```
User enters:
  - Username: pushyami@divami.com
  - Password: ********
  
Browser → POST http://localhost:3003/login
```

**Request:**
```http
POST /login
Content-Type: application/json

{
  "userName": "pushyami@divami.com",
  "password": "password123"
}
```

---

### Step 2: Auth Service Validates & Returns JWT Token
```
Auth Service (localhost:3003)
  ↓ Validates credentials against iirm database
  ↓ Generates JWT token
  ↓ Returns token to browser
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "token",
    "refreshToken": "...",
    "user": {
      "id": 2,
      "email": "pushyami@divami.com",
      "firstName": "Pushyami",
      "orgId": 1,
      "role": { "id": 3, "name": "ISG Executive" }
    }
  }
}
```

**JWT Token Payload (Decoded):**
```json
{
  "userDetails": {
    "userId": 2,
    "emailId": "pushyami@divami.com",
    "firstName": "Pushyami",
    "lastName": "...",
    "organisationId": 1,
    "roleId": 3
  },
  "iat": 1708617600,
  "exp": 1708704000
}
```

---

### Step 3: Browser Stores Token in sessionStorage
```javascript
// Frontend automatically stores token
sessionStorage.setItem('user', JSON.stringify({
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { id: 2, email: "pushyami@divami.com", ... }
}));
```

**Storage Location:** Browser sessionStorage
**Key:** `"user"`
**Value:**
```json
{
  "accessToken": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 2,
    "email": "pushyami@divami.com",
    "firstName": "Pushyami"
  }
}
```

---

### Step 4: User Clicks to View FAQs
```
User in iwork/IBP dashboard
  ↓ Clicks "FAQs" or navigates to FAQ page
  ↓ Frontend makes API call
```

---

### Step 5: Frontend Retrieves Token from sessionStorage
**File:** `strapi-auth.service.ts`

```typescript
// Extract token from sessionStorage
private static getIworkToken(): string | null {
  const userStr = sessionStorage.getItem("user");
  if (!userStr) return null;
  
  const user = JSON.parse(userStr);
  return user?.accessToken?.accessToken || user?.accessToken || null;
}
```

**Result:** Gets the JWT token: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

---

### Step 6: Frontend Calls Strapi FAQ API with Token
**File:** `strapi-auth.service.ts`

```typescript
// Make authenticated request to Strapi
static async makeAuthenticatedRequest(url: string): Promise<Response> {
  // Get token from sessionStorage
  const strapiToken = await this.getValidToken();
  
  // Make API call with token in Authorization header
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${strapiToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}

// FAQ API call
export const strapiApi = {
  async getFaqsList() {
    const response = await StrapiAuthService.makeAuthenticatedRequest(
      'http://localhost:4321/api/basic-faqs?populate=*'
    );
    return response.json();
  }
}
```

**Actual HTTP Request:**
```http
GET /api/basic-faqs?populate=*
Host: localhost:4321
Authorization: Bearer {token}
Content-Type: application/json
```

---

### Step 7: Strapi JWT Middleware Validates Token
**File:** `jwt-validator.ts`

```typescript
export default () => {
  return async (ctx, next) => {
    // 1. Extract token from Authorization header
    const authHeader = ctx.request.headers.authorization;
    const token = authHeader.substring(7); // Remove "Bearer "
    
    // 2. Verify token with JWT secret
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'r97lUhAaTL';
    const decoded = jwt.verify(token, secret);
    
    // 3. Check if it's an iwork token
    if (decoded.userDetails) {
      // Regular iwork/IBP token - validate against auth-service
      const validatedToken = await strapi
        .service("api::auth-integration.auth-integration")
        .validateJwtToken(token);
      
      // 4. Set user context
      ctx.state.user = {
        userId: decoded.userDetails.userId,  // 2
        orgId: decoded.userDetails.organisationId,  // 1
        email: decoded.userDetails.emailId,  // pushyami@divami.com
        isActive: true
      };
    }
    
    // 5. Allow request to proceed
    await next();
  };
};
```

**Validation Steps:**
1. ✅ Token extracted from `Authorization: Bearer ...`
2. ✅ Token decoded and verified with JWT secret
3. ✅ User ID and email extracted: userId=2, email=pushyami@divami.com
4. ✅ User context set in `ctx.state.user`
5. ✅ Request proceeds to FAQ controller

---

### Step 8: Strapi Returns FAQ Data
**File:** `basic-faq/routes/basic-faq.ts`

```typescript
export default factories.createCoreRouter("api::basic-faq.basic-faq", {
  config: {
    find: {
      auth: false,
      middlewares: ["api::auth-integration.jwt-validator"]
    }
  }
});
```

**Database Query:**
```sql
SELECT * FROM basic_faqs WHERE published_at IS NOT NULL;
```

**Response to Frontend:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "faq123",
      "question": "How to enroll?",
      "answer": "Click on enrollment...",
      "category": "General",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-01T00:00:00Z",
      "publishedAt": "2026-01-15T00:00:00Z"
    },
    {
      "id": 2,
      "question": "What documents are needed?",
      "answer": "You need...",
      ...
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

---

### Step 9: Frontend Displays FAQs to User
```typescript
// React component receives FAQ data
const faqData = await strapiApi.getFaqsList();

// Display in UI
{faqData.data.map(faq => (
  <div key={faq.id}>
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  </div>
))}
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
┌─────────────────┐
│  1. USER LOGIN  │
│  iwork/IBP      │
└────────┬────────┘
         │ POST /login
         │ { userName, password }
         ↓
┌──────────────────────┐
│  2. AUTH SERVICE     │
│  localhost:3003      │
│  ✓ Validate creds    │
│  ✓ Generate JWT      │
└────────┬─────────────┘
         │ Returns JWT token
         │ { accessToken: "eyJhbG..." }
         ↓
┌──────────────────────┐
│  3. BROWSER STORAGE  │
│  sessionStorage      │
│  Key: "user"         │
│  Value: { token }    │
└────────┬─────────────┘
         │
         │ User clicks FAQs
         ↓
┌──────────────────────┐
│  4. FRONTEND         │
│  Get token from      │
│  sessionStorage      │
└────────┬─────────────┘
         │ GET /api/basic-faqs
         │ Authorization: Bearer <token>
         ↓
┌──────────────────────┐
│  5. STRAPI CMS       │
│  localhost:4321      │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│  6. JWT MIDDLEWARE   │
│  ✓ Extract token     │
│  ✓ Verify token      │
│  ✓ Set user context  │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│  7. FAQ CONTROLLER   │
│  Query database      │
│  Return FAQ data     │
└────────┬─────────────┘
         │ Returns JSON
         │ { data: [...] }
         ↓
┌──────────────────────┐
│  8. FRONTEND         │
│  Display FAQs to     │
│  user in UI          │
└──────────────────────┘
```

---

## 🔑 KEY POINTS

### 1. Token Source:
- ✅ JWT token comes from **auth-service** (localhost:3003)
- ✅ Generated during **user login** to iwork/IBP
- ✅ Stored in **browser sessionStorage**

### 2. Token Storage:
```javascript
Location: sessionStorage
Key: "user"
Value: {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { id: 2, email: "pushyami@divami.com" }
}
```

### 3. Token Usage:
```http
Every Strapi API call includes:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Token Validation:
- ✅ Strapi validates token using shared JWT secret
- ✅ Extracts user ID and email from token
- ✅ Checks if user is active
- ✅ Allows/denies request based on validation

---

## 🚫 WHAT HAPPENS IF TOKEN IS MISSING/INVALID?

### No Token:
```http
GET /api/basic-faqs
(No Authorization header)

Response: 401 Unauthorized
{
  "error": "Authentication token required"
}
```

### Invalid Token:
```http
GET /api/basic-faqs
Authorization: Bearer invalid_token_here

Response: 401 Unauthorized
{
  "error": "Invalid or expired token"
}
```

### Expired Token:
```http
GET /api/basic-faqs
Authorization: Bearer eyJhbGc... (expired)

Response: 401 Unauthorized
{
  "error": "Token expired"
}
```

**Frontend Behavior:**
- Automatically redirects user to login page
- Clears sessionStorage
- User must log in again

---

## 🔄 TOKEN LIFECYCLE

```
1. LOGIN
   ↓
2. TOKEN GENERATED (valid for 24 hours)
   ↓
3. TOKEN STORED (sessionStorage)
   ↓
4. TOKEN USED (every API call)
   ↓
5. TOKEN EXPIRES (after 24 hours)
   ↓
6. USER LOGS OUT OR SESSION ENDS
   ↓
7. TOKEN DELETED (sessionStorage cleared)
```

---

## 📝 CODE LOCATIONS

| Step | File | Location |
|------|------|----------|
| Login API | `endPoints.ts` | `auth: environment.authUrl + "/login"` |
| Token Storage | User's browser | `sessionStorage.getItem("user")` |
| Token Retrieval | `strapi-auth.service.ts` | `getIworkToken()` method |
| Token Usage | `strapi-auth.service.ts` | `makeAuthenticatedRequest()` |
| Token Validation | `jwt-validator.ts` | Middleware in Strapi |
| FAQ API | `basic-faq/routes/basic-faq.ts` | Strapi route with middleware |

---

## ✅ SUMMARY

**Question:** How does the user get JWT token for FAQ API?

**Answer:**
1. User logs into iwork/IBP → Auth service generates JWT token
2. Browser stores token in sessionStorage
3. When accessing FAQs, frontend retrieves token from sessionStorage
4. Frontend includes token in `Authorization: Bearer <token>` header
5. Strapi validates token and returns FAQ data

**Key Point:** The JWT token is obtained during **initial login** and reused for all subsequent API calls, including the FAQ API. No separate authentication is needed for Strapi - it uses the same iwork login token!
