#!/bin/bash
# Start both backend and mobile app in separate terminals

SCRIPT_DIR="$(dirname "$0")"

echo "🚀 Starting Alphinium App Development Environment"
echo ""

# Check if we're on macOS to use Terminal.app
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "🍎 macOS detected - opening in separate Terminal tabs..."
  echo ""
  echo "⚠️  If you get a permissions error:"
  echo "   1. Go to: System Settings → Privacy & Security → Accessibility"
  echo "   2. Enable 'Terminal' (or your terminal app)"
  echo "   3. Restart your terminal and try again"
  echo ""
  
  # Alternative: use simpler approach with open command
  # Start backend in new terminal window
  open -a Terminal "$PWD/SCRIPTS/dev-backend.sh"
  
  echo "⏳ Waiting for backend to start..."
  sleep 3
  
  # Start mobile in new terminal window
  open -a Terminal "$PWD/SCRIPTS/dev-mobile.sh"
  
  echo "✅ Started backend and mobile in separate windows!"
  echo ""
  echo "📍 Backend: http://localhost:1337"
  echo "📱 Mobile: Check Expo DevTools window"
  
else
  echo "🐧 Linux detected - please run in separate terminals:"
  echo ""
  echo "Terminal 1: ./SCRIPTS/dev-backend.sh"
  echo "Terminal 2: ./SCRIPTS/dev-mobile.sh"
fi
