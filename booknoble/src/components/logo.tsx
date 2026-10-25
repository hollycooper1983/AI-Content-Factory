import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { brand, fonts } from '@/theme/tokens';

/**
 * The BookNoble mark: a royal-blue booking calendar crowned in gold, with the
 * letter B drawn inside and a gold "booked" dot in its lower bowl.
 */
export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel="BookNoble logo">
      <Rect x={7} y={15} width={50} height={44} rx={11} fill={brand.royalBlue} />
      <Rect x={7} y={15} width={50} height={44} rx={11} fill="none" stroke={brand.nobleGold} strokeOpacity={0.55} strokeWidth={1.2} />
      <Path d="M19 17 L21.5 6.5 L27 12 L32 4.5 L37 12 L42.5 6.5 L45 17 Z" fill={brand.nobleGold} />
      <Circle cx={32} cy={4.5} r={1.6} fill={brand.nobleGold} />
      <Path
        d="M24 25 V51 H35.5 a6.8 6.8 0 0 0 0 -13.6 H24 M24 25 H33.5 a6.2 6.2 0 0 1 0 12.4"
        fill="none"
        stroke={brand.white}
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={35} cy={44.2} r={2.1} fill={brand.nobleGold} />
    </Svg>
  );
}

export function Wordmark({ size = 28, color = brand.white }: { size?: number; color?: string }) {
  return (
    <Text accessibilityRole="header" style={[styles.word, { fontSize: size, color }]}>
      Book<Text style={{ color: brand.nobleGold }}>Noble</Text>
    </Text>
  );
}

export function LogoLockup({ size = 28, color }: { size?: number; color?: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel="BookNoble">
      <LogoMark size={size * 1.3} />
      <Wordmark size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  word: { fontFamily: fonts.heading, letterSpacing: -0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
