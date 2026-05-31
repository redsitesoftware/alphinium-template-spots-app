#!/bin/bash
# Automated Stripe Product Setup Wrapper
# Creates all products and prices, then updates config files
# 
# Usage:
#   ./scripts/setup-all-products.sh test
#   ./scripts/setup-all-products.sh live

set -e

# Load environment variables
if [ -f .env.test ]; then
  export $(grep -v '^#' .env.test | xargs)
fi

MODE="${1:-test}"

# Select correct key based on mode
if [ "$MODE" = "live" ]; then
  KEY="${STRIPE_SECRET_KEY_LIVE}"
  KEY_NAME="STRIPE_SECRET_KEY_LIVE"
else
  KEY="${STRIPE_SECRET_KEY_TEST:-$STRIPE_SECRET_KEY}"
  KEY_NAME="STRIPE_SECRET_KEY_TEST"
fi

if [ -z "$KEY" ] || [[ "$KEY" == *"PLACEHOLDER"* ]]; then
  echo "❌ ${KEY_NAME} not configured in .env.test"
  echo ""
  echo "Get your key from:"
  if [ "$MODE" = "live" ]; then
    echo "  https://dashboard.stripe.com/apikeys"
  else
    echo "  https://dashboard.stripe.com/test/apikeys"
  fi
  echo ""
  echo "Then add to .env.test:"
  echo "  ${KEY_NAME}=sk_${MODE}_YOUR_KEY_HERE"
  exit 1
fi

export STRIPE_SECRET_KEY="$KEY"

echo "🚀 Starting automated Stripe setup in ${MODE} mode..."
echo "🔑 Using: ${KEY_NAME}"
echo ""

# Step 1: Create products and prices in Stripe
echo "📦 Step 1: Creating products and prices in Stripe..."
node scripts/setup-stripe-products.js --mode=${MODE}

if [ $? -ne 0 ]; then
  echo "❌ Failed to create products"
  exit 1
fi

echo ""
echo "✅ Products created successfully!"
echo ""

# Step 2: Update configuration files
echo "🔧 Step 2: Updating configuration files..."
node scripts/update-config-files.js --mode=${MODE}

if [ $? -ne 0 ]; then
  echo "❌ Failed to update config files"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review: git diff"
echo "  2. Update HTML: node scripts/update-test-html.js ${MODE}"
echo "  3. Restart server: npm run test:server"
echo "  4. Test: http://localhost:3456/test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Update test HTML
echo "📄 Step 3: Updating test HTML with ${MODE} price IDs..."
node scripts/update-test-html.js ${MODE}

echo ""
echo "✅ All done! Restart server to test."
echo ""
