// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    // Payment routes will be registered in bootstrap after controllers load
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // ── Auto-configure OAuth providers from environment variables ────────────
    // Reads FACEBOOK_APP_ID + FACEBOOK_APP_SECRET (and future providers) and
    // writes them into Strapi's plugin store so the admin panel doesn't need
    // to be touched manually. Safe to call every startup — only updates if
    // env vars are present, never clears existing config.
    try {
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const grantConfig = (await pluginStore.get({ key: 'grant' })) as Record<string, any> || {};
      let updated = false;

      if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
        grantConfig.facebook = {
          ...(grantConfig.facebook || {}),
          enabled: true,
          icon: 'facebook',
          key: process.env.FACEBOOK_APP_ID,
          secret: process.env.FACEBOOK_APP_SECRET,
          callback: `${process.env.PUBLIC_URL || 'http://localhost:1337'}/api/connect/facebook/callback`,
          scope: ['email', 'public_profile'],
        };
        updated = true;
        console.log('✅ Facebook OAuth auto-configured from FACEBOOK_APP_ID/FACEBOOK_APP_SECRET');
      }

      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        grantConfig.google = {
          ...(grantConfig.google || {}),
          enabled: true,
          icon: 'google',
          key: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
          callback: `${process.env.PUBLIC_URL || 'http://localhost:1337'}/api/connect/google/callback`,
          scope: ['email', 'profile'],
        };
        updated = true;
        console.log('✅ Google OAuth auto-configured from GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
      }

      if (updated) {
        await pluginStore.set({ key: 'grant', value: grantConfig });
      }
    } catch (e: any) {
      console.error('⚠️  Could not auto-configure OAuth providers:', e.message);
    }

    // NOTE: Payment API routes are defined in src/api/payment/routes/payment.js
    // Do NOT register them here — that bypasses the users-permissions JWT middleware.

    // Helper: validate users-permissions JWT and return user or throw 401
    const requireAuth = async (ctx) => {
      const authHeader = ctx.request.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        ctx.unauthorized('You must be logged in');
        return null;
      }
      try {
        const { id } = await strapi.plugin('users-permissions').service('jwt').verify(token);
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        ctx.state.user = user;
        return user;
      } catch (e) {
        ctx.unauthorized('Invalid or expired token');
        return null;
      }
    };

    // Register payment API routes (static routes/payment.js not loaded without content-type)
    strapi.server.routes([
      {
        method: 'GET',
        path: '/api/payment/plans',
        handler: async (ctx) => {
          const stripeService = require(require('path').join(strapi.dirs.app.src, 'api/payment/services/stripe'));
          const plans = stripeService.getPlans();
          ctx.body = { product: plans.productName, tiers: plans.tiers, currency: 'USD' };
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/verify-payment',
        handler: async (ctx) => {
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.verifyPayment(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/create-checkout-session',
        handler: async (ctx) => {
          const user = await requireAuth(ctx);
          if (!user) return;
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.createCheckoutSession(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'GET',
        path: '/api/payment/subscription/:userId',
        handler: async (ctx) => {
          const user = await requireAuth(ctx);
          if (!user) return;
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.getSubscription(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/cancel-subscription',
        handler: async (ctx) => {
          const user = await requireAuth(ctx);
          if (!user) return;
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.cancelSubscription(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/reactivate-subscription',
        handler: async (ctx) => {
          const user = await requireAuth(ctx);
          if (!user) return;
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.reactivateSubscription(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/create-portal-session',
        handler: async (ctx) => {
          const user = await requireAuth(ctx);
          if (!user) return;
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.createPortalSession(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/payment/webhook',
        handler: async (ctx) => {
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/webhooks'));
          await controller.handleWebhook(ctx);
        },
        config: { policies: [], auth: false },
      },
      {
        // Metering pipeline — called by IO API on pod_start / pod_stop events.
        // Acks immediately; persists to usage_events table and reports to Stripe Meters async.
        method: 'POST',
        path: '/api/payment/record-usage',
        handler: async (ctx) => {
          const controller = require(require('path').join(strapi.dirs.app.src, 'api/payment/controllers/checkout'));
          await controller.recordUsage(ctx);
        },
        config: { policies: [], auth: false },
      },
    ]);

    // Auto-create admin user from environment variables (dev only)
    if (process.env.STRAPI_ADMIN_EMAIL && process.env.STRAPI_ADMIN_PASSWORD) {
      try {
        const admins = await strapi.db.query('admin::user').findMany();
        
        if (admins.length === 0) {
          console.log('🔧 No admin user found - creating from environment variables...');
          
          await strapi.admin.services.user.create({
            email: process.env.STRAPI_ADMIN_EMAIL,
            password: process.env.STRAPI_ADMIN_PASSWORD,
            firstname: process.env.STRAPI_ADMIN_FIRSTNAME || 'Admin',
            lastname: process.env.STRAPI_ADMIN_LASTNAME || 'User',
            isActive: true,
            roles: [],
          });
          
          console.log('✅ Admin user created automatically!');
          console.log('📧 Email:', process.env.STRAPI_ADMIN_EMAIL);
          console.log('🔐 Password:', process.env.STRAPI_ADMIN_PASSWORD);
          console.log('🌐 Login at: http://localhost:1337/admin');
        }
      } catch (error) {
        console.error('⚠️  Could not auto-create admin:', error.message);
      }
    }

    // Auto-create API token for development
    if (process.env.NODE_ENV === 'development' || process.env.AUTO_CREATE_API_TOKEN === 'true') {
      try {
        const existingTokens = await strapi.db.query('admin::api-token').findMany({
          where: { name: 'Development Token' },
        });

        if (existingTokens.length === 0) {
          console.log('🔑 Creating API token for development...');
          
          const token = await strapi.admin.services['api-token'].create({
            name: 'Development Token',
            description: 'Auto-generated token for local development',
            type: 'full-access',
            lifespan: null,
          });

          console.log('✅ API Token created!');
          console.log('🔑 Token:', token.accessKey);
          
          // Auto-write token to react-native/.env
          const fs = require('fs');
          const path = require('path');
          const envPath = path.join(__dirname, '../../react-native/.env');
          
          try {
            let envContent = '';
            if (fs.existsSync(envPath)) {
              envContent = fs.readFileSync(envPath, 'utf8');
            }
            
            // Replace or add STRAPI_API_TOKEN
            if (envContent.includes('STRAPI_API_TOKEN=')) {
              envContent = envContent.replace(
                /STRAPI_API_TOKEN=.*/g,
                `STRAPI_API_TOKEN=${token.accessKey}`
              );
            } else {
              envContent += `\nSTRAPI_API_TOKEN=${token.accessKey}\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Token automatically added to react-native/.env');
          } catch (fsError) {
            console.log('💡 Manually add to react-native/.env:');
            console.log(`STRAPI_API_TOKEN=${token.accessKey}`);
          }
          console.log('');
        }
      } catch (error) {
        console.error('⚠️  Could not auto-create API token:', error.message);
      }
    }

    // Auto-configure public permissions for development
    if (process.env.NODE_ENV === 'development' || process.env.AUTO_CREATE_API_TOKEN === 'true') {
      try {
        console.log('🔓 Configuring public API permissions for development...');
        
        const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'public' },
        });

        if (publicRole) {
          // Get all article permissions
          const articlePermissions = await strapi.query('plugin::users-permissions.permission').findMany({
            where: {
              role: publicRole.id,
              action: { $startsWith: 'api::article.article' },
            },
          });

          // Enable find and findOne by publishing them
          for (const permission of articlePermissions) {
            if (permission.action.includes('.find')) {
              await strapi.query('plugin::users-permissions.permission').update({
                where: { id: permission.id },
                data: { published_at: new Date() },
              });
            }
          }

          console.log('✅ Public permissions configured for Article API');
          console.log(`   Enabled ${articlePermissions.length} permissions`);
        }
      } catch (error) {
        console.error('⚠️  Could not configure permissions:', error.message);
      }
    }
  },
};
