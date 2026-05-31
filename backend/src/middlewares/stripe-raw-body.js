/**
 * stripe-raw-body middleware
 *
 * For the Stripe webhook route: buffers the raw request body, stores it at
 * ctx.state.rawBody for Stripe signature verification, then re-streams the
 * buffered bytes back into ctx.req so koa-body can still parse the body.
 *
 * koa-body v6 does NOT support ctx.disableBodyParser, so we must ensure the
 * stream is still readable when koa-body runs.
 */
const { Readable } = require('stream');

module.exports = (_config, { strapi: _strapi }) => {
  return async (ctx, next) => {
    if (ctx.path === '/api/payment/webhook' && ctx.method === 'POST') {
      // Buffer the raw body before koa-body consumes the stream
      const rawBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        ctx.req.on('data', chunk => chunks.push(chunk));
        ctx.req.on('end', () => resolve(Buffer.concat(chunks)));
        ctx.req.on('error', reject);
      });

      // Store the raw body on ctx.state for signature verification
      ctx.state.rawBody = rawBuffer;

      // Re-create the readable stream so koa-body can still parse it
      const restored = new Readable({
        read() {}
      });
      restored.push(rawBuffer);
      restored.push(null);

      // Copy essential IncomingMessage properties koa-body needs
      restored.headers = ctx.req.headers;
      restored.method = ctx.req.method;
      restored.url = ctx.req.url;

      ctx.req = restored;
    }

    await next();
  };
};
