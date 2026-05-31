#!/usr/bin/env bash
# deploy-payments.sh — build, push, and deploy the Alphinium payments pod
#
# Usage:
#   ./scripts/deploy-payments.sh                  # build + deploy
#   ./scripts/deploy-payments.sh --build-only      # build + push, no deploy
#   ./scripts/deploy-payments.sh --deploy-only TAG  # deploy existing tag, skip build
#
# Prerequisites:
#   - gcloud auth login (as redsitesoftware@gmail.com)
#   - docker buildx with gke-builder configured
#   - kubectl context pointing to user-pods-cluster
#   - STRIPE_SECRET_KEY env var set
#   - DATABASE_URL env var (optional — falls back to ephemeral SQLite if unset)

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
REGISTRY="us-central1-docker.pkg.dev/alphinium-production/user-pods"
IMAGE_NAME="alphinium-payments-slim"
POD_NAME="payments-api"
NAMESPACE="alphinium-7r86kuat"
POD_URL="https://${POD_NAME}-7r86kuat.user-pods.alphinium.io"
WEBHOOK_ID="we_1TZEjFHc2oT07zw5fnnHOh4S"
API_KEY="502739bda12495b8f93d4c035d332ddeaa3db3d238ba5e6897ce1dbc3f36bc85"
USER_PODS_API="https://api.user-pods.alphinium.io"

# ─── Args ─────────────────────────────────────────────────────────────────────
BUILD=true
DEPLOY=true
CUSTOM_TAG=""

for arg in "$@"; do
  case $arg in
    --build-only) DEPLOY=false ;;
    --deploy-only) BUILD=false; shift; CUSTOM_TAG="${1:-}" ;;
    *) ;;
  esac
done

# ─── Tag ──────────────────────────────────────────────────────────────────────
if [[ -n "$CUSTOM_TAG" ]]; then
  TAG="$CUSTOM_TAG"
else
  TAG="amd64-$(date +%Y%m%d-%H%M)"
fi
IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Build ────────────────────────────────────────────────────────────────────
if [[ "$BUILD" == "true" ]]; then
  echo "🔨 Building linux/amd64 image: $IMAGE"
  echo "   (using gke-builder — ~4 min)"

  docker buildx build \
    --builder gke-builder \
    --platform linux/amd64 \
    --tag "$IMAGE" \
    --file "$REPO_ROOT/backend/Dockerfile" \
    --push \
    "$REPO_ROOT/"

  echo "✅ Image pushed: $IMAGE"
fi

# ─── Deploy ───────────────────────────────────────────────────────────────────
if [[ "$DEPLOY" == "true" ]]; then
  echo ""
  echo "🧹 Cleaning up orphaned ingress/service for '$POD_NAME'..."
  kubectl delete ingress,service \
    -n "$NAMESPACE" \
    -l "deploy-name=${POD_NAME}" \
    --ignore-not-found 2>/dev/null || true

  echo "🚀 Deploying $POD_NAME..."

  # Required: STRIPE_SECRET_KEY must be set in env
  if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
    echo "❌ STRIPE_SECRET_KEY env var not set. Export it first:"
    echo "   export STRIPE_SECRET_KEY=sk_test_..."
    exit 1
  fi

  # Build env_vars JSON using python3 to avoid bash quoting issues
  ENV_JSON=$(python3 - <<PYEOF
import json, os
env = {
    "NODE_ENV": "production",
    "APP_KEYS": "testkey1,testkey2,testkey3,testkey4",
    "ADMIN_JWT_SECRET": "testadminjwtsecret1234567890",
    "JWT_SECRET": "testjwtsecret1234567890",
    "API_TOKEN_SALT": "testapitokensalt1234",
    "STRIPE_SECRET_KEY": os.environ["STRIPE_SECRET_KEY"],
    "FRONTEND_URL": "https://app.alphinium.com",
        "STRIPE_WEBHOOK_SECRET": "whsec_HSTujocfSVb7p8sgL8yiAlSsxc7UeiY1",
    "STRIPE_PRICE_STARTER_MONTHLY": "price_1TY1HdHc2oT07zw5TBMmRAeH",
    "STRIPE_PRICE_STARTER_ANNUAL": "price_1TY1HeHc2oT07zw5k0JY7LKB",
    "STRIPE_PRICE_DEVELOPER_MONTHLY": "price_1TVTZrHc2oT07zw5SvIGsPio",
    "STRIPE_PRICE_DEVELOPER_ANNUAL": "price_1TVTZrHc2oT07zw5DmjHQXyp",
    "STRIPE_PRICE_TEAM_MONTHLY": "price_1TVTZsHc2oT07zw5uqAaTnc9",
    "STRIPE_PRICE_TEAM_ANNUAL": "price_1TVTZsHc2oT07zw59M8MTdB8",
    "STRIPE_PRICE_ENTERPRISE_MONTHLY": "price_1TVSN9Hc2oT07zw5zb4OZHtJ",
    "STRIPE_PRICE_ENTERPRISE_ANNUAL": "price_1TVSN9Hc2oT07zw5HnasGyTf",
    "STRIPE_PRICE_ADDON_POD_MONTHLY": "price_1TVak6Hc2oT07zw5q2kNE2Sn",
}
db_url = os.environ.get("DATABASE_URL", "")
if db_url:
    env["DATABASE_CLIENT"] = "postgres"
    env["DATABASE_URL"] = db_url
    env["DATABASE_SSL"] = "true"
print(json.dumps(env))
PYEOF
)

  PAYLOAD=$(python3 -c "
import json, sys
payload = {
    'image': '${IMAGE}',
    'name': '${POD_NAME}',
    'port': 1337,
    'env_vars': json.loads(sys.stdin.read())
}
print(json.dumps(payload))
" <<< "$ENV_JSON")

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${USER_PODS_API}/deploy" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)

  if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
    echo "✅ Deploy accepted"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  else
    echo "❌ Deploy failed (HTTP $HTTP_CODE):"
    echo "$BODY"
    exit 1
  fi

  echo ""
  echo "⏳ Waiting for pod to be ready (up to 120s)..."
  DEPLOY_POD=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pod_name',''))" 2>/dev/null || echo "")
  for i in $(seq 1 24); do
    if [[ -n "$DEPLOY_POD" ]]; then
      READY=$(kubectl get pod -n "$NAMESPACE" "$DEPLOY_POD" \
        -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
      PHASE=$(kubectl get pod -n "$NAMESPACE" "$DEPLOY_POD" \
        -o jsonpath='{.status.phase}' 2>/dev/null || echo "Pending")
    else
      PHASE=$(kubectl get pod -n "$NAMESPACE" -l "deploy-name=${POD_NAME}" \
        --sort-by=.metadata.creationTimestamp \
        -o jsonpath='{.items[-1].status.phase}' 2>/dev/null || echo "Pending")
      READY=$(kubectl get pod -n "$NAMESPACE" -l "deploy-name=${POD_NAME}" \
        --sort-by=.metadata.creationTimestamp \
        -o jsonpath='{.items[-1].status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
    fi
    echo "   [${i}/24] phase=$PHASE ready=$READY"
    if [[ "$READY" == "true" ]]; then
      echo "✅ Pod is ready"
      break
    fi
    sleep 5
  done

  echo ""
  echo "🔍 Verifying pod is responding..."
  sleep 5  # brief extra wait for Strapi to finish initialising
  PLANS=$(curl -s "${POD_URL}/api/payment/plans" 2>/dev/null)
  if echo "$PLANS" | grep -q '"plans"\|"tiers"'; then
    echo "✅ Plans endpoint OK"
  else
    echo "⚠️  Plans endpoint not responding yet — may still be starting"
    echo "   curl ${POD_URL}/api/payment/plans"
  fi

  # ── Update Stripe webhook URL ───────────────────────────────────────────────
  echo ""
  echo "🪝 Updating Stripe webhook URL → ${POD_URL}/api/payment/webhook"
  STRIPE_RESP=$(curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints/${WEBHOOK_ID}" \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "url=${POD_URL}/api/payment/webhook")

  if echo "$STRIPE_RESP" | grep -q '"url"'; then
    NEW_URL=$(echo "$STRIPE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))" 2>/dev/null)
    echo "✅ Webhook updated: $NEW_URL"
  else
    echo "⚠️  Webhook update may have failed:"
    echo "$STRIPE_RESP" | python3 -m json.tool 2>/dev/null || echo "$STRIPE_RESP"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Done!"
  echo "   Pod URL:    $POD_URL"
  echo "   Image tag:  $TAG"
  echo "   Plans:      ${POD_URL}/api/payment/plans"
  echo ""
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "⚠️  SQLite is ephemeral — data lost on pod restart. Add persistent Postgres:"
    echo "   1. Create free DB at https://neon.tech → copy connection string"
    echo "   2. export DATABASE_URL='postgres://user:pass@host/db?sslmode=require'"
    echo "   3. Re-run this script"
    echo ""
    echo "   Until then, re-register test users after each redeploy:"
    echo "   curl -X POST ${POD_URL}/api/auth/local/register \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"username\":\"test\",\"email\":\"test@redsitesoftware.com\",\"password\":\"Test1234!\"}'"
  else
    echo "✅ Using persistent Postgres (DATABASE_URL set)"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
