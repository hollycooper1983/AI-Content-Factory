import { Linking, Platform } from 'react-native';

import { repo } from './data';
import { LocalRepository } from './data/local';
import type { PlanId } from './types';

/**
 * BookNoble software subscriptions (what a business pays BookNoble).
 *
 * Policy summary (verify before launch — see docs/BILLING.md):
 *  - iOS / Android: digital subscriptions sold inside the app use Apple
 *    In-App Purchase and Google Play Billing. Plan: RevenueCat
 *    (react-native-purchases) in a development/production build, with its
 *    webhook updating businesses.plan server-side.
 *  - Web: subscriptions may be sold with Stripe Billing on the website.
 *  - Customer payments for real-world services are NOT app-store purchases
 *    and use Stripe Connect (see lib/payments.ts).
 *
 * Until a store product is configured, purchases are unavailable in
 * production builds. Demo mode can switch plans locally for testing.
 */
export type BillingStatus =
  | { kind: 'demo' }
  | { kind: 'store'; store: 'app_store' | 'play_store' }
  | { kind: 'web' }
  | { kind: 'unconfigured' };

export function billingStatus(): BillingStatus {
  if (repo instanceof LocalRepository) return { kind: 'demo' };
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_STRIPE_BILLING_URL ? { kind: 'web' } : { kind: 'unconfigured' };
  if (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY) {
    return { kind: 'store', store: Platform.OS === 'ios' ? 'app_store' : 'play_store' };
  }
  return { kind: 'unconfigured' };
}

/** Demo mode only: switches the plan on-device so gated features can be tested. */
export async function setDemoPlan(businessId: string, plan: PlanId) {
  if (!(repo instanceof LocalRepository)) throw new Error('Plan changes are handled by your app store or billing provider.');
  return repo.updateBusiness(businessId, { plan });
}

export function openWebBilling() {
  const url = process.env.EXPO_PUBLIC_STRIPE_BILLING_URL;
  if (url) Linking.openURL(url);
}

/** Where a subscriber cancels or changes their plan. */
export function manageSubscriptionUrl(): string {
  if (Platform.OS === 'ios') return 'https://apps.apple.com/account/subscriptions';
  if (Platform.OS === 'android') return 'https://play.google.com/store/account/subscriptions';
  return process.env.EXPO_PUBLIC_STRIPE_BILLING_URL ?? 'https://booknoble.app/account';
}
