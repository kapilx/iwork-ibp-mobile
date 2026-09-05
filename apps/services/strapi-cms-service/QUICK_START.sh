#!/bin/bash

echo "==============================================="
echo "Strapi CMS Service - Quick Access Setup Guide"
echo "==============================================="

echo -e "\n✅ Service is running on: http://localhost:3024"
echo "✅ Admin Panel: http://localhost:3024/admin"
echo "✅ Via Gateway: http://localhost:3000/cms/admin"

echo -e "\n📝 To enable public access to APIs:"
echo -e "\n1. Open admin panel: http://localhost:3024/admin"
echo "2. Create an admin account (if not done)"
echo "3. Login to admin panel"
echo "4. Go to Settings > Users & Permissions > Roles > Public"
echo "5. Under 'Permissions', expand 'Hello-world'"
echo "6. Check 'find' and 'findOne' permissions"
echo "7. Click 'Save'"

echo -e "\n🧪 Test commands after enabling public access:"
echo ""
echo "# Direct access to Strapi:"
echo "curl http://localhost:3024/api/hello-worlds"
echo ""
echo "# Via API Gateway:"
echo "curl http://localhost:3000/cms/api/hello-worlds"
echo ""

echo -e "\n📋 Create a new Hello World entry:"
echo ""
echo 'curl -X POST http://localhost:3024/api/hello-worlds \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"data\": {\"title\": \"Test\", \"message\": \"Hello World\", \"isActive\": true}}"'

echo -e "\n==============================================="
