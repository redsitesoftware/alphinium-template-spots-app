/**
 * Stripe Integration Test Server
 * 
 * Supports both TEST and LIVE mode dynamically
 * 
 * Usage:
 *   1. Set environment variables:
 *      STRIPE_SECRET_KEY_TEST=sk_test_...
 *      STRIPE_SECRET_KEY_LIVE=sk_live_...
 *      STRIPE_WEBHOOK_SECRET=whsec_...
 *   
 *   2. Run: node test-server.js
 *   
 *   3. Open: http://localhost:3456/test
 *   
 *   4. Toggle between Test/Live mode in UI
 */

require('dotenv').config({ path: '.env.test' });
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Postgres (usage events) ──────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
let db = null;
if (DATABASE_URL) {
  db = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  db.query(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT,
      event_type TEXT NOT NULL,
      pod_id TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      duration_hours NUMERIC(10,4),
      plan_tier TEXT,
      stripe_customer_id TEXT,
      meter_reported BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).then(() => console.log('✅ usage_events table ready'))
    .catch(e => console.warn('⚠️ usage_events table init failed:', e.message));
} else {
  console.warn('⚠️ DATABASE_URL not set — usage events will not be persisted');
}

// Both Stripe instances
const STRIPE_TEST_KEY = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
// STRIPE_SECRET_KEY_LIVE takes precedence; falls back to STRIPE_SECRET_KEY (injected by user-pods deploy).
// No hardcoded fallback — server fails loudly at startup if neither is set.
const STRIPE_LIVE_KEY = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
if (!STRIPE_LIVE_KEY) throw new Error('STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE must be set');
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('[FATAL] STRIPE_WEBHOOK_SECRET is not set. Refusing to start — webhook endpoint would accept unverified events.');

const stripeTest = STRIPE_TEST_KEY ? new Stripe(STRIPE_TEST_KEY) : null;
const stripeLive = new Stripe(STRIPE_LIVE_KEY);

console.log('✅ Stripe clients initialized');
console.log('   Test mode:', STRIPE_TEST_KEY ? '✅ Available' : '⚠️ Not configured');
console.log('   Live mode:', '✅ Available');

// Load plans
const alphiniuPlans = require('./src/examples/plans-alphinium');
const billing = require('./src/index');

// Initialize the billing package so subscription-controller can use Stripe
billing.init({
  stripeSecretKey: STRIPE_LIVE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  plans: alphiniuPlans,
});

const ALLOWED_ORIGINS = [
  'https://app.alphinium.com',
  'https://alphinium.com',
  'https://alphinium-cluster.alphinium.io',   // direct cluster URL (used before custom domain resolves)
  'http://localhost:3000',
  'http://localhost:5173',
];

// CORS middleware — sets headers unconditionally so nginx stripping the
// Origin request header doesn't prevent CORS from working.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // No Origin header (e.g. nginx stripped it) — allow all dashboard origins
    res.setHeader('Access-Control-Allow-Origin', 'https://app.alphinium.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '3600');
    return res.status(204).end();
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/test');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payments', timestamp: new Date().toISOString() });
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test-stripe-integration.html');
});

/**
 * Create checkout session
 * POST /api/create-checkout
 */
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { product, tier, interval, email = 'test@example.com', mode = 'test', priceId } = req.body;
    
    console.log(`📥 Checkout request (${mode.toUpperCase()} mode):`, { product, tier, interval, priceId });
    
    // Select correct Stripe instance
    const stripe = mode === 'live' ? stripeLive : stripeTest;
    if (!stripe) {
      console.error(`❌ Stripe ${mode} mode not configured`);
      return res.status(500).json({ error: `Stripe ${mode} mode not available. Check environment variables.` });
    }
    
    // Use priceId from frontend (which has both test and live IDs)
    // Fallback to config files only if not provided
    let finalPriceId = priceId;
    
    if (!finalPriceId) {
      console.log('⚠️ No priceId provided, looking up from config...');
      const planConfig = plans[product];
      if (!planConfig) {
        console.error('❌ Invalid product:', product);
        return res.status(400).json({ error: `Invalid product: ${product}` });
      }
      
      const tierConfig = planConfig.tiers[tier];
      if (!tierConfig) {
        console.error('❌ Invalid tier:', tier);
        return res.status(400).json({ error: `Invalid tier: ${tier}` });
      }
      
      finalPriceId = tierConfig.prices[interval];
      if (!finalPriceId) {
        console.error('❌ Invalid interval:', interval);
        return res.status(400).json({ error: `Invalid interval: ${interval}` });
      }
    }
    
    console.log(`💳 Creating checkout with price: ${finalPriceId}`);
    
    // Determine trial days
    let trialDays = 14;
    if (product === 'enterprise') trialDays = 30;
    if (product === 'userpods') trialDays = 7;
    
    // Create checkout session using selected Stripe instance
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{
        price: finalPriceId,
        quantity: 1
      }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          product,
          tier,
          interval,
          userId: 'test-user-123'
        }
      },
      success_url: `${process.env.APP_BASE_URL || `http://localhost:${PORT}`}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL || `http://localhost:${PORT}`}/test`,
      metadata: {
        product,
        tier,
        interval,
        mode
      }
    });
    
    console.log(`✅ Checkout session created (${mode.toUpperCase()}): ${session.id}`);
    console.log(`   Product: ${product} - ${tier} - ${interval}`);
    console.log(`   Price ID: ${finalPriceId}`);
    console.log(`   URL: ${session.url}`);
    
    res.json({ 
      sessionId: session.id,
      url: session.url,
      mode
    });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    console.error('   Type:', error.type);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      type: error.type,
      details: error.raw?.message || 'Check server logs for details'
    });
  }
});

/**
 * Handle webhooks
 * POST /api/payment/webhook  ← matches Stripe dashboard config
 * POST /api/webhook          ← legacy alias (stripe listen default)
 */
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const rawBody = JSON.stringify(req.body);
  
  try {
    const event = billing.services.webhooks.verifySignature(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log(`📥 Webhook received: ${event.type}`);
    
    await billing.services.webhooks.handleEvent(event, {
      'checkout.session.completed': async (session) => {
        console.log('✅ Checkout completed:', session.id);
        console.log(`   Customer: ${session.customer}`);
        console.log(`   Subscription: ${session.subscription}`);
      },
      
      'customer.subscription.created': async (subscription) => {
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = alphiniuPlans.getTierFromPriceId(priceId);
        console.log('✅ Subscription created:', subscription.id);
        console.log(`   Tier: ${tier}`);
        console.log(`   Status: ${subscription.status}`);
      },
      
      'customer.subscription.updated': async (subscription) => {
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = alphiniuPlans.getTierFromPriceId(priceId);
        console.log('📝 Subscription updated:', subscription.id);
        console.log(`   Tier: ${tier}`);
        console.log(`   Status: ${subscription.status}`);
      },
      
      'customer.subscription.deleted': async (subscription) => {
        console.log('❌ Subscription deleted:', subscription.id);
      },
      
      'invoice.paid': async (invoice) => {
        console.log('💰 Invoice paid:', invoice.id);
        console.log(`   Amount: $${invoice.amount_paid / 100}`);
      },
      
      'invoice.payment_failed': async (invoice) => {
        console.log('⚠️ Payment failed:', invoice.id);
        console.log(`   Amount: $${invoice.amount_due / 100}`);
      }
    });
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

app.post('/api/payment/webhook', handleWebhook);
app.post('/api/webhook', handleWebhook);

/**
 * Success page
 */
app.get('/success', (req, res) => {
  const sessionId = req.query.session_id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Success!</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f7fafc;
                margin: 0;
            }
            .success-box {
                background: white;
                padding: 3rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                max-width: 500px;
            }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { color: #718096; margin-bottom: 1rem; }
            .session { 
                font-family: monospace; 
                background: #f7fafc; 
                padding: 0.5rem; 
                border-radius: 6px;
                font-size: 0.85rem;
                margin: 1rem 0;
            }
            a {
                display: inline-block;
                margin-top: 1rem;
                padding: 12px 24px;
                background: #dc2626;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="success-box">
            <h1>✅ Payment Successful!</h1>
            <p>Your test subscription has been created.</p>
            <div class="session">Session: ${sessionId}</div>
            <p>Check your webhook logs to verify the subscription was created correctly.</p>
            <a href="/test">← Back to Test Suite</a>
        </div>
    </body>
    </html>
  `);
});

/**
 * Get plan info
 */
app.get('/api/plans/:product', (req, res) => {
  const { product } = req.params;
  const plans = billing.plans[product];
  
  if (!plans) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(plans);
});

// ─── Dashboard-facing /api/payment/* routes ──────────────────────────────────
// The web dashboard calls these routes (configured via PAYMENT_API_ENDPOINT).

/**
 * GET /api/payment/plans
 * Returns all tiers + addons for the Alphinium product.
 * No auth required — frontend reads this to render the pricing/billing UI.
 */
app.get('/api/payment/plans', (req, res) => {
  res.json(alphiniuPlans);
});

/**
 * GET /api/payment/subscription/:userId
 * Look up subscription by userId stored in Stripe customer metadata.
 */
app.get('/api/payment/subscription/:userId', async (req, res) => {
  const { userId } = req.params;
  const stripe = stripeLive;
  try {
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });
    if (!customers.data.length) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 1, status: 'all' });
    if (!subs.data.length) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    const sub = subs.data[0];
    const priceId = sub.items.data[0]?.price?.id;
    // Resolve tier from price ID
    let tier = 'free';
    for (const [tierKey, tierCfg] of Object.entries(alphiniuPlans.tiers)) {
      const prices = tierCfg.prices || {};
      if (tierCfg.priceId === priceId || Object.values(prices).includes(priceId)) {
        tier = tierKey;
        break;
      }
    }
    res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        tier,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        amount: sub.items.data[0]?.price?.unit_amount,
        interval: sub.items.data[0]?.price?.recurring?.interval,
      },
    });
  } catch (err) {
    console.error('❌ subscription lookup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/create-checkout-session
 * Dashboard checkout flow: user selects plan → Stripe Checkout.
 */
app.post('/api/payment/create-checkout-session', async (req, res) => {
  const { priceId, userId, email, successUrl, cancelUrl, trialDays } = req.body;
  try {
    const subCtrl = require('./src/controllers/subscription-controller');
    const result = await subCtrl.createCheckoutSession({
      email, userId, priceId,
      successUrl: successUrl || `${req.headers.origin}/subscription/success`,
      cancelUrl:  cancelUrl  || `${req.headers.origin}/settings?tab=billing`,
      metadata: { userId },
      trialDays: trialDays || undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('❌ create-checkout-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/create-portal-session
 * Opens Stripe Customer Portal so user can manage payment method/cancel.
 */
app.post('/api/payment/create-portal-session', async (req, res) => {
  const { returnUrl, userId } = req.body;
  const stripe = stripeLive;
  try {
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });
    if (!customers.data.length) {
      return res.status(404).json({ error: 'No customer found' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || process.env.PORTAL_RETURN_URL || 'https://alphinium.com/settings?tab=billing',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ portal session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/change-plan
 * Upgrade/downgrade active subscription to a new price.
 */
app.post('/api/payment/change-plan', async (req, res) => {
  const { userId, newPriceId, newPlanTier, billingPeriod = 'monthly' } = req.body;
  const stripe = stripeLive;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // Resolve price ID from tier name when caller sends newPlanTier instead of newPriceId
  let resolvedPriceId = newPriceId;
  if (!resolvedPriceId && newPlanTier) {
    const tierConfig = alphiniuPlans.tiers[newPlanTier];
    resolvedPriceId = tierConfig?.prices?.[billingPeriod] || tierConfig?.prices?.monthly;
    if (!resolvedPriceId) {
      return res.status(400).json({ error: `No price configured for plan: ${newPlanTier} (${billingPeriod})` });
    }
  }
  if (!resolvedPriceId) return res.status(400).json({ error: 'Missing newPriceId or newPlanTier' });

  try {
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });
    if (!customers.data.length) return res.status(404).json({ error: 'No customer found' });
    const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, limit: 1, status: 'active' });
    if (!subs.data.length) return res.status(404).json({ error: 'No active subscription' });
    const sub = subs.data[0];
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0].id, price: resolvedPriceId }],
      proration_behavior: 'create_prorations',
    });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ change-plan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/create-addon-session
 * Purchase an add-on (e.g. extra pod slot) via Stripe Checkout.
 */
app.post('/api/payment/create-addon-session', async (req, res) => {
  const { userId, email, addonKey, quantity = 1, successUrl, cancelUrl } = req.body;
  const addon = alphiniuPlans.addons?.[addonKey];
  if (!addon) return res.status(400).json({ error: `Unknown addon: ${addonKey}` });
  try {
    const subCtrl = require('./src/controllers/subscription-controller');
    const result = await subCtrl.createCheckoutSession({
      email, userId,
      priceId: addon.priceId,
      successUrl: successUrl || `${req.headers.origin}/subscription/success`,
      cancelUrl:  cancelUrl  || `${req.headers.origin}/settings?tab=billing`,
      metadata: { userId, addonKey, quantity: String(quantity) },
      trialDays: 0,
    });
    res.json(result);
  } catch (err) {
    console.error('❌ create-addon-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET|POST /api/payment/entitlement
 * Called by alphinium-input-output (agents_v1.py for desktops, project_pods.py for pods).
 *
 * Query/body params:
 *   email        — user email to look up in Stripe
 *   active_count — current count of active desktops or pods (caller tracks this)
 *   type         — "pod" | "desktop" (default "desktop") — selects which limit to check
 *
 * Response (all callers should use plan_tier / desktop_limit / pod_limit):
 *   { allowed, plan_tier, tier, desktop_limit, pod_limit, limit, active_count, message }
 *
 * Desktop limits: free=1, starter=1, developer=3, team=10, enterprise=unlimited
 * Pod limits:     free=0, starter=1, developer=unlimited, team=unlimited, enterprise=unlimited
 */
const DESKTOP_LIMITS = { free: 1, starter: 1, developer: 3, team: 10, enterprise: null };
const POD_LIMITS     = { free: 0, starter: 1, developer: null, team: null, enterprise: null };

async function checkEntitlement(req, res) {
  const email = req.query.email || req.body?.email;
  const activeCount = parseInt(req.query.active_count ?? req.body?.active_count ?? '0', 10);
  const type = (req.query.type || req.body?.type || 'desktop').toLowerCase();
  const stripe = stripeLive;

  try {
    const customers = await stripe.customers.search({ query: `email:'${email}'`, limit: 1 });
    let tier = 'free';
    let addonPodCount = 0;

    if (customers.data.length) {
      const subs = await stripe.subscriptions.list({
        customer: customers.data[0].id, limit: 1, status: 'active',
        expand: ['data.items'],
      });
      if (subs.data.length) {
        const addonPriceId = process.env.STRIPE_PRICE_ADDON_POD_MONTHLY;
        for (const item of subs.data[0].items.data) {
          const priceTier = alphiniuPlans.getTierFromPriceId(item.price.id);
          if (priceTier) {
            tier = priceTier;
          } else if (addonPriceId && item.price.id === addonPriceId) {
            addonPodCount += item.quantity || 1;
          }
        }
      }
    }

    const desktopLimit = DESKTOP_LIMITS[tier] ?? 1;
    const basePodLimit = POD_LIMITS[tier] ?? 0;
    // null = unlimited; otherwise add purchased add-on pods to base limit
    const podLimit = basePodLimit === null ? null : basePodLimit + addonPodCount;
    const activeLimit = type === 'pod' ? podLimit : desktopLimit;
    const allowed = activeLimit === null || activeCount < activeLimit;
    const message = allowed
      ? null
      : `${tier} plan allows ${activeLimit} ${type}(s)${addonPodCount > 0 ? ` (incl. ${addonPodCount} add-on pod(s))` : ''}. You have ${activeCount} active.`;

    res.json({
      allowed,
      plan_tier: tier,       // primary field — used by agents_v1 + project_pods
      tier,                  // legacy alias
      desktop_limit: desktopLimit,
      pod_limit: podLimit,
      addon_pod_count: addonPodCount,
      limit: activeLimit,    // legacy alias — limit for the requested type
      active_count: activeCount,
      message,
    });
  } catch (err) {
    console.error('❌ entitlement error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
app.get('/api/payment/entitlement', checkEntitlement);
app.post('/api/payment/entitlement', checkEntitlement);

// ─────────────────────────────────────────────────────────────────────────────

// Start server
/**
 * POST /api/payment/record-usage
 * Called by alphinium-input-output (agents_v1.py, project_pods.py, pod_deployer.py)
 * on pod_start and pod_stop events. Always returns 200 — failures are logged only.
 *
 * Body: { user_id, event_type, pod_id, started_at, ended_at?, user_email? }
 *
 * On pod_stop: calculates duration_hours, looks up Stripe customer, reports to
 * Stripe Billing Meters (STRIPE_METER_POD_HOURS) for usage-based billing.
 */
const STRIPE_METER_EVENT_NAME = process.env.STRIPE_METER_EVENT_NAME || 'alphinium_pod_hours';
const STRIPE_METER_POD_HOURS = process.env.STRIPE_METER_POD_HOURS; // meter ID for logging

app.post('/api/payment/record-usage', async (req, res) => {
  // Always ack immediately — caller must never be blocked by metering
  res.json({ received: true });

  const { user_id, event_type, pod_id, started_at, ended_at, user_email, plan_tier } = req.body;
  if (!user_id || !event_type || !pod_id || !started_at) {
    console.warn('⚠️ record-usage: missing required fields', req.body);
    return;
  }

  let durationHours = null;
  if (event_type === 'pod_stop' && ended_at) {
    const ms = new Date(ended_at) - new Date(started_at);
    if (ms > 0) durationHours = +(ms / 3600000).toFixed(4);
  }

  // ── 1. Persist to DB ──────────────────────────────────────────────────────
  let dbRowId = null;
  if (db) {
    try {
      const result = await db.query(
        `INSERT INTO usage_events
           (user_id, user_email, event_type, pod_id, started_at, ended_at, duration_hours, plan_tier)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [user_id, user_email || null, event_type, pod_id,
         started_at, ended_at || null, durationHours, plan_tier || null]
      );
      dbRowId = result.rows[0]?.id;
      console.log(`✅ Usage event stored: ${event_type} pod=${pod_id} duration=${durationHours}h (row ${dbRowId})`);
    } catch (e) {
      console.warn('⚠️ record-usage DB insert failed:', e.message);
    }
  }

  // ── 2. Report to Stripe Meters on pod_stop ────────────────────────────────
  if (event_type !== 'pod_stop' || !durationHours || !STRIPE_METER_POD_HOURS) return;

  try {
    // Find Stripe customer by email or userId metadata
    let stripeCustomerId = null;
    if (user_email) {
      const byEmail = await stripeLive.customers.search({
        query: `email:'${user_email}'`, limit: 1,
      });
      stripeCustomerId = byEmail.data[0]?.id || null;
    }
    if (!stripeCustomerId && user_id) {
      const byMeta = await stripeLive.customers.search({
        query: `metadata['userId']:'${user_id}'`, limit: 1,
      });
      stripeCustomerId = byMeta.data[0]?.id || null;
    }

    if (!stripeCustomerId) {
      console.warn(`⚠️ record-usage: no Stripe customer for user ${user_id} — meter event skipped`);
      return;
    }

    // Report to Stripe Billing Meters
    await stripeLive.billing.meterEvents.create({
      event_name: STRIPE_METER_EVENT_NAME,
      payload: {
        stripe_customer_id: stripeCustomerId,
        value: String(durationHours),
      },
      timestamp: Math.floor(new Date(ended_at).getTime() / 1000),
      identifier: `usage_event_${dbRowId || pod_id}_${ended_at}`,
    });

    console.log(`✅ Stripe meter event reported: ${durationHours}h for ${stripeCustomerId} (meter ${STRIPE_METER_POD_HOURS})`);

    // Mark as reported in DB
    if (db && dbRowId) {
      await db.query(
        'UPDATE usage_events SET meter_reported=TRUE, stripe_customer_id=$1 WHERE id=$2',
        [stripeCustomerId, dbRowId]
      ).catch(() => {});
    }
  } catch (e) {
    console.warn('⚠️ record-usage Stripe meter report failed (non-fatal):', e.message);
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Stripe Integration Test Server Running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`🧪 Test Suite: http://localhost:${PORT}/test`);
  console.log('');
  console.log('📦 Package: @alphinium/stripe-billing');
  console.log(`🔑 Mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
  console.log('');
  console.log('Webhook endpoint: POST /api/payment/webhook (primary)');
  console.log('Webhook endpoint: POST /api/webhook (alias)');
  console.log('Checkout endpoint: POST /api/create-checkout');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
