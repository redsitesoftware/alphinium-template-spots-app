import type { Core } from '@strapi/strapi';

// Allow extra origins via env var (comma-separated).
// Use CORS_ORIGINS for a full override, CORS_EXTRA_ORIGINS to add to the defaults.
// e.g. CORS_EXTRA_ORIGINS=https://pod-test-frontend-xxxx.user-pods.alphinium.io
const defaultOrigins = [
  'https://app.alphinium.com',
  'https://alphinium.com',
  'https://alphinium-cluster.alphinium.io',
  'http://localhost:3000',
  'http://localhost:5173',
];

const extraOrigins = process.env.CORS_EXTRA_ORIGINS
  ? process.env.CORS_EXTRA_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const frontendUrl = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.trim()]
  : [];

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [...defaultOrigins, ...extraOrigins, ...frontendUrl];

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'global::serve-landing',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: [
        'Content-Type',
        'Authorization',
        'X-Frame-Options',
        'X-Internal-Secret',
        'X-Service-Token',
      ],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'global::stripe-raw-body',
  'strapi::body',
  {
    name: 'strapi::session',
    config: {
      // proxy:true in server.ts makes Koa trust X-Forwarded-Proto: https from nginx ingress,
      // so ctx.secure is true even though the pod receives HTTP internally.
      // Using NODE_ENV check: Secure cookie flag in production, relaxed in local dev.
      secure: process.env.NODE_ENV === 'production',
    },
  },
  'strapi::favicon',
  'strapi::public',
];

export default config;
