/**
 * Webhooks Controller
 * Handles Stripe webhook events.
 *
 * Uses ctx.state.rawBody (set by global::stripe-raw-body middleware) for
 * Stripe signature verification. Uses strapi.db.query() — the Strapi v5 API.
 */

const stripeService = require('../services/stripe');

// ─── Event Handlers ──────────────────────────────────

async function onSubscriptionCreated(subscription, tier) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('[payment] onSubscriptionCreated: no userId in subscription metadata', subscription.id);
    return;
  }

  const existingSubs = await strapi.db.query('api::subscription.subscription').findMany({
    where: { user: userId },
  });

  const data = {
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    plan_tier: tier || 'free',
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };

  if (existingSubs && existingSubs.length > 0) {
    await strapi.db.query('api::subscription.subscription').update({
      where: { id: existingSubs[0].id },
      data,
    });
  } else {
    await strapi.db.query('api::subscription.subscription').create({
      data: { user: userId, ...data },
    });
  }

  await strapi.db.query('plugin::users-permissions.user').update({
    where: { id: userId },
    data: { subscription_status: tier || 'free' },
  });

  console.log(`[payment] Subscription created: user=${userId} tier=${tier} id=${subscription.id}`);
}

async function onSubscriptionUpdated(subscription, tier) {
  const subs = await strapi.db.query('api::subscription.subscription').findMany({
    where: { stripe_subscription_id: subscription.id },
    populate: ['user'],
  });

  if (!subs || subs.length === 0) {
    console.error('[payment] onSubscriptionUpdated: subscription not found in DB:', subscription.id);
    return;
  }

  const sub = subs[0];
  await strapi.db.query('api::subscription.subscription').update({
    where: { id: sub.id },
    data: {
      plan_tier: tier || sub.plan_tier,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  const userId = sub.user?.id || sub.user || subscription.metadata?.userId;
  if (userId) {
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: parseInt(userId) },
      data: { subscription_status: tier || sub.plan_tier },
    });
  }

  console.log(`[payment] Subscription updated: ${subscription.id} tier=${tier} user=${userId}`);
}

async function onSubscriptionDeleted(subscription) {
  const subs = await strapi.db.query('api::subscription.subscription').findMany({
    where: { stripe_subscription_id: subscription.id },
    populate: ['user'],
  });

  if (!subs || subs.length === 0) {
    console.error('[payment] onSubscriptionDeleted: not found in DB:', subscription.id);
    return;
  }

  const sub = subs[0];
  await strapi.db.query('api::subscription.subscription').update({
    where: { id: sub.id },
    data: { status: 'canceled', plan_tier: 'free', cancel_at_period_end: false },
  });

  // Get userId from populated relation or metadata fallback
  const userId = sub.user?.id || sub.user || subscription.metadata?.userId;
  if (userId) {
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: parseInt(userId) },
      data: { subscription_status: 'free' },
    });
  }

  console.log(`[payment] Subscription deleted: ${subscription.id}, user=${userId} downgraded to free`);
}

async function onInvoicePaid(invoice) {
  if (!invoice.subscription) return;
  const subs = await strapi.db.query('api::subscription.subscription').findMany({
    where: { stripe_subscription_id: invoice.subscription },
  });
  if (subs && subs.length > 0) {
    await strapi.db.query('api::subscription.subscription').update({
      where: { id: subs[0].id },
      data: { status: 'active' },
    });
  }
  console.log(`[payment] Invoice paid: ${invoice.id}`);
}

async function onPaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const subs = await strapi.db.query('api::subscription.subscription').findMany({
    where: { stripe_subscription_id: invoice.subscription },
  });
  if (subs && subs.length > 0) {
    await strapi.db.query('api::subscription.subscription').update({
      where: { id: subs[0].id },
      data: { status: 'past_due' },
    });
  }
  console.log(`[payment] Invoice payment failed: ${invoice.id}`);
}

// ─── helper Plans ──────────────────────────────

function getTier(subscription) {
  try {
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plans = stripeService.getPlans();
    return plans.getTierFromPriceId(priceId) || 'free';
  } catch (_e) {
    return 'free';
  }
}

// ─── Controller ────────────────────────────────────────────────────────────────

module.exports = {
  async handleWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    const rawBody = ctx.state.rawBody;  // set by global::stripe-raw-body middleware

    let event;
    try {
      event = stripeService.constructWebhookEvent(rawBody, sig);
    } catch (err) {
      console.error('[payment] Webhook signature verification failed:', err.message);
      ctx.status = 400;
      ctx.body = { error: `Webhook Error: ${err.message}` };
      return;
    }

    console.log(`[payment] Webhook received: ${event.type}`);
    const obj = event.data.object;

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log(`[payment] Checkout completed, session=${obj.id}`);
          break;
        case 'customer.subscription.created':
          await onSubscriptionCreated(obj, getTier(obj));
          break;
        case 'customer.subscription.updated':
          await onSubscriptionUpdated(obj, getTier(obj));
          break;
        case 'customer.subscription.deleted':
          await onSubscriptionDeleted(obj);
          break;
        case 'invoice.paid':
          await onInvoicePaid(obj);
          break;
        case 'invoice.payment_failed':
          await onPaymentFailed(obj);
          break;
        case 'customer.subscription.trial_will_end':
          console.log(`[payment] Trial ending soon: ${obj.id}`);
          break;
        default:
          console.log(`[payment] Unhandled event type: ${event.type}`);
      }

      ctx.status = 200;
      ctx.body = { received: true };
    } catch (err) {
      console.error(`[payment] Error handling ${event.type}:`, err.message);
      ctx.status = 500;
      ctx.body = { error: 'Internal error processing webhook' };
    }
  },
};
