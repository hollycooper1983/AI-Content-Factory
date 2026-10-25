import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import type { Metrics } from '@/lib/analytics';
import { formatMoneyExact } from '@/lib/money';
import { WEEKDAY_SHORT, weekdayOf } from '@/lib/scheduling';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

import { Text } from './ui';

function Bar({ ratio, highlight, index, label }: { ratio: number; highlight: boolean; index: number; label: string }) {
  const { colors, reduceMotion } = useTheme();
  const h = useSharedValue(reduceMotion ? ratio : 0);
  useEffect(() => {
    h.value = reduceMotion ? ratio : withDelay(120 + index * 50, withSpring(ratio, { damping: 16 }));
  }, [ratio, index, reduceMotion, h]);
  const style = useAnimatedStyle(() => ({ height: `${Math.max(6, h.value * 100)}%` }));
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }} accessibilityLabel={label}>
      <Animated.View style={[{ width: '100%', borderRadius: 5, backgroundColor: highlight ? colors.gold : 'rgba(255,255,255,0.38)' }, style]} />
    </View>
  );
}

/** Weekly booked-revenue card with animated bars. */
export function RevenueHero({ metrics, today, currency }: { metrics: Metrics; today: string; currency: string }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...metrics.daily.map((d) => d.cents));
  return (
    <View style={{ borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,181,107,0.35)' }}>
      <Image source={require('@/assets/brand/banner-bg.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23,13,53,0.55)' }]} />
      <View style={{ padding: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="smallStrong" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Booked revenue · this week
          </Text>
          {metrics.changePct !== null ? (
            <View style={{ backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text variant="caption" style={{ color: '#170D35', letterSpacing: 0.2, fontSize: 12 }}>
                {metrics.changePct >= 0 ? '+' : ''}
                {metrics.changePct}% vs last week
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="display" style={{ color: '#FFFFFF', fontSize: 34, lineHeight: 40 }}>
          {formatMoneyExact(metrics.weekRevenueCents, currency)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, height: 52 }}>
          {metrics.daily.map((d, i) => (
            <Bar
              key={d.date}
              index={i}
              ratio={d.cents / max}
              highlight={d.date === today}
              label={`${WEEKDAY_SHORT[weekdayOf(d.date)]}: ${formatMoneyExact(d.cents, currency)}`}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {metrics.daily.map((d) => (
            <Text key={d.date} variant="caption" style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.75)', letterSpacing: 0 }}>
              {WEEKDAY_SHORT[weekdayOf(d.date)][0]}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
