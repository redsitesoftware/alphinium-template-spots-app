/**
 * UserPods Pricing Plans
 * Add-on tiers for cloud pod resources
 */

module.exports = {
  productName: 'UserPods',
  isAddon: true,
  requiresBaseSubscription: true,
  
  tiers: {
    hobby: {
      name: 'Hobby',
      prices: {
        monthly: 'price_1T6JJ2Hc2oT07zw5MISsMZNa'
      },
      amounts: {
        monthly: 29
      },
      resources: {
        vCPU: 0.5,
        ram: '512MB',
        storage: '10GB',
        network: '100GB'
      }
    },
    
    pro: {
      name: 'Pro',
      prices: {
        monthly: 'price_1T6JJ3Hc2oT07zw5bJHjNgaS'
      },
      amounts: {
        monthly: 49
      },
      resources: {
        vCPU: 1,
        ram: '1GB',
        storage: '25GB',
        network: '250GB'
      }
    },
    
    business: {
      name: 'Business',
      prices: {
        monthly: 'price_1T6JJ4Hc2oT07zw50zhXa6wb'
      },
      amounts: {
        monthly: 79
      },
      resources: {
        vCPU: 2,
        ram: '2GB',
        storage: '50GB',
        network: '500GB'
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
  }
};
