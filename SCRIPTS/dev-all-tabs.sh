#!/bin/bash
# Start both backend and mobile app in separate Terminal TABS (requires Accessibility permissions)

SCRIPT_DIR="$(dirname "$0")"

echo "🚀 Starting Alphinium App Development Environment (with tabs)"
echo ""

if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "❌ This script only works on macOS"
  echo "💡 Use ./SCRIPTS/dev-all.sh instead"
  exit 1
fi

echo "🍎 Opening in separate Terminal tabs..."
echo ""

# Start backend in new tab
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using command down
    do script "cd '$PWD' && ./SCRIPTS/dev-backend.sh" in front window
end tell
APPLESCRIPT

# Wait a bit for backend to start
sleep 2

# Start mobile in new tab
osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    tell application "System Events" to keystroke "t" using command down
    do script "cd '$PWD' && ./SCRIPTS/dev-mobile.sh" in front window
end tell
APPLESCRIPT

echo "✅ Started backend and mobile in separate tabs!"
echo ""
echo "📍 Backend: http://localhost:1337"
echo "📱 Mobile: Check Expo DevTools tab"
