import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Badge, FadeIn, ListRow, Text } from '@/components/ui';
import { PLANS } from '@/lib/plans';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

const SECTIONS: { title: string; items: { icon: IconName; label: string; sub: string; href: Href }[] }[] = [
  {
    title: 'Business',
    items: [
      { icon: 'tag', label: 'Services & pricing', sub: 'Menu, durations, deposits', href: '/services' },
      { icon: 'clock', label: 'Hours & availability', sub: 'Hours, breaks, buffers, time off', href: '/availability' },
      { icon: 'receipt', label: 'Invoices', sub: 'Bill clients and request payment', href: '/invoices' },
      { icon: 'bell', label: 'Reminders', sub: 'Automatic booking reminders', href: '/reminders' },
      { icon: 'link', label: 'Booking page', sub: 'Profile and public link', href: '/business-profile' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'crown', label: 'Subscription', sub: 'Plans and billing', href: '/subscription' },
      { icon: 'settings', label: 'Settings', sub: 'Appearance, privacy, account', href: '/settings' },
    ],
  },
];

export default function More() {
  const business = useBusiness();
  const { colors } = useTheme();
  const plan = PLANS.find((p) => p.id === business.plan)!;
  return (
    <Screen brandHeader back={false} title="More" subtitle={business.name}>
      <FadeIn>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            padding: space.lg,
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <Icon name="crown" size={22} color={colors.goldText} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{plan.name} plan</Text>
            <Text variant="small" tone="secondary">
              {plan.tagline}
            </Text>
          </View>
          {business.plan !== 'pro' ? <Badge label="Upgrade" tone="gold" /> : <Badge label="All features" tone="success" />}
        </View>
      </FadeIn>
      {SECTIONS.map((section, si) => (
        <FadeIn key={section.title} index={si + 1} style={{ gap: space.sm }}>
          <Text variant="caption" tone="secondary">
            {section.title.toUpperCase()}
          </Text>
          {section.items.map((it) => (
            <ListRow
              key={it.label}
              left={<Icon name={it.icon} size={20} color={colors.primary} />}
              title={it.label}
              subtitle={it.sub}
              onPress={() => router.push(it.href)}
            />
          ))}
        </FadeIn>
      ))}
    </Screen>
  );
}
