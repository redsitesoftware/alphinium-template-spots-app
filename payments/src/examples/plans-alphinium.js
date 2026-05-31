/**
 * Alphinium Pricing Plans
 * Centralized pricing configuration.
 * Price IDs for developer, team, and enterprise are resolved from env vars at runtime,
 * with hardcoded fallbacks for local development.
 */

module.exports = {
  productName: 'Alphinium',
  
  tiers: {
    free: {
      name: 'Free',
      priceId: null,
      amount: 0,
      interval: null,
      features: {
        desktops: 1,
        hours: 50,
        storage: 5,
        support: 'community'
      }
    },
    
    starter: {
      name: 'Starter',
      prices: {
        monthly: 'price_1TY1HdHc2oT07zw5TBMmRAeH',
        annual: 'price_1TY1HeHc2oT07zw5k0JY7LKB'
      },
      amounts: {
        monthly: 14,
        annual: 120
      },
      features: {
        desktops: 1,
        pods: 1,
        pod_tier: 'hobby',
        hours: 'capped',
        storage: 10,
        support: 'community',
        compute: 'rss_pool'
      }
    },

    developer: {
      name: 'Developer',
      prices: {
        monthly: process.env.STRIPE_PRICE_DEVELOPER_MONTHLY || 'price_1T6JIhHc2oT07zw5BTzlrJJe',
        annual: process.env.STRIPE_PRICE_DEVELOPER_ANNUAL || 'price_1T6JIjHc2oT07zw58lZu0Sic',
        beta: 'price_1T6JIiHc2oT07zw5ubke9xad',
      },
      amounts: {
        monthly: 29,
        annual: 264,
        beta: 20,
      },
      features: {
        desktops: 3,
        hours: 'unlimited',
        storage: 50,
        support: 'priority',
        api: true
      }
    },
    
    team: {
      name: 'Team',
      prices: {
        monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_1T6JIkHc2oT07zw5m8AKTzhR',
        annual: process.env.STRIPE_PRICE_TEAM_ANNUAL || 'price_1T6JImHc2oT07zw5WfD24fsb',
        beta: 'price_1T6JIlHc2oT07zw56KEg6Bxb',
      },
      amounts: {
        monthly: 99,
        annual: 888,
        beta: 69,
      },
      features: {
        desktops: 10,
        hours: 'unlimited',
        storage: 200,
        support: 'priority',
        api: true,
        collaboration: true,
        analytics: true
      }
    },

    enterprise: {
      name: 'Enterprise',
      prices: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || null,
        annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || null,
      },
      amounts: {
        monthly: 299,
        annual: 2988,
      },
      features: {
        desktops: 'unlimited',
        hours: 'unlimited',
        storage: 1000,
        support: 'dedicated',
        api: true,
        collaboration: true,
        analytics: true,
        sso: true,
        sla: true,
      }
    }
  },

  /**
   * Add-ons — purchasable on top of any paid tier.
   * priceId is resolved at runtime from STRIPE_PRICE_ADDON_POD_MONTHLY env var.
   */
  get addons() {
    const podPriceId = process.env.STRIPE_PRICE_ADDON_POD_MONTHLY;
    if (!podPriceId) return {};
    return {
      extra_pod: {
        name: 'Extra Pod',
        priceId: podPriceId,
        amount: 9,
        interval: 'month',
        features: { pod_tier: 'hobby' },
      },
    };
  },

  /**
   * Legacy price IDs — old price IDs that still map to a tier.
   * Add entries here when Stripe prices are rotated so existing subscribers
   * continue resolving to the correct tier.
   */
  legacyPriceIds: {
    'price_1T6JIhHc2oT07zw5BTzlrJJe': 'developer',
    'price_1T6JIiHc2oT07zw5ubke9xad': 'developer',
    'price_1T6JIjHc2oT07zw58lZu0Sic': 'developer',
    'price_1T6JIkHc2oT07zw5m8AKTzhR': 'team',
    'price_1T6JIlHc2oT07zw56KEg6Bxb': 'team',
    'price_1T6JImHc2oT07zw5WfD24fsb': 'team',
  },

  /**
   * Get tier from price ID. Checks legacy map first so rotated prices still resolve.
   * Returns null for unknown price IDs (callers should fall back to stored tier or 'free').
   */
  getTierFromPriceId(priceId) {
    if (!priceId) return null;
    if (this.legacyPriceIds[priceId]) return this.legacyPriceIds[priceId];
    for (const [tier, config] of Object.entries(this.tiers)) {
      if (config.prices) {
        for (const price of Object.values(config.prices)) {
          if (price && price === priceId) return tier;
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
