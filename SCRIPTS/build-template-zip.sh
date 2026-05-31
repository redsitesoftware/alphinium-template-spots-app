#!/bin/bash
# ============================================================
# alphinium-app — Template Zip Build Script
# ============================================================
# Builds a clean, distributable zip of alphinium-app for
# alphinium-forge template distribution.
#
# Usage:
#   ./SCRIPTS/build-template-zip.sh v1.0.0
#
# Requirements:
#   - SSH access to redsitesoftware/alphinium-app AND alphinium-stripe-billing
#   - MinIO CLI (mc) configured with 'alphinium' alias, OR set SKIP_UPLOAD=1
#   - zip utility
#
# Output:
#   alphinium-app-v{version}.zip  (in current directory)
#   Uploaded to MinIO: templates/alphinium-app/alphinium-app-v{version}.zip
#   Updated: templates/alphinium-app/version.json
# ============================================================

set -euo pipefail

VERSION="${1:?Usage: $0 <version> (e.g. v1.0.0)}"
REPO="git@github.com:redsitesoftware/alphinium-app.git"
ZIP_NAME="alphinium-app-${VERSION}.zip"
TMP_DIR=$(mktemp -d)
CLONE_DIR="${TMP_DIR}/alphinium-app"
MINIO_ALIAS="${MINIO_ALIAS:-alphinium}"
MINIO_BUCKET="${MINIO_BUCKET:-alphinium-templates}"
SKIP_UPLOAD="${SKIP_UPLOAD:-0}"

echo "============================================================"
echo " alphinium-app Template Zip Builder"
echo " Version: ${VERSION}"
echo " Output:  ${ZIP_NAME}"
echo "============================================================"
echo ""

# --- Validate version format ---
if [[ ! "${VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format: '${VERSION}'"
    echo "   Expected format: v1.0.0"
    exit 1
fi

# --- Clone with all submodules fully resolved ---
echo "📦 Cloning alphinium-app with submodules..."
git clone --recurse-submodules "${REPO}" "${CLONE_DIR}"
echo "✅ Clone complete"
echo ""

# --- Pre-release validation ---
echo "🔍 Running pre-release validation..."

# Check for real API keys in .env.example files
REAL_KEY_PATTERN='pk_test_[A-Za-z0-9]{20,}'
if grep -rE "${REAL_KEY_PATTERN}" "${CLONE_DIR}" --include="*.example" --include="*.env" 2>/dev/null; then
    echo "❌ BLOCKED: Real Stripe publishable key found in .env.example file(s)"
    echo "   Run: git grep -n 'pk_test_' to find all occurrences"
    exit 1
fi

# Check for internal alphinium.io URLs in .env.example files
if grep -r "alphinium\.io" "${CLONE_DIR}" --include="*.example" 2>/dev/null | grep -v "^Binary"; then
    echo "❌ BLOCKED: Internal alphinium.io URL found in .env.example file(s)"
    echo "   These must be generic placeholders for template distribution"
    exit 1
fi

# Verify payments submodule resolved
if [ ! -f "${CLONE_DIR}/payments/package.json" ]; then
    echo "❌ payments/ submodule not resolved — check SSH access to alphinium-stripe-billing"
    exit 1
fi

echo "✅ Validation passed"
echo ""

# --- Build the zip ---
echo "🗜️  Building ${ZIP_NAME}..."

cd "${TMP_DIR}"

# Remove all .git directories (top-level and inside resolved submodules)
find "${CLONE_DIR}" -name ".git" -exec rm -rf {} + 2>/dev/null || true
# Remove .gitmodules (not needed in distributed template)
find "${CLONE_DIR}" -name ".gitmodules" -delete 2>/dev/null || true
# Remove node_modules
find "${CLONE_DIR}" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
# Remove platform build caches
find "${CLONE_DIR}" -name ".expo" -type d -exec rm -rf {} + 2>/dev/null || true
find "${CLONE_DIR}" -name "android" -type d -path "*/react-native/*" -exec rm -rf {} + 2>/dev/null || true
find "${CLONE_DIR}" -name "ios" -type d -path "*/react-native/*" -exec rm -rf {} + 2>/dev/null || true
# Remove macOS metadata
find "${CLONE_DIR}" -name ".DS_Store" -delete 2>/dev/null || true
find "${CLONE_DIR}" -name "*.log" -delete 2>/dev/null || true

zip -r "${ZIP_NAME}" alphinium-app/ \
    --exclude "*.git*" \
    --exclude "*/__pycache__/*" \
    2>/dev/null

ZIP_SIZE=$(du -sh "${TMP_DIR}/${ZIP_NAME}" | cut -f1)
echo "✅ Built: ${ZIP_NAME} (${ZIP_SIZE})"
echo ""

# Move zip to caller's directory
mv "${TMP_DIR}/${ZIP_NAME}" "${OLDPWD}/${ZIP_NAME}"

# --- Upload to MinIO ---
if [ "${SKIP_UPLOAD}" = "1" ]; then
    echo "⏭️  Skipping MinIO upload (SKIP_UPLOAD=1)"
    echo ""
else
    echo "☁️  Uploading to MinIO..."

    # Upload zip
    mc cp "${OLDPWD}/${ZIP_NAME}" "${MINIO_ALIAS}/${MINIO_BUCKET}/alphinium-app/${ZIP_NAME}"

    # Create and upload version.json
    VERSION_JSON=$(cat <<EOF
{
  "name": "alphinium-app",
  "version": "${VERSION}",
  "zip": "${ZIP_NAME}",
  "released_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "description": "Multi-platform app: React Native (iOS/Android/Web) + Strapi CMS + Stripe payments",
  "source_repo": "redsitesoftware/alphinium-app"
}
EOF
)
    echo "${VERSION_JSON}" | mc pipe "${MINIO_ALIAS}/${MINIO_BUCKET}/alphinium-app/version.json"

    echo "✅ Uploaded:"
    echo "   ${MINIO_ALIAS}/${MINIO_BUCKET}/alphinium-app/${ZIP_NAME}"
    echo "   ${MINIO_ALIAS}/${MINIO_BUCKET}/alphinium-app/version.json"
    echo ""
fi

# --- Cleanup ---
rm -rf "${TMP_DIR}"
echo ""
echo "============================================================"
echo " ✅ Done!"
echo ""
echo " Zip:     ${OLDPWD}/${ZIP_NAME}"
if [ "${SKIP_UPLOAD}" != "1" ]; then
echo " MinIO:   ${MINIO_ALIAS}/${MINIO_BUCKET}/alphinium-app/"
echo ""
echo " Next steps:"
echo "   1. Update alphinium-assets registry.json: current_version = \"${VERSION}\""
echo "   2. Push alphinium-assets registry.json update"
echo "   3. Test: alphinium-forge new --template alphinium-app --name test-project --dry-run"
fi
echo "============================================================"
