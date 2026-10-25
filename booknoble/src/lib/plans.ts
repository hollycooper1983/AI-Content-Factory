import type { PlanId } from './types';

/**
 * Provisional BookNoble software tiers. These are what a business pays
 * BookNoble; they are unrelated to what customers pay a business for services.
 */
export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  monthlyCents: number;
  tagline: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    monthlyCents: 0,
    tagline: 'Get booked online',
    features: ['Business profile & booking page', 'Basic online booking', `Up to ${30} upcoming appointments`],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: '$9.99/mo',
    monthlyCents: 999,
    tagline: 'Run your day',
    features: ['Unlimited appointments', 'Automatic reminders', 'Client directory & history', 'Deposits & booking rules'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$19.99/mo',
    monthlyCents: 1999,
    tagline: 'Grow the business',
    features: ['Everything in Starter', 'Invoices & payment requests', 'Business analytics', 'Advanced scheduling (buffers, notice, horizon)'],
  },
];

export const FREE_UPCOMING_LIMIT = 30;

export type Feature = 'unlimited_appointments' | 'reminders' | 'clients' | 'deposits' | 'invoices' | 'analytics' | 'advanced_scheduling';

const FEATURE_PLAN: Record<Feature, PlanId> = {
  unlimited_appointments: 'starter',
  reminders: 'starter',
  clients: 'starter',
  deposits: 'starter',
  invoices: 'pro',
  analytics: 'pro',
  advanced_scheduling: 'pro',
};

const RANK: Record<PlanId, number> = { free: 0, starter: 1, pro: 2 };

export function hasFeature(plan: PlanId, feature: Feature): boolean {
  return RANK[plan] >= RANK[FEATURE_PLAN[feature]];
}

export function requiredPlan(feature: Feature): Plan {
  return PLANS.find((p) => p.id === FEATURE_PLAN[feature])!;
}
