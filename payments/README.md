# @alphinium/stripe-billing

**Dynamic Stripe billing package for Alphinium platform projects.**

This package is **product-agnostic**. It provides the billing infrastructure (Stripe API calls, webhook handling, subscription lifecycle) but knows nothing about your specific product's plans. You define your own plan names, pricing tiers, and price IDs — either via env vars or a config file.

Any project cloned from `alphinium-app` gets payments working by setting their Stripe keys and price IDs in `.env`. No code changes needed.

## Quick Start

```bash
npm install  # @alphinium/stripe-billing is a file: submodule, already linked
```

In your backend entry point:
```js
const billing = require('@alphinium/stripe-billing');
const plans = require('./config/plans');  // your project's plan config

billing.init({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  plans,
});
```

## Deployment Modes

### Alphinium Platform (permanent)

Alphinium's own billing backend runs as a permanent Strapi pod in GKE and serves:

- `https://payments-api.alphinium.com`
- Helm-managed deployment in `alphinium-alphinium-cluster`
- PostgreSQL-backed state for production billing

Use this mode for `alphinium.com` and the main platform dashboard.

### Forge/Customer Projects (per-tenant)

Projects created from `alphinium-app` still deploy payments as a customer-specific user pod with their own Stripe keys:

```bash
./scripts/deploy-payments.sh
```

Use this mode for customer/template projects, not for Alphinium's own production billing.

## Plan Config

Copy `src/examples/plans-template.js` to your project as `backend/config/plans.js` and set your price IDs via env vars:

```env
PRODUCT_NAME=My SaaS

STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_yyy
STRIPE_PRICE_PRO_ANNUAL=price_zzz
```

Run the setup script to auto-create products in your Stripe account:
```bash
node scripts/create-stripe-products.js
```

## API

### `billing.init(options)`

| Option | Required | Description |
|--------|----------|-------------|
| `stripeSecretKey` | ✅ | Your Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `stripeWebhookSecret` | recommended | Webhook signing secret (`whsec_...`) |
| `plans` | ✅ | Your plan config object (see `src/examples/plans-template.js`) |

### `billing.getPlans()`
Returns the plan config registered at init time.

### `billing.services.subscriptions`
Low-level Stripe API wrappers:
- `createCustomer(email, metadata)`
- `getOrCreateCustomer(email, userId, metadata)`
- `createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, trialDays })`
- `getSubscription(subscriptionId)`
- `updateSubscription(subscriptionId, updates)`
- `cancelSubscription(subscriptionId, immediately?)`
- `reactivateSubscription(subscriptionId)`
- `createPortalSession(customerId, returnUrl)`
- `listCustomerSubscriptions(customerId)`

### `billing.controllers.subscription`
Higher-level orchestration:
- `createCheckoutSession({ email, userId, priceId, successUrl, cancelUrl, trialDays })`
- `getSubscription(customerId)`
- `cancelSubscription(subscriptionId, immediately?)`
- `reactivateSubscription(subscriptionId)`
- `createPortalSession(customerId, returnUrl)`

### `billing.controllers.webhook.createHandler(webhookSecret, eventHandlers)`
Creates a Koa-compatible webhook middleware. The plan config is resolved automatically from `billing.getPlans()`.

Event handler callbacks:
- `onCheckoutCompleted(session)`
- `onSubscriptionCreated(subscription, tierKey)`
- `onSubscriptionUpdated(subscription, tierKey)`
- `onSubscriptionDeleted(subscription)`
- `onInvoicePaid(invoice)`
- `onPaymentFailed(invoice)`
- `onTrialWillEnd(subscription)`

## Required Env Vars

```env
# Stripe keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_...     # used by frontend
STRIPE_WEBHOOK_SECRET=whsec_...        # from Stripe Dashboard > Webhooks

# Your product
PRODUCT_NAME=My SaaS

# Your price IDs (from Stripe Dashboard > Products, or run setup script)
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...

# Frontend URL (for checkout redirect)
FRONTEND_URL=https://yourapp.com
```

## Reference Implementations

`src/examples/` contains complete plan configs for existing Alphinium products as reference:
- `plans-alphinium.js` — Alphinium developer/team tiers
- `plans-chatinstance.js` — ChatInstance starter/professional/business tiers
- `plans-userpods.js` — UserPods hobby/pro/enterprise tiers
- `plans-template.js` — **Start here for a new project**

## Webhook Setup

1. In [Stripe Dashboard](https://dashboard.stripe.com/webhooks), add an endpoint:
   - URL: `https://your-backend.com/api/payment/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
2. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`
3. For local testing: `stripe listen --forward-to localhost:1337/api/payment/webhook`

## Testing

```bash
# Copy test env template
cp .env.test.template .env.test

# Add your Stripe test keys to .env.test, then:
node test-server.js

# Test with Stripe CLI
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```
