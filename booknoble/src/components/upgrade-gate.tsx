import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { hasFeature, requiredPlan, type Feature } from '@/lib/plans';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

import { Icon } from './icon';
import { Button, Text } from './ui';

/** Renders children when the plan includes `feature`, otherwise an upgrade card. */
export function UpgradeGate({ feature, title, children }: { feature: Feature; title: string; children: ReactNode }) {
  const { business } = useApp();
  const { colors } = useTheme();
  if (business && hasFeature(business.plan, feature)) return <>{children}</>;
  const plan = requiredPlan(feature);
  return (
    <View
      style={{
        backgroundColor: colors.nav,
        borderRadius: radius.xl,
        padding: space.xl,
        gap: space.md,
        borderWidth: 1,
        borderColor: 'rgba(217,181,107,0.4)',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name="crown" size={20} color={colors.gold} />
        <Text variant="caption" style={{ color: colors.gold }}>
          {plan.name.toUpperCase()} FEATURE
        </Text>
      </View>
      <Text variant="title" tone="onNav">
        {title}
      </Text>
      <Text style={{ color: colors.onNavMuted }}>
        Available on {plan.name} ({plan.priceLabel}). {plan.features.slice(0, 2).join(' · ')}.
      </Text>
      <Button label={`See ${plan.name} plan`} variant="gold" onPress={() => router.push('/subscription')} />
    </View>
  );
}
