import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInRight, ReduceMotion, runOnJS, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { LogoLockup } from '@/components/logo';
import { Button, Text } from '@/components/ui';
import { ONBOARDED_KEY } from '@/lib/storage-keys';
import { useTheme } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/tokens';

const SLIDES: {
  image: number;
  title: string;
  points: { icon: IconName; strong: string; text: string }[];
}[] = [
  {
    image: require('@/assets/brand/onboarding-owner.webp'),
    title: 'Your business,\nbeautifully booked.',
    points: [
      { icon: 'link', strong: 'Share one link.', text: 'Clients book 24/7 — no app download needed.' },
      { icon: 'calendarCheck', strong: 'No double-bookings.', text: 'Hours, breaks and buffers handled for you.' },
    ],
  },
  {
    image: require('@/assets/brand/industry-detailing.webp'),
    title: 'Built for every\nappointment business.',
    points: [
      { icon: 'scissors', strong: 'Stylists to detailers.', text: 'Starter menus for your industry in one tap.' },
      { icon: 'users', strong: 'Know every client.', text: 'Visit history, notes and contact in one place.' },
    ],
  },
  {
    image: require('@/assets/brand/industry-events.webp'),
    title: 'Booked. Organized.\nGrowing.',
    points: [
      { icon: 'receipt', strong: 'Get paid.', text: 'Invoices and deposits through a secure processor.' },
      { icon: 'chart', strong: 'Watch it grow.', text: 'Revenue, busy days and top services at a glance.' },
    ],
  },
];

function Dot({ active }: { active: boolean }) {
  const { colors, reduceMotion } = useTheme();
  const style = useAnimatedStyle(() => ({
    width: reduceMotion ? (active ? 24 : 6) : withTiming(active ? 24 : 6, { duration: 220 }),
  }));
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: active ? colors.primary : colors.borderStrong }, style]} />;
}

export default function Onboarding() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const finish = async (to: '/sign-in' | '/sign-in?mode=signin') => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace(to);
  };

  const go = (i: number) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  const next = () => (index < SLIDES.length - 1 ? go(index + 1) : finish('/sign-in'));

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(go)(index + 1);
      else if (e.translationX > 50) runOnJS(go)(index - 1);
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GestureDetector gesture={swipe}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 46, backgroundColor: colors.nav }}>
            <Animated.View key={`img-${index}`} entering={FadeIn.duration(450).reduceMotion(ReduceMotion.System)} style={StyleSheet.absoluteFill}>
              <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23,13,53,0.25)' }]} />
            </Animated.View>
          </View>
          <View
            style={{
              flex: 54,
              marginTop: -24,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: space.xxl,
              paddingTop: space.xxl,
            }}>
            <Animated.View
              key={`txt-${index}`}
              entering={FadeInRight.duration(380).reduceMotion(ReduceMotion.System)}
              style={{ gap: space.xl, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
              <Text variant="display">{slide.title}</Text>
              {slide.points.map((p) => (
                <View key={p.strong} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: radius.sm,
                      backgroundColor: colors.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name={p.icon} size={20} color={colors.onPrimarySoft} />
                  </View>
                  <Text tone="secondary" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{p.strong} </Text>
                    {p.text}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      <View style={{ position: 'absolute', top: insets.top + space.md, left: space.xl, right: space.xl, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'rgba(23,13,53,0.72)', borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 }}>
          <LogoLockup size={15} />
        </View>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" onPress={() => finish('/sign-in')} hitSlop={12} style={{ padding: 8 }}>
          <Text variant="bodyStrong" tone="onNav">
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.xxl, paddingBottom: insets.bottom + space.lg, gap: space.md, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center', marginBottom: space.sm }} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === index} />
          ))}
        </View>
        <Button label={index === SLIDES.length - 1 ? "Get started — it's free" : 'Continue'} onPress={next} />
        <Button label="I already have an account" variant="ghost" onPress={() => finish('/sign-in?mode=signin')} />
      </View>
    </View>
  );
}
