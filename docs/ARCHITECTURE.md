# Alphinium App Architecture

**Version:** 1.1.0
**Last Updated:** May 2026
**Status:** Production Template — deployed via alphinium-forge

## 🎯 Overview

alphinium-app is the **official React Native + Strapi template** used by [alphinium-forge-cli](https://github.com/redsitesoftware/alphinium-forge-cli) to bootstrap new projects. When a user runs `alphinium forge new`, this repo is forked, addons are installed via the [alphinium-assets registry](https://github.com/redsitesoftware/alphinium-assets), and the fork is deployed to [alphinium user-pods](https://user-pods.alphinium.io).

### Core ecosystem
| Repo | Role |
|------|------|
| `alphinium-app` | This template — forked per project |
| `alphinium-forge-cli` | CLI that scaffolds forks + installs addons |
| `alphinium-assets` | Registry of addons + templates |
| `alphinium-payments` | Shared platform billing server |
| `alphinium-auth` | Shared auth package (RN + server) |
| `alphinium-analytics` | Analytics collector + dashboard |
| `alphinium-ads` | AdMob/MAX ad integration addon |
| alphinium user-pods | Kubernetes hosting platform for forks |

---

## 🏗️ Repository Structure

```
alphinium-app/
├── react-native/              # Mobile app (React Native + Expo)
│   ├── App.js                 # App entry point
│   ├── app.config.js          # Expo config (reads env vars)
│   ├── tsconfig.json          # TypeScript (opt-in, .ts/.tsx files only)
│   ├── src/
│   │   ├── context/           # AuthContext (re-export shim → @alphinium/auth)
│   │   ├── hooks/             # useAuth (re-export shim → @alphinium/auth)
│   │   ├── navigation/        # React Navigation (stack + bottom tabs)
│   │   ├── screens/           # LoginScreen, Dashboard, Account, Pricing, etc.
│   │   ├── services/          # StripeService, stripe.js
│   │   ├── store/             # Zustand global store (index.ts)
│   │   ├── types/             # Shared TypeScript types (index.ts)
│   │   ├── components/        # Reusable UI components
│   │   ├── config.js          # App config (reads EXPO_PUBLIC_* env vars)
│   │   └── theme.js           # Design system tokens (colors, spacing, etc.)
│   └── assets/                # App icons, splash screens
├── backend/                   # Strapi CMS
│   ├── config/                # Strapi config (database, server, middleware)
│   ├── src/                   # Custom APIs, content types, plugins
│   └── Dockerfile             # Backend container
├── Dockerfile.frontend        # Frontend web container (nginx)
├── Dockerfile.frontend.nginx.conf
├── .alphinium/
│   └── pods.yml               # Canonical deployment manifest (consumed by forge + user-pods)
├── docs/                      # This documentation
└── k8s/                       # Kubernetes manifests (reference)
```

---

## 🔧 Technology Stack

### Mobile App
| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76.5 + Expo 52 |
| Language | JavaScript + optional TypeScript |
| Auth | `@alphinium/auth` — AuthProvider, useAuth, withAuth, LoginScreen |
| State | Zustand 5 (global store) |
| Data fetching | TanStack Query 5 (QueryClientProvider in App.js) |
| Navigation | React Navigation 7 (stack + bottom tabs) |
| Payments | `@stripe/stripe-react-native` + StripeService |
| i18n | i18next |
| Storage | AsyncStorage |

### Backend (Strapi CMS)
| Layer | Technology |
|-------|-----------|
| Framework | Strapi v5 |
| Database | SQLite (dev/user-pods), PostgreSQL (production) |
| Auth | Strapi built-in JWT + OAuth (GitHub, Google via alphinium-socials) |
| API | REST |

### Auth Package (`@alphinium/auth`)

All auth logic lives in the shared [`alphinium-auth`](https://github.com/redsitesoftware/alphinium-auth) package:

```js
// React Native
import { AuthProvider, useAuth, withAuth, LoginScreen } from '@alphinium/auth';

// Server (Node.js)
const { validateStrapiJwt, createStrapiAuthMiddleware } = require('@alphinium/auth/server');
```

`AuthProvider` wraps the app and reads `strapiUrl` to connect to the Strapi backend. All screens use `useAuth()` — the local `src/context/AuthContext.js` and `src/hooks/useAuth.js` are re-export shims for backward compatibility.

### State Management (Zustand)

`src/store/index.ts` provides a global store with auth state + UI state:

```ts
import { useAppStore, selectUser, selectIsAuthenticated } from './src/store';
const user = useAppStore(selectUser);
```

### Data Fetching (TanStack Query)

`QueryClientProvider` is mounted in `App.js`. Use `useQuery`/`useMutation` for all server state:

```js
import { useQuery } from '@tanstack/react-query';
const { data, isLoading } = useQuery({ queryKey: ['plans'], queryFn: fetchPlans });
```

---

## 🚀 Deployment Architecture

alphinium-app forks are hosted on **alphinium user-pods** — an internal Kubernetes platform that auto-provisions ingress, TLS, and DNS under `*.user-pods.alphinium.io`.

### Deployment manifest: `.alphinium/pods.yml`

This file is the single source of truth consumed by:
- **alphinium-forge-cli** — reads it to know what env vars to prompt for during `forge new`
- **alphinium user-pods deployer** — auto-generates secrets and sets env vars before deploy
- **alphinium-cli** — `pod deploy` command uses it

Two pods are deployed per fork:

| Pod | Dockerfile | Port | Description |
|-----|-----------|------|-------------|
| `backend` | `backend/Dockerfile` | 1337 | Strapi CMS |
| `frontend` | `Dockerfile.frontend` | 80 | React Native Web (nginx) |

### Environment variable categories in `pods.yml`

| Category | Behaviour |
|----------|-----------|
| `auto_generate` | Generated once by user-pods at deploy time, never regenerated (e.g. `ADMIN_JWT_SECRET`, `APP_KEYS`) |
| `defaults` | Safe static values baked in (e.g. `DATABASE_CLIENT: sqlite`) |
| `user_provided` | Prompted by `alphinium-cli` during deploy (e.g. Stripe keys) |

### Live test deployment

| URL | Description |
|-----|-------------|
| `https://alphinium-app-test-69wj81da.user-pods.alphinium.io/` | Live test fork |

---

## 🔐 Auth Flow

```
User opens app
  └─ AuthProvider checks AsyncStorage for cached JWT
       ├─ Token found → fetch /api/users/me (Strapi) → restore session
       └─ No token → show LoginScreen (GitHub / Google OAuth via WebView)
               └─ OAuth success → token received → login() → store in AsyncStorage
```

On the server side, any alphinium service can validate Strapi JWTs:

```js
const { createStrapiAuthMiddleware } = require('@alphinium/auth/server');
router.use('/protected', createStrapiAuthMiddleware({ strapiUrl: process.env.STRAPI_URL }));
```

---

## 💳 Payment Flow

Payments are handled by the shared [`alphinium-payments`](https://github.com/redsitesoftware/alphinium-payments) server at `https://payments-api.alphinium.com`.

```
Mobile App → alphinium-payments (create checkout session)
  └─ Stripe Checkout (hosted)
       └─ Stripe webhook → alphinium-payments
              └─ subscription_events audit table
              └─ entitlement check endpoint for app to query
```

The app queries `GET /api/entitlement/:userId` to check subscription tier.

---

## 📦 Addon System

Addons are installed into forks via `alphinium-forge-cli` using the registry in [`alphinium-assets/registry.json`](https://github.com/redsitesoftware/alphinium-assets). Each addon has an `install.sh` that applies changes to the fork.

Available addons: `alphinium-ads`, `alphinium-analytics`, `alphinium-socials`, `alphinium-auth`, `alphinium-maps`, `alphinium-weather`, `alphinium-air-traffic`, `alphinium-land-traffic`, `alphinium-water-traffic`, `alphinium-space-traffic`.

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) — Developer onboarding
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Daily development workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) — User-pods deployment guide
- [USER-PODS.md](./USER-PODS.md) — User-pods platform reference
- [SETUP.md](./SETUP.md) — Strapi + payments setup

---

**Maintained by:** Red Site Software


## 🎯 Overview

Alphinium is a unified multi-platform application suite consisting of:
- **Mobile App** (iOS, Android, Web) - React Native + Expo
- **Backend CMS** - Strapi headless CMS
- **Payment System** - Shared Stripe billing infrastructure
- **Push Notifications** - Custom alphinium-push-service microservice
- **Brand Assets** - Centralized alphinium-marketing-assets repository

## 🏗️ Repository Structure

```
alphinium-app/
├── react-native/          # Mobile app (React Native + Expo)
│   ├── App.js            # Basic version (Issue #324)
│   ├── App-Enhanced.js   # Full features (Issue #448)
│   ├── App-Stripe.js     # Payment integration (Issue #570)
│   ├── assets/           # App assets (logos, icons, splash screens)
│   ├── src/              # Source code
│   └── docs/             # Component documentation
├── backend/              # Strapi CMS
│   ├── config/           # Strapi configuration
│   ├── src/              # Custom code, APIs
│   └── database/         # Database files
├── payments/             # Submodule: alphinium-stripe-billing
│   ├── src/              # Stripe integration code
│   └── webhooks/         # Stripe webhook handlers
└── docs/                 # Project documentation
    ├── api/              # API documentation
    └── pricing/          # Pricing research

External Repositories:
├── alphinium-marketing-assets/   # Brand assets (logos, guidelines)
│   ├── logos/                    # RSS, ChatInstance, Alphinium logos
│   ├── brand-guidelines/         # Colors, typography
│   └── index.html                # Preview page
└── alphinium-push-service/       # Push notification microservice (Issues #13-23)
    ├── src/                      # Custom APNs/FCM integration
    └── webhooks/                 # Notification event handlers
```

## 🔧 Technology Stack

### Mobile App (React Native)
- **Framework:** React Native 0.76.5 + Expo 52.0.0
- **Language:** JavaScript (React 18.3.1)
- **UI Components:** React Native core components
- **Storage:** AsyncStorage for offline support
- **HTTP Client:** Axios
- **Payment:** @stripe/stripe-react-native

### Backend (Strapi CMS)
- **Framework:** Strapi v5 (latest)
- **Database:** SQLite (development), PostgreSQL (production)
- **API:** RESTful + GraphQL
- **Auth:** Strapi built-in authentication
- **Media:** Strapi upload plugin

### Payment System
- **Provider:** Stripe
- **Features:**
  - Recurring subscriptions
  - One-time payments
  - Usage tracking
  - Webhook processing
- **Shared Package:** alphinium-stripe-billing (submodule)

## 📊 Data Flow

### Content Management Flow
```
Mobile App → Strapi API → Database
     ↓           ↓
 Display    Process/Store
```

### Payment Flow
```
Mobile App → Stripe Checkout → Stripe API
     ↓              ↓              ↓
Display        Process         Webhook → Backend
                                   ↓
                              Update Subscription
```

### Offline-First Flow (Enhanced Version)
```
User Action → AsyncStorage (cache) → API Call
     ↓              ↓                    ↓
 Immediate      Background           Sync when online
 Feedback         Queue
```

## 🔐 Authentication & Authorization

### Current Implementation
- **Method:** Strapi API tokens (hardcoded for prototype)
- **Scope:** Full API access

### Production Plan
- **Method:** JWT tokens via Strapi auth
- **Flow:**
  1. User registers/logs in
  2. Strapi issues JWT token
  3. Mobile app stores token securely
  4. Token sent with each API request
- **Refresh:** Token refresh on expiry

## 📱 Mobile App Architecture

### Three App Versions

#### 1. App.js (Basic - Issue #324)
- Simple CRUD operations
- Direct Strapi integration
- Connection testing
- Basic UI

#### 2. App-Enhanced.js (Full Features - Issue #448)
**Recommended for production**
- Complete CRUD (create, read, update, delete)
- Offline support with sync queue
- Advanced error handling
- Search, sort, filter
- Bookmarks/favorites
- Draft saving
- Share functionality
- Haptic feedback
- Accessibility support

#### 3. App-Stripe.js (Payment Demo - Issue #570)
- Subscription plan selection
- Stripe Checkout integration
- Payment verification
- Success/cancel handling

### Component Structure
```
App (Root)
├── Connection Status
├── Article List
│   ├── Search Bar
│   ├── Sort/Filter Controls
│   └── Article Cards
├── Create/Edit Form
│   ├── Title Input
│   ├── Content Input
│   └── Action Buttons
└── Payment Screens (Stripe version)
    ├── Plan Selection
    ├── Checkout Integration
    └── Payment Result
```

## 🔄 API Endpoints

### Strapi Content API
- `GET /api/articles` - List all articles
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Strapi Auth API
- `POST /api/auth/local/register` - Register user
- `POST /api/auth/local` - Login user
- `GET /api/users/me` - Get current user

### Stripe Payment API (via Backend)
- `POST /api/subscriptions/create-checkout-session` - Create payment
- `GET /api/subscriptions/:id` - Get subscription status
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 🚀 Deployment Architecture

### Development
- **Mobile:** Expo Go app (dev builds)
- **Backend:** Local Strapi (http://localhost:1337)
- **Database:** SQLite
- **Stripe:** Test mode

### Staging
- **Mobile:** Expo EAS builds (internal testing)
- **Backend:** Strapi on cloud VPS
- **Database:** PostgreSQL
- **Stripe:** Test mode

### Production
- **Mobile:** 
  - iOS: App Store (TestFlight → Production)
  - Android: Google Play (Internal/Closed Beta → Production)
  - Web: Static hosting (Vercel/Netlify)
- **Backend:** Strapi on production VPS
- **Database:** PostgreSQL with backups
- **Stripe:** Live mode
- **CDN:** CloudFlare for assets

## 📦 Package Management

### Dependencies
- **Mobile:** npm (package.json in react-native/)
- **Backend:** npm (package.json in backend/)
- **Payments:** npm (submodule dependency)

### Version Strategy
- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **Current:** 0.1.0-alpha
- **Beta:** 0.2.0-beta (when ready for beta testing)
- **Production:** 1.0.0 (first public release)

## 🔒 Security Considerations

### Current (Prototype)
- ⚠️ Hardcoded API tokens (for development only)
- ⚠️ No user authentication
- ✅ HTTPS for API calls (production)
- ✅ Stripe hosted checkout (PCI compliant)

### Production Requirements
- ✅ JWT authentication
- ✅ Secure token storage (Keychain/Keystore)
- ✅ API rate limiting
- ✅ Input validation/sanitization
- ✅ Environment variable management
- ✅ Regular security audits

## 📈 Scalability Considerations

### Database
- SQLite (development)
- PostgreSQL (production)
- Consider: Redis for caching

### API
- Strapi handles scaling well
- Consider: Load balancing for high traffic
- CDN for media assets

### Mobile App
- Offline-first architecture reduces server load
- Background sync reduces real-time requests
- Pagination for large data sets

## 🧪 Testing Strategy

### Mobile App
- Manual testing on Expo Go
- Device testing (iOS/Android)
- Web browser testing
- Automated testing: Jest (planned)

### Backend
- Strapi admin testing
- API endpoint testing
- Database migration testing
- Automated testing: Jest (planned)

### Integration
- End-to-end flow testing
- Payment flow testing (Stripe test mode)
- Offline sync testing

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Developer onboarding guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [API Documentation](./api/) - Detailed API specs

## 🎯 Future Enhancements

### Phase 2 (Q2 2026)
- User authentication system
- Profile management
- Push notifications
- Real-time sync
- Advanced analytics

### Phase 3 (Q3 2026)
- Desktop management interface
- Advanced subscription tiers
- Team collaboration features
- API for third-party integrations

---

**Maintained by:** Dan Woods - Red Site Software  
**Questions?** Open an issue on GitHub

## 🎨 Brand Assets

**Repository:** [alphinium-marketing-assets](https://github.com/redsitesoftware/alphinium-marketing-assets)

Centralized brand assets for all Red Site Software properties:

### Available Brands
- **Red Site Software** - Red (#E74C3C) branding
- **ChatInstance** - Blue (#3498DB) speech bubble icon
- **Alphinium** - Purple (#9B59B6) lettermark

### Assets Per Brand
- Original logo (source)
- App icon (1024x1024)
- Adaptive icon (1024x1024)  
- Splash screen (1242x2436)
- Favicon (512x512)
- Brand guidelines & documentation

### Preview
View all assets: [index.html preview page](https://github.com/redsitesoftware/alphinium-marketing-assets/blob/main/index.html)

## 🔔 Push Notifications

**Custom Implementation** (Issues #13-23)

Alphinium uses a custom push notification microservice instead of Firebase:

### alphinium-push-service
- Custom APNs integration (iOS)
- Custom FCM integration (Android)
- Device token management
- Badge counter system
- Webhook event handling

### Components
1. **Backend Service** (#14) - Microservice for push delivery
2. **Device Management** (#15) - Token registration/storage
3. **APNs Integration** (#16) - iOS notifications
4. **FCM Integration** (#17) - Android notifications
5. **Badge Counters** (#18) - Unread count tracking
6. **iOS Client** (#20) - React Native iOS implementation
7. **Android Client** (#21) - React Native Android implementation
8. **Integration** (#22) - Connect all components
9. **Testing** (#23) - End-to-end validation

### Why Custom?
- Full control over notification delivery
- No third-party dependencies
- Better privacy and data control
- Optimized for our use case
- Cost-effective at scale

