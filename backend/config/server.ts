import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  proxy: true,  // Trust X-Forwarded-Proto from ingress (required for HTTPS OAuth cookies)
  url: env('PUBLIC_URL', ''),
});

export default config;
