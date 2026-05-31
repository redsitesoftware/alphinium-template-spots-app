/**
 * PLAN CONFIG TEMPLATE
 *
 * Copy this file to your project as backend/config/plans.js and customise.
 * Set STRIPE_PRICE_* env vars to the price IDs from your own Stripe account.
 *
 * Run `node scripts/create-stripe-products.js` to auto-create products/prices
 * in your Stripe account and populate the env vars.
 */

module.exports = {
  productName: process.env.PRODUCT_NAME || 'My App',

  tiers: {
    free: {
      name: 'Free',
      priceId: null,
      amount: 0,
      interval: null,
      features: {
        // define your free tier features here
      },
    },

    basic: {
      name: 'Basic',
      // Single price (monthly only):
      priceId: process.env.STRIPE_PRICE_BASIC,
      // OR multi-interval pricing:
      // prices: {
      //   monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
      //   annual:  process.env.STRIPE_PRICE_BASIC_ANNUAL,
      // },
      amounts: {
        monthly: 29,
        annual: 264,
      },
      features: {
        // define your basic tier features here
      },
    },

    pro: {
      name: 'Pro',
      prices: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
        annual:  process.env.STRIPE_PRICE_PRO_ANNUAL,
        beta:    process.env.STRIPE_PRICE_PRO_BETA,
      },
      amounts: {
        monthly: 99,
        annual:  948,
      },
      features: {
        // define your pro tier features here
      },
    },
  },

  /**
   * Resolve a Stripe price ID back to a tier key.
   * Used by webhook handlers to determine what tier a subscription is on.
   * DO NOT EDIT — works dynamically from the tiers above.
   */
  getTierFromPriceId(priceId) {
    if (!priceId) return 'free';
    for (const [tierKey, tier] of Object.entries(this.tiers)) {
      if (!tier.prices && !tier.priceId) continue;
      const ids = tier.prices ? Object.values(tier.prices) : [tier.priceId];
      if (ids.includes(priceId)) return tierKey;
    }
    return 'free';
  },

  /**
   * Get all price IDs for a given tier.
   */
  getPriceIds(tierKey) {
    const tier = this.tiers[tierKey];
    if (!tier) return null;
    if (tier.prices) return tier.prices;
    if (tier.priceId) return { default: tier.priceId };
    return null;
  },
};
