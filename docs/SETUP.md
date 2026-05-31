# Developer Setup Guide

**Version:** 1.1.0 | **Updated:** May 2026

Welcome to `alphinium-app` — the forge template for React Native + Strapi apps deployed on alphinium user-pods.

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- **Git**
- **Expo Go** app on your phone (for quick mobile testing)

For web development, no extra tools needed — `npm start` then press `w`.

---

## Quick Start (local dev)

### 1. Clone

```bash
git clone git@github.com:redsitesoftware/alphinium-app.git
cd alphinium-app
```

No submodules — payments is a separate service, not a submodule.

### 2. Install React Native dependencies

```bash
cd react-native
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Strapi backend (run locally or point to a deployed pod)
EXPO_PUBLIC_API_URL=http://localhost:1337

# App branding — shown in LoginScreen and throughout the app
EXPO_PUBLIC_APP_NAME=My App

# Stripe (optional for local dev — leave blank to disable payment screens)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Start the React Native app

```bash
npm start
# Press w for web, i for iOS simulator, a for Android emulator
# Or scan the QR code with Expo Go on your phone
```

### 5. Start Strapi backend (optional for full auth flow)

```bash
cd ../backend
npm install
npm run develop
# Admin panel: http://localhost:1337/admin
```

On first run, Strapi will prompt you to create an admin account.

---

## Auth setup

Auth is handled by [`@alphinium/auth`](https://github.com/redsitesoftware/alphinium-auth). The app shows a `LoginScreen` with GitHub and Google OAuth providers. These flow through Strapi's built-in OAuth:

1. In Strapi admin → Settings → Users & Permissions → Providers
2. Enable GitHub or Google and paste your OAuth app credentials
3. Set callback URL to `http://localhost:1337/api/connect/github/callback`

For local testing you can skip OAuth — the `LoginScreen` is shown but skipping it won't block development of most screens.

---

## Payments setup (optional)

The app integrates with the shared `alphinium-payments` server at `https://payments-api.alphinium.com`. For local payments testing:

1. Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
2. See [STRIPE_INSTALLATION.md](../react-native/STRIPE_INSTALLATION.md) for Stripe test mode setup

---

## TypeScript

TypeScript is configured opt-in via `tsconfig.json`. Existing `.js` files are unaffected. Add new files as `.ts` / `.tsx` to get full type checking. Shared types live in `src/types/index.ts`.

---

## Project structure

```
react-native/
├── App.js                  # Entry: QueryClientProvider → AuthProvider → Navigator
├── src/
│   ├── config.js           # EXPO_PUBLIC_* env vars
│   ├── theme.js            # Design tokens (colors, spacing, typography)
│   ├── store/index.ts      # Zustand global store
│   ├── types/index.ts      # Shared TypeScript types
│   ├── context/            # AuthContext (re-export shim → @alphinium/auth)
│   ├── hooks/              # useAuth (re-export shim → @alphinium/auth)
│   ├── navigation/         # Tab + stack navigators
│   ├── screens/            # All screens
│   ├── services/           # StripeService, API clients
│   └── components/         # Shared UI components
```

---

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Daily dev workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deploy to user-pods
- [USER-PODS.md](./USER-PODS.md) — User-pods platform reference
