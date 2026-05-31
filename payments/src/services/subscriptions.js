/**
 * Subscription Service
 * Handles all subscription operations
 */

const stripeClient = require('./stripe-client');

module.exports = {
  /**
   * Create customer in Stripe
   */
  async createCustomer(email, metadata = {}) {
    const stripe = stripeClient.getInstance();
    
    return await stripe.customers.create({
      email,
      metadata
    });
  },

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(email, userId, metadata = {}) {
    const stripe = stripeClient.getInstance();
    
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return await this.createCustomer(email, { userId, ...metadata });
  },

  /**
   * Create checkout session
   */
  async createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, metadata = {}, trialDays }) {
    const stripe = stripeClient.getInstance();

    const subscriptionData = { metadata };
    if (trialDays && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: subscriptionData,
      metadata
    });

    return session;
  },

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    const stripe = stripeClient.getInstance();
    return await stripe.subscriptions.retrieve(subscriptionId);
  },

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    const stripe = stripeClient.getInstance();
    return await stripe.subscriptions.update(subscriptionId, updates);
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    const stripe = stripeClient.getInstance();
    
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }
  },

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId) {
    const stripe = stripeClient.getInstance();
    
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  },

  /**
   * Create portal session
   */
  async createPortalSession(customerId, returnUrl) {
    const stripe = stripeClient.getInstance();
    
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  },

  /**
   * List customer subscriptions
   */
  async listCustomerSubscriptions(customerId) {
    const stripe = stripeClient.getInstance();
    
    return await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });
  }
};
