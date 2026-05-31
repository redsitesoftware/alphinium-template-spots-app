/**
 * Plan Configuration
 *
 * This file defines the subscription tiers for THIS project.
 * All price IDs come from env vars — set them to your Stripe price IDs.
 *
 * To create Stripe products and get price IDs:
 *   1. Go to https://dashboard.stripe.com/products
 *   2. Create products manually, OR run: node scripts/create-stripe-products.js
 *   3. Copy the price IDs into your .env file
 *
 * For a new project cloned from alphinium-app:
 *   - Set PRODUCT_NAME to your product name
 *   - Add/remove tiers to match your pricing model
 *   - Set STRIPE_PRICE_* vars for each tier
 *   - No changes needed to any other file
 */

module.exports = {
  productName: process.env.PRODUCT_NAME || 'Alphinium',

  tiers: {
    free: {
      name: 'Free',
      priceId: null,
      amount: 0,
      interval: null,
      features: {
        desktops: 1,
        hours: 50,
        storage: '5GB',
        support: 'community',
      },
    },

    starter: {
      name: 'Starter',
      hidden: true,          // Not shown on public pricing page — accessible via direct link
      trialDays: 7,          // 7-day free trial before first charge
      prices: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
        annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL,
      },
      amounts: {
        monthly: 14,
        annual: 120,
      },
      features: {
        desktops: 1,
        pods: 1,
        pod_tier: 'hobby',
        hours: 'capped',
        storage: '10GB',
        support: 'community',
        compute: 'rss_pool',
      },
    },

    developer: {
      name: 'Developer',
      trialDays: 0,          // No trial — pay immediately
      prices: {
        monthly: process.env.STRIPE_PRICE_DEVELOPER_MONTHLY,
        annual:  process.env.STRIPE_PRICE_DEVELOPER_ANNUAL,
        beta:    process.env.STRIPE_PRICE_DEVELOPER_BETA,
      },
      amounts: {
        monthly: 29,
        annual: 264,
        beta: 20,
      },
      features: {
        desktops: 3,
        hours: 'unlimited',
        storage: '50GB',
        support: 'priority',
        api: true,
      },
    },

    team: {
      name: 'Team',
      trialDays: 0,          // No trial — pay immediately
      prices: {
        monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
        annual:  process.env.STRIPE_PRICE_TEAM_ANNUAL,
        beta:    process.env.STRIPE_PRICE_TEAM_BETA,
      },
      amounts: {
        monthly: 99,
        annual: 888,
        beta: 69,
      },
      features: {
        desktops: 10,
        hours: 'unlimited',
        storage: '200GB',
        support: 'priority',
        api: true,
        collaboration: true,
        analytics: true,
      },
    },

    enterprise: {
      name: 'Enterprise',
      trialDays: 0,          // No trial — pay immediately
      prices: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        annual:  process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
      },
      amounts: {
        monthly: 499,
        annual: 4788,
      },
      features: {
        desktops: null,        // null = unlimited — SM-of-SMs enforces GKE cap only
        hours: 'unlimited',
        storage: 'unlimited',
        support: 'dedicated',
        api: true,
        collaboration: true,
        analytics: true,
        sla: '99.9%',
        priority_scheduling: true,
      },
    },
  },

  /**
   * Add-ons — purchasable extras on top of a base subscription tier.
   * These are subscription items (recurring), not one-time charges.
   */
  addons: {
    extra_pod: {
      name: 'Extra Pod',
      description: 'Add one additional Hobby-tier user pod to your plan',
      priceId: process.env.STRIPE_PRICE_ADDON_POD_MONTHLY,
      amount: 9,          // $9/mo per extra pod
      interval: 'month',
      features: { pod_tier: 'hobby' },
    },
  },

  /**
   * Resolve a Stripe price ID → tier key.
   * Used by webhook handlers. Do not edit.
   */
  getTierFromPriceId(priceId) {
    if (!priceId) return 'free';
    for (const [tierKey, tier] of Object.entries(this.tiers)) {
      if (!tier.prices && !tier.priceId) continue;
      const ids = tier.prices ? Object.values(tier.prices).filter(Boolean) : [tier.priceId];
      if (ids.includes(priceId)) return tierKey;
    }
    return 'free';
  },

  /**
   * Get price IDs for a tier.
   */
  getPriceIds(tierKey) {
    const tier = this.tiers[tierKey];
    if (!tier) return null;
    if (tier.prices) return tier.prices;
    if (tier.priceId) return { default: tier.priceId };
    return null;
  },
};
