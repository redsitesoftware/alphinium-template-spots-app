/**
 * ChatInstance Pricing Plans
 * Centralized pricing configuration
 */

module.exports = {
  productName: 'ChatInstance',
  
  tiers: {
    starter: {
      name: 'Starter',
      prices: {
        monthly: 'price_1T6JInHc2oT07zw5PQQf8Mm2',
        beta: 'price_1T6JIoHc2oT07zw5Ip3z9D1F',
        annual: 'price_1T6JIpHc2oT07zw5oQ2lGlLS'
      },
      amounts: {
        monthly: 99,
        beta: 69,
        annual: 948
      },
      features: {
        interactions: 500,
        assistants: 1,
        support: 'email'
      }
    },
    
    professional: {
      name: 'Professional',
      prices: {
        monthly: 'price_1T6JIqHc2oT07zw5vAKwlayK',
        beta: 'price_1T6JIrHc2oT07zw5MgduiwU7',
        annual: 'price_1T6JIrHc2oT07zw5q7fDNcuE'
      },
      amounts: {
        monthly: 199,
        beta: 139,
        annual: 1908
      },
      features: {
        interactions: 'unlimited',
        assistants: 3,
        support: 'priority',
        analytics: true
      }
    },
    
    business: {
      name: 'Business',
      prices: {
        monthly: 'price_1T6JItHc2oT07zw5BWy9Cj4W',
        beta: 'price_1T6JIuHc2oT07zw5D9aeQUq4',
        annual: 'price_1T6JIuHc2oT07zw5mPjCNUGv'
      },
      amounts: {
        monthly: 299,
        beta: 209,
        annual: 2868
      },
      features: {
        interactions: 'unlimited',
        assistants: 'unlimited',
        support: 'dedicated',
        analytics: true,
        multiLocation: true,
        customIntegrations: true
      }
    }
  },

  /**
   * Get tier from price ID
   */
  getTierFromPriceId(priceId) {
    for (const [tier, config] of Object.entries(this.tiers)) {
      for (const price of Object.values(config.prices)) {
        if (price === priceId) {
          return tier;
        }
      }
    }
    return null;
  },

  /**
   * Get price IDs for a tier
   */
  getPriceIds(tier) {
    return this.tiers[tier]?.prices || null;
  }
};
