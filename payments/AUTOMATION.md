# 🤖 Automated Stripe Product Setup

**Why automate?** Creating 11 products with 24-26 prices manually in Stripe Dashboard takes 2-3 hours and is error-prone. Our automation does it in **5 minutes** via Stripe's SDK.

---

## 🎯 What Gets Automated

### Products Created (11 total)

**Alphinium** (2 products)
- Alphinium Developer ($29-$264)
- Alphinium Team ($69-$888)

**ChatInstance** (3 products)
- ChatInstance Starter ($69-$948)
- ChatInstance Professional ($139-$1,908)
- ChatInstance Business ($209-$2,868)

**Enterprise** (2 products)
- Enterprise Starter ($2,000-$27,000)
- Enterprise Growth ($4,000-$54,000)

**UserPods** (3 products)
- UserPods Hobby ($29/month)
- UserPods Pro ($49/month)
- UserPods Business ($79/month)

### Prices Created (24-26 total)

Each product tier gets:
- **Monthly** price (standard)
- **Beta** price (30% discount for early adopters)
- **Annual** price (10% discount vs monthly)

---

## 🚀 Quick Start

### Prerequisites

1. Stripe account with API access
2. Node.js 18+ installed
3. Environment variables set

```bash
# Add to .env or .env.test
STRIPE_SECRET_KEY=sk_test_xxx  # Test mode key
# or
STRIPE_SECRET_KEY=sk_live_xxx  # Live mode key
```

### One-Command Setup

```bash
# Create all products in TEST mode
npm run setup:stripe:test && npm run update:config:test

# Or for LIVE mode
npm run setup:stripe:live && npm run update:config:live
```

That's it! All products, prices, and configs are ready.

---

## 📋 Step-by-Step Guide

### Step 1: Create Products & Prices in Stripe

```bash
# For development/testing
STRIPE_SECRET_KEY=sk_test_xxx npm run setup:stripe:test
```

**What happens:**
1. Script connects to Stripe API
2. Checks if products already exist (idempotent)
3. Creates missing products with descriptions
4. Creates all pricing variants (monthly/beta/annual)
5. Saves price IDs to `.stripe-prices-test.json`

**Output:**
```
🚀 Setting up Stripe products in TEST mode...

📦 Alphinium
  ✓ Created product: Alphinium Developer (prod_abc123)
    ✓ Created price: Developer Monthly - A$29.00/month (price_xyz789)
    ✓ Created price: Developer Beta - A$20.00/month (price_xyz790)
    ✓ Created price: Developer Annual - A$264.00/year (price_xyz791)
  ✓ Created product: Alphinium Team (prod_def456)
    ...

✅ Setup complete!
   Products: 11
   Prices: 24

💾 Saved price IDs to: .stripe-prices-test.json
```

### Step 2: Update Configuration Files

```bash
npm run update:config:test
```

**What happens:**
1. Reads `.stripe-prices-test.json`
2. Updates `src/config/plans-alphinium.js` with real price IDs
3. Updates `src/config/plans-chatinstance.js`
4. Updates `src/config/plans-userpods.js`
5. Updates `test-stripe-integration.html` test UI

**Output:**
```
🔧 Updating configuration files with TEST mode prices...

✓ Updated src/config/plans-alphinium.js
✓ Updated src/config/plans-chatinstance.js
✓ Updated src/config/plans-userpods.js
✓ Updated test-stripe-integration.html

✅ All configuration files updated!
```

### Step 3: Test Everything

```bash
npm run test:server
```

Open http://localhost:3456/test and test checkout flows.

---

## 🔄 Switching Between Test & Live

### Development (Test Mode)

```bash
# Use test keys (sk_test_xxx)
STRIPE_SECRET_KEY=sk_test_xxx npm run setup:stripe:test
npm run update:config:test
```

- Uses test credit cards (4242 4242 4242 4242)
- No real charges
- Full Stripe functionality

### Production (Live Mode)

```bash
# Use live keys (sk_live_xxx)
STRIPE_SECRET_KEY=sk_live_xxx npm run setup:stripe:live
npm run update:config:live
```

- Real payment methods required
- Actual charges processed
- Run AFTER testing in test mode!

---

## 🛠️ Script Reference

### setup-stripe-products.js

**Location:** `scripts/setup-stripe-products.js`

**Purpose:** Create all products and prices in Stripe

**Usage:**
```bash
node scripts/setup-stripe-products.js --mode=test
node scripts/setup-stripe-products.js --mode=live
```

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Checks for existing products before creating
- ✅ Validates API key matches mode
- ✅ Creates products with metadata
- ✅ Generates all price variants
- ✅ Saves output to JSON file

**Environment:**
- `STRIPE_SECRET_KEY` - Required

### update-config-files.js

**Location:** `scripts/update-config-files.js`

**Purpose:** Update configuration files with price IDs

**Usage:**
```bash
node scripts/update-config-files.js --mode=test
node scripts/update-config-files.js --mode=live
```

**Updates:**
- `src/config/plans-alphinium.js`
- `src/config/plans-chatinstance.js`
- `src/config/plans-userpods.js`
- `test-stripe-integration.html`

**Input:**
- `.stripe-prices-{mode}.json`

---

## 🔍 How It Works

### Under the Hood

The automation uses Stripe's official Node.js SDK:

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create product
const product = await stripe.products.create({
  name: 'Alphinium Developer',
  description: 'Perfect for individual developers',
  metadata: { product: 'alphinium', tier: 'developer' }
});

// Create price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2900,  // $29.00 in cents
  currency: 'aud',
  recurring: { interval: 'month' },
  nickname: 'Developer Monthly'
});
```

### Idempotency

Scripts check for existing products/prices before creating:

```javascript
const existingProducts = await stripe.products.list({ limit: 100 });
const existing = existingProducts.data.find(p => 
  p.name === productName && p.active
);

if (existing) {
  console.log('✓ Product already exists');
  return existing;
}
```

Safe to run multiple times without duplicates!

---

## 🐛 Troubleshooting

### Error: STRIPE_SECRET_KEY not found

```bash
# Solution: Set environment variable
export STRIPE_SECRET_KEY=sk_test_xxx

# Or add to .env file
echo "STRIPE_SECRET_KEY=sk_test_xxx" > .env
```

### Error: Key type doesn't match mode

```bash
❌ Key type (test) doesn't match requested mode (live)
```

**Solution:** Use correct key for mode:
- Test mode: `sk_test_xxx`
- Live mode: `sk_live_xxx`

### Error: Price file not found

```bash
❌ Price file not found: .stripe-prices-test.json
```

**Solution:** Run setup script first:
```bash
npm run setup:stripe:test
```

### Products Already Exist

If products already exist, script will:
1. Find existing product
2. Reuse product ID
3. Create missing prices only

**To start fresh:**
1. Archive old products in Stripe Dashboard
2. Run setup script again

---

## 📊 Verification

### Check Stripe Dashboard

After running setup, verify in Stripe Dashboard:

1. **Products:** https://dashboard.stripe.com/test/products
2. **Prices:** Click each product to see prices
3. **Search:** Filter by product name

### Verify Config Files

```bash
# Check updated price IDs
grep "price_" src/config/plans-alphinium.js

# Should show real Stripe price IDs like:
# monthly: 'price_1ABC123xyz456'
```

### Test Checkout

```bash
npm run test:server
# Visit http://localhost:3456/test
# Click "Test Checkout" buttons
# Verify correct prices load
```

---

## 🎯 Benefits

### Manual Setup (Old Way)
- ⏱️ 2-3 hours of clicking
- ❌ Error-prone (typos in prices)
- 😫 Boring and repetitive
- 📋 Manual config file updates
- 🔄 Must repeat for test AND live

### Automated Setup (New Way)
- ⚡ 5 minutes total
- ✅ Consistent and accurate
- 🎉 One command per mode
- 🤖 Auto-updates configs
- 🔁 Idempotent and safe

---

## 🚀 Next Steps

After automated setup:

1. ✅ All products created in Stripe
2. ✅ All prices configured
3. ✅ Config files updated
4. ✅ Ready to test

**Now:**
- Test checkout flows
- Integrate into your apps
- Deploy to production!

See [TESTING.md](./TESTING.md) for testing guide.

---

## 📚 References

- [Stripe API: Create Product](https://docs.stripe.com/api/products/create)
- [Stripe API: Create Price](https://docs.stripe.com/api/prices/create)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe Products & Prices Guide](https://docs.stripe.com/products-prices)

---

**Created:** March 1, 2026  
**Last Updated:** March 2, 2026  
**Automation Version:** 1.0.0
