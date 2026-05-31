#!/bin/bash
# Reset Strapi database and cache (for fresh start)

cd "$(dirname "$0")/../backend" || exit 1

echo "🗑️  Resetting Strapi backend..."
echo ""
echo "⚠️  This will delete:"
echo "  - All content in database"
echo "  - Admin user"
echo "  - Cache and build files"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf .tmp/ .strapi/ dist/ database/data.db* 2>/dev/null
  echo "✅ Reset complete!"
  echo ""
  echo "Next: Start backend with ./SCRIPTS/dev-backend.sh"
  echo "Admin will be auto-created from .env"
else
  echo "❌ Cancelled"
fi
