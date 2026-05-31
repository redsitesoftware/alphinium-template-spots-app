# Android Build Guide

**Version:** 1.1.0 | **Updated:** May 2026

Android builds for alphinium-app run on the **alphinium mac build agent** — a local macOS agent that polls the alphinium API for jobs, compiles, and uploads artifacts to GCS.

> ⚠️ **Outdated info below?** Earlier versions of this doc described a Kubernetes Job approach. That is no longer used — the mac build agent replaced it.

---

## Triggering a Build

```bash
TOKEN="your-alphinium-jwt"
PROJECT_ID="your-project-uuid"

curl -X POST https://api.app.alphinium.com/api/builds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"'$PROJECT_ID'","platform":"android","ref":"main"}'
```

Poll status:
```bash
BUILD_ID="returned-build-id"
curl https://api.app.alphinium.com/api/builds/$BUILD_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

When `status: "complete"`:
- `download_url` — public GCS link to the APK
- `firebase_install_url` — Firebase App Distribution install link

---

## Build Pipeline

```
API trigger
  → mac build agent picks up job (polls every 30s)
  → git clone alphinium-app@main → /tmp/alphinium-android-{id}/
  → npm install --legacy-peer-deps
  → expo prebuild --platform android
  → ./gradlew assembleDebug
  → gsutil cp → gs://alphinium-assets/builds/android/{job-id}/alphinium-app-debug.apk
  → firebase app distribution upload
  → API: status=complete + download_url + firebase_install_url
```

**Typical build time:** 8–12 minutes (incremental, uses derived data cache)

---

## Build Stats

| Metric | Value |
|--------|-------|
| Build time (warm) | ~8 min |
| Build time (cold) | ~15 min |
| APK size | ~130–145 MB |
| Gradle tasks | ~450 |
| Java version | 17 |
| Android SDK | 36 |
| Build tools | 37.0.0 |

---

## Mac Agent Setup

The build agent runs on your Mac. See `alphinium-mac-build-agent` repo for full setup.

Key `.env` settings for Android:

```env
ANDROID_SDK_ROOT=/Users/dan/Library/Android/sdk
JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Firebase App Distribution
FIREBASE_PROJECT_NUMBER=425274373424
FIREBASE_APP_ID=1:425274373424:android:6563cc711545857cb084f5
GOOGLE_APPLICATION_CREDENTIALS=/Users/dan/.alphinium/firebase-dist-sa.json

# Release signing (required for Play Store AAB — optional for debug APK)
ANDROID_KEYSTORE_PATH=/Users/dan/.alphinium/alphinium-release.keystore
ANDROID_KEYSTORE_PASSWORD=
ANDROID_KEY_ALIAS=alphinium
ANDROID_KEY_PASSWORD=
```

Start the agent:
```bash
cd alphinium-mac-build-agent
npm start
# Or for auto-start on login:
npm run install-launchd
```

---

## Artifacts

| Artifact | URL pattern |
|----------|-------------|
| APK (GCS) | `https://storage.googleapis.com/alphinium-assets/builds/android/{job-id}/alphinium-app-debug.apk` |
| Firebase | `https://appdistribution.firebase.google.com/testerapps/{app-id}/releases/{release-id}` |

---

## For Play Store Release

The default build produces a **debug APK** — fine for testing via Firebase App Distribution. For Play Store you need a **signed release AAB**. See [APP-STORE-SUBMISSION.md](./APP-STORE-SUBMISSION.md#android-release-build).

---

## Troubleshooting

### Build stuck on "pending"

Agent may be offline. Check:
```bash
ps aux | grep "alphinium-mac-build-agent" | grep -v grep
```
If not running: `cd alphinium-mac-build-agent && npm start`

### npm install fails for @alphinium/auth

The package is installed from a private GitHub repo. Requires SSH access:
```bash
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

### Out of disk space during build

Gradle caches accumulate. Clean:
```bash
rm -rf ~/.gradle/caches/
rm -rf /tmp/alphinium-android-*/
```
