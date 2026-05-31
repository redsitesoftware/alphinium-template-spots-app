#!/bin/bash
# Wait for Strapi to be ready and auto-create admin

STRAPI_URL=${STRAPI_URL:-http://localhost:1337}
MAX_WAIT=60
ELAPSED=0

echo "⏳ Waiting for Strapi to start at $STRAPI_URL..."

while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -s "$STRAPI_URL/_health" >/dev/null 2>&1 || curl -s "$STRAPI_URL/admin" >/dev/null 2>&1; then
    echo "✅ Strapi is ready!"
    echo ""
    
    # Try to create admin
    node SCRIPTS/init-strapi-admin.js
    exit 0
  fi
  
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  echo "  Waiting... ${ELAPSED}s"
done

echo "❌ Strapi did not start within ${MAX_WAIT} seconds"
exit 1
