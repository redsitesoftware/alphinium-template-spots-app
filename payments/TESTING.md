# 🧪 Testing Guide - @alphinium/stripe-billing

Comprehensive testing suite for Stripe integration across all products.

---

## 🎯 Quick Start

### 1. Setup Test Environment

```bash
# Copy environment template
cp .env.test.template .env.test

# Add your Stripe test keys
# Get from: https://dashboard.stripe.com/test/apikeys
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Test Server

```bash
npm run test:server
```

### 4. Open Test Suite

Open in browser: **http://localhost:3456/test**

---

## 🔧 Test Server Features

### Endpoints

**Test UI:**
- `GET /test` - Interactive test suite

**API Endpoints:**
- `POST /api/create-checkout` - Create checkout session
- `POST /api/webhook` - Receive Stripe webhooks
- `GET /api/plans/:product` - Get pricing config

**Success Page:**
- `GET /success?session_id=...` - Post-checkout success page

---

## 🧪 What Gets Tested

### ✅ All Products (11 Total)

**Alphinium (2 tiers × 3 price variants):**
- [ ] Developer Monthly ($29)
- [ ] Developer Beta ($20)
- [ ] Developer Annual ($264)
- [ ] Team Monthly ($99)
- [ ] Team Beta ($69)
- [ ] Team Annual ($888)

**ChatInstance (3 tiers × 3 price variants):**
- [ ] Starter Monthly ($99)
- [ ] Starter Beta ($69)
- [ ] Starter Annual ($948)
- [ ] Professional Monthly ($199)
- [ ] Professional Beta ($139)
- [ ] Professional Annual ($1,908)
- [ ] Business Monthly ($299)
- [ ] Business Beta ($209)
- [ ] Business Annual ($2,868)

**Enterprise (2 tiers × 3 price variants):**
- [ ] Starter Monthly ($2,500)
- [ ] Starter Beta ($2,000)
- [ ] Starter Annual ($27,000)
- [ ] Growth Monthly ($5,000)
- [ ] Growth Beta ($4,000)
- [ ] Growth Annual ($54,000)

**UserPods (3 tiers × 1 price):**
- [ ] Hobby Monthly ($29)
- [ ] Pro Monthly ($49)
- [ ] Business Monthly ($79)

**Total:** 24 prices to test!

---

## 📋 Testing Workflow

### Phase 1: Setup (30 min)

1. **Create Products in Stripe Dashboard**
   - Follow Marketing #11 instructions
   - Create all 11 products in TEST mode
   - Create all 24-26 prices
   - Copy price IDs

2. **Update Price IDs**
   - Edit `test-stripe-integration.html` lines 267-336
   - Replace placeholder price IDs with real ones
   - Or update `src/config/plans-*.js` files

3. **Configure Webhook**
   - In Stripe Dashboard → Webhooks → Add endpoint
   - URL: `http://localhost:3456/api/webhook`
   - Use ngrok/localtunnel if testing remotely
   - Copy webhook secret to `.env.test`

---

### Phase 2: Test Checkout Flows (60 min)

**For EACH product/tier/interval:**

1. Click "Test Checkout" button
2. Verify checkout session created
3. Complete payment with test card: `4242 4242 4242 4242`
4. Verify redirect to success page
5. Check webhook logs in terminal
6. Verify subscription created in Stripe Dashboard

**Test Cards:**
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 3D Secure: `4000 0025 0000 3155`

---

### Phase 3: Test Subscription Management (30 min)

**Test these scenarios:**

1. **Cancel Subscription (End of Period)**
   - Create subscription
   - Cancel with `immediately: false`
   - Verify `cancel_at_period_end: true`
   - Verify webhook received

2. **Cancel Subscription (Immediately)**
   - Create subscription
   - Cancel with `immediately: true`
   - Verify status changes to `canceled`
   - Verify webhook received

3. **Reactivate Subscription**
   - Create subscription
   - Cancel at period end
   - Reactivate before period ends
   - Verify `cancel_at_period_end: false`

4. **Upgrade/Downgrade**
   - Create Developer subscription
   - Upgrade to Team
   - Verify proration
   - Check webhook events

---

### Phase 4: Test Webhooks (30 min)

**Verify these events are received:**

- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.paid`
- [ ] `invoice.payment_failed`
- [ ] `customer.subscription.trial_will_end`

**Watch terminal output for webhook logs!**

---

### Phase 5: Test Customer Portal (15 min)

1. Create subscription
2. Get customer ID from Stripe Dashboard
3. Create portal session via API
4. Open portal URL
5. Verify can:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Update subscription

---

### Phase 6: Test Trial Periods (Observe)

**Trial lengths:**
- Alphinium: 14 days
- ChatInstance: 14 days
- Enterprise: 30 days
- UserPods: 7 days

**Verify:**
- [ ] Trial period set correctly on subscription
- [ ] No charge during trial
- [ ] `customer.subscription.trial_will_end` fires 3 days before
- [ ] Charge occurs at end of trial

---

### Phase 7: Live Mode Testing (60 min)

**After all test mode tests pass:**

1. **Switch Stripe to Live Mode**
   - Stripe Dashboard → Toggle to Live

2. **Create Products in Live Mode**
   - Recreate all 11 products
   - Recreate all 24-26 prices
   - Copy NEW live price IDs

3. **Update Configuration**
   - Update `.env.test` with live keys
   - Update price IDs in code
   - Update webhook to live endpoint

4. **Retest Everything**
   - Use REAL card (small amount)
   - Test one flow end-to-end
   - Verify webhook works
   - Cancel immediately to avoid charges

---

## 🐛 Common Issues & Solutions

### Issue: Webhook not received

**Solution:**
- Verify webhook endpoint URL is correct
- Use ngrok if testing locally: `ngrok http 3456`
- Check webhook secret in `.env.test`
- Check Stripe Dashboard → Webhooks → Recent Deliveries

### Issue: Invalid price ID

**Solution:**
- Verify price exists in Stripe Dashboard
- Check price is in correct mode (test vs live)
- Verify price ID copied correctly (starts with `price_`)

### Issue: Customer not found

**Solution:**
- Verify customer email is valid
- Check customer exists in Stripe Dashboard
- Create customer first if needed

### Issue: Trial not applied

**Solution:**
- Verify trial_period_days is set in checkout session
- Check price allows trials (some don't)
- Verify in Stripe Dashboard → Subscriptions

---

## 📊 Success Criteria

### All Tests Pass When:

- [x] All 24 price IDs created in Stripe
- [x] All checkout sessions create successfully
- [x] All test cards work as expected
- [x] All webhooks received and processed
- [x] Subscriptions visible in Stripe Dashboard
- [x] Customer portal works
- [x] Trial periods set correctly
- [x] Cancel/reactivate works
- [x] Upgrade/downgrade works with proration
- [x] Live mode tested with real card

**Result:** Ready for production integration! 🚀

---

## 🔗 Integration with Apps

### alphinium-app

**After testing, integrate:**

```javascript
// backend/src/api/payment/services/stripe.js
const billing = require('@alphinium/stripe-billing');

billing.init({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  product: 'alphinium'
});
```

### ci-dashboard

```javascript
// services/billing.js
const billing = require('@alphinium/stripe-billing');

billing.init({
  product: 'chatinstance' // ← Different product!
});
```

### user-pods-api

```javascript
// services/billing.js
const billing = require('@alphinium/stripe-billing');

billing.init({
  product: 'userpods' // ← Add-on pricing!
});
```

---

## 📦 Package Structure Being Tested

```
@alphinium/stripe-billing/
├── src/
│   ├── services/
│   │   ├── stripe-client.js      ✅ Stripe SDK wrapper
│   │   ├── subscriptions.js      ✅ CRUD operations
│   │   └── webhooks.js            ✅ Event handling
│   ├── controllers/
│   │   ├── subscription-controller.js  ✅ Business logic
│   │   └── webhook-controller.js       ✅ Event routing
│   ├── config/
│   │   ├── plans-alphinium.js    ✅ $29/$99 pricing
│   │   ├── plans-chatinstance.js ✅ $99/$199/$299 pricing
│   │   └── plans-userpods.js     ✅ $29/$49/$79 pricing
│   └── index.js                   ✅ Main export
├── test-server.js                 ✅ Test server
├── test-stripe-integration.html   ✅ Test UI
└── TESTING.md                     ✅ This file
```

---

## 🎯 Next Steps After Testing

1. ✅ All tests pass in test mode
2. ✅ All tests pass in live mode
3. Update alphinium-app to use package
4. Update ci-dashboard to use package (when ready)
5. Update user-pods-api to use package (when ready)
6. Deploy and launch! 🚀

---

## 💡 Pro Tips

### Faster Testing

**Test multiple tiers at once:**
- Open test UI in multiple tabs
- Run through flows in parallel
- Check webhook logs for all events

### Automate Price ID Updates

After creating in Stripe, use Stripe CLI:

```bash
stripe prices list --limit 100 | grep "price_alphinium"
```

### Monitor Webhooks

Keep Stripe Dashboard open:
- Webhooks → Recent deliveries
- See all events in real-time
- Retry failed webhooks

---

## 🏆 When All Tests Pass

**You have:**
- ✅ Verified all 24 prices work
- ✅ Confirmed webhooks process correctly
- ✅ Tested all subscription operations
- ✅ Validated in both test and live modes
- ✅ Package ready for production use

**Deploy to:**
- alphinium-app backend
- ci-dashboard (when ready)
- user-pods-api (when ready)

**Start getting paying customers!** 💰

---

**Test Server:** `npm run test:server`  
**Test Suite:** http://localhost:3456/test  
**Status:** Ready to test after Stripe setup (Marketing #11)
