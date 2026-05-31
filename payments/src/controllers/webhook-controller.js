/**
 * Webhook Controller
 * Processes Stripe webhook events.
 *
 * Plan tier resolution is driven by the plans config passed at billing.init() time,
 * so this works for any product — no hardcoded plan names.
 */

const webhookService = require('../services/webhooks');
const billing = require('../index');

module.exports = {
  /**
   * Create a webhook handler middleware (Koa/Express compatible).
   *
   * @param {string} webhookSecret   - STRIPE_WEBHOOK_SECRET env var
   * @param {Object} eventHandlers   - Callbacks for each event type
   * @param {Object} [planConfig]    - Optional plan config override; defaults to billing.getPlans()
   */
  createHandler(webhookSecret, eventHandlers, planConfig) {
    // Use provided planConfig, or fall back to the one registered at init()
    const plans = planConfig || billing.getPlans();

    return webhookService.createHandler(webhookSecret, {
      'checkout.session.completed': async (session) => {
        if (eventHandlers.onCheckoutCompleted) {
          await eventHandlers.onCheckoutCompleted(session);
        }
      },

      'customer.subscription.created': async (subscription) => {
        const tier = plans.getTierFromPriceId(subscription.items.data[0].price.id);
        if (eventHandlers.onSubscriptionCreated) {
          await eventHandlers.onSubscriptionCreated(subscription, tier);
        }
      },

      'customer.subscription.updated': async (subscription) => {
        const tier = plans.getTierFromPriceId(subscription.items.data[0].price.id);
        if (eventHandlers.onSubscriptionUpdated) {
          await eventHandlers.onSubscriptionUpdated(subscription, tier);
        }
      },

      'customer.subscription.deleted': async (subscription) => {
        if (eventHandlers.onSubscriptionDeleted) {
          await eventHandlers.onSubscriptionDeleted(subscription);
        }
      },

      'invoice.paid': async (invoice) => {
        if (eventHandlers.onInvoicePaid) {
          await eventHandlers.onInvoicePaid(invoice);
        }
      },

      'invoice.payment_failed': async (invoice) => {
        if (eventHandlers.onPaymentFailed) {
          await eventHandlers.onPaymentFailed(invoice);
        }
      },

      'customer.subscription.trial_will_end': async (subscription) => {
        if (eventHandlers.onTrialWillEnd) {
          await eventHandlers.onTrialWillEnd(subscription);
        }
      },
    });
  },
};
