/**
 * Subscription Controller
 * Handles subscription-related API endpoints
 */

const subscriptionService = require('../services/subscriptions');

module.exports = {
  /**
   * Create checkout session
   */
  async createCheckoutSession(options) {
    const { email, userId, priceId, successUrl, cancelUrl, trialDays, metadata } = options;

    // Get or create customer
    const customer = await subscriptionService.getOrCreateCustomer(email, userId, metadata);

    // Create checkout session
    const session = await subscriptionService.createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl,
      cancelUrl,
      metadata: { userId, ...metadata },
      trialDays
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  },

  /**
   * Get subscription by customer
   */
  async getSubscription(customerId) {
    const subscriptions = await subscriptionService.listCustomerSubscriptions(customerId);
    
    if (subscriptions.data.length === 0) {
      return null;
    }

    return subscriptions.data[0];
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    return await subscriptionService.cancelSubscription(subscriptionId, immediately);
  },

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId) {
    return await subscriptionService.reactivateSubscription(subscriptionId);
  },

  /**
   * Create portal session
   */
  async createPortalSession(customerId, returnUrl) {
    const session = await subscriptionService.createPortalSession(customerId, returnUrl);
    return { url: session.url };
  }
};
