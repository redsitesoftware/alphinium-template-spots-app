#!/bin/bash
set -e

INDEX="/usr/share/nginx/html/index.html"

# ── Runtime config.js ─────────────────────────────────────────────────────────
cat > /usr/share/nginx/html/config.js << JSEOF
window.ENV = {
  SITE_NAME: "${SITE_NAME}",
  DOMAIN: "${DOMAIN}",
};
JSEOF

# ── Google Analytics injection ────────────────────────────────────────────────
# Injects GA4 gtag snippet before </head> at container startup.
# No rebuild required — swap GOOGLE_ANALYTICS_ID env var and restart.
if [ -n "${GOOGLE_ANALYTICS_ID}" ]; then
  echo "✅ Injecting Google Analytics: ${GOOGLE_ANALYTICS_ID}"
  GA_SNIPPET="<script async src=\"https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GOOGLE_ANALYTICS_ID}');</script>"
  # Use a temp file for safe in-place edit on Alpine
  sed "s|</head>|${GA_SNIPPET}</head>|" "${INDEX}" > "${INDEX}.tmp" && mv "${INDEX}.tmp" "${INDEX}"
else
  echo "ℹ️  GOOGLE_ANALYTICS_ID not set — running without analytics"
fi

echo "🚀 alphinium-app frontend starting"
echo "   SITE_NAME: ${SITE_NAME}"
echo "   DOMAIN:    ${DOMAIN}"
echo "   GA:        ${GOOGLE_ANALYTICS_ID:-none}"

exec "$@"
