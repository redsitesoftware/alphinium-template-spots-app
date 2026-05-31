#!/bin/bash
# Start React Native mobile app for local development

cd "$(dirname "$0")/../react-native" || exit 1

echo "📱 Starting React Native app..."
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

echo "📱 Expo DevTools will open in your browser"
echo ""
echo "To run on device/simulator:"
echo "  - Press 'a' for Android"
echo "  - Press 'i' for iOS"
echo "  - Press 'w' for Web"
echo ""

npm start
