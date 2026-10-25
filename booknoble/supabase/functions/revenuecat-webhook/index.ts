// Keeps businesses.plan in sync with App Store / Google Play subscriptions
// managed through RevenueCat. Configure the app to call Purchases.logIn(<supabase user id>)
// and create entitlements named "starter" and "pro".
// Secrets: REVENUECAT_WEBHOOK_AUTH (the Authorization value set in RevenueCat)
import { admin, json, requireEnv } from '../_shared/supabase.ts';

const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED']);

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== requireEnv('REVENUECAT_WEBHOOK_AUTH')) return json({ error: 'Forbidden' }, 403);
  const { event } = await req.json();
  const userId: string | undefined = event?.app_user_id;
  if (!userId || userId.startsWith('$RCAnonymousID')) return json({ ignored: true });

  const entitlements: string[] = event.entitlement_ids ?? [];
  let plan: 'free' | 'starter' | 'pro' | null = null;
  if (ACTIVE.has(event.type)) plan = entitlements.includes('pro') ? 'pro' : entitlements.includes('starter') ? 'starter' : null;
  if (event.type === 'EXPIRATION') plan = 'free';
  if (!plan) return json({ ignored: true });

  await admin().from('businesses').update({ plan }).eq('owner_id', userId);
  return json({ plan });
});
