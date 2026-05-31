/**
 * Payment Service (Adapter)
 * Delegates to @alphinium/stripe-billing package.
 *
 * Plans come from backend/config/plans.js — driven entirely by env vars.
 * To customise this project's pricing, edit config/plans.js and set
 * STRIPE_PRICE_* env vars. No changes needed here.
 */

const billing = require('@alphinium/stripe-billing');
const plans = require('../../../../config/plans');

// Initialize once on load — uses this project's plan config
billing.init({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  plans,
});

module.exports = {
  /**
   * Get plans configuration for this project.
   * Used by GET /api/payment/plans — frontend fetches this dynamically.
   */
  getPlans() {
    return billing.getPlans();
  },

  /**
   * Create a Stripe Checkout session.
   */
  async createCheckoutSession(options) {
    return await billing.controllers.subscription.createCheckoutSession(options);
  },

  /**
   * Get a customer's active subscription from Stripe.
   */
  async getSubscription(customerId) {
    return await billing.controllers.subscription.getSubscription(customerId);
  },

  /**
   * Retrieve a Stripe Checkout session (for payment verification).
   */
  async retrieveCheckoutSession(sessionId) {
    const stripe = billing.services.stripe.getInstance();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
  },

  /**
   * Cancel a subscription.
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    return await billing.controllers.subscription.cancelSubscription(subscriptionId, immediately);
  },

  /**
   * Reactivate a canceled subscription.
   */
  async reactivateSubscription(subscriptionId) {
    return await billing.controllers.subscription.reactivateSubscription(subscriptionId);
  },

  /**
   * Create a Stripe Billing Portal session.
   */
  async createPortalSession(customerId, returnUrl) {
    return await billing.controllers.subscription.createPortalSession(customerId, returnUrl);
  },

  /**
   * Verify and construct a Stripe webhook event.
   * Requires the raw request body (not parsed JSON) for signature verification.
   */
  constructWebhookEvent(rawBody, signature) {
    const stripe = billing.services.stripe.getInstance();
    return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  },

  /**
   * Expose the raw Stripe SDK instance for advanced operations (add-ons, etc.).
   */
  getStripeInstance() {
    return billing.services.stripe.getInstance();
  },

  /**
   * Create the webhook handler middleware (Koa compatible).
   * Plan config is resolved automatically from billing.getPlans().
   */
  createWebhookHandler(eventHandlers) {
    return billing.controllers.webhook.createHandler(
      process.env.STRIPE_WEBHOOK_SECRET,
      eventHandlers,
    );
  },
};
