// Shared TypeScript types for alphinium-app
// Import from here: import type { User, ApiResponse, SubscriptionPlan } from '@/types';

// ─── Strapi ──────────────────────────────────────────────────────────────────

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface StrapiAuthResponse {
  jwt: string;
  user: StrapiUser;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PlanInterval = 'monthly' | 'annual';
export type PlanTier = 'free' | 'starter' | 'developer' | 'team' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  prices: {
    monthly?: number;
    annual?: number;
  };
  features: string[];
  podLimit: number | null;
  desktopLimit: number | null;
}

export interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  tier: PlanTier;
  plan_tier: PlanTier;
  current_period_end: number;
  cancel_at_period_end: boolean;
  amount: number | null;
  interval: PlanInterval | null;
}

export interface EntitlementCheck {
  allowed: boolean;
  plan_tier: PlanTier;
  tier: PlanTier;
  desktop_limit: number | null;
  pod_limit: number | null;
  addon_pod_count: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Account: undefined;
};
