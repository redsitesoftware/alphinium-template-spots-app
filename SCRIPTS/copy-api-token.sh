#!/bin/bash
# Copy API token from backend logs to react-native/.env

cd "$(dirname "$0")/.." || exit 1

echo "🔍 Searching for API token in backend logs..."
echo ""

# Look for the token that was printed during backend startup
# This assumes backend was recently started and logs are available

echo "💡 Steps to get the token:"
echo ""
echo "1. Look in the backend terminal for this line:"
echo "   🔑 Token: xxxxxxxxxxxxxxxxxxxx"
echo ""
echo "2. Copy the token and add to react-native/.env:"
echo "   STRAPI_API_TOKEN=your_token_here"
echo ""
echo "3. Or run this command with the token:"
echo "   echo 'STRAPI_API_TOKEN=your_token' >> react-native/.env"
echo ""
echo "4. Restart the mobile app: ./SCRIPTS/dev-mobile.sh"
echo ""
