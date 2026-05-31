/**
 * @alphinium/stripe-billing
 * Dynamic Stripe billing package for Alphinium platform projects.
 *
 * This package is PRODUCT-AGNOSTIC. Each project that uses it defines its own
 * plan configuration — no plan names, price IDs, or tiers are hardcoded here.
 *
 * Usage:
 *   const billing = require('@alphinium/stripe-billing');
 *   billing.init({
 *     stripeSecretKey: process.env.STRIPE_SECRET_KEY,
 *     stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
 *     plans: require('./config/plans'),  // your project's plan config
 *   });
 */

const stripeClient = require('./services/stripe-client');
const subscriptionService = require('./services/subscriptions');
const webhookService = require('./services/webhooks');
const subscriptionController = require('./controllers/subscription-controller');
const webhookController = require('./controllers/webhook-controller');

let initialized = false;
let config = {};

/**
 * Initialize the billing system.
 *
 * @param {Object}  options
 * @param {string}  options.stripeSecretKey      - Stripe secret key (required)
 * @param {string}  [options.stripeWebhookSecret] - Webhook signing secret
 * @param {Object}  options.plans                - Your project's plan config (required)
 * @param {string}  options.plans.productName    - Display name for this product
 * @param {Object}  options.plans.tiers          - Map of tier key → { name, priceId|prices, amount }
 *
 * Example plans object:
 * {
 *   productName: 'My SaaS',
 *   tiers: {
 *     free:  { name: 'Free',  priceId: null, amount: 0 },
 *     basic: { name: 'Basic', priceId: process.env.STRIPE_PRICE_BASIC, amount: 29 },
 *     pro:   { name: 'Pro',   prices: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
 *                                       annual:  process.env.STRIPE_PRICE_PRO_ANNUAL }, amount: 99 },
 *   }
 * }
 */
function init(options) {
  if (!options.stripeSecretKey) {
    throw new Error('[@alphinium/stripe-billing] stripeSecretKey is required');
  }
  if (!options.plans || !options.plans.tiers) {
    throw new Error('[@alphinium/stripe-billing] plans config with tiers is required. Pass your project\'s plan config.');
  }

  config = {
    productName: options.plans.productName || 'Unknown',
    webhookSecret: options.stripeWebhookSecret,
    plans: options.plans,
  };

  stripeClient.init(options.stripeSecretKey);
  initialized = true;
  console.log(`[@alphinium/stripe-billing] Initialized for "${config.productName}"`);
}

/**
 * Get the active configuration (plans, productName, etc).
 */
function getConfig() {
  if (!initialized) {
    throw new Error('[@alphinium/stripe-billing] Not initialized. Call billing.init() first.');
  }
  return config;
}

/**
 * Get the plan config passed at init time.
 * Use this in webhook handlers and controllers.
 */
function getPlans() {
  return getConfig().plans;
}

module.exports = {
  init,
  getConfig,
  getPlans,

  // Services (Stripe API wrappers)
  services: {
    stripe: stripeClient,
    subscriptions: subscriptionService,
    webhooks: webhookService,
  },

  // Controllers (higher-level orchestration)
  controllers: {
    subscription: subscriptionController,
    webhook: webhookController,
  },
};
