/**
 * Checkout Controller
 * Uses @alphinium/stripe-billing for subscription operations.
 *
 * Uses strapi.db.query() — the Strapi v5 API (entityService was removed in v5).
 */

const stripeService = require('../services/stripe');

const SUB_MODEL = 'api::subscription.subscription';
const USER_MODEL = 'plugin::users-permissions.user';

module.exports = {
  async getPlans(ctx) {
    try {
      const plans = stripeService.getPlans();
      ctx.body = { product: plans.productName, tiers: plans.tiers, addons: plans.addons || {}, currency: 'USD' };
    } catch (error) {
      console.error('Get plans error:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  async verifyPayment(ctx) {
    try {
      const { sessionId } = ctx.request.body;
      if (!sessionId) { ctx.status = 400; ctx.body = { error: 'sessionId is required' }; return; }

      const session = await stripeService.retrieveCheckoutSession(sessionId);
      if (session.payment_status !== 'paid' && session.status !== 'complete') {
        ctx.status = 402; ctx.body = { success: false, error: 'Payment not completed' }; return;
      }

      const subscription = session.subscription;
      ctx.body = {
        success: true,
        sessionId: session.id,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscriptionId: typeof subscription === 'string' ? subscription : subscription?.id,
        subscriptionStatus: typeof subscription === 'object' ? subscription?.status : 'active',
        userId: session.metadata?.userId || null,
      };
    } catch (error) {
      console.error('Verify payment error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  async createCheckoutSession(ctx) {
    try {
      const { priceId, userId, email: emailParam } = ctx.request.body;
      if (!priceId || !userId) { ctx.status = 400; ctx.body = { error: 'priceId and userId are required' }; return; }

      // Payments Strapi has its own user DB separate from alphinium — userId is an external UUID.
      // Use email sent directly from the dashboard; store userId as external reference in metadata.
      const resolvedEmail = emailParam;
      const resolvedUserId = userId;

      if (!resolvedEmail) { ctx.status = 400; ctx.body = { error: 'email is required for checkout' }; return; }

      // Look up trial days from plan config — each tier defines its own trialDays
      const plans = require('../../../../config/plans');
      const tierKey = plans.getTierFromPriceId(priceId);
      const trialDays = plans.tiers[tierKey]?.trialDays ?? 0;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      const session = await stripeService.createCheckoutSession({
        email: resolvedEmail,
        userId: resolvedUserId,
        priceId,
        successUrl: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${frontendUrl}/subscription/cancel`,
        trialDays: trialDays > 0 ? trialDays : undefined,
        metadata: { userId: resolvedUserId }
      });
      ctx.body = session;
    } catch (error) {
      console.error('Create checkout session error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  async getSubscription(ctx) {
    try {
      const { userId } = ctx.params;
      const subscriptions = await strapi.db.query(SUB_MODEL).findMany({ where: { user: userId } });

      if (!subscriptions || subscriptions.length === 0) {
        ctx.status = 404; ctx.body = { error: 'No subscription found' }; return;
      }
      ctx.body = { subscription: subscriptions[0] };
    } catch (error) {
      console.error('Get subscription error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  async cancelSubscription(ctx) {
    try {
      const { userId, immediately = false } = ctx.request.body;
      if (!userId) { ctx.status = 400; ctx.body = { error: 'userId is required' }; return; }

      const subscriptions = await strapi.db.query(SUB_MODEL).findMany({ where: { user: userId } });
      if (!subscriptions || subscriptions.length === 0) {
        ctx.status = 404; ctx.body = { error: 'No subscription found' }; return;
      }

      const sub = subscriptions[0];
      await stripeService.cancelSubscription(sub.stripe_subscription_id, immediately);

      if (immediately) {
        await strapi.db.query(SUB_MODEL).update({ where: { id: sub.id }, data: { status: 'canceled', plan_tier: 'free' } });
      } else {
        await strapi.db.query(SUB_MODEL).update({ where: { id: sub.id }, data: { cancel_at_period_end: true } });
      }

      ctx.body = { success: true, message: immediately ? 'Subscription cancelled' : 'Will cancel at period end' };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  async reactivateSubscription(ctx) {
    try {
      const { userId } = ctx.request.body;
      if (!userId) { ctx.status = 400; ctx.body = { error: 'userId is required' }; return; }

      const subscriptions = await strapi.db.query(SUB_MODEL).findMany({ where: { user: userId } });
      if (!subscriptions || subscriptions.length === 0) {
        ctx.status = 404; ctx.body = { error: 'No subscription found' }; return;
      }

      const sub = subscriptions[0];
      await stripeService.reactivateSubscription(sub.stripe_subscription_id);
      await strapi.db.query(SUB_MODEL).update({ where: { id: sub.id }, data: { cancel_at_period_end: false } });

      ctx.body = { success: true, message: 'Subscription reactivated' };
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  async createPortalSession(ctx) {
    try {
      const { userId } = ctx.request.body;
      if (!userId) { ctx.status = 400; ctx.body = { error: 'userId is required' }; return; }

      const subscriptions = await strapi.db.query(SUB_MODEL).findMany({ where: { user: userId } });
      if (!subscriptions || subscriptions.length === 0) {
        ctx.status = 404; ctx.body = { error: 'No subscription found' }; return;
      }

      const sub = subscriptions[0];
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      const session = await stripeService.createPortalSession(sub.stripe_customer_id, `${frontendUrl}/subscription`);

      ctx.body = session;
    } catch (error) {
      console.error('Create portal session error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  /**
   * POST /api/payment/entitlement
   * Called server-to-server by the IO API before spawning agent pods.
   * Body: { email, active_count }
   * Returns: { allowed, plan_tier, pod_limit, message }
   *
   * Base pod limits:
   *   free       → 0  (desktops only, no user-deployed pods)
   *   starter    → 1
   *   developer  → 3
   *   team       → 10
   *   enterprise → null (unlimited)
   * Add-ons are counted from Stripe subscription items and added to the base limit.
   */
  async checkEntitlement(ctx) {
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (internalSecret) {
      const provided = ctx.request.headers['x-internal-secret'] || ctx.request.headers['authorization']?.replace('Bearer ', '');
      if (provided !== internalSecret) {
        ctx.status = 403; ctx.body = { error: 'Forbidden' }; return;
      }
    }

    try {
      // Accept query params (GET from IO API) or body (POST)
      const { email, active_count = 0 } = ctx.request.method === 'GET'
        ? ctx.request.query
        : ctx.request.body;
      if (!email) { ctx.status = 400; ctx.body = { error: 'email is required' }; return; }

      // Pod limits per tier (base — before add-ons)
      // Desktop limits match billing tiers: free=1, starter=1, developer=3, team=10, enterprise=unlimited
      const DESKTOP_LIMITS = { free: 1, starter: 1, developer: 3, team: 10, enterprise: null };
      const TIER_LIMITS    = { free: 0, starter: 1, developer: 3, team: 10, enterprise: null };

      // Look up user by email
      const user = await strapi.db.query(USER_MODEL).findOne({ where: { email } });
      if (!user) {
        ctx.body = {
          allowed: false,
          plan_tier: 'free',
          desktop_limit: DESKTOP_LIMITS.free,
          pod_limit: 0,
          message: 'Free tier — upgrade to create pods (alphinium.com/#pricing)',
        };
        return;
      }

      // Look up active subscription
      const subs = await strapi.db.query(SUB_MODEL).findMany({
        where: { user: user.id, status: ['active', 'trialing'] },
        orderBy: { created_at: 'desc' },
        limit: 1,
      });

      const plan_tier = subs[0]?.plan_tier || user.subscription_status || 'free';
      const base_limit = TIER_LIMITS.hasOwnProperty(plan_tier) ? TIER_LIMITS[plan_tier] : 0;

      // Enterprise: always allowed, no limit
      if (plan_tier === 'enterprise' || base_limit === null) {
        ctx.body = { allowed: true, plan_tier, desktop_limit: null, pod_limit: null, message: 'Enterprise — unlimited pods' };
        return;
      }

      // Count add-on pods purchased via Stripe subscription items
      let addon_pods = 0;
      const addonPriceId = process.env.STRIPE_PRICE_ADDON_POD_MONTHLY;
      if (subs[0]?.stripe_subscription_id && addonPriceId) {
        try {
          const stripe = require('../services/stripe').getStripeInstance();
          const subscription = await stripe.subscriptions.retrieve(subs[0].stripe_subscription_id, {
            expand: ['items'],
          });
          for (const item of subscription.items.data) {
            if (item.price.id === addonPriceId) {
              addon_pods += item.quantity || 1;
            }
          }
        } catch (addonErr) {
          console.warn('Could not retrieve add-on items from Stripe (ignoring):', addonErr.message);
        }
      }

      const pod_limit = base_limit + addon_pods;
      const desktop_limit = DESKTOP_LIMITS.hasOwnProperty(plan_tier) ? DESKTOP_LIMITS[plan_tier] : 1;
      const allowed = active_count < pod_limit;
      ctx.body = {
        allowed,
        plan_tier,
        desktop_limit,
        pod_limit,
        addon_pods,
        message: allowed
          ? `${plan_tier} tier — ${active_count}/${pod_limit} pods active${addon_pods ? ` (${addon_pods} add-on)` : ''}`
          : `${plan_tier} tier limit reached (${pod_limit} pod${pod_limit !== 1 ? 's' : ''} max). Add more at alphinium.com/#pricing`,
      };
    } catch (error) {
      console.error('Entitlement check error:', error);
      // Fail open — don't block pod creation if payments DB is unavailable
      ctx.body = { allowed: true, plan_tier: 'unknown', pod_limit: null, message: 'Entitlement check unavailable (failing open)' };
    }
  },

  /**
   * POST /api/payment/create-addon-session
   * Creates a Stripe Checkout session to purchase extra pod add-ons.
   * Body: { userId, quantity }   (quantity = number of extra pods to add)
   * Returns: { url } — redirect to Stripe
   */
  async createAddonSession(ctx) {
    try {
      const { userId, quantity = 1 } = ctx.request.body;
      if (!userId) { ctx.status = 400; ctx.body = { error: 'userId is required' }; return; }

      const addonPriceId = process.env.STRIPE_PRICE_ADDON_POD_MONTHLY;
      if (!addonPriceId) {
        ctx.status = 503; ctx.body = { error: 'Add-on pods are not available in this environment.' }; return;
      }

      const user = await strapi.db.query(USER_MODEL).findOne({ where: { id: userId } });
      if (!user) { ctx.status = 404; ctx.body = { error: 'User not found' }; return; }

      const subs = await strapi.db.query(SUB_MODEL).findMany({
        where: { user: user.id, status: ['active', 'trialing'] },
        orderBy: { created_at: 'desc' },
        limit: 1,
      });
      if (!subs || subs.length === 0) {
        ctx.status = 402; ctx.body = { error: 'An active subscription is required to purchase add-on pods.' }; return;
      }

      const stripe = require('../services/stripe').getStripeInstance();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      const session = await stripe.checkout.sessions.create({
        customer: subs[0].stripe_customer_id,
        mode: 'subscription',
        line_items: [{ price: addonPriceId, quantity: Math.max(1, parseInt(quantity) || 1) }],
        success_url: `${frontendUrl}/subscription/success?addon=pod&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/subscription`,
        subscription_data: { metadata: { userId: user.id.toString(), addon: 'extra_pod' } },
        metadata: { userId: user.id.toString(), addon: 'extra_pod' },
      });

      ctx.body = { url: session.url };
    } catch (error) {
      console.error('Create addon session error:', error);
      ctx.status = 500; ctx.body = { error: error.message };
    }
  },

  /**
   * POST /api/payment/record-usage
   * Metering pipeline — called by IO API on pod_start / pod_stop events.
   * Acks immediately (200) so the caller is never blocked.
   * Persists to usage_events table and reports to Stripe Billing Meters in the background.
   */
  async recordUsage(ctx) {
    // Ack immediately — do all async work in background
    ctx.status = 200;
    ctx.body = { received: true };

    const { user_id, user_email, pod_id, event_type, started_at, ended_at, plan_tier } = ctx.request.body || {};

    setImmediate(async () => {
      try {
        const { Pool } = require('pg');
        const DATABASE_URL = process.env.DATABASE_URL;
        if (!DATABASE_URL) {
          console.warn('[record-usage] DATABASE_URL not set — skipping persistence');
          return;
        }

        const db = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

        // Ensure table exists
        await db.query(`
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
        `);

        let duration_hours = null;
        if (event_type === 'pod_stop' && started_at && ended_at) {
          const ms = new Date(ended_at) - new Date(started_at);
          duration_hours = ms > 0 ? +(ms / 3_600_000).toFixed(4) : 0;
        }

        const result = await db.query(
          `INSERT INTO usage_events (user_id, user_email, event_type, pod_id, started_at, ended_at, duration_hours, plan_tier)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [user_id, user_email, event_type, pod_id, started_at, ended_at || null, duration_hours, plan_tier || null]
        );

        console.log(`[record-usage] persisted event id=${result.rows[0].id} type=${event_type} pod=${pod_id}`);

        // Report to Stripe Billing Meters on pod_stop
        if (event_type === 'pod_stop' && duration_hours > 0) {
          try {
            const stripeService = require('../services/stripe');
            const stripe = stripeService.getStripeInstance();
            const meterEventName = process.env.STRIPE_METER_EVENT_NAME || 'alphinium_pod_hours';

            // Look up Stripe customer by email or userId metadata
            let customerId = null;
            if (user_email) {
              const customers = await stripe.customers.list({ email: user_email, limit: 1 });
              customerId = customers.data[0]?.id || null;
            }

            if (customerId) {
              await stripe.billing.meterEvents.create({
                event_name: meterEventName,
                payload: {
                  stripe_customer_id: customerId,
                  value: String(duration_hours),
                },
              });
              await db.query('UPDATE usage_events SET meter_reported=TRUE, stripe_customer_id=$1 WHERE id=$2', [customerId, result.rows[0].id]);
              console.log(`[record-usage] Stripe meter reported: ${duration_hours}h for customer ${customerId}`);
            }
          } catch (stripeErr) {
            console.warn('[record-usage] Stripe meter report failed (non-fatal):', stripeErr.message);
          }
        }

        await db.end();
      } catch (err) {
        console.error('[record-usage] background error (non-fatal):', err.message);
      }
    });
  },
};
