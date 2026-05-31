/**
 * Webhook Service
 * Handles Stripe webhook verification and routing
 */

const stripeClient = require('./stripe-client');

module.exports = {
  /**
   * Verify webhook signature
   */
  verifySignature(rawBody, signature, webhookSecret) {
    const stripe = stripeClient.getInstance();
    
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  },

  /**
   * Handle webhook event
   */
  async handleEvent(event, handlers = {}) {
    const { type, data } = event;
    const handler = handlers[type];

    if (handler && typeof handler === 'function') {
      try {
        await handler(data.object);
        return { success: true, type };
      } catch (error) {
        console.error(`Error handling ${type}:`, error);
        throw error;
      }
    }

    console.log(`No handler for event type: ${type}`);
    return { success: true, type, unhandled: true };
  },

  /**
   * Default webhook handler middleware (for Express/Koa)
   */
  createHandler(webhookSecret, eventHandlers) {
    return async (ctx) => {
      const sig = ctx.request.headers['stripe-signature'];
      const rawBody = ctx.request.body[Symbol.for('unparsedBody')];

      try {
        const event = this.verifySignature(rawBody, sig, webhookSecret);
        await this.handleEvent(event, eventHandlers);
        
        ctx.status = 200;
        ctx.body = { received: true };
      } catch (error) {
        console.error('Webhook error:', error.message);
        ctx.status = 400;
        ctx.body = { error: `Webhook Error: ${error.message}` };
      }
    };
  }
};
