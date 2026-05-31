#!/bin/bash
# Start Strapi CMS backend for local development

cd "$(dirname "$0")/../backend" || exit 1

echo "🚀 Starting Strapi CMS backend..."
echo "📍 Location: $(pwd)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found!"
  echo "📋 Creating from .env.example..."
  cp .env.example .env
  echo "✅ Created .env - please update with your keys"
  echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

echo "🌐 Backend will be available at: http://localhost:1337"
echo "🔧 Admin panel: http://localhost:1337/admin"
echo ""
echo "📧 Default admin: ${STRAPI_ADMIN_EMAIL:-admin@alphinium.local}"
echo "🔐 Default password: ${STRAPI_ADMIN_PASSWORD:-Admin123!Dev}"
echo ""
echo "⏳ Backend will auto-create admin and API token on first run..."
echo ""

npm run develop
