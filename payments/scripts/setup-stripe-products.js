#!/usr/bin/env node
/**
 * Automated Stripe Product Setup
 * 
 * Creates all 11 products with 24-26 prices across:
 * - Alphinium (Developer, Team)
 * - ChatInstance (Starter, Professional, Business)
 * - Enterprise (Starter, Growth)
 * - UserPods (Hobby, Pro, Business)
 * 
 * Usage:
 *   node scripts/setup-stripe-products.js --mode=test
 *   node scripts/setup-stripe-products.js --mode=live
 * 
 * Environment:
 *   STRIPE_SECRET_KEY - Your Stripe secret key (sk_test_... or sk_live_...)
 */

require('dotenv').config();
const Stripe = require('stripe');

// Parse command line args
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'test';

if (!['test', 'live'].includes(mode)) {
  console.error('❌ Mode must be "test" or "live"');
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

// Verify key matches mode
const keyMode = stripeKey.startsWith('sk_test_') ? 'test' : 'live';
if (keyMode !== mode) {
  console.error(`❌ Key type (${keyMode}) doesn't match requested mode (${mode})`);
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

// Product definitions matching our pricing plans
const PRODUCTS = {
  alphinium: {
    name: 'Alphinium',
    description: 'Cloud desktop workspaces with AI-powered productivity',
    metadata: { product: 'alphinium' },
    tiers: [
      {
        tier: 'developer',
        name: 'Alphinium Developer',
        description: 'Perfect for individual developers',
        prices: [
          { interval: 'month', amount: 2900, nickname: 'Developer Monthly' },
          { interval: 'month', amount: 2000, nickname: 'Developer Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 26400, nickname: 'Developer Annual' }
        ]
      },
      {
        tier: 'team',
        name: 'Alphinium Team',
        description: 'For teams and organizations',
        prices: [
          { interval: 'month', amount: 9900, nickname: 'Team Monthly' },
          { interval: 'month', amount: 6900, nickname: 'Team Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 88800, nickname: 'Team Annual' }
        ]
      }
    ]
  },
  
  chatinstance: {
    name: 'ChatInstance',
    description: 'AI-powered chat assistants for your business',
    metadata: { product: 'chatinstance' },
    tiers: [
      {
        tier: 'starter',
        name: 'ChatInstance Starter',
        description: '500 interactions per month',
        prices: [
          { interval: 'month', amount: 9900, nickname: 'Starter Monthly' },
          { interval: 'month', amount: 6900, nickname: 'Starter Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 94800, nickname: 'Starter Annual' }
        ]
      },
      {
        tier: 'professional',
        name: 'ChatInstance Professional',
        description: 'Unlimited interactions, 3 assistants',
        prices: [
          { interval: 'month', amount: 19900, nickname: 'Professional Monthly' },
          { interval: 'month', amount: 13900, nickname: 'Professional Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 190800, nickname: 'Professional Annual' }
        ]
      },
      {
        tier: 'business',
        name: 'ChatInstance Business',
        description: 'Unlimited everything with priority support',
        prices: [
          { interval: 'month', amount: 29900, nickname: 'Business Monthly' },
          { interval: 'month', amount: 20900, nickname: 'Business Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 286800, nickname: 'Business Annual' }
        ]
      }
    ]
  },
  
  enterprise: {
    name: 'Enterprise',
    description: 'Enterprise-grade solutions for large organizations',
    metadata: { product: 'enterprise' },
    tiers: [
      {
        tier: 'starter',
        name: 'Enterprise Starter',
        description: 'Entry-level enterprise features',
        prices: [
          { interval: 'month', amount: 250000, nickname: 'Enterprise Starter Monthly' },
          { interval: 'month', amount: 200000, nickname: 'Enterprise Starter Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 2700000, nickname: 'Enterprise Starter Annual' }
        ]
      },
      {
        tier: 'growth',
        name: 'Enterprise Growth',
        description: 'Full enterprise capabilities',
        prices: [
          { interval: 'month', amount: 500000, nickname: 'Enterprise Growth Monthly' },
          { interval: 'month', amount: 400000, nickname: 'Enterprise Growth Beta', metadata: { type: 'beta' } },
          { interval: 'year', amount: 5400000, nickname: 'Enterprise Growth Annual' }
        ]
      }
    ]
  },
  
  userpods: {
    name: 'UserPods',
    description: 'Cloud compute resources - add-on to Alphinium',
    metadata: { product: 'userpods', addon: 'true' },
    tiers: [
      {
        tier: 'hobby',
        name: 'UserPods Hobby',
        description: '0.5 vCPU, 512MB RAM',
        prices: [
          { interval: 'month', amount: 2900, nickname: 'Hobby Monthly' }
        ]
      },
      {
        tier: 'pro',
        name: 'UserPods Pro',
        description: '1 vCPU, 1GB RAM',
        prices: [
          { interval: 'month', amount: 4900, nickname: 'Pro Monthly' }
        ]
      },
      {
        tier: 'business',
        name: 'UserPods Business',
        description: '2 vCPU, 2GB RAM',
        prices: [
          { interval: 'month', amount: 7900, nickname: 'Business Monthly' }
        ]
      }
    ]
  }
};

// Track created products/prices for config file generation
const createdPrices = {
  alphinium: {},
  chatinstance: {},
  enterprise: {},
  userpods: {}
};

/**
 * Create or find existing product
 */
async function createProduct(productConfig, tierConfig) {
  const productName = tierConfig.name;
  
  // Check if product already exists
  const existingProducts = await stripe.products.list({ limit: 100 });
  const existing = existingProducts.data.find(p => p.name === productName && p.active);
  
  if (existing) {
    console.log(`  ✓ Product already exists: ${productName} (${existing.id})`);
    return existing;
  }
  
  // Create new product
  const product = await stripe.products.create({
    name: productName,
    description: tierConfig.description,
    metadata: {
      ...productConfig.metadata,
      tier: tierConfig.tier
    }
  });
  
  console.log(`  ✓ Created product: ${productName} (${product.id})`);
  return product;
}

/**
 * Create or find existing price
 */
async function createPrice(product, priceConfig) {
  const { interval, amount, nickname, metadata = {} } = priceConfig;
  
  // Check if price already exists
  const existingPrices = await stripe.prices.list({ 
    product: product.id,
    limit: 100 
  });
  
  const existing = existingPrices.data.find(p => 
    p.unit_amount === amount && 
    p.recurring?.interval === interval &&
    p.active &&
    p.nickname === nickname
  );
  
  if (existing) {
    console.log(`    ✓ Price already exists: ${nickname} (${existing.id})`);
    return existing;
  }
  
  // Create new price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: 'aud',
    recurring: { interval },
    nickname,
    metadata
  });
  
  console.log(`    ✓ Created price: ${nickname} - A$${(amount/100).toFixed(2)}/${interval} (${price.id})`);
  return price;
}

/**
 * Setup all products and prices
 */
async function setupProducts() {
  console.log(`\n🚀 Setting up Stripe products in ${mode.toUpperCase()} mode...\n`);
  
  let totalProducts = 0;
  let totalPrices = 0;
  
  for (const [productKey, productConfig] of Object.entries(PRODUCTS)) {
    console.log(`📦 ${productConfig.name}`);
    
    for (const tierConfig of productConfig.tiers) {
      const product = await createProduct(productConfig, tierConfig);
      totalProducts++;
      
      // Store tier structure if not exists
      if (!createdPrices[productKey][tierConfig.tier]) {
        createdPrices[productKey][tierConfig.tier] = {};
      }
      
      for (const priceConfig of tierConfig.prices) {
        const price = await createPrice(product, priceConfig);
        totalPrices++;
        
        // Store price ID by interval type
        const priceKey = priceConfig.metadata?.type === 'beta' ? 'beta' : 
                        priceConfig.interval === 'year' ? 'annual' : 'monthly';
        
        createdPrices[productKey][tierConfig.tier][priceKey] = price.id;
      }
    }
    
    console.log('');
  }
  
  console.log(`✅ Setup complete!`);
  console.log(`   Products: ${totalProducts}`);
  console.log(`   Prices: ${totalPrices}`);
  
  return createdPrices;
}

/**
 * Generate configuration file
 */
function generateConfigFile(prices) {
  console.log('\n📝 Price IDs for configuration:\n');
  console.log('━'.repeat(80));
  
  for (const [product, tiers] of Object.entries(prices)) {
    console.log(`\n// ${product.toUpperCase()}`);
    console.log(JSON.stringify(tiers, null, 2));
  }
  
  console.log('\n━'.repeat(80));
  console.log('\n💡 Next steps:');
  console.log('   1. Run: node scripts/update-config-files.js --mode=' + mode);
  console.log('   2. Test checkout flows at http://localhost:3456/test');
  console.log('\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const prices = await setupProducts();
    generateConfigFile(prices);
    
    // Save to file for automated config update
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, `../.stripe-prices-${mode}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(prices, null, 2));
    console.log(`💾 Saved price IDs to: ${outputPath}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Check your STRIPE_SECRET_KEY is valid');
    }
    process.exit(1);
  }
}

main();
