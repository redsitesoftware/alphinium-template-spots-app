/**
 * Spots Design System — Theme Tokens
 * Earth tones + natural greens for an outdoor discovery app.
 * Forked from alphinium-app.
 */

export const colors = {
  // Brand — forest green + golden amber
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryDark: '#1B4332',
  accent: '#F4A261',
  accentLight: '#F7B97A',

  // Backgrounds — deep forest night
  background: '#0F1A0F',
  surface: '#162416',
  surfaceElevated: '#1E321E',
  surfaceBorder: '#2A422A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A8C5A0',
  textMuted: '#607060',
  textInverse: '#0F1A0F',

  // Status
  success: '#52B788',
  successBg: 'rgba(82, 183, 136, 0.12)',
  warning: '#F4A261',
  warningBg: 'rgba(244, 162, 97, 0.12)',
  error: '#E76F51',
  errorBg: 'rgba(231, 111, 81, 0.12)',
  info: '#74C0FC',
  infoBg: 'rgba(116, 192, 252, 0.12)',

  // Spot categories
  categoryBeach: '#4DA6FF',
  categoryBeachBg: 'rgba(77, 166, 255, 0.12)',
  categoryLookout: '#F4A261',
  categoryLookoutBg: 'rgba(244, 162, 97, 0.12)',
  categoryHike: '#52B788',
  categoryHikeBg: 'rgba(82, 183, 136, 0.12)',
  categoryCafe: '#D4A373',
  categoryCafeBg: 'rgba(212, 163, 115, 0.12)',
  categoryFishing: '#4ECDC4',
  categoryFishingBg: 'rgba(78, 205, 196, 0.12)',
  categorySecret: '#A855F7',
  categorySecretBg: 'rgba(168, 85, 247, 0.12)',

  // UI
  divider: 'rgba(255,255,255,0.07)',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Map pin colours (by category)
  pinBeach: '#4DA6FF',
  pinLookout: '#F4A261',
  pinHike: '#52B788',
  pinCafe: '#D4A373',
  pinFishing: '#4ECDC4',
  pinSecret: '#A855F7',
  pinDefault: '#2D6A4F',
};

export const typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,

  // Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default { colors, typography, spacing, radius, shadows };
