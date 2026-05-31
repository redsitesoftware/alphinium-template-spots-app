# Stripe Integration

`alphinium-app` is a **template** — clone it, set env vars, and payments work for any project with any pricing structure. No source code changes are required per project.

---

## 🚀 Live Payments Pod (Alphinium)

**Pod URL:** `https://payments-api-7r86kuat.user-pods.alphinium.io`  
**Image:** `us-central1-docker.pkg.dev/alphinium-production/user-pods/alphinium-payments-slim:amd64-20260508-1634`  
**Branch:** `test/payments-pod`  
**Webhook endpoint:** `we_1TUlp6Hc2oT07zw5xTK6c2ev`  
**Webhook secret:** `whsec_Mlgc5EgDH8ZRziI5tWJKT008nmgmUI6B`

### Redeploy the payments pod

```bash
# 1. Build a new amd64 image (takes ~4 min)
TAG="amd64-$(date +%Y%m%d-%H%M)"
IMAGE="us-central1-docker.pkg.dev/alphinium-production/user-pods/alphinium-payments-slim:$TAG"
docker buildx build --builder gke-builder --platform linux/amd64 \
  --tag "$IMAGE" --file backend/Dockerfile --push ./

# 2. Clean up any orphaned ingress from previous deploy
kubectl delete ingress -n alphinium-7r86kuat -l app=payments-api --ignore-not-found 2>/dev/null

# 3. Deploy (note: env_vars not env)
curl -s -X POST "https://api.user-pods.alphinium.io/deploy" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$IMAGE\",
    \"name\": \"payments-api\",
    \"port\": 1337,
    \"env_vars\": {
      \"NODE_ENV\": \"production\",
      \"APP_KEYS\": \"testkey1,testkey2,testkey3,testkey4\",
      \"ADMIN_JWT_SECRET\": \"testadminjwtsecret1234567890\",
      \"JWT_SECRET\": \"testjwtsecret1234567890\",
      \"API_TOKEN_SALT\": \"testapitokensalt1234\",
      \"STRIPE_SECRET_KEY\": \"sk_test_51StiaZHc2oT07zw5...\",
      \"STRIPE_WEBHOOK_SECRET\": \"whsec_Mlgc5EgDH8ZRziI5tWJKT008nmgmUI6B\",
      \"STRIPE_PRICE_DEVELOPER_MONTHLY\": \"price_1TUffXHc2oT07zw5H1likq1y\",
      \"STRIPE_PRICE_DEVELOPER_ANNUAL\": \"price_1TUffXHc2oT07zw5AGpV5ntL\",
      \"STRIPE_PRICE_TEAM_MONTHLY\": \"price_1TUffZHc2oT07zw5tRBMSZGQ\",
      \"STRIPE_PRICE_TEAM_ANNUAL\": \"price_1TUffZHc2oT07zw5AbK32Z4o\"
    }
  }"

# 4. Update Stripe webhook URL after each redeploy (URL changes with new pod name)
curl -X POST "https://api.stripe.com/v1/webhook_endpoints/we_1TUlp6Hc2oT07zw5xTK6c2ev" \
  -u "$STRIPE_SECRET_KEY:" \
  -d "url=https://payments-api-7r86kuat.user-pods.alphinium.io/api/payment/webhook"
```

### Stripe Price IDs (test mode)

| Tier | Interval | Price ID | AUD |
|------|----------|----------|-----|
| Developer | Monthly | `price_1TUffXHc2oT07zw5H1likq1y` | $29 |
| Developer | Annual | `price_1TUffXHc2oT07zw5AGpV5ntL` | $290 |
| Team | Monthly | `price_1TUffZHc2oT07zw5tRBMSZGQ` | $79 |
| Team | Annual | `price_1TUffZHc2oT07zw5AbK32Z4o` | $790 |

### Required webhook events

The Stripe webhook endpoint must have ALL of these enabled:
- `checkout.session.completed`
- `customer.subscription.created` ← was missing initially, caused subscription creation to fail
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Important: Stripe raw body middleware

Stripe signature verification requires the **raw request body** before any body parser touches it. The middleware `backend/src/middlewares/stripe-raw-body.js` handles this. It **must** be registered BEFORE `strapi::body` in `backend/src/config/middlewares.ts`:

```ts
export default [
  'global::stripe-raw-body',  // ← must be first
  'strapi::errors',
  'strapi::security',
  // ...
  'strapi::body',
];
```

### Important: Pod uses ephemeral SQLite

The pod's SQLite DB (`.tmp/data.db`) is wiped on every restart. After each redeploy you must re-register test users. For production, add `DATABASE_URL` env var to use persistent Postgres.

---

## Architecture

```
alphinium-stripe-billing (npm)
       │
       ▼
backend/config/plans.js        ← per-project customisation (env-driven)
backend/src/api/payment/       ← Strapi API layer
       │
       ▼
GET  /api/payment/plans                → returns plans from config/plans.js
POST /api/payment/create-checkout-session → creates Stripe Checkout session
POST /api/payment/verify-payment       → verifies session after redirect
POST /api/payment/webhook              → handles all Stripe events
GET  /api/payment/subscription/:userId → returns subscription record
POST /api/payment/cancel-subscription  → cancels at period end
POST /api/payment/reactivate-subscription
POST /api/payment/create-portal-session → Stripe Billing Portal URL

react-native/src/services/stripe.js   ← RN service calling all of the above
```

---

## Quick Start

### 1. Create Stripe Products

Create your products and prices in the [Stripe Dashboard](https://dashboard.stripe.com/products), then copy the price IDs.

### 2. Configure `backend/config/plans.js`

This is the **one file you edit per project**. Customise `productName`, `tiers`, and their features. Map price IDs from env vars.

```js
// backend/config/plans.js
module.exports = {
  productName: process.env.PRODUCT_NAME || 'My App',
  tiers: {
    developer: {
      name: 'Developer',
      prices: {
        monthly: { priceId: process.env.STRIPE_PRICE_DEVELOPER_MONTHLY, amount: 2900, interval: 'month' },
        annual:  { priceId: process.env.STRIPE_PRICE_DEVELOPER_ANNUAL,  amount: 29000, interval: 'year' },
      },
      features: ['Feature A', 'Feature B'],
    },
    team: {
      name: 'Team',
      recommended: true,
      prices: {
        monthly: { priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY, amount: 7900, interval: 'month' },
        annual:  { priceId: process.env.STRIPE_PRICE_TEAM_ANNUAL,  amount: 79000, interval: 'year' },
      },
      features: ['Everything in Developer', 'Feature C', 'Feature D'],
    },
  },
  // Resolves a Stripe price ID back to a tier key (used by webhooks)
  getTierFromPriceId(priceId) {
    for (const [tierKey, tier] of Object.entries(this.tiers)) {
      const prices = tier.prices || {};
      if (Object.values(prices).some(p => p.priceId === priceId)) return tierKey;
      if (tier.priceId === priceId) return tierKey;
    }
    return 'free';
  },
};
```

### 3. Set environment variables

Copy `backend/.env.example` → `backend/.env` and fill in:

```bash
PRODUCT_NAME=My App
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_DEVELOPER_MONTHLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
# ...etc
```

Copy `react-native/.env.example` → `react-native/.env` and fill in:

```bash
EXPO_PUBLIC_API_URL=https://api.myapp.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_APP_SCHEME=myapp
```

### 4. Set up Stripe webhooks

In Stripe Dashboard, create a webhook endpoint pointing to:
```
https://api.yourapp.com/api/payment/webhook
```

Required events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

For local development:
```bash
stripe listen --forward-to localhost:1337/api/payment/webhook
```

---

## React Native Flow

1. **PricingScreen** calls `stripeService.getSubscriptionPlans()` → renders tiers dynamically
2. User selects a plan → `stripeService.createCheckoutSession(priceId, userId, token)`
3. App opens Stripe Checkout URL in browser/WebView
4. Stripe redirects to `{APP_SCHEME}://payment-success?session_id=...`
5. **PaymentSuccessScreen** calls `stripeService.verifyPayment(sessionId)` to confirm payment
6. On success, update local user state with subscription tier

---

## Strapi Subscription Schema

The `subscription` content type stores:

| Field | Type | Notes |
|---|---|---|
| `user` | Relation (oneToOne) | Links to users-permissions user |
| `stripe_customer_id` | String (unique) | Stripe customer ID |
| `stripe_subscription_id` | String (unique) | Stripe subscription ID |
| `plan_tier` | **String** | Free-form — matches your tier keys (not an enum) |
| `status` | Enumeration | active, canceled, past_due, etc. |
| `cancel_at_period_end` | Boolean | True when subscription will not renew |
| `current_period_end` | DateTime | When current billing period ends |
| `trial_end` | DateTime | When trial period ends (if applicable) |

`plan_tier` is a plain string (not an enum) so it works with any project's tier names.

---

## Adding a New Billing Interval or Feature Tier

1. Add the tier to `backend/config/plans.js`
2. Add the Stripe price ID env var
3. Set the env var in deployment
4. The frontend auto-discovers new tiers via `GET /api/payment/plans`
5. No code changes to billing package or Strapi controllers needed

---

## Reference: `@alphinium/stripe-billing`

The underlying billing package. See `payments/` submodule for source.

```js
const billing = require('@alphinium/stripe-billing');

billing.init({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  plans: require('./config/plans'),  // your per-project config
});

// billing.createCheckoutSession({ priceId, successUrl, cancelUrl, metadata })
// billing.createWebhookHandler({ onCheckoutCompleted, onSubscriptionCreated, ... })
// billing.getPlans()
```
