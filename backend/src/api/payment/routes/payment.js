/**
 * Payment routes
 *
 * All routes are product-agnostic — plan names and price IDs come from
 * backend/config/plans.js (env-driven), not from this file.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/payment/plans',
      handler: 'checkout.getPlans',
      config: { auth: false },  // public — frontend fetches plans dynamically
    },
    {
      method: 'POST',
      path: '/payment/verify-payment',
      handler: 'checkout.verifyPayment',
      config: { auth: false },  // public — called after Stripe redirect with session_id
    },
    {
      method: 'POST',
      path: '/payment/create-checkout-session',
      handler: 'checkout.createCheckoutSession',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/payment/subscription/:userId',
      handler: 'checkout.getSubscription',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/payment/cancel-subscription',
      handler: 'checkout.cancelSubscription',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/payment/reactivate-subscription',
      handler: 'checkout.reactivateSubscription',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/payment/create-portal-session',
      handler: 'checkout.createPortalSession',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/payment/webhook',
      handler: 'webhooks.handleWebhook',
      config: {
        auth: false,  // Stripe calls this directly — auth via signature verification
      },
    },
    {
      method: 'POST',
      path: '/payment/create-addon-session',
      handler: 'checkout.createAddonSession',
      config: { auth: false },
    },
    {
      // GET form — used by IO API (agents_v1.py, project_pods.py) with ?email=&active_count= query params
      method: 'GET',
      path: '/payment/entitlement',
      handler: 'checkout.checkEntitlement',
      config: { auth: false },
    },
    {
      // POST form — kept for backwards compatibility
      method: 'POST',
      path: '/payment/entitlement',
      handler: 'checkout.checkEntitlement',
      config: { auth: false },
    },
  ],
};
