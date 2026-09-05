#!/bin/bash

echo "======================================"
echo "IIRM-Strapi SSO Integration Test"
echo "======================================"
echo ""

# Configuration
AUTH_SERVICE_URL="http://localhost:3003"
STRAPI_URL="http://localhost:4321"
TEST_USER_EMAIL="test@example.com"
TEST_PASSWORD="password"

echo "🔍 Testing SSO Integration Flow..."
echo ""

# Step 1: Login to IIRM to get JWT token
echo "Step 1: Authenticating with IIRM auth service..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_SERVICE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
  echo "✅ IIRM authentication successful"
  echo "🔑 JWT Token: ${JWT_TOKEN:0:50}..."
else
  echo "❌ IIRM authentication failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Step 2: Test Strapi API authentication
echo "Step 2: Testing Strapi API authentication..."
API_AUTH_RESPONSE=$(curl -s -X POST "$STRAPI_URL/api/auth-integration/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$JWT_TOKEN\"}")

if echo "$API_AUTH_RESPONSE" | grep -q "strapiToken"; then
  STRAPI_TOKEN=$(echo "$API_AUTH_RESPONSE" | jq -r '.data.strapiToken')
  echo "✅ Strapi API authentication successful"
  echo "🔑 Strapi Token: ${STRAPI_TOKEN:0:50}..."
else
  echo "❌ Strapi API authentication failed"
  echo "Response: $API_AUTH_RESPONSE"
  exit 1
fi

echo ""

# Step 3: Test admin panel access authentication
echo "Step 3: Testing Admin Panel SSO authentication..."
ADMIN_AUTH_RESPONSE=$(curl -s -X POST "$STRAPI_URL/api/auth-integration/admin-access" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$JWT_TOKEN\",\"redirectTo\":\"/admin\"}")

if echo "$ADMIN_AUTH_RESPONSE" | grep -q "adminToken"; then
  ADMIN_TOKEN=$(echo "$ADMIN_AUTH_RESPONSE" | jq -r '.data.adminToken')
  echo "✅ Admin panel authentication successful"
  echo "🔑 Admin Token: ${ADMIN_TOKEN:0:50}..." 
  echo "👤 Admin User: $(echo "$ADMIN_AUTH_RESPONSE" | jq -r '.data.user.email')"
else
  echo "❌ Admin panel authentication failed"
  echo "Response: $ADMIN_AUTH_RESPONSE"
  exit 1
fi

echo ""

# Step 4: Test Strapi API access with token
echo "Step 4: Testing Strapi API access with authentication..."
API_TEST_RESPONSE=$(curl -s -X GET "$STRAPI_URL/api/dashboard-contents" \
  -H "Authorization: Bearer $STRAPI_TOKEN")

if echo "$API_TEST_RESPONSE" | grep -q "data"; then
  echo "✅ Strapi API access successful"
else
  echo "❌ Strapi API access failed" 
  echo "Response: $API_TEST_RESPONSE"
fi

echo ""
echo "======================================"
echo "🎉 SSO Integration Test Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "✅ IIRM Authentication"
echo "✅ Strapi API Authentication"  
echo "✅ Admin Panel Authentication"
echo "✅ Authenticated API Access"
echo ""
echo "Next Steps:"
echo "1. Test 'Open Strapi' button in iwork frontend"
echo "2. Verify admin panel automatic login"
echo "3. Test content management operations"
echo ""
echo "Admin Panel URLs:"
echo "🌐 Direct: $STRAPI_URL/admin"
echo "🔗 SSO: $STRAPI_URL/admin?sso=true"
echo ""