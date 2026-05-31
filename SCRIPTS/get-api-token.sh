#!/bin/bash
# Extract and display the API token from backend logs or database

cd "$(dirname "$0")/.." || exit 1

echo "🔑 Looking for Strapi API token..."
echo ""

# Check if backend is running and look for token in recent logs
TOKEN=$(grep -r "STRAPI_API_TOKEN=" backend/.env react-native/.env 2>/dev/null | grep -v "your-api-token" | cut -d= -f2 | head -1)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "your-api-token-here" ]; then
  echo "✅ Found token in .env files:"
  echo "$TOKEN"
  echo ""
  echo "💡 Add to react-native/.env:"
  echo "STRAPI_API_TOKEN=$TOKEN"
else
  echo "⚠️  No token found yet."
  echo ""
  echo "📝 The token will be printed when backend starts for the first time."
  echo "   Look for: '🔑 Token: xxxxx' in the backend logs"
  echo ""
  echo "💡 Or manually create in Strapi admin:"
  echo "   1. Go to http://localhost:1337/admin"
  echo "   2. Settings → API Tokens → Create new token"
  echo "   3. Copy token to react-native/.env"
fi
