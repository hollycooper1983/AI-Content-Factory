import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Badge, Button, FadeIn, Text } from '@/components/ui';
import { billingStatus, manageSubscriptionUrl, openWebBilling, setDemoPlan } from '@/lib/billing';
import { errorMessage, notify } from '@/lib/dialogs';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/lib/types';
import { useApp, useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

export default function Subscription() {
  const business = useBusiness();
  const { setBusiness } = useApp();
  const { colors } = useTheme();
  const status = billingStatus();
  const [busy, setBusy] = useState<PlanId | null>(null);

  const choose = async (plan: PlanId) => {
    if (plan === business.plan) return;
    if (status.kind === 'demo') {
      setBusy(plan);
      try {
        setBusiness(await setDemoPlan(business.id, plan));
      } catch (e) {
        notify('Couldn’t change plan', errorMessage(e));
      } finally {
        setBusy(null);
      }
      return;
    }
    if (status.kind === 'web') return openWebBilling();
    if (status.kind === 'store') {
      notify('Purchases', 'Connect RevenueCat in a development build to enable in-app purchases (docs/BILLING.md).');
      return;
    }
    notify('Not available yet', 'Paid plans are not available in this build yet.');
  };

  const storeName = Platform.OS === 'ios' ? 'Apple ID' : Platform.OS === 'android' ? 'Google Play' : 'payment method';

  return (
    <Screen title="Subscription">
      {status.kind === 'demo' ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: space.md, flexDirection: 'row', gap: space.sm }}>
          <Icon name="info" size={18} color={colors.goldText} />
          <Text variant="small" style={{ color: colors.goldText, flex: 1 }}>
            Demo mode: switching plans here is free and only unlocks features on this device so you can try them. No payment is taken.
          </Text>
        </View>
      ) : null}

      {PLANS.map((p, i) => {
        const current = p.id === business.plan;
        const featured = p.id === 'pro';
        return (
          <FadeIn key={p.id} index={i}>
            <View
              style={{
                borderRadius: radius.xl,
                padding: space.xl,
                gap: space.md,
                backgroundColor: featured ? colors.nav : colors.surface,
                borderWidth: current ? 2 : 1,
                borderColor: current ? colors.primary : featured ? 'rgba(217,181,107,0.45)' : colors.border,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="title" style={{ color: featured ? colors.onNav : colors.text, flex: 1 }}>
                  {p.name}
                </Text>
                {current ? <Badge label="Current plan" tone="info" /> : featured ? <Badge label="Best value" tone="gold" /> : null}
              </View>
              <Text variant="display" style={{ color: featured ? colors.gold : colors.text, fontSize: 28 }}>
                {p.priceLabel}
              </Text>
              <Text style={{ color: featured ? colors.onNavMuted : colors.textSecondary }}>{p.tagline}</Text>
              {p.features.map((f) => (
                <View key={f} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                  <Icon name="check" size={18} color={featured ? colors.gold : colors.primary} />
                  <Text style={{ color: featured ? colors.onNav : colors.text, flex: 1 }}>{f}</Text>
                </View>
              ))}
              {current ? null : (
                <Button
                  label={p.id === 'free' ? 'Switch to Free' : `Choose ${p.name}`}
                  variant={featured ? 'gold' : 'primary'}
                  loading={busy === p.id}
                  onPress={() => choose(p.id)}
                />
              )}
            </View>
          </FadeIn>
        );
      })}

      <Text variant="small" tone="secondary">
        Starter and Pro are auto-renewing monthly subscriptions. Payment is charged to your {storeName} at confirmation of purchase. The
        subscription renews automatically at the same price unless cancelled at least 24 hours before the end of the current period. You can
        manage or cancel anytime in your account settings; cancelling stops future renewals and keeps access until the period ends.
        Customers’ payments for your services are separate and never pass through this subscription.
      </Text>
      <View style={{ flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' }}>
        <Text variant="smallStrong" tone="primary" accessibilityRole="link" onPress={() => Linking.openURL(manageSubscriptionUrl())}>
          Manage or cancel subscription
        </Text>
        <Text variant="smallStrong" tone="primary" accessibilityRole="link" onPress={() => router.push('/terms')}>
          Terms of Service
        </Text>
        <Text variant="smallStrong" tone="primary" accessibilityRole="link" onPress={() => router.push('/privacy')}>
          Privacy Policy
        </Text>
      </View>
    </Screen>
  );
}
