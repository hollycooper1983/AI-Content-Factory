import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Appointment-confirmed animation: pop, draw the tick, gold ring ripple. */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(reduceMotion ? 1 : 0.4);
  const draw = useSharedValue(reduceMotion ? 0 : 40);
  const ring = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withSequence(withSpring(1.08, { damping: 10, stiffness: 220 }), withSpring(1));
    draw.value = withDelay(300, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    ring.value = withDelay(250, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, [reduceMotion, scale, draw, ring]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ripple = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - ring.value), transform: [{ scale: 0.85 + ring.value * 0.6 }] }));
  const tick = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel="Confirmed">
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.gold },
          ripple,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: size,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          },
          pop,
        ]}>
        <Svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24">
          <AnimatedPath
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="#FFFFFF"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={40}
            animatedProps={tick}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
