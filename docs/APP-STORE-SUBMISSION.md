# App Store & Google Play Submission Guide

**Version:** 1.1.0 | **Updated:** May 2026  
**Applies to:** alphinium-app template forks deployed via alphinium forge

This guide walks through everything needed to get a forked alphinium-app into the Apple App Store and Google Play Store — from account setup through to approval.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Before You Build](#before-you-build)
3. [Building for Production](#building-for-production)
4. [Apple App Store](#apple-app-store)
   - [App Store Connect setup](#app-store-connect-setup)
   - [TestFlight internal testing](#testflight-internal-testing)
   - [Submitting for review](#submitting-for-review)
   - [Common rejection reasons](#common-rejection-reasons)
5. [Google Play Store](#google-play-store)
   - [Play Console setup](#play-console-setup)
   - [Internal testing track](#internal-testing-track)
   - [Submitting for review](#submitting-for-review-1)
   - [Common rejection reasons](#common-rejection-reasons-1)
6. [Required Assets](#required-assets)
7. [App Metadata](#app-metadata)
8. [After Approval](#after-approval)
9. [Updating the App](#updating-the-app)

---

## Prerequisites

### Accounts (required before anything else)

| Account | Cost | Where |
|---------|------|-------|
| Apple Developer Program | USD $99/year | [developer.apple.com](https://developer.apple.com/programs/enroll/) |
| Google Play Developer | USD $25 one-time | [play.google.com/console](https://play.google.com/console/signup) |

Apple review takes **1–2 days** for enrolment. Plan ahead.

### Credentials (alphinium build agent reads these)

| Credential | iOS | Android |
|------------|-----|---------|
| Apple Team ID | `APPLE_TEAM_ID` in `.env` | — |
| App Store Connect API Key | `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_PATH` | — |
| Distribution certificate | Keychain (managed by Xcode) | — |
| Provisioning profile | `~/Library/MobileDevice/Provisioning Profiles/` | — |
| Release keystore | — | `ANDROID_KEYSTORE_PATH`, passwords in `.env` |

### Required local tools

```bash
# Verify everything is installed
xcodebuild -version          # Xcode 14+
java -version                # Java 17
pod --version                # CocoaPods 1.12+
gsutil version               # Google Cloud SDK
```

---

## Before You Build

### 1. Set your Bundle ID / Package name

This is the unique identifier for your app. **Set it once — it cannot be changed after submission.**

In `react-native/app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

> **Convention:** Use reverse domain notation — `com.yourcompany.appname`. No hyphens allowed.

### 2. Set your app version

In `react-native/app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

Rules:
- `version` — user-facing (e.g. `1.0.0`) — increment for every release
- `buildNumber` (iOS) — integer string, increment for every build uploaded to TestFlight
- `versionCode` (Android) — integer, must be strictly increasing for every Play Store upload

### 3. Replace placeholder assets

| Asset | Path | Required size |
|-------|------|--------------|
| App icon | `react-native/assets/icon.png` | 1024×1024px, no alpha |
| Splash screen | `react-native/assets/splash.png` | 2048×2048px |
| Adaptive icon (Android) | `react-native/assets/adaptive-icon.png` | 1024×1024px, transparent background |
| Favicon (web) | `react-native/assets/favicon.png` | 48×48px |

> Use tools like [appicon.co](https://www.appicon.co) or [makeappicon.com](https://makeappicon.com) to generate all sizes from a single 1024px source.

### 4. Prepare screenshots

Both stores require screenshots. Prepare them for each required device size before submitting.

**iOS required sizes:**
- iPhone 6.9" (iPhone 15 Pro Max / 16 Pro Max) — **mandatory**
- iPhone 6.5" (iPhone 14 Plus / 15 Plus)
- iPad Pro 13" — required if supporting iPad

**Android required sizes:**
- Phone screenshots (any resolution)
- Tablet screenshots (optional but recommended)

> **Tip:** Use the iOS Simulator + `xcrun simctl io booted screenshot` or Android Emulator + `adb exec-out screencap -p` to capture screenshots with real app content.

---

## Building for Production

### Using the alphinium mac build agent (recommended)

Trigger builds via the API — the agent handles compilation, signing, and upload automatically:

```bash
# Get your project ID (created when you forged the app)
PROJECT_ID="your-project-uuid"
TOKEN="your-alphinium-jwt"

# Android release build
curl -X POST https://api.app.alphinium.com/api/builds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"'$PROJECT_ID'","platform":"android","ref":"main"}'

# iOS build (archives + uploads to TestFlight automatically)
curl -X POST https://api.app.alphinium.com/api/builds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"'$PROJECT_ID'","platform":"ios","ref":"main"}'
```

Poll for completion:
```bash
BUILD_ID="returned-build-id"
curl https://api.app.alphinium.com/api/builds/$BUILD_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

When complete you'll get:
- `download_url` — direct GCS link to the binary
- `testflight_url` — TestFlight public link (iOS)
- `firebase_install_url` — Firebase App Distribution link (Android)

### Build output locations

| Platform | Artifact | Location |
|----------|----------|----------|
| Android | `.apk` debug | `gs://alphinium-assets/builds/android/{job-id}/alphinium-app-debug.apk` |
| iOS | `.ipa` | `gs://alphinium-assets/builds/ios/{job-id}/alphinium-app.ipa` |

> **For Play Store submission**, you need a **signed release AAB** (not debug APK). See [Android release build](#android-release-build) below.

### Android release build

The default build agent produces a **debug APK** sufficient for Firebase testing. For Play Store you need a signed **AAB**:

1. Generate a release keystore (one-time):
   ```bash
   keytool -genkey -v \
     -keystore ~/.alphinium/yourapp-release.keystore \
     -alias yourapp \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
   Store the keystore and passwords somewhere safe — **losing it means you can never update the app on Play Store**.

2. Set in `alphinium-mac-build-agent/.env`:
   ```env
   ANDROID_KEYSTORE_PATH=/Users/you/.alphinium/yourapp-release.keystore
   ANDROID_KEYSTORE_PASSWORD=yourpassword
   ANDROID_KEY_ALIAS=yourapp
   ANDROID_KEY_PASSWORD=yourkeypassword
   ```

3. The build agent will produce a signed AAB ready for Play Store.

---

## Apple App Store

### App Store Connect setup

1. Log in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps → +** → New App
3. Fill in:
   - **Platform:** iOS
   - **Name:** Your app name (max 30 chars — choose carefully, hard to change)
   - **Primary Language:** English (Australia) or your locale
   - **Bundle ID:** Select the one registered in the Developer Portal (must match `app.json`)
   - **SKU:** Any unique string (e.g. `yourapp-001`)
4. **Register App ID in Developer Portal** (if not already):
   - [developer.apple.com/account](https://developer.apple.com/account) → Identifiers → +
   - Type: App IDs → App
   - Bundle ID: Explicit → enter your bundle ID
   - Capabilities: enable what you need (Push Notifications, In-App Purchase if applicable)

### Create App Store Connect API Key

Required for the build agent to upload to TestFlight automatically:

1. App Store Connect → Users and Access → Integrations → App Store Connect API
2. Generate API Key → Role: **App Manager** or **Admin**
3. Download the `.p8` file — **you can only download it once**
4. Save to: `~/.appstoreconnect/private_keys/AuthKey_{KEY_ID}.p8`
5. Set in `alphinium-mac-build-agent/.env`:
   ```env
   ASC_API_KEY_ID=XXXXXXXXXX
   ASC_API_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ASC_API_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8
   ```

### Create provisioning profile

1. Developer Portal → Profiles → +
2. Type: **App Store Connect** (Distribution)
3. Select your App ID
4. Select your Distribution Certificate
5. Name it: `{yourapp}-appstore`
6. Download and double-click to install
7. Set in `.env`:
   ```env
   APPLE_PROVISIONING_PROFILE_NAME={yourapp}-appstore
   APPLE_PROVISIONING_PROFILE_PATH=~/Library/MobileDevice/Provisioning\ Profiles/{yourapp}-appstore.mobileprovision
   ```

### TestFlight internal testing

After the build agent uploads your `.ipa`:

1. App Store Connect → Your App → TestFlight
2. The build appears under **iOS Builds** with status "Processing" (takes 5–15 min)
3. Once processing completes → click the build → **Add to Group** → Internal Testing
4. Internal testers (your Apple Developer team members) can install immediately — no Apple review
5. Verify: login works, payments work, all screens load correctly

### TestFlight external testing (beta)

For users outside your team:

1. TestFlight → External Groups → + → Create group
2. Add testers by email or share the public TestFlight link
3. **Requires Beta App Review** — Apple reviews the build before external testers can access (~1–2 days)

### Submitting for App Store review

Once satisfied with internal testing:

1. App Store Connect → Your App → App Store tab
2. Fill in all required fields:

**Version Information:**
- What's New (if update): describe changes
- Promotional text (optional): up to 170 chars, no review needed to change

**App Information:**
- Description: explain what the app does (up to 4000 chars)
- Keywords: comma-separated, max 100 chars total — choose carefully
- Support URL: must be live and accessible
- Marketing URL (optional)

**Pricing & Availability:**
- Price: Free (or set tier if paid)
- Availability: All countries or selected

**App Review Information:**
- Demo account credentials if your app requires login
- Contact info for reviewer
- Notes: any context that helps the reviewer

**Privacy Policy URL:** required — must be live before submission

3. Select the build (from TestFlight)
4. **Add for Review → Submit**

### App Store review timeline

- First submission: **1–3 days** typically (can be up to 7)
- Updates: usually **24–48 hours**
- Expedited review: available for genuine bugs/crashes only via [developer.apple.com/contact/app-store/](https://developer.apple.com/contact/app-store/)

### Common rejection reasons (iOS)

| Reason | Guideline | Fix |
|--------|-----------|-----|
| Crashes on launch or during review | 2.1 | Test on real device before submitting |
| Missing privacy policy | 5.1.1 | Add a live privacy policy URL |
| Login required but no demo credentials | 2.1 | Add demo account in review notes |
| Placeholder content / Lorem ipsum | 4.0 | Replace all placeholder text/images |
| App too simple / limited functionality | 4.2 | Ensure the app provides real value |
| Misleading screenshots | 2.3.7 | Screenshots must match actual app |
| In-app purchases not using Apple IAP | 3.1.1 | Stripe direct payments to users is OK for B2B/marketplace — know the rules |
| Push notifications without clear purpose | 4.5.4 | Remove or explain notification usage |

---

## Google Play Store

### Play Console setup

1. Log in at [play.google.com/console](https://play.google.com/console)
2. **Create app**
3. Fill in:
   - App name, default language, app/game, free/paid
   - Declarations (ads, target audience, etc.)
4. Complete the **Setup** checklist in the left nav — all items must be green before you can submit

### Internal testing track

Upload your signed AAB for immediate internal testing (no review):

1. Play Console → Your App → Testing → Internal testing → Create new release
2. Upload the signed `.aab` file
3. Add testers via email or Google Group
4. Testers install via the opt-in URL — updates within minutes

**Verify on real Android device or emulator** before proceeding to production.

### Submit for production review

1. Play Console → Your App → Production → Create new release
2. Upload signed `.aab`
3. Fill in release notes (What's new)
4. Complete all required store listing fields:

**Store listing:**
- Short description (max 80 chars)
- Full description (max 4000 chars)
- Screenshots (phone, 7" tablet optional, 10" tablet optional)
- Feature graphic: 1024×500px (shown in Play Store header)
- App icon: 512×512px

**Content rating:**
- Play Console → Policy → App content → Content rating
- Answer the questionnaire — takes ~5 min
- Generates your rating (Everyone, Teen, Mature, etc.)

**Target audience:**
- Declare if app targets children (COPPA/GDPR-K implications)

**Privacy policy:** Required — must be a live URL

5. **Send X% for review** — you can roll out to 10%, 50%, or 100% of users

### Google Play review timeline

- First submission: **3–7 days**
- Updates: **24 hours–3 days** (faster for established apps)

### Common rejection reasons (Android)

| Reason | Fix |
|--------|-----|
| Missing privacy policy | Add live privacy policy URL |
| Permissions not justified | Only request permissions you actually use — remove unused |
| App crashes or ANR on review device | Test on multiple Android versions and screen sizes |
| Misleading metadata | Description must match actual functionality |
| Content policy violation | No adult content without proper rating |
| Broken login / demo account issues | Provide working test credentials in review notes |

---

## Required Assets

### Prepare before starting either submission

```
assets/
├── icon-1024.png              # Source icon (1024×1024, no rounded corners — stores add them)
├── screenshots/
│   ├── ios/
│   │   ├── 6.9inch/           # iPhone 15 Pro Max / 16 Pro Max (required)
│   │   └── 6.5inch/           # iPhone 14 Plus (required for older devices)
│   └── android/
│       ├── phone/             # Any phone resolution (required)
│       └── tablet/            # Optional
├── feature-graphic.png        # Android only — 1024×500px
└── privacy-policy.html        # Must be hosted at a public URL
```

### Privacy Policy minimum content

Your privacy policy must cover (even for simple apps):

- What data you collect (email, device info, usage analytics)
- How it's used
- Third-party services (Stripe, Google Analytics if used)
- Data retention and deletion policy
- Contact email for privacy requests
- GDPR compliance (right to deletion) if you have EU users

Free generators: [privacypolicies.com](https://www.privacypolicies.com), [app-privacy-policy.com](https://app-privacy-policy.com)

---

## App Metadata

### Recommended description structure

```
[Hook — 1–2 sentences of what the app does]

[Main features — 3–5 bullet points]

[Who it's for]

[Call to action]

[Legal/compliance if needed]
```

### Keywords strategy (iOS)

- 100 character limit — every character counts
- No spaces after commas: `keyword1,keyword2,keyword3`
- Don't repeat words already in your app name or subtitle
- Research competitors' keywords

---

## After Approval

### iOS

- App goes live automatically (or on a scheduled date you set)
- You'll receive an email: "Your app is ready for sale"
- Check [itunesconnect.apple.com](https://itunesconnect.apple.com) → Sales and Trends for downloads

### Android

- Rolls out to the percentage you selected
- Increase rollout % in Play Console → Production → Manage release → Edit rollout

### Monitor post-launch

- **Crashes:** Xcode Organiser → Crashes (iOS) / Play Console → Android Vitals (Android)
- **Reviews:** Respond to user reviews within 48 hours — affects store ranking
- **Analytics:** App Store Connect Analytics / Play Console Statistics

---

## Updating the App

### Version bump checklist

Before each release:

- [ ] Increment `version` in `app.json` (e.g. `1.0.0` → `1.0.1`)
- [ ] Increment `buildNumber` (iOS) — must be higher than last uploaded build
- [ ] Increment `versionCode` (Android) — must be strictly higher than last Play Store upload
- [ ] Trigger new build via mac build agent
- [ ] Test in TestFlight / Play internal track
- [ ] Submit update (iOS ~24–48h review, Android ~24h)

### Hotfix process (critical bug)

1. Fix the bug on a hotfix branch
2. Bump build number / version code
3. Trigger build → internal test → expedited review (iOS) or direct production push (Android if < 1% crash rate)

---

## Troubleshooting

### "Missing compliance" (iOS)

Your app uses encryption (HTTPS). Set in `app.json`:
```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```
This is already set in the alphinium-app template.

### "Invalid binary" upload error

Usually a signing issue. Check:
- Provisioning profile matches bundle ID exactly
- Certificate hasn't expired
- Team ID is correct

### Android upload rejected — version code already exists

Each upload to Play Store must have a strictly higher `versionCode`. Cannot reuse or skip codes.

### App killed by Apple for inactivity

Apple removes apps that haven't been updated in 2+ years. Set a reminder to release at least a maintenance update annually.

---

## Quick Reference

| Action | iOS | Android |
|--------|-----|---------|
| Submit new app | App Store Connect → New App | Play Console → Create App |
| Upload build | Automatic via build agent → TestFlight | Trigger build → download AAB → upload to Play Console |
| Internal test | TestFlight → Internal Group | Internal Testing track |
| Public beta | TestFlight → External Group (+Beta Review) | Open Testing track |
| Production | App Store → Submit for Review | Production track → rollout % |
| Review time | 1–3 days | 3–7 days |
| Update review | 24–48 hours | 24 hours |
| Crash reporting | Xcode Organiser / App Store Connect | Play Console → Android Vitals |
