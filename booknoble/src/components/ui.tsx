import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Switch,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { radius, space, type as typeScale, type Palette } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'secondary' | 'primary' | 'gold' | 'danger' | 'success' | 'onPrimary' | 'onNav';

const toneColor = (c: Palette, tone: Tone) =>
  ({
    default: c.text,
    secondary: c.textSecondary,
    primary: c.link,
    gold: c.goldText,
    danger: c.danger,
    success: c.success,
    onPrimary: c.textOnPrimary,
    onNav: c.onNav,
  })[tone];

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  children,
  ...rest
}: {
  variant?: Variant;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text' | 'link';
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const isHeading = variant === 'display' || variant === 'title';
  return (
    <RNText
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={1.6}
      style={[typeScale[variant], { color: toneColor(colors, tone) }, style]}
      {...rest}>
      {children}
    </RNText>
  );
}

// ---------------------------------------------------------------------------
// Button — springy press feedback + light haptic
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'lg',
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void | Promise<void>;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const { colors, reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.textOnPrimary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.link },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    gold: { bg: colors.gold, fg: '#170D35' },
  };
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        disabled={inactive}
        onPressIn={() => {
          if (!reduceMotion) scale.set(withSpring(0.97, { damping: 18, stiffness: 400 }));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 14, stiffness: 300 }));
        }}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.();
        }}
        style={({ pressed }) => ({
          minHeight: size === 'lg' ? 54 : 44,
          paddingHorizontal: space.xl,
          borderRadius: radius.lg,
          backgroundColor: variant === 'primary' && pressed ? colors.primaryPressed : p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          opacity: inactive ? 0.55 : 1,
          ...(variant === 'primary' && !inactive && Platform.OS !== 'android'
            ? { shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }
            : null),
        })}>
        {loading ? (
          <ActivityIndicator color={p.fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
            <RNText maxFontSizeMultiplier={1.4} style={[typeScale.bodyStrong, { color: p.fg, fontSize: 16 }]}>
              {label}
            </RNText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  tone = 'surface',
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  tone?: 'surface' | 'primary' | 'nav';
}) {
  const { colors } = useTheme();
  const bg = tone === 'primary' ? colors.primary : tone === 'nav' ? 'rgba(255,255,255,0.08)' : colors.surface;
  const fg = tone === 'surface' ? colors.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: bg,
        borderWidth: tone === 'surface' ? 1 : tone === 'nav' ? 1 : 0,
        borderColor: tone === 'nav' ? 'rgba(255,255,255,0.18)' : colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}>
      <Icon name={icon} size={20} color={fg} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

/** Staggered entrance; Reanimated skips it when the OS asks for reduced motion. */
export function FadeIn({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(380)
        .delay(Math.min(index, 8) * 60)
        .springify()
        .damping(20)
        .reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={10} style={{ paddingVertical: 8 }}>
          <Text variant="smallStrong" tone="primary">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  helper,
  style,
  ...input
}: TextInputProps & { label: string; error?: string | null; helper?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text variant="smallStrong">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={helper}
        placeholderTextColor={colors.textSecondary}
        maxFontSizeMultiplier={1.4}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          typeScale.body,
          {
            minHeight: input.multiline ? 96 : 50,
            borderRadius: radius.md,
            borderWidth: focused ? 2 : 1,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.borderStrong,
            backgroundColor: colors.surface,
            color: colors.text,
            paddingHorizontal: focused ? 13 : 14,
            paddingVertical: input.multiline ? 12 : 0,
            fontSize: 16,
            textAlignVertical: input.multiline ? 'top' : 'center',
          },
        ]}
      />
      {error ? (
        <Text variant="small" tone="danger" accessibilityRole="text">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="small" tone="secondary">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.borderStrong,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      {icon ? <Icon name={icon} size={16} color={selected ? colors.onPrimarySoft : colors.text} /> : null}
      <Text variant="smallStrong" style={{ color: selected ? colors.onPrimarySoft : colors.text, fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.surface : 'transparent',
            }}>
            <Text variant="smallStrong" tone={on ? 'default' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {description ? (
          <Text variant="small" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

/** Numeric stepper with accessible increment/decrement. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 10_000,
  format = String,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const { colors } = useTheme();
  const btn = (icon: IconName, delta: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a11y} ${label}`}
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.sm,
        backgroundColor: pressed ? colors.primarySoft : colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <Icon name={icon} size={18} color={colors.text} />
    </Pressable>
  );
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? step : -step))))
      }
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      {btn('minus', -step, 'Decrease')}
      <Text variant="bodyStrong" style={{ minWidth: 76, textAlign: 'center' }}>
        {format(value)}
      </Text>
      {btn('plus', step, 'Increase')}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?';
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text variant="heading" style={{ color: colors.onPrimarySoft, fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { colors } = useTheme();
  const map: Record<BadgeTone, [string, string]> = {
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.primarySoft, colors.onPrimarySoft],
    neutral: [colors.surfaceAlt, colors.textSecondary],
    gold: [colors.goldSoft, colors.goldText],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text variant="caption" style={{ color: fg, letterSpacing: 0.2, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  accent,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  accent?: string;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      {accent ? <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: accent }} /> : null}
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevronRight" size={18} color={colors.textSecondary} /> : null)}
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    minHeight: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  };
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.8 : 1 }]}>
      {content}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  return (
    <FadeIn>
      <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.xl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: colors.goldSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={icon} size={30} color={colors.goldText} />
        </View>
        <Text variant="heading" style={{ textAlign: 'center' }}>
          {title}
        </Text>
        <Text tone="secondary" style={{ textAlign: 'center', maxWidth: 320 }}>
          {body}
        </Text>
        {action ? <Button label={action.label} onPress={action.onPress} size="md" style={{ marginTop: space.sm }} /> : null}
      </View>
    </FadeIn>
  );
}

/** Pulsing placeholder while data loads (static when reduced motion is on). */
export function Skeleton({ height = 60, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors, reduceMotion } = useTheme();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (!reduceMotion) o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [reduceMotion, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt }, anim, style]}
    />
  );
}

export function LoadingList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: space.md }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space.md, flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
      <Icon name="alert" size={18} color={colors.danger} />
      <Text variant="small" tone="danger" style={{ flex: 1 }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
          <Text variant="smallStrong" tone="danger">
            Retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export type { PressableProps };
