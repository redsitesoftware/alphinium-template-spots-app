#!/bin/bash
# Initial setup for Alphinium App

SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$SCRIPT_DIR/.."

echo "🔧 Alphinium App - Initial Setup"
echo ""

# Check for required tools
echo "✓ Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found! Install from nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not found!"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git not found!"; exit 1; }

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"
echo ""

# Initialize submodules
echo "📦 Initializing git submodules..."
git submodule update --init --recursive
echo ""

# Setup backend
echo "🔧 Setting up backend..."
cd "$ROOT_DIR/backend" || exit 1

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env"
fi

if [ ! -d node_modules ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi
echo ""

# Setup React Native
echo "📱 Setting up React Native app..."
cd "$ROOT_DIR/react-native" || exit 1

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created react-native/.env"
fi

if [ ! -d node_modules ]; then
  echo "📦 Installing mobile dependencies..."
  npm install
fi
echo ""

# Setup payments submodule
echo "💳 Setting up payments submodule..."
cd "$ROOT_DIR/payments" || exit 1

if [ ! -f .env.test ]; then
  if [ -f .env.test.template ]; then
    cp .env.test.template .env.test
    echo "✅ Created payments/.env.test"
  fi
fi

if [ ! -d node_modules ]; then
  echo "📦 Installing payment dependencies..."
  npm install
fi
echo ""

cd "$ROOT_DIR"

echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update .env files with your API keys:"
echo "     - backend/.env (Stripe keys, database)"
echo "     - react-native/.env (Strapi URL, Stripe key)"
echo ""
echo "  2. Start development:"
echo "     ./SCRIPTS/dev-backend.sh    # Start Strapi backend"
echo "     ./SCRIPTS/dev-mobile.sh     # Start React Native app"
echo "     ./SCRIPTS/dev-all.sh        # Start both (macOS)"
echo ""
echo "  3. Access:"
echo "     Backend: http://localhost:1337/admin"
echo "     Mobile: Expo DevTools will open automatically"
echo ""
