/**
 * Stripe Client
 * Core Stripe SDK wrapper
 */

const Stripe = require('stripe');

let stripe = null;

module.exports = {
  /**
   * Initialize Stripe client
   */
  init(secretKey) {
    if (!secretKey) {
      throw new Error('Stripe secret key is required');
    }
    stripe = new Stripe(secretKey);
    return stripe;
  },

  /**
   * Get Stripe instance
   */
  getInstance() {
    if (!stripe) {
      throw new Error('Stripe not initialized. Call init() first.');
    }
    return stripe;
  }
};
