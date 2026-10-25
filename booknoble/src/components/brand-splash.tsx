import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { brand } from '@/theme/tokens';

import { LogoMark, Wordmark } from './logo';
import { Text } from './ui';

/**
 * Launch logo reveal layered over the app while it loads. ~1.3 s total and
 * dismissed as soon as the app is ready; with reduced motion it simply fades.
 */
export function BrandSplash({ ready }: { ready: boolean }) {
  const { reduceMotion } = useTheme();
  const [done, setDone] = useState(false);
  const mark = useSharedValue(reduceMotion ? 1 : 0);
  const crownY = useSharedValue(reduceMotion ? 0 : 1);
  const word = useSharedValue(reduceMotion ? 1 : 0);
  const veil = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    mark.value = withSpring(1, { damping: 14, stiffness: 140 });
    crownY.value = withDelay(250, withSpring(0, { damping: 12 }));
    word.value = withDelay(450, withTiming(1, { duration: 450 }));
  }, [reduceMotion, mark, crownY, word]);

  useEffect(() => {
    if (!ready) return;
    veil.value = withDelay(
      reduceMotion ? 150 : 1000,
      withSequence(
        withTiming(1, { duration: 1 }),
        withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }, (fin) => {
          if (fin) runOnJS(setDone)(true);
        }),
      ),
    );
  }, [ready, reduceMotion, veil]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ scale: 0.8 + mark.value * 0.2 }, { translateY: crownY.value * -6 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 10 }] }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

  if (done) return null;
  return (
    <Animated.View pointerEvents={ready ? 'none' : 'auto'} style={[StyleSheet.absoluteFill, styles.root, veilStyle]}>
      <Image source={require('@/assets/brand/splash-bg.webp')} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.center} accessible accessibilityLabel="BookNoble. Booked. Organized. Growing.">
        <View style={styles.glow} />
        <Animated.View style={markStyle}>
          <LogoMark size={112} />
        </Animated.View>
        <Animated.View style={[styles.words, wordStyle]}>
          <Wordmark size={40} />
          <Text variant="caption" style={styles.tag}>
            BOOKED. ORGANIZED. GROWING.
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: brand.deepPurple, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(217,181,107,0.12)',
  },
  words: { alignItems: 'center', gap: 10 },
  tag: { color: 'rgba(255,255,255,0.8)', fontSize: 13, letterSpacing: 3 },
});
