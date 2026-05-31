/**
 * Spots App Configuration
 */

export const STRAPI_URL = process.env.EXPO_PUBLIC_API_URL || '';
export const STRAPI_API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'Spots';
export const APP_VERSION = '1.0.0';

// OAuth providers — comma-separated list of enabled providers.
// Valid values: github, google, facebook, email
export const OAUTH_PROVIDERS = (process.env.EXPO_PUBLIC_OAUTH_PROVIDERS || 'google,facebook,email')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

// Maps
export const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || '';
export const ALPHINIUM_APP_ID = process.env.EXPO_PUBLIC_ALPHINIUM_APP_ID || '';
export const ALPHINIUM_AI_KEY = process.env.EXPO_PUBLIC_ALPHINIUM_AI_KEY || '';
export const ALPHINIUM_AI_ENDPOINT = process.env.EXPO_PUBLIC_ALPHINIUM_AI_ENDPOINT || '';

export default {
  STRAPI_URL,
  STRAPI_API_TOKEN,
  STRIPE_PUBLISHABLE_KEY,
  APP_NAME,
  APP_VERSION,
  OAUTH_PROVIDERS,
  MAPTILER_KEY,
  ALPHINIUM_APP_ID,
  ALPHINIUM_AI_KEY,
  ALPHINIUM_AI_ENDPOINT,
};
