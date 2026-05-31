#!/usr/bin/env bash
# ============================================================
# build-mobile.sh — Build iOS/Android from within alphinium agent (FULL image)
#
# Usage:
#   ./build-mobile.sh android          # Local APK build (works in full image)
#   ./build-mobile.sh ios              # EAS Cloud build (requires EAS account)
#   ./build-mobile.sh android --profile local-android
#   ./build-mobile.sh eas-android      # EAS Cloud Android build
#   ./build-mobile.sh eas-ios          # EAS Cloud iOS build
# ============================================================
set -euo pipefail

PLATFORM="${1:-android}"
PROFILE="${2:---profile}"
PROFILE_NAME="${3:-preview}"
RN_DIR="$(cd "$(dirname "$0")/.." && pwd)/react-native"

echo "📱 Alphinium Mobile Builder"
echo "   Platform: $PLATFORM"
echo "   RN dir:   $RN_DIR"
echo ""

cd "$RN_DIR"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

case "$PLATFORM" in

  android)
    echo "🤖 Building Android APK (local — requires Android SDK in FULL image)..."

    # Verify Android SDK
    if [ -z "${ANDROID_HOME:-}" ]; then
      echo "❌ ANDROID_HOME not set. Are you in the FULL agent image?"
      exit 1
    fi
    echo "   ANDROID_HOME: $ANDROID_HOME"
    java -version 2>&1 | head -1

    # Generate native project if needed
    if [ ! -d "android" ]; then
      echo "⚙️  Running expo prebuild..."
      npx expo prebuild --platform android --clean
    fi

    echo "🔨 Building release APK..."
    npx expo run:android --variant release --no-install

    APK=$(find android/app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -1)
    if [ -n "$APK" ]; then
      mkdir -p /workspace/builds
      cp "$APK" /workspace/builds/app-release.apk
      echo ""
      echo "✅ Android APK built!"
      echo "   Output: /workspace/builds/app-release.apk"
      echo "   Size:   $(du -h /workspace/builds/app-release.apk | cut -f1)"
    else
      echo "❌ APK not found after build"
      exit 1
    fi
    ;;

  eas-android)
    echo "🤖 Building Android via EAS Cloud..."
    if ! command -v eas &>/dev/null; then
      echo "❌ eas-cli not found. Run: npm install -g eas-cli"
      exit 1
    fi
    eas build --platform android --profile "${PROFILE_NAME}" --non-interactive
    ;;

  eas-ios)
    echo "🍎 Building iOS via EAS Cloud..."
    if ! command -v eas &>/dev/null; then
      echo "❌ eas-cli not found. Run: npm install -g eas-cli"
      exit 1
    fi
    eas build --platform ios --profile "${PROFILE_NAME}" --non-interactive
    ;;

  ios)
    echo "🍎 iOS cannot be built locally on Linux."
    echo "   Use: ./build-mobile.sh eas-ios"
    echo "   Or run from a macOS machine with Xcode."
    exit 1
    ;;

  *)
    echo "Usage: $0 [android|ios|eas-android|eas-ios]"
    exit 1
    ;;

esac
